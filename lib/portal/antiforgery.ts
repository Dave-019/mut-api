import { parse } from 'node-html-parser';
import { messageOf, ParseError, PortalUnreachableError } from '../errors';
import { applySetCookie, readSetCookieHeaders, type PortalCookie } from './cookies';

export const ANTIFORGERY_FIELD = '__RequestVerificationToken';

export interface AntiforgeryToken {
  token: string;
  cookies: PortalCookie[];
}

export function extractAntiforgeryToken(html: string): string {
  const root = parse(html);
  const input = root.querySelector(`input[name="${ANTIFORGERY_FIELD}"]`);
  const value = input?.getAttribute('value');

  if (!value) {
    throw new ParseError('ANTIFORGERY_TOKEN_MISSING', `Login page did not contain ${ANTIFORGERY_FIELD}`);
  }

  return value;
}

export async function fetchAntiforgeryToken(loginUrl: string): Promise<AntiforgeryToken> {
  let response: Response;

  try {
    response = await fetch(loginUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { accept: 'text/html,application/xhtml+xml' },
    });
  } catch (error) {
    throw new PortalUnreachableError(`Could not load the portal login page: ${messageOf(error)}`);
  }

  if (!response.ok) {
    throw new PortalUnreachableError(`Portal login page responded with ${response.status}`);
  }

  const cookies = applySetCookie([], readSetCookieHeaders(response.headers));
  const html = await response.text();

  return { token: extractAntiforgeryToken(html), cookies };
}
