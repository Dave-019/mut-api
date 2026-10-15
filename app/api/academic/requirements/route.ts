import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { errorResponse, FeatureUnavailableError } from '@/lib/errors';

export const runtime = 'edge';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    requireStudentNo(request);
    throw new FeatureUnavailableError('The portal does not expose a programme requirements endpoint');
  } catch (error) {
    return errorResponse(error);
  }
}
