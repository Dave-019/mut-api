import type { Env } from '../env';
import {
  FeatureUnavailableError,
  messageOf,
  PortalUnreachableError,
  SessionExpiredError,
} from '../errors';
import { isLoginRedirect, requireValidSession, destroySession, type SessionScope } from './session';

const DEFAULT_ACCEPT = 'application/json, text/html;q=0.9, */*;q=0.8';
const BASE64_CHUNK_SIZE = 0x8000;

export interface PortalRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  scope?: SessionScope;
}

export interface PortalBinary {
  contentType: string;
  bytes: ArrayBuffer;
  byteLength: number;
}

function portalUrl(env: Env, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.PORTAL_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function withQuery(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK_SIZE));
  }

  return btoa(binary);
}

export async function portalFetch(
  env: Env,
  studentNo: string,
  path: string,
  options: PortalRequestOptions = {},
): Promise<Response> {
  const scope: SessionScope = options.scope ?? 'primary';
  const session = await requireValidSession(env, studentNo, scope);
  const url = portalUrl(env, path);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        accept: DEFAULT_ACCEPT,
        cookie: session.cookie,
        ...options.headers,
      },
      body: options.body,
      redirect: 'manual',
    });
  } catch (error) {
    throw new PortalUnreachableError(`Portal request to ${path} failed: ${messageOf(error)}`);
  }

  if (isLoginRedirect(response)) {
    await destroySession(env, studentNo, scope);
    throw new SessionExpiredError(`Portal redirected ${path} to the login page`);
  }

  if (response.status === 401 || response.status === 403) {
    await destroySession(env, studentNo, scope);
    throw new SessionExpiredError(`Portal rejected the stored session for ${path}`);
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location') ?? '/';
    throw new FeatureUnavailableError(
      `Portal redirected ${path} to ${location}. The portal does this for pages it will not serve in the current session state.`,
    );
  }

  if (!response.ok) {
    throw new PortalUnreachableError(`Portal responded with ${response.status} for ${path}`);
  }

  return response;
}

export async function portalJson<T>(
  env: Env,
  studentNo: string,
  path: string,
  options: PortalRequestOptions = {},
): Promise<T> {
  const response = await portalFetch(env, studentNo, path, {
    ...options,
    headers: { accept: 'application/json', ...options.headers },
  });

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new PortalUnreachableError(`Portal returned invalid JSON for ${path}: ${messageOf(error)}`);
  }
}

export async function portalHtml(
  env: Env,
  studentNo: string,
  path: string,
  options: PortalRequestOptions = {},
): Promise<string> {
  const response = await portalFetch(env, studentNo, path, options);
  return response.text();
}

export async function portalBinary(
  env: Env,
  studentNo: string,
  path: string,
  options: PortalRequestOptions = {},
): Promise<PortalBinary> {
  const response = await portalFetch(env, studentNo, path, options);
  const buffer = await response.arrayBuffer();

  return {
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
    bytes: buffer,
    byteLength: buffer.byteLength,
  };
}
