import { NextResponse, type NextRequest } from 'next/server';
import { errorResponse, UnauthorizedError } from '../errors';
import { verifyToken } from './jwt';

export const STUDENT_NO_HEADER = 'x-student-no';

export const PUBLIC_ROUTES: readonly string[] = ['/api/auth/login'];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export async function authorizeRequest(request: NextRequest, jwtSecret: string): Promise<Response> {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return errorResponse(new UnauthorizedError());

  try {
    const claims = await verifyToken(token, jwtSecret);
    const headers = new Headers(request.headers);
    headers.set(STUDENT_NO_HEADER, claims.studentNo);
    return NextResponse.next({ request: { headers } });
  } catch {
    return errorResponse(new UnauthorizedError('Token is invalid or expired'));
  }
}

export function requireStudentNo(request: NextRequest): string {
  const studentNo = request.headers.get(STUDENT_NO_HEADER);
  if (!studentNo) throw new UnauthorizedError('Authenticated request is missing the student number');
  return studentNo;
}
