//! Window look that Tauri's configuration cannot express.

/// Windows 11: no window border and square corners, so the transparent window
/// shows only the iron frame the page paints, with nothing drawn around it.
/// Ignored silently on Windows 10, which does not support these attributes.
pub fn style_window_border(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::{COLORREF, HWND};
    use windows::Win32::Graphics::Dwm::{
        DwmSetWindowAttribute, DWMWA_BORDER_COLOR, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND,
    };

    let Ok(hwnd) = window.hwnd() else { return };
    let hwnd = HWND(hwnd.0 as _);

    // DWMWA_COLOR_NONE: Windows draws no border at all.
    let no_border = COLORREF(0xFFFF_FFFE);
    let corner = DWMWCP_DONOTROUND;

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
            &no_border as *const _ as *const _,
            std::mem::size_of_val(&no_border) as u32,
        );
    }
}
