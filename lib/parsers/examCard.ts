import { parse, type HTMLElement } from 'node-html-parser';
import { ParseError } from '../errors';
import {
  cleanText,
  extractLabelValuePairs,
  findTable,
  headerIndex,
  normalizeLabel,
  pick,
} from './helpers';

const SEMESTER_KEYS = ['semester', 'trimester', 'exam session', 'session'];

export interface ExamEntry {
  unitCode: string | null;
  unitTitle: string | null;
  date: string | null;
  session: string | null;
  venue: string | null;
  seatNumber: string | null;
}

export interface ExamCard {
  semester: string | null;
  exams: ExamEntry[];
  details: Record<string, string>;
}

function readExams(table: HTMLElement): ExamEntry[] {
  const headers = table.querySelectorAll('th').map((cell) => normalizeLabel(cell.text));
  const codeIndex = headerIndex(headers, ['code', 'unit code']);
  const titleIndex = headerIndex(headers, ['unit', 'title', 'course']);
  const dateIndex = headerIndex(headers, ['date', 'day']);
  const sessionIndex = headerIndex(headers, ['session', 'time']);
  const venueIndex = headerIndex(headers, ['venue', 'room', 'hall']);
  const seatIndex = headerIndex(headers, ['seat', 'desk']);

  const exams: ExamEntry[] = [];
  for (const row of table.querySelectorAll('tr')) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) continue;

    const values = cells.map((cell) => cleanText(cell.text));
    const at = (index: number): string | null => (index >= 0 ? values[index] ?? null : null);

    exams.push({
      unitCode: at(codeIndex),
      unitTitle: at(titleIndex),
      date: at(dateIndex),
      session: at(sessionIndex),
      venue: at(venueIndex),
      seatNumber: at(seatIndex),
    });
  }

  return exams;
}

export function parseExamCard(html: string): ExamCard {
  const root = parse(html);
  const details = extractLabelValuePairs(html);

  const table = findTable(root, ['unit']) ?? findTable(root, ['venue']);
  if (!table) {
    throw new ParseError('EXAM_CARD_TABLE_MISSING', 'Exam card page did not contain an exam schedule table');
  }

  return {
    semester: pick(details, SEMESTER_KEYS),
    exams: readExams(table),
    details,
  };
}
