import axios from 'axios';

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

        const matches = response.data.response;

        // On prépare un tableau de promesses pour les détails des matchs
        const detailPromises = matches.map(match => {
            if (match.fixture.status.elapsed !== null) {
                // Si le match est live/terminé, on retourne la promesse de fetch des détails
                return getMatchDetails(match.fixture.id);
            }
            // Sinon, on retourne une promesse qui se résout immédiatement avec un tableau vide
            return Promise.resolve([]);
        });

        // On exécute toutes les promesses en parallèle
        const allEventsResults = await Promise.all(detailPromises);

        // On combine les données originales des matchs avec leurs événements respectifs
        return  matches.map((match, index) => {
            const matchEvents = allEventsResults[index];
            console.log(match);
            const matche = {
                id: match.fixture.id,
                status: match.fixture.status,
                date: match.fixture.timestamp,
                league: match.league,
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
                        matche.homeTeam.events.push(simpleEvent);
                    } else if (event.team.id === match.teams.away.id) {
                        matche.awayTeam.events.push(simpleEvent);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs :", error.message);
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
        console.error("Erreur lors de la récupération des classements :", error);
        return [];
    }
}

export async function getMatchDetails(matchId) {
    try {
        const response = await footballApi.get('/fixtures', {
            params: {
                id: matchId,
            }
        });
        return response.data.response[0]?.events;
    } catch (error) {
        console.error("Erreur lors de la récupération des details du matchs :", error);
        return [];
    }
}