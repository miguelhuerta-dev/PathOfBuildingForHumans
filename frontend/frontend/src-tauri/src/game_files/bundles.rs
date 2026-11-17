//! Reads files from the game's bundles (`Bundles2`), the storage Path of Exile
//! uses since 3.11.2.
//!
//! `_.index.bin` lists every bundle and, for each file, the hash of its path,
//! its bundle and its place inside it. Bundles are split into blocks compressed
//! with Oodle. Only the files asked for are read; nothing else is unpacked.

use std::collections::{BTreeMap, HashMap};
use std::path::Path;

/// Larger than any real bundle; guards allocations against damaged files.
const MAX_UNCOMPRESSED: u64 = 1 << 30;

struct Reader<'a> {
    data: &'a [u8],
    pos: usize,
}

impl<'a> Reader<'a> {
    fn new(data: &'a [u8]) -> Self {
        Self { data, pos: 0 }
    }

    fn bytes(&mut self, len: usize) -> Result<&'a [u8], String> {
        let end = self.pos.checked_add(len).filter(|&end| end <= self.data.len()).ok_or(DAMAGED)?;
        let slice = &self.data[self.pos..end];
        self.pos = end;
        Ok(slice)
    }

    fn u32(&mut self) -> Result<u32, String> {
        Ok(u32::from_le_bytes(self.bytes(4)?.try_into().map_err(|_| DAMAGED)?))
    }

    fn usize(&mut self) -> Result<usize, String> {
        Ok(self.u32()? as usize)
    }

    fn u64(&mut self) -> Result<u64, String> {
        Ok(u64::from_le_bytes(self.bytes(8)?.try_into().map_err(|_| DAMAGED)?))
    }
}

const DAMAGED: &str = "The game's files could not be read (unexpected bundle format).";

/// Decompresses a whole bundle.
pub fn decompress(bundle: &[u8]) -> Result<Vec<u8>, String> {
    let mut reader = Reader::new(bundle);
    reader.bytes(12)?; // uncompressed size, total payload size, head size (32-bit copies)
    reader.bytes(8)?; // first file's codec, unknown
    let uncompressed = reader.u64()?;
    reader.u64()?; // total payload size
    let blocks = reader.usize()?;
    let granularity = reader.usize()?;
    reader.bytes(16)?; // unknown
    if uncompressed > MAX_UNCOMPRESSED || granularity == 0 {
        return Err(DAMAGED.into());
    }
    let uncompressed = uncompressed as usize;
    if blocks != uncompressed.div_ceil(granularity) {
        return Err(DAMAGED.into());
    }
    let sizes = (0..blocks).map(|_| reader.usize()).collect::<Result<Vec<_>, _>>()?;

    let mut out = vec![0u8; uncompressed];
    let mut extractor = oozextract::Extractor::new();
    for (block, (size, output)) in sizes.into_iter().zip(out.chunks_mut(granularity)).enumerate() {
        let input = reader.bytes(size)?;
        let written = extractor
            .read_from_slice(input, output)
            .map_err(|e| format!("The game's files could not be read (block {block}: {e:?})."))?;
        if written != output.len() {
            return Err(DAMAGED.into());
        }
    }
    Ok(out)
}

/// Hash of a file path in the index (MurmurHash64A of the lowercase path).
pub fn path_hash(path: &str) -> u64 {
    murmur64a(path.to_lowercase().as_bytes(), 0x1337_b33f)
}

fn murmur64a(key: &[u8], seed: u64) -> u64 {
    const M: u64 = 0xc6a4_a793_5bd1_e995;
    const R: u32 = 47;
    let mut h = seed ^ (key.len() as u64).wrapping_mul(M);
    let (chunks, tail) = key.as_chunks::<8>();
    for chunk in chunks {
        let mut k = u64::from_le_bytes(*chunk);
        k = k.wrapping_mul(M);
        k ^= k >> R;
        k = k.wrapping_mul(M);
        h ^= k;
        h = h.wrapping_mul(M);
    }
    if !tail.is_empty() {
        for (i, byte) in tail.iter().enumerate() {
            h ^= u64::from(*byte) << (8 * i);
        }
        h = h.wrapping_mul(M);
    }
    h ^= h >> R;
    h = h.wrapping_mul(M);
    h ^= h >> R;
    h
}

struct Location {
    bundle: usize,
    offset: usize,
    size: usize,
}

/// Reads the given files (by path) from the bundles in `dir`.
/// Files the game does not have are left out of the result.
pub fn read_files(dir: &Path, paths: &[String]) -> Result<HashMap<String, Vec<u8>>, String> {
    let index = std::fs::read(dir.join("_.index.bin"))
        .map_err(|e| format!("Could not open the game's file index: {e}"))?;
    let index = decompress(&index)?;
    let mut reader = Reader::new(&index);

    let bundle_count = reader.usize()?;
    let mut bundles = Vec::with_capacity(bundle_count.min(1 << 20));
    for _ in 0..bundle_count {
        let len = reader.usize()?;
        bundles.push(String::from_utf8_lossy(reader.bytes(len)?).into_owned());
        reader.u32()?; // uncompressed size
    }

    let mut wanted: HashMap<u64, &String> = paths.iter().map(|path| (path_hash(path), path)).collect();
    let mut found: BTreeMap<usize, Vec<(&String, Location)>> = BTreeMap::new();
    let file_count = reader.usize()?;
    for _ in 0..file_count {
        let hash = reader.u64()?;
        let location = Location { bundle: reader.usize()?, offset: reader.usize()?, size: reader.usize()? };
        if let Some(path) = wanted.remove(&hash) {
            found.entry(location.bundle).or_default().push((path, location));
            if wanted.is_empty() {
                break;
            }
        }
    }

    // Each bundle is decompressed once, however many of the files it holds.
    let mut files = HashMap::new();
    for (bundle, entries) in found {
        let name = bundles.get(bundle).ok_or(DAMAGED)?;
        let raw = std::fs::read(dir.join(format!("{name}.bundle.bin")))
            .map_err(|e| format!("Could not open the game's bundle {name}: {e}"))?;
        let data = decompress(&raw)?;
        for (path, location) in entries {
            let end = location.offset.checked_add(location.size).filter(|&end| end <= data.len()).ok_or(DAMAGED)?;
            files.insert(path.clone(), data[location.offset..end].to_vec());
        }
    }
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_paths_case_insensitively() {
        // The real hashes are checked against an installed game in game_files::tests.
        assert_eq!(path_hash("Art/A.DDS"), path_hash("art/a.dds"));
        assert_ne!(path_hash("art/a.dds"), path_hash("art/b.dds"));
    }

    #[test]
    fn rejects_truncated_bundles() {
        assert!(decompress(&[0u8; 10]).is_err());
    }
}
