import { endOfWeek, format, startOfWeek } from 'date-fns';
import LEAGUE_MAP from '../data/league.ts';
import { getServerConfig } from '../db/serverConfig.ts';
import i18next from "i18next";

interface Choice {
  name: string;
  value: string;
}

interface DateRange {
  dateFrom: string;
  dateTo: string;
}


/**
 * Create a delay
 * @param ms - Milliseconds to wait
 * @returns A promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

/**
 * Change the language for i18next based on the server configuration.
 * @param guildId - Id of the Discord guild (server).
 */
export async function changeLang(guildId: string): Promise<void> {
  const server = await getServerConfig(guildId);
  const lang = server?.language || 'en';
  await i18next.changeLanguage(lang);
}

/**
 * Obtains a list of choices for adding or removing leagues based on the server's configuration.
 * @param guildId - Id of the Discord guild (server).
 * @param type - Type of operation: 'add' to get leagues that can be added, 'remove' to get leagues that can be removed.
 * @returns Array of choices with league names and IDs.
 */
export async function getChoice(guildId: string, type: 'add' | 'remove'): Promise<Choice[]> {
  const server = await getServerConfig(guildId);
  if (!server) return [];

  const configuredLeagues = new Set((server.leagues || []).map((l) => l.id));
  if (type === 'remove' && configuredLeagues.size === 0) return [];

  const allLeagues: [string, string][] = Array.from(LEAGUE_MAP.entries());
  let filteredLeagues: [string, string][] = [];

  if (type === 'add') {
    filteredLeagues = allLeagues.filter(([id]) => !configuredLeagues.has(id));
  } else {
    filteredLeagues = allLeagues.filter(([id]) => configuredLeagues.has(id));
  }

  return filteredLeagues.map(([id, name]) => ({
    name,
    value: id,
  }));
}

/**
 * Calculates the date range for the current week (Monday to Sunday).
 * @returns An object containing the start and end dates of the week in 'yyyy-MM-dd' format.
 */
export function getDateRange(): DateRange {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const sunday = endOfWeek(today, { weekStartsOn: 1 });

  const dateFrom = format(monday, 'yyyy-MM-dd');
  const dateTo = format(sunday, 'yyyy-MM-dd');

  return { dateFrom, dateTo };
}

/**
 * Chunks an array into smaller arrays of a specified size.
 * A function that divides an array into smaller arrays (chunks) of a specified size.
 *
 * @template T - Type of elements in the input array.
 * @param array - Array to be chunked.
 * @param chunkSize - Size of each chunk.
 * @returns Array of chunked arrays.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}