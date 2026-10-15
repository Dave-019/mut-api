import { parse, type HTMLElement } from 'node-html-parser';

export function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeLabel(value: string): string {
  return cleanText(value).replace(/[:*#]+$/, '').trim().toLowerCase();
}

function mergePairs(target: Record<string, string>, source: Record<string, string>): void {
  for (const [key, value] of Object.entries(source)) {
    if (key && value && !(key in target)) target[key] = value;
  }
}

function extractStrongLabelPairs(root: HTMLElement): Record<string, string> {
  const pairs: Record<string, string> = {};

  for (const strong of root.querySelectorAll('strong')) {
    const label = normalizeLabel(strong.text);
    if (!label) continue;

    const sibling = strong.nextElementSibling;
    if (sibling && /^span$/i.test(sibling.rawTagName ?? '')) {
      const value = cleanText(sibling.text);
      if (value && !(label in pairs)) pairs[label] = value;
    }
  }

  return pairs;
}

function extractDetailItems(root: HTMLElement): Record<string, string> {
  const pairs: Record<string, string> = {};

  for (const item of root.querySelectorAll('.detail-item')) {
    const labelNode = item.querySelector('.label');
    const valueNode = item.querySelector('.value');
    if (!labelNode || !valueNode) continue;

    const label = normalizeLabel(labelNode.text);
    const value = cleanText(valueNode.text);
    if (label && value && !(label in pairs)) pairs[label] = value;
  }

  for (const tile of root.querySelectorAll('.stat-tile')) {
    const labelNode = tile.querySelector('.stat-tile-label');
    const valueNode = tile.querySelector('.stat-tile-value');
    if (!labelNode || !valueNode) continue;

    const label = normalizeLabel(labelNode.text);
    const value = cleanText(valueNode.text);
    if (label && value && !(label in pairs)) pairs[label] = value;
  }

  return pairs;
}

function extractTablePairs(root: HTMLElement): Record<string, string> {
  const pairs: Record<string, string> = {};

  for (const row of root.querySelectorAll('tr')) {
    const cells = row.querySelectorAll('td, th');
    if (cells.length < 2) continue;

    const label = normalizeLabel(cells[0].text);
    const value = cleanText(cells[1].text);
    if (label && value && !(label in pairs)) pairs[label] = value;
  }

  for (const term of root.querySelectorAll('dt')) {
    const label = normalizeLabel(term.text);
    const sibling = term.nextElementSibling;
    if (!label || !sibling || label in pairs) continue;

    const value = cleanText(sibling.text);
    if (value) pairs[label] = value;
  }

  return pairs;
}

function extractLabelledFields(root: HTMLElement): Record<string, string> {
  const pairs: Record<string, string> = {};
  const byId = new Map<string, HTMLElement>();

  for (const element of root.querySelectorAll('[id]')) {
    const id = element.getAttribute('id');
    if (id) byId.set(id, element);
  }

  for (const label of root.querySelectorAll('label')) {
    const target = label.getAttribute('for');
    if (!target) continue;

    const key = normalizeLabel(label.text);
    if (!key || key in pairs) continue;

    const field = byId.get(target);
    const value = field ? cleanText(field.getAttribute('value') ?? field.text) : '';
    if (value) pairs[key] = value;
  }

  return pairs;
}

const SKIPPED_INPUT_TYPES = new Set(['hidden', 'password', 'submit', 'button', 'reset', 'file', 'checkbox', 'radio']);

function extractFormFields(root: HTMLElement): Record<string, string> {
  const pairs: Record<string, string> = {};

  for (const input of root.querySelectorAll('input')) {
    const name = input.getAttribute('name');
    const type = (input.getAttribute('type') ?? 'text').toLowerCase();
    if (!name || SKIPPED_INPUT_TYPES.has(type)) continue;

    const value = cleanText(input.getAttribute('value') ?? '');
    const key = normalizeLabel(name);
    if (key && value && !(key in pairs)) pairs[key] = value;
  }

  for (const select of root.querySelectorAll('select')) {
    const name = select.getAttribute('name');
    if (!name) continue;

    const selected = select.querySelector('option[selected]');
    const value = cleanText(selected?.getAttribute('value') ?? selected?.text ?? '');
    const key = normalizeLabel(name);
    if (key && value && !(key in pairs)) pairs[key] = value;
  }

  for (const area of root.querySelectorAll('textarea')) {
    const name = area.getAttribute('name');
    if (!name) continue;

    const value = cleanText(area.text);
    const key = normalizeLabel(name);
    if (key && value && !(key in pairs)) pairs[key] = value;
  }

  return pairs;
}

export function extractLabelValuePairs(html: string): Record<string, string> {
  const root = parse(html);
  const pairs: Record<string, string> = {};

  mergePairs(pairs, extractStrongLabelPairs(root));
  mergePairs(pairs, extractDetailItems(root));
  mergePairs(pairs, extractTablePairs(root));
  mergePairs(pairs, extractLabelledFields(root));
  mergePairs(pairs, extractFormFields(root));

  return pairs;
}

export function pick(pairs: Record<string, string>, candidates: string[]): string | null {
  for (const candidate of candidates) {
    const value = pairs[normalizeLabel(candidate)];
    if (value) return value;
  }
  return null;
}

export const REGISTRATION_NUMBER_PATTERN = /\b[A-Za-z]{2,3}\d{2,4}\/\d{1,4}\/\d{4}\b/;

export function findRegistrationNumber(html: string): string | null {
  return REGISTRATION_NUMBER_PATTERN.exec(html)?.[0] ?? null;
}

export function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null;

  const match = /-?\d[\d,]*(?:\.\d+)?/.exec(value.replace(/\s/g, ''));
  if (!match) return null;

  const parsed = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function detectCurrency(value: string | null | undefined): string {
  const match = /\b(KES|KSh|Ksh|USD|EUR|GBP)\b/i.exec(value ?? '');
  return match ? match[1].toUpperCase().replace('KSH', 'KES') : 'KES';
}

export function findTable(root: HTMLElement, requiredHeaders: string[]): HTMLElement | null {
  for (const table of root.querySelectorAll('table')) {
    const headers = table.querySelectorAll('th').map((cell) => normalizeLabel(cell.text)).join(' ');
    if (headers.length === 0) continue;

    const matches = requiredHeaders.every((header) => headers.includes(normalizeLabel(header)));
    if (matches) return table;
  }

  return null;
}

export function headerIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

export function readTableRows(table: HTMLElement): string[][] {
  const rows: string[][] = [];

  for (const row of table.querySelectorAll('tr')) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) continue;
    rows.push(cells.map((cell) => cleanText(cell.text)));
  }

  return rows;
}

const ALERT_SELECTORS = ['.db-alert', '.alert-danger', '.alert-warning', '.alert-info'];

export function findPortalAlert(root: HTMLElement): string | null {
  for (const selector of ALERT_SELECTORS) {
    const node = root.querySelector(selector);
    const text = node ? cleanText(node.text) : '';
    if (text) return text;
  }

  return null;
}

export function findFormAction(root: HTMLElement): string | null {
  const form = root.querySelector('form[action]');
  return form?.getAttribute('action') ?? null;
}

export function isRegistrationClosed(html: string): boolean {
  return /unitRegDeadlinePassed\s*=\s*true/i.test(html);
}
