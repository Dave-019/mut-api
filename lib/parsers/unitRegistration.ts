import { parse } from 'node-html-parser';
import {
  findPortalAlert,
  findTable,
  headerIndex,
  isRegistrationClosed,
  normalizeLabel,
  readTableRows,
} from './helpers';
import { parsePortalPage, type PortalTable } from './page';

export interface RegisteredUnit {
  unitCode: string;
  unitName: string;
}

export interface UnitRegistration {
  registeredUnits: RegisteredUnit[];
  registrationOpen: boolean;
  portalMessage: string | null;
  tables: PortalTable[];
}

const CODE_HEADERS = ['unit code', 'code'];
const NAME_HEADERS = ['unit name', 'unit title', 'name'];

function readUnits(table: ReturnType<typeof findTable>): RegisteredUnit[] {
  if (!table) return [];

  const headers = table.querySelectorAll('th').map((cell) => normalizeLabel(cell.text));
  const codeIndex = headerIndex(headers, CODE_HEADERS);
  const nameIndex = headerIndex(headers, NAME_HEADERS);

  if (codeIndex < 0 && nameIndex < 0) return [];

  const units: RegisteredUnit[] = [];
  for (const cells of readTableRows(table)) {
    const unitCode = codeIndex >= 0 ? cells[codeIndex] ?? '' : '';
    const unitName = nameIndex >= 0 ? cells[nameIndex] ?? '' : '';
    if (!unitCode && !unitName) continue;

    units.push({ unitCode, unitName });
  }

  return units;
}

export function parseUnitRegistration(html: string): UnitRegistration {
  const root = parse(html);

  const table = findTable(root, ['unit code', 'unit name']) ?? findTable(root, ['unit']);
  const registeredUnits = readUnits(table);

  return {
    registeredUnits,
    registrationOpen: !isRegistrationClosed(html),
    portalMessage: findPortalAlert(root),
    tables: parsePortalPage(html).tables,
  };
}
