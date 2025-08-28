const matchesByLeague = new Map();

/**
 * Add matches to a specific league
 * @param leagueId
 * @param matches
 */
export const addMatchesLeague = (leagueId, matches) => {
  matchesByLeague.set(leagueId, matches);
};
/**
 * Get all matches grouped by league
 * @returns {any[]}
 */
export const getMatches = () => Array.from(matchesByLeague.values());

/**
 * Clear all matches
 */
export const clearMatches = () => {
  matchesByLeague.clear();
};

/**
 * Get matches by league ID
 * @param id
 * @returns {any}
 */
export const getMatchesByLeagueId = (id) => matchesByLeague.get(id);
