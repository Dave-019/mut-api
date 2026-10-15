import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { getEnv } from '@/lib/env';
import { errorResponse } from '@/lib/errors';
import { parseProfilePhoto } from '@/lib/parsers';
import { portalHtml } from '@/lib/portal/client';
import { PORTAL_ENDPOINTS } from '@/lib/portal/endpoints';

export const runtime = 'edge';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const studentNo = requireStudentNo(request);
    const html = await portalHtml(getEnv(), studentNo, PORTAL_ENDPOINTS.dashboard);
    return Response.json(parseProfilePhoto(html));
  } catch (error) {
    return errorResponse(error);
  }
}
