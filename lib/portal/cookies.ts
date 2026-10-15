export interface PortalCookie {
  name: string;
  value: string;
}

const SESSION_COOKIE_PATTERN = /session/i;

export function parseCookieHeader(header: string | null | undefined): PortalCookie[] {
  if (!header) return [];

  const cookies: PortalCookie[] = [];
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;

    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!name) continue;

    cookies.push({ name, value });
  }

  return cookies;
}

export function serializeCookies(cookies: PortalCookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

export function applySetCookie(cookies: PortalCookie[], setCookieHeaders: string[]): PortalCookie[] {
  const jar = new Map(cookies.map((cookie) => [cookie.name, cookie.value]));

  for (const header of setCookieHeaders) {
    const pair = header.split(';')[0];
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;

    const name = pair.slice(0, separator).trim();
    if (!name) continue;

    const value = pair.slice(separator + 1).trim();
    if (value.length === 0) {
      jar.delete(name);
      continue;
    }

    jar.set(name, value);
  }

  return Array.from(jar, ([name, value]) => ({ name, value }));
}

export function findSessionCookie(cookies: PortalCookie[]): PortalCookie | null {
  return cookies.find((cookie) => SESSION_COOKIE_PATTERN.test(cookie.name)) ?? null;
}

export function readSetCookieHeaders(headers: Headers): string[] {
  const carrier = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof carrier.getSetCookie === 'function') {
    return carrier.getSetCookie();
  }

  const combined = headers.get('set-cookie');
  if (!combined) return [];

  return splitSetCookieHeader(combined);
}

function splitSetCookieHeader(header: string): string[] {
  const parts: string[] = [];
  let current = '';

  for (let index = 0; index < header.length; index += 1) {
    const character = header[index];

    if (character === ',') {
      const rest = header.slice(index + 1).trimStart().toLowerCase();
      if (!rest.startsWith('expires=')) {
        parts.push(current);
        current = '';
        continue;
      }
    }

    current += character;
  }

  if (current.trim().length > 0) parts.push(current);
  return parts;
}
