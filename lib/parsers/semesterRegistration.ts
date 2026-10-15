import { parse } from 'node-html-parser';
import { ParseError } from '../errors';
import {
  extractLabelValuePairs,
  findFormAction,
  findPortalAlert,
  pick,
} from './helpers';

const FIELD_KEYS = {
  studentNo: ['student no', 'student number', 'reg no', 'registration number'],
  semesterCode: ['semester code', 'semester'],
  names: ['names', 'student name', 'full name'],
  settlementType: ['settlement type', 'settlement'],
  programmeCode: ['programme code', 'program code', 'programme'],
  stage: ['stage', 'year of study'],
} as const;

export interface SemesterRegistration {
  studentNo: string | null;
  semesterCode: string | null;
  names: string | null;
  settlementType: string | null;
  programmeCode: string | null;
  stage: string | null;
  action: string | null;
  canReport: boolean;
  portalMessage: string | null;
  details: Record<string, string>;
}

export function parseSemesterRegistration(html: string): SemesterRegistration {
  const root = parse(html);

  if (!findFormAction(root)) {
    throw new ParseError('SEMESTER_REGISTRATION_FORM_MISSING', 'Semester registration page had no form');
  }

  const details = extractLabelValuePairs(html);
  const read = (keys: readonly string[]): string | null => pick(details, [...keys]);

  const studentNo = read(FIELD_KEYS.studentNo);
  const semesterCode = read(FIELD_KEYS.semesterCode);
  const names = read(FIELD_KEYS.names);
  const settlementType = read(FIELD_KEYS.settlementType);
  const programmeCode = read(FIELD_KEYS.programmeCode);
  const stage = read(FIELD_KEYS.stage);

  const portalMessage = findPortalAlert(root);

  return {
    studentNo,
    semesterCode,
    names,
    settlementType,
    programmeCode,
    stage,
    action: findFormAction(root),
    canReport: Boolean(studentNo && semesterCode && names) && portalMessage === null,
    portalMessage,
    details,
  };
}
