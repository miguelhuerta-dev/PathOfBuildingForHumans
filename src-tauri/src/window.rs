//! Window look that Tauri's configuration cannot express.

/// Windows 11: rounded corners and a bronze 1px window border.
/// Ignored silently on Windows 10, which does not support these attributes.
pub fn style_window_border(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::{COLORREF, HWND};
    use windows::Win32::Graphics::Dwm::{
        DwmSetWindowAttribute, DWMWA_BORDER_COLOR, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_ROUND,
    };

    let Ok(hwnd) = window.hwnd() else { return };
    let hwnd = HWND(hwnd.0 as _);

    // COLORREF is 0x00BBGGRR. Bronze #A8864B.
    let bronze = COLORREF(0x004B86A8);
    let corner = DWMWCP_ROUND;

    // SAFETY: both values live on the stack for the whole call and their sizes are passed with them.
    unsafe {
        let _ = DwmSetWindowAttribute(
            hwnd,
            DWMWA_WINDOW_CORNER_PREFERENCE,
            &corner as *const _ as *const _,
            std::mem::size_of_val(&corner) as u32,
        );
        let _ = DwmSetWindowAttribute(
            hwnd,
            DWMWA_BORDER_COLOR,
            &bronze as *const _ as *const _,
            std::mem::size_of_val(&bronze) as u32,
        );
    }
}

/// Clips the window to the pieces the page paints (the iron frame, the pillars),
/// each a polygon in physical pixels from the window's top-left corner. Outside
/// them the window is gone: the desktop shows and clicks go through. No pieces:
/// a plain rectangle again.
pub fn shape_window(window: &tauri::WebviewWindow, pieces: &[Vec<(i32, i32)>]) -> Result<(), String> {
    use windows::Win32::Foundation::{HWND, POINT};
    use windows::Win32::Graphics::Gdi::{CombineRgn, CreatePolygonRgn, CreateRectRgn, DeleteObject, SetWindowRgn, ALTERNATE, RGN_OR};

    let hwnd = window.hwnd().map_err(|e| format!("The window is not available: {e}"))?;
    let hwnd = HWND(hwnd.0 as _);
    let pieces: Vec<&Vec<(i32, i32)>> = pieces.iter().filter(|piece| piece.len() >= 3).collect();
    // SAFETY: the window handle is alive for the call. Every region made here is
    // either deleted or, once SetWindowRgn succeeds, owned and freed by the system.
    unsafe {
        if pieces.is_empty() {
            SetWindowRgn(hwnd, None, true);
            return Ok(());
        }
        let shape = CreateRectRgn(0, 0, 0, 0);
        if shape.is_invalid() {
            return Err("Could not shape the window.".into());
        }
        for piece in pieces {
            let points: Vec<POINT> = piece.iter().map(|&(x, y)| POINT { x, y }).collect();
            let region = CreatePolygonRgn(&points, ALTERNATE);
            if !region.is_invalid() {
                CombineRgn(Some(shape), Some(shape), Some(region), RGN_OR);
                let _ = DeleteObject(region.into());
            }
        }
        SetWindowRgn(hwnd, Some(shape), true);
    }
    Ok(())
}
