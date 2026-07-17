/**
 * Europeana REST API client.
 * Uses the public Europeana API key directly  it's echoed in every response anyway.
 */
import { SPACE_ID } from '@/config/app';

const EUROPEANA_API_KEY = 'omesisitand';
const BASE_URL = 'https://api.europeana.eu/record/v2';

export interface EuropeanaItem {
  id: string;
  guid: string;
  title: string;
  dcCreator: string[];
  dcDescription: string[];
  year: string;
  provider: string[];
  dataProvider: string[];
  rights: string[];
  edmIsShownAt: string[];
  type: string;
  europeanaCompleteness: number;
  previewNoDistribute: boolean;
  // additional parsed fields
  composer?: string;
  description?: string;
}

interface EuropeanaSearchResponse {
  success: boolean;
  itemsCount: number;
  totalResults: number;
  items: EuropeanaItem[];
}

export interface EuropeanaSearchParams {
  query: string;
  rows?: number;
  start?: number;
  reusability?: 'open' | 'restricted' | 'permission';
  media?: boolean;
  type?: 'TEXT' | 'IMAGE' | 'SOUND' | 'VIDEO' | '3D';
}

export interface SearchResult {
  items: EuropeanaItem[];
  totalResults: number;
  itemsCount: number;
}

function parseComposer(item: EuropeanaItem): string {
  const creator = item.dcCreator?.[0] ?? '';
  if (!creator) return '';
  // Europeana stores IMSLP urls as creator values
  const match = creator.match(/Category:([^,_]+)(?:,_(\w+))?/);
  if (match) {
    const last = match[2] ? match[2] : '';
    const first = match[1] || '';
    return last ? `${last}, ${first}` : first;
  }
  return creator;
}

function parseDescription(item: EuropeanaItem): string {
  return item.dcDescription?.[0] ?? '';
}

async function doRequest<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}?wskey=${EUROPEANA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Europeana API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function searchEuropeana(params: EuropeanaSearchParams): Promise<SearchResult> {
  const rows = params.rows ?? 20;
  const start = params.start ?? 1;
  const q = encodeURIComponent(params.query);
  const extras: string[] = [];
  if (params.reusability) extras.push(`reusability=${params.reusability}`);
  if (params.media) extras.push('media=true');
  if (params.type) extras.push(`type=${params.type}`);

  let path = `/search.json?query=${q}&rows=${rows}&start=${start}`;
  if (extras.length > 0) path += `&${extras.join('&')}`;

  const data = await doRequest<EuropeanaSearchResponse>(path);

  const items = data.items.map((item) => ({
    ...item,
    composer: parseComposer(item),
    description: parseDescription(item),
  }));

  return {
    items,
    totalResults: data.totalResults,
    itemsCount: data.itemsCount,
  };
}

export async function getEuropeanaRecord(recordId: string): Promise<Record<string, unknown>> {
  return doRequest(`${recordId}.json`);
}

export function getEuropeanaThumbnail(recordId: string): string {
  return `https://api.europeana.eu/thumbnail/v2/url.json?uri=${encodeURIComponent(`https://api.europeana.eu/record/v2${recordId}.json`)}&wskey=${EUROPEANA_API_KEY}`;
}

export function getEuropeanaPortalUrl(item: EuropeanaItem): string {
  return item.guid || `https://www.europeana.eu/item${item.id}`;
}
