//! Which picture the game draws for each item base ("Divine Life Flask" →
//! `Art/2DItems/Flasks/...dds`), read from the game's own data tables:
//! `BaseItemTypes` names each base and points at a row of
//! `ItemVisualIdentity`, whose `DDSFile` column is the item's art.
//!
//! Column offsets follow the community's dat schema, but tables gain columns
//! between patches. Each offset is therefore checked against items whose art
//! has not changed in years, and searched for again when the check fails.

use super::dat::Table;
use std::collections::HashMap;

pub const BASE_ITEM_TYPES: [&str; 2] = ["Data/BaseItemTypes.datc64", "Data/BaseItemTypes.dat64"];
pub const ITEM_VISUAL_IDENTITY: [&str; 2] = ["Data/ItemVisualIdentity.datc64", "Data/ItemVisualIdentity.dat64"];

/// Where item art lives in the game's files; nothing else is ever read.
pub const ART_PREFIX: &str = "art/2ditems/";

/// `BaseItemTypes.Name`, `BaseItemTypes.ItemVisualIdentityKey` and
/// `ItemVisualIdentity.DDSFile`, as the schema had them when this was written.
const NAME: usize = 32;
const VISUAL_IDENTITY: usize = 124;
const DDS_FILE: usize = 8;

/// Bases whose art is known, used to find and check the columns.
const ANCHORS: [(&str, &str); 2] = [
    ("Chaos Orb", "Art/2DItems/Currency/CurrencyRerollRare.dds"),
    ("Scroll of Wisdom", "Art/2DItems/Currency/CurrencyIdentification.dds"),
];

const LAYOUT_CHANGED: &str =
    "This version of Path of Exile stores item data in a way the app does not know yet; item art is unavailable.";

fn is_item_art(path: &str) -> bool {
    path.to_lowercase().starts_with(ART_PREFIX) && path.to_lowercase().ends_with(".dds") && !path.contains("..")
}

fn row_named(bases: &Table, name_col: usize, name: &str) -> Option<usize> {
    (0..bases.rows()).find(|&row| bases.string(row, name_col).as_deref() == Some(name))
}

fn art_of(bases: &Table, visuals: &Table, row: usize, visual_col: usize, dds_col: usize) -> Option<String> {
    let visual = bases.row_ref(row, visual_col)?;
    visuals.string(visual, dds_col)
}

/// Do these columns give every anchor its known art?
fn columns_fit(bases: &Table, visuals: &Table, name_col: usize, visual_col: usize, dds_col: usize) -> bool {
    ANCHORS.iter().all(|(name, art)| {
        row_named(bases, name_col, name)
            .and_then(|row| art_of(bases, visuals, row, visual_col, dds_col))
            .is_some_and(|found| found.eq_ignore_ascii_case(art))
    })
}

/// The three columns, from the schema when it still fits, else by search.
fn find_columns(bases: &Table, visuals: &Table) -> Option<(usize, usize, usize)> {
    if columns_fit(bases, visuals, NAME, VISUAL_IDENTITY, DDS_FILE) {
        return Some((NAME, VISUAL_IDENTITY, DDS_FILE));
    }
    let offsets = |width: usize| 0..width.saturating_sub(7);
    let name_col = offsets(bases.width()).find(|&col| row_named(bases, col, ANCHORS[0].0).is_some())?;
    let anchor_row = row_named(bases, name_col, ANCHORS[0].0)?;
    let dds_col = offsets(visuals.width()).find(|&col| {
        (0..visuals.rows()).any(|row| {
            visuals
                .string(row, col)
                .is_some_and(|s| s.eq_ignore_ascii_case(ANCHORS[0].1))
        })
    })?;
    offsets(bases.width())
        .filter(|&col| {
            art_of(bases, visuals, anchor_row, col, dds_col).is_some_and(|s| s.eq_ignore_ascii_case(ANCHORS[0].1))
        })
        .find(|&col| columns_fit(bases, visuals, name_col, col, dds_col))
        .map(|visual_col| (name_col, visual_col, dds_col))
}

/// Base name → art path (as the game names it, e.g. `Art/2DItems/...dds`).
/// The first base of a name wins: later ones are variants of other leagues.
pub fn art_by_base(base_item_types: &[u8], item_visual_identity: &[u8]) -> Result<HashMap<String, String>, String> {
    let bases = Table::parse(base_item_types)?;
    let visuals = Table::parse(item_visual_identity)?;
    let (name_col, visual_col, dds_col) = find_columns(&bases, &visuals).ok_or(LAYOUT_CHANGED)?;
    let mut art = HashMap::new();
    for row in 0..bases.rows() {
        let Some(name) = bases.string(row, name_col).filter(|name| !name.is_empty()) else {
            continue;
        };
        if art.contains_key(&name) {
            continue;
        }
        if let Some(path) = art_of(&bases, &visuals, row, visual_col, dds_col).filter(|path| is_item_art(path)) {
            art.insert(name, path);
        }
    }
    Ok(art)
}

#[cfg(test)]
mod tests {
    use super::super::dat::tests::{table, Cell};
    use super::*;

    fn visuals(dds_col: usize) -> Vec<u8> {
        table(
            dds_col + 8,
            &[
                vec![
                    (0, Cell::Str("CurrencyRerollRare")),
                    (dds_col, Cell::Str("Art/2DItems/Currency/CurrencyRerollRare.dds")),
                ],
                vec![
                    (0, Cell::Str("CurrencyIdentification")),
                    (dds_col, Cell::Str("Art/2DItems/Currency/CurrencyIdentification.dds")),
                ],
                vec![
                    (0, Cell::Str("DivineLife")),
                    (dds_col, Cell::Str("Art/2DItems/Flasks/DivineLifeFlask.dds")),
                ],
                vec![(0, Cell::Str("Odd")), (dds_col, Cell::Str("Art/Textures/Other.dds"))],
            ],
        )
    }

    fn bases(name_col: usize, visual_col: usize) -> Vec<u8> {
        let row = |name, visual| {
            vec![
                (0, Cell::Str("Metadata/Items/X")),
                (name_col, Cell::Str(name)),
                (visual_col, Cell::Ref(visual)),
            ]
        };
        table(
            visual_col.max(name_col) + 16,
            &[
                row("Chaos Orb", Some(0)),
                row("Scroll of Wisdom", Some(1)),
                row("Divine Life Flask", Some(2)),
                row("Divine Life Flask", Some(1)),
                row("No Art", None),
                row("Strange Thing", Some(3)),
                row("", Some(2)),
            ],
        )
    }

    #[test]
    fn maps_base_names_to_item_art() {
        let art = art_by_base(&bases(NAME, VISUAL_IDENTITY), &visuals(DDS_FILE)).unwrap();
        assert_eq!(art["Chaos Orb"], "Art/2DItems/Currency/CurrencyRerollRare.dds");
        assert_eq!(
            art["Divine Life Flask"], "Art/2DItems/Flasks/DivineLifeFlask.dds",
            "first row of a name wins"
        );
        assert!(!art.contains_key("No Art"));
        assert!(!art.contains_key("Strange Thing"), "only art under Art/2DItems/");
        assert!(!art.contains_key(""));
    }

    #[test]
    fn finds_moved_columns() {
        // A patch added columns before both the name and the visual identity.
        let art = art_by_base(&bases(40, 140), &visuals(16)).unwrap();
        assert_eq!(art["Divine Life Flask"], "Art/2DItems/Flasks/DivineLifeFlask.dds");
    }

    #[test]
    fn reports_an_unknown_layout() {
        let unrelated = table(16, &[vec![(0, Cell::Str("Nothing"))]]);
        assert!(art_by_base(&unrelated, &visuals(DDS_FILE)).is_err());
    }
}
