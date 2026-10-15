import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { getEnv } from '@/lib/env';
import { errorResponse, FeatureUnavailableError } from '@/lib/errors';
import { assertFeatureEnabled } from '@/lib/features';
import { portalJson, withQuery } from '@/lib/portal/client';
import { PORTAL_ENDPOINTS } from '@/lib/portal/endpoints';

export const runtime = 'edge';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv();
    const studentNo = requireStudentNo(request);

    await assertFeatureEnabled(env, 'hostel');

    const hostelId = request.nextUrl.searchParams.get('hostelId');
    if (!hostelId) {
      throw new FeatureUnavailableError('A hostelId query parameter is required');
    }

    const costs = await portalJson<unknown>(
      env,
      studentNo,
      withQuery(PORTAL_ENDPOINTS.hostelRoomCosts, { hostelId }),
    );

    return Response.json({ hostelId, costs });
  } catch (error) {
    return errorResponse(error);
  }
}
