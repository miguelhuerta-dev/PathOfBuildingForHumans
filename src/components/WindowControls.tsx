import { useT } from "../i18n";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isDesktopApp } from "../lib/desktop";

const buttonBase =
  "grid h-9 w-11 place-items-center text-[#cdb78a] transition-colors focus-visible:outline-1 focus-visible:outline-gold";

function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isDesktopApp) return;
    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    appWindow.isMaximized().then(setMaximized);
    appWindow
      .onResized(() => {
        appWindow.isMaximized().then(setMaximized);
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => unlisten?.();
  }, []);

  const t = useT();
  if (!isDesktopApp) return null;

  const appWindow = getCurrentWindow();

  return (
    <div className="ml-2 flex items-center border-l border-gold-dim/45 pl-3">
      <button
        type="button"
        aria-label={t("Minimize")}
        className={`${buttonBase} hover:bg-white/5 hover:text-gold`}
        onClick={() => appWindow.minimize()}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>

      <button
        type="button"
        aria-label={maximized ? t("Restore") : t("Maximize")}
        className={`${buttonBase} hover:bg-white/5 hover:text-gold`}
        onClick={() => appWindow.toggleMaximize()}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {maximized ? (
            <>
              <rect x="5.5" y="8.5" width="10" height="10" />
              <path d="M8.5 8.5V5.5h10v10h-3" />
            </>
          ) : (
            <rect x="5.5" y="5.5" width="13" height="13" />
          )}
        </svg>
      </button>

      <button
        type="button"
        aria-label={t("Close")}
        className={`${buttonBase} hover:bg-[linear-gradient(180deg,#8e2a22,#4a0c07)] hover:text-[#f6d8c8]`}
        onClick={() => appWindow.close()}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

export default WindowControls;
