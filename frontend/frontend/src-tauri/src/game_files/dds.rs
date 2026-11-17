//! Decodes the largest image of a DDS texture to RGBA and encodes it as PNG.
//! Covers the formats the game uses for 2D art: BC1–BC5, BC7 and 8-bit RGBA/BGRA.

const HEADER_LEN: usize = 128;
const DX10_LEN: usize = 20;

#[derive(Clone, Copy)]
enum Format {
    Bc1,
    Bc2,
    Bc3,
    Bc4,
    Bc5,
    Bc7,
    Rgba8,
    Bgra8,
}

impl Format {
    fn from_dxgi(code: u32) -> Option<Self> {
        Some(match code {
            70..=72 => Self::Bc1,
            73..=75 => Self::Bc2,
            76..=78 => Self::Bc3,
            79..=81 => Self::Bc4,
            82..=84 => Self::Bc5,
            97..=99 => Self::Bc7,
            27..=29 => Self::Rgba8,
            87 | 90 | 91 => Self::Bgra8,
            _ => return None,
        })
    }

    fn from_four_cc(code: &[u8]) -> Option<Self> {
        Some(match code {
            b"DXT1" => Self::Bc1,
            b"DXT2" | b"DXT3" => Self::Bc2,
            b"DXT4" | b"DXT5" => Self::Bc3,
            b"ATI1" | b"BC4U" => Self::Bc4,
            b"ATI2" | b"BC5U" => Self::Bc5,
            _ => return None,
        })
    }

    /// Bytes per 4×4 block, or `None` for uncompressed formats.
    fn block_size(self) -> Option<usize> {
        match self {
            Self::Bc1 | Self::Bc4 => Some(8),
            Self::Bc2 | Self::Bc3 | Self::Bc5 | Self::Bc7 => Some(16),
            Self::Rgba8 | Self::Bgra8 => None,
        }
    }
}

fn u32_at(data: &[u8], at: usize) -> Option<u32> {
    Some(u32::from_le_bytes(data.get(at..at + 4)?.try_into().ok()?))
}

/// Decodes one 4×4 block to RGBA (16 bytes per row).
fn decode_block(format: Format, block: &[u8], out: &mut [u8; 64]) {
    match format {
        Format::Bc1 => bcdec_rs::bc1(block, out, 16),
        Format::Bc2 => bcdec_rs::bc2(block, out, 16),
        Format::Bc3 => bcdec_rs::bc3(block, out, 16),
        Format::Bc7 => bcdec_rs::bc7(block, out, 16),
        Format::Bc4 => {
            let mut red = [0u8; 16];
            bcdec_rs::bc4(block, &mut red, 4, false);
            for (pixel, value) in out.as_chunks_mut::<4>().0.iter_mut().zip(red) {
                *pixel = [value, value, value, 255];
            }
        }
        Format::Bc5 => {
            let mut red_green = [0u8; 32];
            bcdec_rs::bc5(block, &mut red_green, 8, false);
            for (pixel, [r, g]) in out.as_chunks_mut::<4>().0.iter_mut().zip(red_green.as_chunks::<2>().0) {
                *pixel = [*r, *g, 0, 255];
            }
        }
        Format::Rgba8 | Format::Bgra8 => unreachable!("uncompressed formats have no blocks"),
    }
}

/// Width, height and RGBA pixels of the texture's first (largest) image.
pub fn decode(dds: &[u8]) -> Result<(u32, u32, Vec<u8>), String> {
    let unsupported = || "This texture format is not supported.".to_string();
    if dds.get(..4) != Some(b"DDS ") {
        return Err(unsupported());
    }
    let height = u32_at(dds, 12).ok_or_else(unsupported)?;
    let width = u32_at(dds, 16).ok_or_else(unsupported)?;
    if width == 0 || height == 0 || width > 8192 || height > 8192 {
        return Err(unsupported());
    }
    let four_cc = dds.get(84..88).ok_or_else(unsupported)?;
    let (format, data_start) = if four_cc == b"DX10" {
        let code = u32_at(dds, HEADER_LEN).ok_or_else(unsupported)?;
        (Format::from_dxgi(code).ok_or_else(unsupported)?, HEADER_LEN + DX10_LEN)
    } else if four_cc == [0, 0, 0, 0] && u32_at(dds, 88) == Some(32) {
        // Uncompressed 32-bit; the red mask tells RGBA from BGRA.
        let format = if u32_at(dds, 92) == Some(0xff) {
            Format::Rgba8
        } else {
            Format::Bgra8
        };
        (format, HEADER_LEN)
    } else {
        (Format::from_four_cc(four_cc).ok_or_else(unsupported)?, HEADER_LEN)
    };

    let (w, h) = (width as usize, height as usize);
    let data = &dds[data_start..];
    let mut rgba = vec![0u8; w * h * 4];

    match format.block_size() {
        None => {
            let source = data.get(..w * h * 4).ok_or_else(unsupported)?;
            rgba.copy_from_slice(source);
            if matches!(format, Format::Bgra8) {
                rgba.as_chunks_mut::<4>()
                    .0
                    .iter_mut()
                    .for_each(|pixel| pixel.swap(0, 2));
            }
        }
        Some(block_size) => {
            let (blocks_x, blocks_y) = (w.div_ceil(4), h.div_ceil(4));
            let blocks = data.get(..blocks_x * blocks_y * block_size).ok_or_else(unsupported)?;
            let mut decoded = [0u8; 64];
            for (index, block) in blocks.chunks_exact(block_size).enumerate() {
                decode_block(format, block, &mut decoded);
                let (bx, by) = (index % blocks_x * 4, index / blocks_x * 4);
                // Blocks on the right and bottom edges may stick out of the image.
                for row in 0..4.min(h - by) {
                    let columns = 4.min(w - bx);
                    let target = ((by + row) * w + bx) * 4;
                    rgba[target..target + columns * 4].copy_from_slice(&decoded[row * 16..row * 16 + columns * 4]);
                }
            }
        }
    }
    Ok((width, height, rgba))
}

/// Scales the image down so its longest side is at most `max`, averaging the
/// covered source pixels. Colours are weighted by alpha so transparent pixels
/// do not darken the edges. Smaller images are returned unchanged.
pub fn shrink(width: u32, height: u32, rgba: Vec<u8>, max: u32) -> (u32, u32, Vec<u8>) {
    if width <= max && height <= max {
        return (width, height, rgba);
    }
    let scale = f64::from(max) / f64::from(width.max(height));
    let (out_w, out_h) = (
        ((f64::from(width) * scale).round() as u32).max(1),
        ((f64::from(height) * scale).round() as u32).max(1),
    );
    let (w, h) = (width as usize, height as usize);
    let mut out = Vec::with_capacity(out_w as usize * out_h as usize * 4);
    for oy in 0..out_h as usize {
        let (y0, y1) = (oy * h / out_h as usize, ((oy + 1) * h).div_ceil(out_h as usize));
        for ox in 0..out_w as usize {
            let (x0, x1) = (ox * w / out_w as usize, ((ox + 1) * w).div_ceil(out_w as usize));
            let mut sum = [0u64; 4];
            for y in y0..y1 {
                for pixel in rgba[(y * w + x0) * 4..(y * w + x1) * 4].as_chunks::<4>().0 {
                    let alpha = u64::from(pixel[3]);
                    for channel in 0..3 {
                        sum[channel] += u64::from(pixel[channel]) * alpha;
                    }
                    sum[3] += alpha;
                }
            }
            let count = ((y1 - y0) * (x1 - x0)) as u64;
            let colour = |channel: usize| sum[channel].checked_div(sum[3]).unwrap_or(0) as u8;
            out.extend_from_slice(&[colour(0), colour(1), colour(2), (sum[3] / count) as u8]);
        }
    }
    (out_w, out_h, out)
}

pub fn to_png(width: u32, height: u32, rgba: &[u8]) -> Result<Vec<u8>, String> {
    let fail = |e: png::EncodingError| format!("Could not encode an icon: {e}");
    let mut out = Vec::new();
    let mut encoder = png::Encoder::new(&mut out, width, height);
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    encoder.set_compression(png::Compression::High);
    encoder
        .write_header()
        .map_err(fail)?
        .write_image_data(rgba)
        .map_err(fail)?;
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn header(width: u32, height: u32, four_cc: &[u8; 4]) -> Vec<u8> {
        let mut dds = vec![0u8; HEADER_LEN];
        dds[..4].copy_from_slice(b"DDS ");
        dds[12..16].copy_from_slice(&height.to_le_bytes());
        dds[16..20].copy_from_slice(&width.to_le_bytes());
        dds[84..88].copy_from_slice(four_cc);
        dds
    }

    #[test]
    fn decodes_a_solid_bc1_texture_with_odd_size() {
        // 6×5 needs 2×2 blocks. Both endpoint colours are pure red (RGB565 0xF800).
        let mut dds = header(6, 5, b"DXT1");
        for _ in 0..4 {
            dds.extend_from_slice(&[0x00, 0xF8, 0x00, 0xF8, 0, 0, 0, 0]);
        }
        let (w, h, rgba) = decode(&dds).unwrap();
        assert_eq!((w, h, rgba.len()), (6, 5, 6 * 5 * 4));
        assert!(rgba.as_chunks::<4>().0.iter().all(|p| *p == [255, 0, 0, 255]));
        assert!(to_png(w, h, &rgba).unwrap().starts_with(b"\x89PNG"));
    }

    #[test]
    fn shrinks_keeping_edges_clean() {
        // 4×2: left half opaque red, right half fully transparent black.
        let mut rgba = Vec::new();
        for _ in 0..2 {
            rgba.extend_from_slice(&[255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0]);
        }
        let (w, h, small) = shrink(4, 2, rgba, 2);
        assert_eq!((w, h), (2, 1));
        assert_eq!(small, vec![255, 0, 0, 255, 0, 0, 0, 0]);

        let (w, h, same) = shrink(2, 2, vec![7; 16], 96);
        assert_eq!((w, h, same), (2, 2, vec![7; 16]));
    }

    #[test]
    fn rejects_truncated_textures() {
        assert!(decode(&header(8, 8, b"DXT1")).is_err());
        assert!(decode(b"not a texture").is_err());
    }
}
