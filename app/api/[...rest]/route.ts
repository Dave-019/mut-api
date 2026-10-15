import { errorResponse, NotFoundError } from '@/lib/errors';

export const runtime = 'edge';

function handle(request: Request): Response {
  const pathname = new URL(request.url).pathname;
  return errorResponse(new NotFoundError(`No API route for ${pathname}`));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
