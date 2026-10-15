import { NextResponse, type NextRequest } from 'next/server';
import { authorizeRequest, isPublicRoute } from './lib/auth/middleware';
import { getJwtSecret } from './lib/env';

export const config = {
  matcher: ['/:path*'],
};

function jsonNotFound(pathname: string): Response {
  return Response.json(
    { error: 'NOT_FOUND', message: `No route for ${pathname}` },
    { status: 404 },
  );
}

export async function proxy(request: NextRequest): Promise<Response> {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api')) {
    return jsonNotFound(pathname);
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  return authorizeRequest(request, getJwtSecret());
}
