import { parse } from 'node-html-parser';
import { cleanText, extractLabelValuePairs, readTableRows } from './helpers';

export interface PortalTable {
  headers: string[];
  rows: string[][];
}

export interface PortalPage {
  title: string | null;
  details: Record<string, string>;
  tables: PortalTable[];
}

function findTitle(html: string): string | null {
  const root = parse(html);

  for (const selector of ['.ic-header-title', '.page-title', 'h1', 'h2', 'h3']) {
    const node = root.querySelector(selector);
    const value = node ? cleanText(node.text) : '';
    if (value) return value;
  }

  return null;
}

export function parsePortalPage(html: string): PortalPage {
  const root = parse(html);
  const tables: PortalTable[] = [];

  for (const table of root.querySelectorAll('table')) {
    const headers = table.querySelectorAll('th').map((cell) => cleanText(cell.text));
    const rows = readTableRows(table);
    if (headers.length === 0 && rows.length === 0) continue;
    tables.push({ headers, rows });
  }

  return {
    title: findTitle(html),
    details: extractLabelValuePairs(html),
    tables,
  };
}
