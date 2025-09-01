import { getAllServerConfig, setMessageId } from '../db/serverConfig.js';
import { getWeeklyMatchesByLeague } from '../api/footballApi.js';
import { createMatchField } from '../utils/embedHelper.js';
import {
  type Client,
  EmbedBuilder,
  type Guild,
  type Message,
  type TextChannel,
} from 'discord.js';
import { chunkArray, getDateRange } from '../utils/util.js';
import LEAGUE_MAP from '../data/league.js';
import { addMatchesLeague } from '../data/matches.js';
import i18next from 'i18next';
import { postStandingLeague } from '../utils/standing.js';
import type { Match } from '../types/match.js';
import type { League, Server } from '../types/servers.js';
import type { WithId } from 'mongodb';

/**
 * retrieve matches for a set of leagues within a date range.
 * @param uniqueLeagues
 * @param from
 * @param to
 * @returns {Promise<Map<string, Match[]>>}
 */
async function getMatches(
  uniqueLeagues: Set<League>,
  from: string,
  to: string
): Promise<Map<string, Match[]>> {
  const matchesByLeagues: Map<string, Match[]> = new Map();
  for (const c of uniqueLeagues) {
    const matches: Match[] = await getWeeklyMatchesByLeague(c.id, from, to);
    if (matches && matches.length > 0) {
      matchesByLeagues.set(c.id, matches);
    }
  }
  return matchesByLeagues;
}

/**
 * Create an embed for a league with a chunk of matches.
 * @param leagueName
 * @param matchChunk
 * @returns {EmbedBuilder}
 */
export function createLeagueEmbed(
  leagueName: string,
  matchChunk: Match[]
): EmbedBuilder {
  const logo: string = matchChunk[0]?.league?.logo || '';
  const embed: EmbedBuilder = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(i18next.t('planning', { leagueName }))
    .setThumbnail(logo)
    .setFooter({ text: i18next.t('lastUpdate') })
    .setTimestamp();
  for (const match of matchChunk) {
    createMatchField(embed, match);
  }
  return embed;
}

/**
 * Fetch daily matches for all leagues configured in servers and store them in the database.
 * @returns {Promise<void>}
 */
export async function fetchDailyMatchesByLeague(): Promise<void> {
  const date: string = new Date().toISOString().split('T')[0] || '';
  const servers: WithId<Server>[] = await getAllServerConfig();
  const uniqueLeagues = new Set(
    servers.flatMap((s: WithId<Server>): League[] => s.leagues || [])
  );
  if (uniqueLeagues.size === 0) return;
  const matches: Map<string, Match[]> = await getMatches(
    uniqueLeagues,
    date,
    date
  );
  for (const [leagueId, leagueMatches] of matches) {
    console.log(
      `🏆 League: ${LEAGUE_MAP.get(leagueId)} - Matches today: ${leagueMatches.length}`
    );
    const matchs: Match[] | undefined = matches.get(leagueId);
    if (leagueMatches.length === 0 || !matchs) continue;
    addMatchesLeague(leagueId, matchs);
    console.log('✅ Matches added to the database');
  }
}

/**
 * Post weekly overviews to the configured channels in each server.
 * @param client
 * @returns {Promise<void>}
 */
export async function postWeeklyOverviews(client: Client): Promise<void> {
  const servers: WithId<Server>[] = await getAllServerConfig();
  const uniqueLeagues = new Set(
    servers.flatMap((s: WithId<Server>): League[] => s.leagues || [])
  );
  if (uniqueLeagues.size === 0) return;

  const { dateFrom, dateTo } = getDateRange();
  const dateRange: string = `${dateFrom}_${dateTo}`;
  const matchesByLeagues: Map<string, Match[]> = await getMatches(
    uniqueLeagues,
    dateFrom,
    dateTo
  );

  for (const server of servers) {
    if (!server.channelId || !server.leagues) continue;
    try {
      await i18next.changeLanguage(server.language);
      const guild: Guild = await client.guilds.fetch(server.guildId);
      const channel: TextChannel = (await client.channels.fetch(
        server.channelId
      )) as TextChannel;
      for (const league of server.leagues) {
        const leagueMatches: Match[] | undefined = matchesByLeagues.get(
          league.id
        );
        const leagueName: string | undefined = LEAGUE_MAP.get(league.id);
        if (!leagueMatches || !leagueName) continue;

        const leagueMatchesChunks: Match[][] = chunkArray(leagueMatches, 6);
        if (guild) {
          await postStandingLeague(guild, league.id, server.channelId);
        }
        for (const matchChunk of leagueMatchesChunks) {
          const embed: EmbedBuilder = createLeagueEmbed(leagueName, matchChunk);
          const sentMessage: Message = await channel.send({ embeds: [embed] });
          await setMessageId(
            server.guildId,
            league.id,
            sentMessage.id,
            dateRange
          );
        }
      }
    } catch (err) {
      if (err instanceof Error)
      console.error(
        `Erreur (postWeekly) sur serveur ${server.guildId}:`,
        err.message
      );
    }
  }
}

/**
 * Update all scores in the messages previously sent for the current week.
 * @param client
 * @returns {Promise<void>}
 */
export async function updateAllScores(client: Client): Promise<void> {
  const servers: WithId<Server>[] = await getAllServerConfig();
  const uniqueLeagues: Set<League> = new Set(
    servers.flatMap((s: WithId<Server>): League[] => s.leagues || [])
  );
  if (uniqueLeagues.size === 0) return;

  const { dateFrom, dateTo } = getDateRange();
  const dateRange: string = `${dateFrom}_${dateTo}`;
  const matchesByLeagues: Map<string, Match[]> = await getMatches(
    uniqueLeagues,
    dateFrom,
    dateTo
  );

  for (const server of servers) {
    if (!server || !server.channelId || !server.messages?.[dateRange]) continue;
    try {
      await i18next.changeLanguage(server.language);
      const channel: TextChannel = (await client.channels.fetch(
        server.channelId
      )) as TextChannel;
      if (!channel) continue;

      for (const leagueId in server.messages[dateRange]) {
        const messageIds: string[] | undefined = server?.messages[dateRange]
          ? [leagueId].flat()
          : undefined;
        const leagueMatches: Match[] | undefined =
          matchesByLeagues.get(leagueId);
        const leagueName: string | undefined = LEAGUE_MAP.get(leagueId);
        if (!messageIds || !leagueMatches || !leagueName) continue;
        const leagueMatchesChunks: Match[][] = chunkArray(leagueMatches, 6);
        for (let i: number = 0; i < messageIds.length; i++) {
          const messageId: string | undefined = messageIds[i];
          const matchChunk: Match[] | undefined = leagueMatchesChunks[i];
          if (!messageId || !matchChunk) continue;
          const newEmbed: EmbedBuilder = createLeagueEmbed(
            leagueName,
            matchChunk
          );
          try {
            const originalMessage: Message =
              await channel.messages.fetch(messageId);
            await originalMessage.edit({ embeds: [newEmbed] });
          } catch (editError) {
            if (editError instanceof Error){
                console.error(
                  `[Update] Failed to edit message ${messageId}:`,
                  editError.message
                );
            }else{
              console.warn(
                `[Update] Message ${messageId} on server ${server.guildId} was deleted.`
              );
            }
          }
        }
      }
    } catch (fetchChannelError) {
      if (fetchChannelError instanceof Error){
        console.error(
          `[Update] Failed to fetch channel for server ${server.guildId}:`,
          fetchChannelError.message
        );
      }else{
        console.error(
          `[Update] Failed to fetch channel for server ${server.guildId}:`,
          fetchChannelError
        );
      }

    }
  }
}
