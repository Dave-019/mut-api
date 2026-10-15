import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { getEnv } from '@/lib/env';
import { errorResponse } from '@/lib/errors';
import { assertFeatureEnabled } from '@/lib/features';
import { buildRoomSpaces, parseHostelOptions } from '@/lib/parsers';
import { portalHtml, portalJson, withQuery } from '@/lib/portal/client';
import { PORTAL_ENDPOINTS } from '@/lib/portal/endpoints';

export const runtime = 'edge';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv();
    const studentNo = requireStudentNo(request);

    await assertFeatureEnabled(env, 'hostel');

    const hostelId = request.nextUrl.searchParams.get('hostelId');
    const html = await portalHtml(env, studentNo, PORTAL_ENDPOINTS.hostel);
    const hostels = parseHostelOptions(html);

    if (!hostelId) {
      return Response.json({ hostels, hostelId: null, spaces: [] });
    }

    const [spaces, costs] = await Promise.all([
      portalJson<unknown>(
        env,
        studentNo,
        withQuery(PORTAL_ENDPOINTS.hostelAvailableSpaces, { hostelId }),
      ),
      portalJson<unknown>(
        env,
        studentNo,
        withQuery(PORTAL_ENDPOINTS.hostelRoomCosts, { hostelId }),
      ),
    ]);

    return Response.json({ hostels, hostelId, spaces: buildRoomSpaces(hostelId, spaces, costs) });
  } catch (error) {
    return errorResponse(error);
  }
}
