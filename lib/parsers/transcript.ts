import { parse } from 'node-html-parser';
import { ParseError } from '../errors';
import { cleanText } from './helpers';

export interface StudyYear {
  code: string;
  label: string;
}

export function parseStudyYears(html: string): StudyYear[] {
  const root = parse(html);
  const select = root.querySelector('select[name="SemesterCode"]');

  if (!select) {
    throw new ParseError('TRANSCRIPT_YEARS_MISSING', 'Transcript form did not contain a SemesterCode select');
  }

  const years = select
    .querySelectorAll('option')
    .map((option) => ({ code: cleanText(option.getAttribute('value') ?? ''), label: cleanText(option.text) }))
    .filter((year) => year.code.length > 0);

  if (years.length === 0) {
    throw new ParseError('TRANSCRIPT_YEARS_EMPTY', 'Transcript form listed no years of study');
  }

  return years;
}

export interface TranscriptResult {
  success: boolean;
  base64: string;
  byteLength: number;
}

export function parseTranscriptResult(value: unknown): TranscriptResult {
  if (!value || typeof value !== 'object') {
    throw new ParseError('TRANSCRIPT_RESULT_INVALID', 'Transcript generation returned an unexpected payload');
  }

  const record = value as Record<string, unknown>;
  const base64 = typeof record.base64 === 'string' ? record.base64 : '';

  return {
    success: record.success === true,
    base64,
    byteLength: base64.length === 0 ? 0 : Math.floor((base64.length * 3) / 4),
  };
}
