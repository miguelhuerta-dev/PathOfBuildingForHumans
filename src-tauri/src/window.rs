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
