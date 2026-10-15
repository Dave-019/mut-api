export type ErrorCode =
  | 'SESSION_EXPIRED'
  | 'CREDENTIALS_INVALID'
  | 'FEATURE_UNAVAILABLE'
  | 'PARSE_ERROR'
  | 'PORTAL_UNREACHABLE'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ErrorBody {
  error: ErrorCode;
  message: string;
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Missing or invalid authentication token') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'No such route') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = 'Portal session is no longer valid') {
    super('SESSION_EXPIRED', message, 401);
    this.name = 'SessionExpiredError';
  }
}

export class CredentialsInvalidError extends ApiError {
  constructor(message = 'Portal rejected the supplied credentials') {
    super('CREDENTIALS_INVALID', message, 401);
    this.name = 'CredentialsInvalidError';
  }
}

export class FeatureUnavailableError extends ApiError {
  constructor(message = 'Feature is currently unavailable') {
    super('FEATURE_UNAVAILABLE', message, 503);
    this.name = 'FeatureUnavailableError';
  }
}

export class PortalUnreachableError extends ApiError {
  constructor(message = 'MUT portal could not be reached') {
    super('PORTAL_UNREACHABLE', message, 502);
    this.name = 'PortalUnreachableError';
  }
}

export class ParseError extends ApiError {
  readonly parseCode: string;

  constructor(parseCode: string, message: string) {
    super('PARSE_ERROR', `${parseCode}: ${message}`, 502);
    this.name = 'ParseError';
    this.parseCode = parseCode;
  }
}

export function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown error';
}

export function errorResponse(error: unknown): Response {
  const body: ErrorBody = error instanceof ApiError
    ? { error: error.code, message: error.message }
    : { error: 'INTERNAL_ERROR', message: `Unexpected failure: ${messageOf(error)}` };

  const status = error instanceof ApiError ? error.status : 500;
  return Response.json(body, { status });
}
