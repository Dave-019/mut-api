import { SignJWT, jwtVerify } from 'jose';

const ALGORITHM = 'HS256';
const ISSUER = 'mut-bff';
const AUDIENCE = 'mut-android';

export const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionClaims {
  studentNo: string;
}

function encodeSecret(secret: string): Uint8Array {
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(secret);
}

export async function issueToken(
  studentNo: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TOKEN_TTL_SECONDS,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT({ studentNo })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt(issuedAt)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(issuedAt + ttlSeconds)
    .sign(encodeSecret(secret));
}

export async function verifyToken(token: string, secret: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, encodeSecret(secret), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const studentNo = payload.studentNo;
  if (typeof studentNo !== 'string' || studentNo.length === 0) {
    throw new Error('Token payload is missing studentNo');
  }

  return { studentNo };
}
