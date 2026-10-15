import { requireKv, type Env } from '../env';
import {
  CredentialsInvalidError,
  messageOf,
  PortalUnreachableError,
  SessionExpiredError,
} from '../errors';
import { ANTIFORGERY_FIELD, fetchAntiforgeryToken } from './antiforgery';
import {
  applySetCookie,
  findSessionCookie,
  readSetCookieHeaders,
  serializeCookies,
  type PortalCookie,
} from './cookies';

const SESSION_KEY_PREFIX = 'session:';
const DASHBOARD_KEY_PREFIX = 'session:dashboard:';
export const LOGIN_PATH = '/authentication/login';

export const PORTAL_SESSION_TTL_SECONDS = 60 * 30;

/**
 * The portal poisons a session once the dashboard (`/`) is loaded: every
 * subsequent request to the registration pages redirects back to `/` until
 * the session is replaced. Keeping the dashboard on its own session keeps the
 * primary session usable for everything else.
 */
export type SessionScope = 'primary' | 'dashboard';

const LOGIN_FORM_FIELDS = {
  studentNo: 'Username',
  password: 'Password',
} as const;

export interface PortalSession {
  cookie: string;
  expires: number;
  lastVerified: number;
}

export interface PortalCredentials {
  studentNo: string;
  password: string;
}

export function sessionKey(studentNo: string, scope: SessionScope = 'primary'): string {
  const prefix = scope === 'dashboard' ? DASHBOARD_KEY_PREFIX : SESSION_KEY_PREFIX;
  return `${prefix}${studentNo}`;
}

export function isLoginRedirect(response: Response): boolean {
  if (response.status < 300 || response.status >= 400) return false;

  const location = response.headers.get('location');
  if (!location) return false;

  return location.toLowerCase().includes(LOGIN_PATH.toLowerCase());
}

function buildSession(cookies: PortalCookie[]): PortalSession {
  const now = Date.now();
  return {
    cookie: serializeCookies(cookies),
    expires: now + PORTAL_SESSION_TTL_SECONDS * 1000,
    lastVerified: now,
  };
}

function looksLikeLoginForm(html: string): boolean {
  const lower = html.toLowerCase();
  return lower.includes(ANTIFORGERY_FIELD.toLowerCase()) && lower.includes('type="password"');
}

export async function login(env: Env, credentials: PortalCredentials): Promise<PortalSession> {
  const loginUrl = `${env.PORTAL_BASE_URL}${LOGIN_PATH}`;
  const { token, cookies } = await fetchAntiforgeryToken(loginUrl);

  const body = new URLSearchParams();
  body.set(LOGIN_FORM_FIELDS.studentNo, credentials.studentNo);
  body.set(LOGIN_FORM_FIELDS.password, credentials.password);
  body.set(ANTIFORGERY_FIELD, token);

  let response: Response;
  try {
    response = await fetch(loginUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'text/html,application/xhtml+xml',
        cookie: serializeCookies(cookies),
        referer: loginUrl,
      },
      body: body.toString(),
    });
  } catch (error) {
    throw new PortalUnreachableError(`Portal login request failed: ${messageOf(error)}`);
  }

  const responseCookies = applySetCookie(cookies, readSetCookieHeaders(response.headers));
  const sessionCookie = findSessionCookie(responseCookies);

  if (response.status === 401 || response.status === 403) {
    throw new CredentialsInvalidError('Portal rejected the supplied credentials');
  }

  if (response.status >= 300 && response.status < 400) {
    if (!sessionCookie) {
      throw new CredentialsInvalidError('Portal did not issue a session cookie for these credentials');
    }
    return buildSession(responseCookies);
  }

  const html = await response.text().catch(() => '');
  if (looksLikeLoginForm(html)) {
    throw new CredentialsInvalidError('Portal returned the login page; credentials were rejected');
  }

  if (!sessionCookie) {
    throw new CredentialsInvalidError('Portal did not issue a session cookie for these credentials');
  }

  return buildSession(responseCookies);
}

export async function storeSession(
  env: Env,
  studentNo: string,
  session: PortalSession,
  scope: SessionScope = 'primary',
): Promise<void> {
  const ttlSeconds = Math.max(60, Math.floor((session.expires - Date.now()) / 1000));
  await requireKv(env).put(sessionKey(studentNo, scope), JSON.stringify(session), { expirationTtl: ttlSeconds });
}

export async function getSession(
  env: Env,
  studentNo: string,
  scope: SessionScope = 'primary',
): Promise<PortalSession | null> {
  const raw = await requireKv(env).get(sessionKey(studentNo, scope));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PortalSession;
    if (!parsed || typeof parsed.cookie !== 'string' || typeof parsed.expires !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function destroySession(
  env: Env,
  studentNo: string,
  scope: SessionScope = 'primary',
): Promise<void> {
  await requireKv(env).delete(sessionKey(studentNo, scope));
}

export async function requireValidSession(
  env: Env,
  studentNo: string,
  scope: SessionScope = 'primary',
): Promise<PortalSession> {
  const session = (await getSession(env, studentNo, scope))
    ?? (scope === 'dashboard' ? await getSession(env, studentNo, 'primary') : null);

  if (!session) throw new SessionExpiredError('No portal session is stored for this student');

  if (session.expires <= Date.now()) {
    await destroySession(env, studentNo, scope);
    throw new SessionExpiredError('Stored portal session has expired');
  }

  return session;
}

export interface EstablishedSessions {
  primary: PortalSession;
  dashboard: PortalSession;
}

/**
 * Logs in twice so the dashboard has a session of its own to poison. If the
 * second login fails we fall back to the primary session and accept that the
 * registration pages will need a re-login after the dashboard is loaded.
 */
export async function establishSessions(
  env: Env,
  credentials: PortalCredentials,
): Promise<EstablishedSessions> {
  const primary = await login(env, credentials);
  await storeSession(env, credentials.studentNo, primary, 'primary');

  try {
    const dashboard = await login(env, credentials);
    await storeSession(env, credentials.studentNo, dashboard, 'dashboard');
    return { primary, dashboard };
  } catch {
    return { primary, dashboard: primary };
  }
}
