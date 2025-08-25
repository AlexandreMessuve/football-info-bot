import axios from 'axios';
import {chunkArray, delay} from "../utils/util.js";

/**
 *
 * @type {axios.AxiosInstance}
 */
const footballApi = axios.create({
   baseURL: process.env.FOOTBALL_API_BASE_URL,
   headers: {
       'x-apisports-key': process.env.FOOTBALL_API_KEY,
   }
});

export async function getWeeklyMatchesByLeague(leagueId, from, to) {
    try {
        const response = await footballApi.get('/fixtures', {
            params: {
                league: leagueId,
                season: new Date().getFullYear(),
                from: from,
                to: to,
            }
        });

        const allMatches = response.data.response;

        if(allMatches.length === 0) return [];

        const matchesDetails = allMatches.filter(m => m.fixture.status.elapsed !== null);
        const matchChunks = chunkArray(matchesDetails, 5);
        const allEvents = new Map();
        for (const chunk of matchChunks) {
            const eventsResults = await Promise.allSettled(chunk.map(match => getMatchEvents(match.fixture.id)));
            eventsResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const matchId = chunk[index].fixture.id;
                    allEvents.set(matchId, result.value);
                }
            });
            await delay(1000);
        }

        return  allMatches.map((match) => {
            const matchEvents = allEvents.get(match.fixture.id);
            const formatedMatch = {
                id: match.fixture.id,
                status: match.fixture.status,
                date: match.fixture.timestamp,
                league: {
                    name: match.league.name,
                    logo: match.league.logo,
                },
                homeTeam: {
                    name: match.teams.home.name,
                    score: match.goals.home ?? 0,
                    events: []
                },
                awayTeam: {
                    name: match.teams.away.name,
                    score: match.goals.away ?? 0,
                    events: [],
                },
            };
            if (matchEvents && matchEvents.length > 0) {
                matchEvents.filter(event => ['Goal', 'Card'].includes(event.type) && event.detail !== 'Missed Penalty').forEach(event => {
                    const simpleEvent = {
                        minute: event.time.elapsed + '"',
                        player: event.player.name,
                        type: event.type === 'Card' ? (event.detail === 'Yellow Card' ? '🟨 ' : '🟥 ') : `⚽ ${event.detail === 'Penalty' ? '(pen)' : ''}`,
                        detail: event.detail
                    };

                    if (event.team.id === match.teams.home.id) {
                        formatedMatch.homeTeam.events.push(simpleEvent);
                    } else if (event.team.id === match.teams.away.id) {
                        formatedMatch.awayTeam.events.push(simpleEvent);
                    }
                });
            }
            return formatedMatch;
        });
    } catch (error) {
        console.error("[ERROR] Impossible to get matches :", error.message);
        return [];
    }
}

export async function getStandingsByLeague(leagueId) {
    try {
        const response = await footballApi.get('/standings', {
            params: {
                league: leagueId,
                season: new Date().getFullYear(),
            }
        });
        return response.data.response;
    } catch (error) {
        console.error("[ERROR] Impossible to get standings", error);
        return [];
    }
}

export async function getMatchEvents(matchId) {
    try {
        const response = await footballApi.get('/fixtures', {
            params: {
                id: matchId,
            }
        });
        return response.data.response[0]?.events;
    } catch (error) {
        console.error("[ERROR] Impossible to get match detail", error);
        return [];
    }
}