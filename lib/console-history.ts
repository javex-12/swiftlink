/**
 * Where the installed app should land on launch.
 *
 * The PWA's `start_url` is static — a web manifest cannot ask "is this person
 * signed in, and where were they?" — so an installed app opened on the landing
 * page every single time, even for a merchant who lives in the console. The
 * launch route reads this record and sends them back to the last console screen
 * they used instead.
 *
 * Only console paths are remembered. A storefront the merchant was previewing,
 * a shared invite link, or a page that no longer exists must not become the
 * app's home, so anything that is not `/pro`, `/account` or `/business` is
 * ignored and the console home is used.
 */

export const LAST_CONSOLE_PATH_KEY = "swiftlink_last_console_path";

/** Console sections that are safe to resume into. */
export function isConsolePath(path: string): boolean {
  if (!path || !path.startsWith("/")) return false;
  return /^\/(pro|account|business)(\/|$|\?|#)/.test(path);
}

type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };

function storageOrDefault(storage?: StorageLike | null): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode / storage disabled: the app still works, it just opens at
    // the console home every time.
    return null;
  }
}

/** Record the screen the merchant is on, so the next launch can resume it. */
export function rememberConsolePath(path: string, storage?: StorageLike | null): void {
  const target = storageOrDefault(storage);
  if (!target || !isConsolePath(path)) return;
  try {
    target.setItem(LAST_CONSOLE_PATH_KEY, path);
  } catch {
    // Ignore quota/security errors — this is a convenience, not data.
  }
}

/** The last console screen, or null when there is nothing valid to resume. */
export function readLastConsolePath(storage?: StorageLike | null): string | null {
  const target = storageOrDefault(storage);
  if (!target) return null;
  try {
    const value = target.getItem(LAST_CONSOLE_PATH_KEY);
    return value && isConsolePath(value) ? value : null;
  } catch {
    return null;
  }
}
