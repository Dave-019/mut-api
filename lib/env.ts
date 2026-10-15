import { env as workerEnv } from 'cloudflare:workers';

export interface Env {
  MUT_KV: KVNamespace;
  JWT_SECRET: string;
  PORTAL_BASE_URL: string;
}

const DEFAULT_PORTAL_BASE_URL = 'https://portal.mut.ac.ke';

const bindings = workerEnv as unknown as Record<string, unknown>;

function readBinding(key: keyof Env): unknown {
  const bound = bindings[key];
  if (bound !== undefined && bound !== null && bound !== '') return bound;

  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;

  return undefined;
}

export function getEnv(): Env {
  const baseUrl = readBinding('PORTAL_BASE_URL');
  const jwtSecret = readBinding('JWT_SECRET');

  return {
    MUT_KV: readBinding('MUT_KV') as KVNamespace,
    JWT_SECRET: typeof jwtSecret === 'string' ? jwtSecret : '',
    PORTAL_BASE_URL:
      typeof baseUrl === 'string' && baseUrl.length > 0
        ? baseUrl.replace(/\/+$/, '')
        : DEFAULT_PORTAL_BASE_URL,
  };
}

export function getJwtSecret(): string {
  return getEnv().JWT_SECRET;
}

export function requireKv(env: Env): KVNamespace {
  if (!env.MUT_KV) throw new Error('MUT_KV binding is not configured');
  return env.MUT_KV;
}
