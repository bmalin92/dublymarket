import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateDeviceId, getStoredName, storeName, clearIdentity } from './deviceCookie';

function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; max-age=0; path=/`;
    }
  });
}

describe('deviceCookie', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  it('creates and persists a device id', () => {
    const id = getOrCreateDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(getOrCreateDeviceId()).toBe(id);
  });

  it('stores and retrieves a name', () => {
    expect(getStoredName()).toBeNull();
    storeName('Grug');
    expect(getStoredName()).toBe('Grug');
  });

  it('clears both cookies', () => {
    getOrCreateDeviceId();
    storeName('Grug');
    clearIdentity();
    expect(getStoredName()).toBeNull();
  });
});
