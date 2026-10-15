import { parse } from 'node-html-parser';
import { detectCurrency, extractLabelValuePairs, parseAmount, pick } from './helpers';

const BALANCE_KEYS = ['current balance', 'fee balance', 'outstanding balance', 'total balance', 'balance'];

export interface FeeBalance {
  balance: number | null;
  currency: string;
  raw: string | null;
  details: Record<string, string>;
}

export function parseFeeBalance(html: string): FeeBalance {
  const root = parse(html);
  const details = extractLabelValuePairs(html);

  const balanceField = root.querySelector('#Balance');
  const raw = (balanceField?.getAttribute('value') ?? '').trim() || pick(details, BALANCE_KEYS);

  return {
    balance: parseAmount(raw),
    currency: detectCurrency(raw),
    raw: raw || null,
    details,
  };
}
