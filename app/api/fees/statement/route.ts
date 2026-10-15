import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { getEnv } from '@/lib/env';
import { errorResponse } from '@/lib/errors';
import { assertFeatureEnabled } from '@/lib/features';
import { portalBinary, toBase64 } from '@/lib/portal/client';
import { PORTAL_ENDPOINTS } from '@/lib/portal/endpoints';

export const runtime = 'edge';

const FILENAME = 'fee-statement.pdf';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv();
    const studentNo = requireStudentNo(request);

    await assertFeatureEnabled(env, 'feeStatement');

    const file = await portalBinary(env, studentNo, PORTAL_ENDPOINTS.feeStatement);

    if (request.nextUrl.searchParams.get('format') === 'base64') {
      return Response.json({
        contentType: file.contentType,
        filename: FILENAME,
        byteLength: file.byteLength,
        base64: toBase64(file.bytes),
      });
    }

    return new Response(file.bytes, {
      status: 200,
      headers: {
        'content-type': file.contentType,
        'content-disposition': `attachment; filename="${FILENAME}"`,
        'content-length': String(file.byteLength),
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
