import { parse } from 'node-html-parser';

export interface ProfilePhoto {
  dataUri: string | null;
  contentType: string | null;
  isPlaceholder: boolean;
}

const DATA_URI_PATTERN = /^data:([^;,]+)[;,]/i;

export function parseProfilePhoto(html: string): ProfilePhoto {
  const root = parse(html);
  const image = root.querySelector('#profilePhoto');
  const dataUri = image?.getAttribute('src')?.trim() ?? null;

  if (!dataUri) {
    return { dataUri: null, contentType: null, isPlaceholder: true };
  }

  const contentType = DATA_URI_PATTERN.exec(dataUri)?.[1]?.toLowerCase() ?? null;
  const isPlaceholder = dataUri.startsWith('data:image/svg') || dataUri.includes('image/svg+xml');

  return { dataUri, contentType, isPlaceholder };
}
