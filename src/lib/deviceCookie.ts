const DEVICE_ID_COOKIE = 'dublymarket_device_id';
const NAME_COOKIE = 'dublymarket_name';
const FIVE_YEARS_SECONDS = 60 * 60 * 24 * 365 * 5;

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${FIVE_YEARS_SECONDS}; path=/; samesite=lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; max-age=0; path=/`;
}

export function getOrCreateDeviceId(): string {
  const existing = readCookie(DEVICE_ID_COOKIE);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  writeCookie(DEVICE_ID_COOKIE, id);
  return id;
}

export function getStoredName(): string | null {
  return readCookie(NAME_COOKIE);
}

export function storeName(name: string) {
  writeCookie(NAME_COOKIE, name);
}

export function clearIdentity() {
  deleteCookie(DEVICE_ID_COOKIE);
  deleteCookie(NAME_COOKIE);
}
