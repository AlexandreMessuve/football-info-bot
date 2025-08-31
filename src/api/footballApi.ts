import 'dotenv/config';
import axios, {type AxiosInstance} from 'axios';
import { chunkArray, delay } from '../utils/util.js';
import type {Match, Event, Team} from "../types/match.js";
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
export async function getWeeklyMatchesByLeague(leagueId: string, from: string, to: string): Promise<Match[]> {
  try {
    const response = await footballApi.get('/fixtures', {
      params: {
        league: leagueId,
        season: new Date().getFullYear(),
        from: from,
        to: to,
      },
    });

    const allMatches: any[] = response.data.response;

    if (allMatches.length === 0) return [];

    const matchesDetails = allMatches.filter(
      (m: any) => m.fixture.status.elapsed !== null
    );
    const matchChunks: any[][] = chunkArray(matchesDetails, 5);
    const allEvents: Map<number, Event[]> = new Map();
    for (const chunk of matchChunks) {
      const eventsResults = await Promise.allSettled(
        chunk.map((match) => getMatchEvents(match.fixture.id))
      );
      eventsResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const matchId: number = chunk[index].fixture.id;
          const eventsFormated: Event[] = result.value.filter((event: any) =>
            ['Goal', 'Card'].includes(event.type)
          ).map((event: any) => {
              const type: string =
                  event.type === 'Card'
                      ? event.detail === 'Yellow Card'
                          ? '🟨 '
                          : '🟥 '
                      : event.detail === 'Missed Penalty'
                          ? '❌'
                          : '⚽';
              let detail: string =
                  event.detail === 'Penalty'
                      ? '(PEN)'
                      : event.detail === 'Own Goal'
                          ? '(OG)'
                          : '';
              const minute: string = event.time.elapsed +
                  (event.time.extra ? '+' + event.time.extra : '') +
                  '\'';
              const simpleEvent: Event = {
                  teamId: event.team.id,
                  minute,
                  type: type + detail,
                  player: event.player.name
              }
              return simpleEvent;
          });
          allEvents.set(matchId, eventsFormated);
        }
      });
      await delay(1000);
    }

    return allMatches.map((match) => {
      const matchEvents: Event[] | [] = allEvents.get(match.fixture.id) || [];

      const homeTeam: Team = {
          name: match.teams.home.name,
          score: match.goals.home ?? 0,
          penalty: match.score.penalty.home ?? 0,
          winner: match.teams.home.winner,
          events: [],
      }
      const awayTeam: Team = {
          name: match.teams.away.name,
          score: match.goals.away ?? 0,
          penalty: match.score.penalty.away ?? 0,
          winner: match.teams.away.winner,
          events: [],
      }

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
  } catch (error: any) {
    console.error('[ERROR] Impossible to get matches :', error.message);
    return [];
  }
}

/**
 * Get standings by league
 * @param leagueId
 * @returns {Promise<*|*[]>}
 */
export async function getStandingsByLeague(leagueId: string): Promise<any | any[]> {
  try {
    const response = await footballApi.get('/standings', {
      params: {
        league: leagueId,
        season: new Date().getFullYear(),
      },
    });
    const res = response.data.response[0];
    if (res.length === 0) return [];
    const league =  {
        id: res.league.id,
        name: res.league.name,
        logo: res.league.logo,
        standings: []
    };
    if (res.league.standings[0].length > 0){
        let standings = res.league.standings[0];
        standings = standings.map((team: any) => {
            return {
                team: {
                    name: team.team.name,
                    rank: team.rank,
                    points: team.points,
                    form: team.form,
                    played: team.all.played,
                    win: team.all.win,
                    draw: team.all.draw,
                    lose: team.all.lose,
                    goalsFor: team.all.goals.for,
                    goalsAgainst: team.all.goals.against,
                    goalsDiff: team.goalsDiff,
                }
            }
        })
        league.standings = standings;
    }
    return league;
  } catch (error: any) {
    console.error('[ERROR] Impossible to get standings', error);
    return [];
  }
}

/**
 * Get match events by match id
 * @param matchId
 * @returns {Promise<*|*[]>}
 */
export async function getMatchEvents(matchId: number): Promise<any | any[]> {
  try {
    const response = await footballApi.get('/fixtures/events', {
      params: {
        fixture: matchId,
      },
    });
    return response.data.response;
  } catch (error) {
    console.error('[ERROR] Impossible to get match detail', error);
    return [];
  }
}
