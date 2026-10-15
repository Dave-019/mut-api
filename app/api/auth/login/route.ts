import type { NextRequest } from 'next/server';
import { DEFAULT_TOKEN_TTL_SECONDS, issueToken } from '@/lib/auth/jwt';
import { getEnv } from '@/lib/env';
import { CredentialsInvalidError, errorResponse } from '@/lib/errors';
import { establishSessions } from '@/lib/portal/session';

export const runtime = 'edge';

interface LoginBody {
  studentNo?: unknown;
  password?: unknown;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv();
    const body = (await request.json().catch(() => null)) as LoginBody | null;

    const studentNo = typeof body?.studentNo === 'string' ? body.studentNo.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!studentNo || !password) {
      throw new CredentialsInvalidError('Both studentNo and password are required');
    }

    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured on the Worker');
    }

    await establishSessions(env, { studentNo, password });

    const token = await issueToken(studentNo, env.JWT_SECRET);

    return Response.json({
      token,
      tokenType: 'Bearer',
      expiresIn: DEFAULT_TOKEN_TTL_SECONDS,
      studentNo,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
