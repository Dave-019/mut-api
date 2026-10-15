import { parse } from 'node-html-parser';
import { ParseError } from '../errors';
import {
  cleanText,
  extractLabelValuePairs,
  findRegistrationNumber,
  pick,
} from './helpers';

const NAME_KEYS = ['student name', 'full name', 'name', 'student'];
const REGISTRATION_KEYS = [
  'reg no',
  'reg number',
  'registration number',
  'registration no',
  'registration',
];
const PROGRAMME_KEYS = ['programme name', 'programme', 'program', 'course', 'degree'];
const PROGRAM_CODE_KEYS = ['program code', 'programme code', 'course code'];
const CAMPUS_KEYS = ['campus'];
const SEMESTER_KEYS = ['current semester', 'semester', 'trimester', 'year of study'];
const STAGE_PATTERN = /current stage:\s*([A-Za-z0-9]+)/i;

export interface DashboardSummary {
  studentName: string;
  registrationNumber: string | null;
  programme: string | null;
  programCode: string | null;
  campus: string | null;
  currentSemester: string | null;
  currentStage: string | null;
  details: Record<string, string>;
}

function findStudentName(html: string): string | null {
  const root = parse(html);

  for (const heading of root.querySelectorAll('.ic-body h5, .ic-body h4, .ic-body h3')) {
    const value = cleanText(heading.text);
    if (value && !/^\d/.test(value)) return value;
  }

  const title = root.querySelector('.page-title');
  if (title) {
    const match = /welcome back,?\s*(.+)/i.exec(cleanText(title.text));
    if (match) return match[1].trim();
  }

  const pairs = extractLabelValuePairs(html);
  return pick(pairs, NAME_KEYS);
}

function findSemester(html: string): string | null {
  const root = parse(html);

  for (const badge of root.querySelectorAll('.badge-soft-success, .badge, .badge-soft-primary')) {
    const value = cleanText(badge.text);
    if (/semester|trimester/i.test(value)) return value;
  }

  return pick(extractLabelValuePairs(html), SEMESTER_KEYS);
}

export function parseDashboard(html: string): DashboardSummary {
  const details = extractLabelValuePairs(html);
  const studentName = findStudentName(html);

  if (!studentName) {
    throw new ParseError('DASHBOARD_STUDENT_NAME_MISSING', 'Could not locate the student name on the dashboard');
  }

  const stageMatch = STAGE_PATTERN.exec(html);

  return {
    studentName,
    registrationNumber: pick(details, REGISTRATION_KEYS) ?? findRegistrationNumber(html),
    programme: pick(details, PROGRAMME_KEYS),
    programCode: pick(details, PROGRAM_CODE_KEYS),
    campus: pick(details, CAMPUS_KEYS),
    currentSemester: findSemester(html),
    currentStage: stageMatch ? stageMatch[1] : null,
    details,
  };
}
