import type { NextRequest } from 'next/server';
import { requireStudentNo } from '@/lib/auth/middleware';
import { getEnv } from '@/lib/env';
import { errorResponse, FeatureUnavailableError, ValidationError } from '@/lib/errors';
import { assertFeatureEnabled } from '@/lib/features';
import { parseStudyYears, parseTranscriptResult, type StudyYear } from '@/lib/parsers';
import { extractAntiforgeryToken } from '@/lib/portal/antiforgery';
import { portalHtml, portalJson } from '@/lib/portal/client';
import { PORTAL_ENDPOINTS } from '@/lib/portal/endpoints';

export const runtime = 'edge';

function describeYears(years: StudyYear[]): string {
  return years.map((year) => `${year.code} (${year.label})`).join(', ');
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const env = getEnv();
    const studentNo = requireStudentNo(request);

    await assertFeatureEnabled(env, 'transcript');

    const formHtml = await portalHtml(env, studentNo, PORTAL_ENDPOINTS.transcript);
    const years = parseStudyYears(formHtml);

    const requested = request.nextUrl.searchParams.get('year');
    if (!requested) {
      throw new ValidationError(`A "year" query parameter is required. Available years: ${describeYears(years)}`);
    }

    const selected = years.find((year) => year.code === requested);
    if (!selected) {
      throw new ValidationError(`Unknown year "${requested}". Available years: ${describeYears(years)}`);
    }

    const token = extractAntiforgeryToken(formHtml);
    const body = new URLSearchParams({
      SemesterCode: selected.code,
      __RequestVerificationToken: token,
    }).toString();

    const result = await portalJson<unknown>(env, studentNo, PORTAL_ENDPOINTS.generateTranscript, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    const transcript = parseTranscriptResult(result);
    if (!transcript.success) {
      throw new FeatureUnavailableError(`Portal could not generate a transcript for ${selected.code}`);
    }

    if (transcript.byteLength === 0) {
      throw new FeatureUnavailableError(
        `Portal returned an empty transcript for ${selected.code} (${selected.label}). The current in-progress year has no results yet; use a completed year.`,
      );
    }

    return Response.json({ ...transcript, year: selected.code, label: selected.label });
  } catch (error) {
    return errorResponse(error);
  }
}
