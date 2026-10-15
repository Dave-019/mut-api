export { parseDashboard } from './dashboard';
export type { DashboardSummary } from './dashboard';

export { parseFeeBalance } from './feePayment';
export type { FeeBalance } from './feePayment';

export { parseExamCard } from './examCard';
export type { ExamCard, ExamEntry } from './examCard';

export { parseStudyYears, parseTranscriptResult } from './transcript';
export type { StudyYear, TranscriptResult } from './transcript';

export { buildRoomSpaces, parseHostelOptions } from './hostel';
export type { HostelOption, RoomSpace } from './hostel';

export { parseProfilePhoto } from './photo';
export type { ProfilePhoto } from './photo';

export { parsePortalPage } from './page';
export type { PortalPage, PortalTable } from './page';

export { parseSemesterRegistration } from './semesterRegistration';
export type { SemesterRegistration } from './semesterRegistration';

export { parseUnitRegistration } from './unitRegistration';
export type { RegisteredUnit, UnitRegistration } from './unitRegistration';

export {
  cleanText,
  detectCurrency,
  extractLabelValuePairs,
  findRegistrationNumber,
  findTable,
  headerIndex,
  normalizeLabel,
  parseAmount,
  pick,
  readTableRows,
} from './helpers';
