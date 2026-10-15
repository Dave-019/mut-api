import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { getEnv } from '@/lib/env';
import { errorResponse } from '@/lib/errors';
import { assertFeatureEnabled } from '@/lib/features';
import { parseFeeBalance } from '@/lib/parsers';
import { portalHtml } from '@/lib/portal/client';
import { PORTAL_ENDPOINTS } from '@/lib/portal/endpoints';

export const runtime = 'edge';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv();
    const studentNo = requireStudentNo(request);

    await assertFeatureEnabled(env, 'feeStatement');

    const html = await portalHtml(env, studentNo, PORTAL_ENDPOINTS.feePayment);
    return Response.json(parseFeeBalance(html));
  } catch (error) {
    return errorResponse(error);
  }
}
