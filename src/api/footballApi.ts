import 'dotenv/config';
import axios, { type AxiosInstance } from 'axios';
import { chunkArray, delay } from '../utils/util.js';
import type { Event, Match, Team } from '../types/match.js';
import type { League, Standing } from '../types/standing.js';
import type {
  ApiEvent,
  ApiFixture,
  ApiLeague,
  ApiStanding,
} from '../types/api.js';

const BASE_URL: string | undefined = process.env.FOOTBALL_API_BASE_URL;
const API_KEY: string | undefined = process.env.FOOTBALL_API_KEY;

if (!BASE_URL) {
  throw new Error('No baseURL provided');
}
if (!API_KEY) {
  throw new Error('No API key provided');
}
/**
 * Create axios instance for football API
 */
const footballApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-apisports-key': API_KEY,
  },
});

/**
 * Get weekly matches by league
 * @param leagueId
 * @param from
 * @param to
 * @returns {Promise<Match[]>}
 */
export async function getWeeklyMatchesByLeague(
  leagueId: string,
  from: string,
  to: string
): Promise<Match[]> {
  try {
    const response = await footballApi.get<{ response: ApiFixture[] }>(
      '/fixtures',
      {
        params: {
          league: leagueId,
          season: new Date().getFullYear(),
          from: from,
          to: to,
        },
      }
    );

    const allMatches: ApiFixture[] = response.data.response;

    if (allMatches.length === 0) return [];

    const matchesDetails: ApiFixture[] = allMatches.filter(
      (m: ApiFixture) => m.fixture.status.elapsed !== null
    );
    const matchChunks: ApiFixture[][] = chunkArray(matchesDetails, 5);
    const allEvents: Map<number, Event[]> = new Map();
    for (const chunk of matchChunks) {
      const eventsResults = await Promise.allSettled(
        chunk.map((match: ApiFixture) => getMatchEvents(match.fixture.id))
      );
      eventsResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const matchId: number | undefined = chunk[index]?.fixture.id;
          if (!matchId) return;
          const eventsFormated: Event[] = result.value
            .filter((event: ApiEvent): boolean =>
              ['Goal', 'Card'].includes(event.type)
            )
            .map((event: ApiEvent): Event => {
              const type: string =
                event.type === 'Card'
                  ? event.detail === 'Yellow Card'
                    ? '🟨 '
                    : '🟥 '
                  : event.detail === 'Missed Penalty'
                    ? '❌'
                    : '⚽';
              const detail: string =
                event.detail === 'Penalty'
                  ? '(PEN)'
                  : event.detail === 'Own Goal'
                    ? '(OG)'
                    : '';
              const minute: string =
                event.time.elapsed +
                (event.time.extra ? '+' + event.time.extra : '') +
                "'";

              return {
                teamId: event.team.id,
                minute,
                type: type + detail,
                player: event.player.name,
              };
            });
          allEvents.set(matchId, eventsFormated);
        }
      });
      await delay(1000);
    }

    return allMatches.map((match: ApiFixture): Match => {
      const matchEvents: Event[] | [] = allEvents.get(match.fixture.id) || [];

      const homeTeam: Team = {
        name: match.teams.home.name,
        score: match.goals.home ?? 0,
        penalty: match.score.penalty.home ?? 0,
        winner: match.teams.home.winner ?? false,
        events: [],
      };
      const awayTeam: Team = {
        name: match.teams.away.name,
        score: match.goals.away ?? 0,
        penalty: match.score.penalty.away ?? 0,
        winner: match.teams.away.winner ?? false,
        events: [],
      };

      const formatedMatch: Match = {
        id: match.fixture.id,
        status: match.fixture.status,
        date: match.fixture.timestamp,
        league: match.league,
        homeTeam,
        awayTeam,
      };
      if (matchEvents && matchEvents.length > 0) {
        matchEvents.forEach((event) => {
          if (event.teamId === match.teams.home.id) {
            formatedMatch.homeTeam.events.push(event);
          } else if (event.teamId === match.teams.away.id) {
            formatedMatch.awayTeam.events.push(event);
          }
        });
      }
      return formatedMatch;
    });
  } catch (error) {
    console.error('[ERROR] Impossible to get matches :', error);
    return [];
  }
}

/**
 * Get standings by league
 * @param leagueId
 * @returns {Promise<League | null>}
 */
export async function getStandingsByLeague(
  leagueId: string
): Promise<League | null> {
  try {
    const response = await footballApi.get<{ response: ApiLeague[] }>(
      '/standings',
      {
        params: {
          league: leagueId,
          season: new Date().getFullYear(),
        },
      }
    );
    const leagueData = response.data.response[0]?.league;
    if (!leagueData) return null;

    const standingsData: ApiStanding[] = leagueData.standings?.[0] || [];
    const league: League = {
      id: leagueData.id,
      name: leagueData.name,
      logo: leagueData.logo,
      standings: [],
    };
    if (standingsData.length > 0) {
      league.standings = standingsData.map((apiStanding: ApiStanding) => {
        const standing: Standing = {
          name: apiStanding.team.name,
          rank: apiStanding.rank,
          points: apiStanding.points,
          form: apiStanding.form,
          played: apiStanding.all.played,
          win: apiStanding.all.win,
          draw: apiStanding.all.draw,
          lose: apiStanding.all.lose,
          goalsFor: apiStanding.all.goals.for,
          goalsAgainst: apiStanding.all.goals.against,
          goalsDiff: apiStanding.goalsDiff,
        };
        return standing;
      });
    }
    return league;
  } catch (error) {
    console.error('[ERROR] Impossible to get standings', error);
    return null;
  }
}

/**
 * Get match events by match id
 * @param matchId
 * @returns {Promise<ApiEvent[]>}
 */
export async function getMatchEvents(matchId: number): Promise<ApiEvent[]> {
  try {
    const response = await footballApi.get<{ response: ApiEvent[] }>(
      '/fixtures/events',
      {
        params: {
          fixture: matchId,
        },
      }
    );
    return response.data.response || [];
  } catch (error) {
    console.error('[ERROR] Impossible to get match detail', error);
    return [];
  }
}
