const matchesByLeague = new Map();

export const addMatchesLeague = (leagueId, matches) => {
    matchesByLeague.set(leagueId, matches);
}
export const getMatches = () => Array.from(matchesByLeague.values());
export const clearMatches = () => {
    matchesByLeague.clear();
}
export const getMatchesByLeagueId = (id) => matchesByLeague.get(id);