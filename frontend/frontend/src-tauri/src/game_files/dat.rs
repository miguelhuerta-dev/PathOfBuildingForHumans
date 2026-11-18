//! Reads rows of the game's data tables (`Data/*.dat64`).
//!
//! A table is a row count, fixed-width rows, then a variable-length data
//! section that starts with eight `0xBB` bytes. Strings and lists in a row are
//! offsets into that section; strings are UTF-16LE ended by a zero code unit.
//! Column offsets are not stored in the file: callers know them from the
//! table's layout (the community's dat schema documents them).

const MAGIC: [u8; 8] = [0xBB; 8];
/// What the game writes for "no row" in a reference column.
const NULL_ROW: u64 = 0xFEFE_FEFE_FEFE_FEFE;

const DAMAGED: &str = "The game's data tables could not be read (unexpected format).";

pub struct Table<'a> {
    rows: usize,
    width: usize,
    fixed: &'a [u8],
    variable: &'a [u8],
}

impl<'a> Table<'a> {
    pub fn parse(data: &'a [u8]) -> Result<Self, String> {
        let rows = u32::from_le_bytes(data.get(..4).ok_or(DAMAGED)?.try_into().map_err(|_| DAMAGED)?) as usize;
        let body = &data[4..];
        let start = body.windows(MAGIC.len()).position(|w| w == MAGIC).ok_or(DAMAGED)?;
        // The magic can appear inside rows; the real one leaves whole rows before it.
        let start = if rows == 0 {
            start
        } else {
            let mut at = start;
            loop {
                if at % rows == 0 {
                    break at;
                }
                at += 1 + body[at + 1..]
                    .windows(MAGIC.len())
                    .position(|w| w == MAGIC)
                    .ok_or(DAMAGED)?;
            }
        };
        let width = start.checked_div(rows).unwrap_or(0);
        Ok(Self {
            rows,
            width,
            fixed: &body[..start],
            variable: &body[start..],
        })
    }

    pub fn rows(&self) -> usize {
        self.rows
    }

    pub fn width(&self) -> usize {
        self.width
    }

    fn cell(&self, row: usize, offset: usize, len: usize) -> Option<&'a [u8]> {
        if row >= self.rows || offset + len > self.width {
            return None;
        }
        let at = row * self.width + offset;
        self.fixed.get(at..at + len)
    }

    fn u64_at(&self, row: usize, offset: usize) -> Option<u64> {
        Some(u64::from_le_bytes(self.cell(row, offset, 8)?.try_into().ok()?))
    }

    /// A string column (8 bytes: offset into the data section).
    pub fn string(&self, row: usize, offset: usize) -> Option<String> {
        let at = usize::try_from(self.u64_at(row, offset)?).ok()?;
        let units: Vec<u16> = self
            .variable
            .get(at..)?
            .as_chunks::<2>()
            .0
            .iter()
            .map(|pair| u16::from_le_bytes(*pair))
            .take_while(|&unit| unit != 0)
            .collect();
        String::from_utf16(&units).ok()
    }

    /// A reference to a row of another table (16 bytes: row index, unused).
    pub fn row_ref(&self, row: usize, offset: usize) -> Option<usize> {
        let value = self.u64_at(row, offset)?;
        if value == NULL_ROW {
            return None;
        }
        usize::try_from(value).ok()
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;

    /// Builds a table from rows of (string, reference) cells, the layout used
    /// by the tests here and in `item_art`.
    pub fn table(width: usize, rows: &[Vec<(usize, Cell)>]) -> Vec<u8> {
        let mut variable = MAGIC.to_vec();
        let mut fixed = Vec::new();
        for row in rows {
            let mut bytes = vec![0u8; width];
            for (offset, cell) in row {
                let value = match cell {
                    Cell::Str(text) => {
                        let at = variable.len() as u64;
                        for unit in text.encode_utf16() {
                            variable.extend(unit.to_le_bytes());
                        }
                        variable.extend([0; 4]);
                        at
                    }
                    Cell::Ref(Some(row)) => *row as u64,
                    Cell::Ref(None) => NULL_ROW,
                };
                bytes[*offset..offset + 8].copy_from_slice(&value.to_le_bytes());
            }
            fixed.extend(bytes);
        }
        let mut data = (rows.len() as u32).to_le_bytes().to_vec();
        data.extend(fixed);
        data.extend(variable);
        data
    }

    pub enum Cell {
        Str(&'static str),
        Ref(Option<usize>),
    }

    #[test]
    fn reads_strings_and_references() {
        let data = table(
            24,
            &[
                vec![(0, Cell::Str("Metadata/Items/A")), (8, Cell::Ref(Some(1)))],
                vec![(0, Cell::Str("Maelström Staff")), (8, Cell::Ref(None))],
            ],
        );
        let table = Table::parse(&data).unwrap();
        assert_eq!((table.rows(), table.width()), (2, 24));
        assert_eq!(table.string(0, 0).as_deref(), Some("Metadata/Items/A"));
        assert_eq!(table.string(1, 0).as_deref(), Some("Maelström Staff"));
        assert_eq!(table.row_ref(0, 8), Some(1));
        assert_eq!(table.row_ref(1, 8), None);
        assert_eq!(table.string(2, 0), None, "no row past the end");
        assert_eq!(table.string(0, 20), None, "no cell past the row");
    }

    #[test]
    fn skips_the_magic_inside_rows() {
        // A row holding eight 0xBB bytes must not be taken for the data section.
        let rows: Vec<_> = ["x", "y", "z"].map(|s| vec![(0, Cell::Str(s))]).into();
        let mut data = table(16, &rows);
        data[4 + 4..4 + 12].copy_from_slice(&MAGIC);
        let table = Table::parse(&data).unwrap();
        assert_eq!(table.width(), 16);
        assert_eq!(table.string(2, 0).as_deref(), Some("z"));
    }

    #[test]
    fn rejects_damaged_tables() {
        assert!(Table::parse(&[1, 0]).is_err());
        assert!(Table::parse(&[1, 0, 0, 0, 1, 2, 3]).is_err());
    }
}
