import { parse } from 'node-html-parser';
import { cleanText } from './helpers';

export interface HostelOption {
  id: string;
  name: string;
}

export interface RoomSpace {
  hostelId: string;
  roomCode: string;
  spaceCode: string;
  cost: number | null;
}

export function parseHostelOptions(html: string): HostelOption[] {
  const root = parse(html);
  const select = root.querySelector('select[name="SelectedHostelId"]');
  if (!select) return [];

  return select
    .querySelectorAll('option')
    .map((option) => ({ id: cleanText(option.getAttribute('value') ?? ''), name: cleanText(option.text) }))
    .filter((hostel) => hostel.id.length > 0);
}

function readCost(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildRoomSpaces(
  hostelId: string,
  spaces: unknown,
  costs: unknown,
): RoomSpace[] {
  if (!Array.isArray(spaces)) return [];

  const costByRoom = new Map<string, number | null>();
  if (Array.isArray(costs)) {
    for (const entry of costs) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const roomCode = typeof record.RoomCode === 'string' ? record.RoomCode : null;
      if (roomCode) costByRoom.set(roomCode, readCost(record.Cost));
    }
  }

  const result: RoomSpace[] = [];
  for (const entry of spaces) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const spaceCode = typeof record.SpaceCode === 'string' ? record.SpaceCode : null;
    if (!spaceCode) continue;

    const roomCode = typeof record.RoomCode === 'string' ? record.RoomCode : '';
    result.push({ hostelId, roomCode, spaceCode, cost: costByRoom.get(roomCode) ?? null });
  }

  return result;
}
