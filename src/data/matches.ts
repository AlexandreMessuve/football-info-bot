import type { Match } from "../types/match.ts";

const matchesByLeague: Map<string, Match[]> = new Map();

/**
 * Adds matches to a specific league.
 * @param leagueId - The ID of the league.
 * @param matches - An array of match objects.
 */
export function addMatchesLeague (leagueId: string, matches: Match[]): void {
  matchesByLeague.set(leagueId, matches);
}

/**
 * Gets all matches, grouped by league.
 * @returns An array containing arrays of matches for each league.
 */
export function getMatches (): Match[][] {
  // The values of the map are Match[], so the result is an array of Match[]
  return Array.from(matchesByLeague.values());
}

/**
 * Clears all stored matches from the map.
 */
export function clearMatches(): void {
  matchesByLeague.clear();
}

/**
 * Gets matches for a specific league by its ID.
 * @param id - The ID of the league.
 * @returns An array of matches or undefined if the league ID is not found.
 */
export function getMatchesByLeagueId (id: string): Match[] | undefined  {
  return matchesByLeague.get(id);
}