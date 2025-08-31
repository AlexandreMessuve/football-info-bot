import { getAllServerConfig, setMessageId } from '../db/serverConfig.ts';
import { getWeeklyMatchesByLeague } from '../api/footballApi.ts';
import { createMatchField } from '../utils/embedHelper.js';
import { EmbedBuilder } from 'discord.js';
import {changeLang, chunkArray, getDateRange} from '../utils/util.ts';
import LEAGUE_MAP from '../data/league.ts';
import { addMatchesLeague } from '../data/matches.ts';
import i18next from "i18next";
import {postStandingLeague} from "../utils/standing.js";

/**
 * retrieve matches for a set of leagues within a date range.
 * @param uniqueLeagues
 * @param from
 * @param to
 * @returns {Promise<Map<any, any>>}
 */
async function getMatches(uniqueLeagues, from, to) {
  const matchesByLeagues = new Map();
  for (const c of uniqueLeagues) {
    const matches = await getWeeklyMatchesByLeague(c.id, from, to);
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
export function createLeagueEmbed(leagueName, matchChunk) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(i18next.t('planning', { leagueName }))
    .setThumbnail(matchChunk[0].league.logo)
    .setFooter({ text: i18next.t('lastUpdate') } )
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
export async function fetchDailyMatchesByLeague() {
  const date = new Date().toISOString().split('T')[0];
  const servers = await getAllServerConfig();
  const uniqueLeagues = new Set(servers.flatMap((s) => s.leagues || []));
  if (uniqueLeagues.size === 0) return;
  const matches = await getMatches(uniqueLeagues, date, date);
  for (const [leagueId, leagueMatches] of matches) {
    console.log(
      `🏆 League: ${LEAGUE_MAP.get(leagueId)} - Matches today: ${leagueMatches.length}`
    );
    if (leagueMatches.length === 0) continue;
    addMatchesLeague(leagueId, matches.get(leagueId));
    console.log('✅ Matches added to the database');
  }
}

/**
 * Post weekly overviews to the configured channels in each server.
 * @param client
 * @returns {Promise<void>}
 */
export async function postWeeklyOverviews(client) {
  const servers = await getAllServerConfig();
  const uniqueLeagues = new Set(servers.flatMap((s) => s.leagues || []));
  if (uniqueLeagues.size === 0) return;

  const { dateFrom, dateTo } = getDateRange();
  const dateRange = `${dateFrom}_${dateTo}`;
  const matchesByLeagues = await getMatches(uniqueLeagues, dateFrom, dateTo);

  for (const server of servers) {
    if (!server.channelId || !server.leagues) continue;
    try {
      await i18next.changeLanguage(server.language);
      const guild = await client.guilds.fetch(server.guildId);
      const channel = await client.channels.fetch(server.channelId);
      for (const league of server.leagues) {

        const leagueMatches = matchesByLeagues.get(league.id);
        if (!leagueMatches) continue;

        const leagueName = LEAGUE_MAP.get(league.id);
        const leagueMatchesChunks = chunkArray(leagueMatches, 6);
        if (guild){
          await postStandingLeague(guild, league.id, server.channelId);
        }
        for (const matchChunk of leagueMatchesChunks) {
          const embed = createLeagueEmbed(leagueName, matchChunk);
          const sentMessage = await channel.send({ embeds: [embed] });
          await setMessageId(
            server.guildId,
            league.id,
            sentMessage.id,
            dateRange
          );
        }
      }
    } catch (err) {
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
export async function updateAllScores(client) {
  const servers = await getAllServerConfig();
  const uniqueLeagues = new Set(servers.flatMap((s) => s.leagues || []));
  if (uniqueLeagues.size === 0) return;

  const { dateFrom, dateTo } = getDateRange();
  const dateRange = `${dateFrom}_${dateTo}`;
  const matchesByLeagues = await getMatches(uniqueLeagues, dateFrom, dateTo);

  for (const server of servers) {
    if (!server.channelId || !server.messages?.[dateRange]) continue;
    try {
      await i18next.changeLanguage(server.language);
      const channel = await client.channels.fetch(server.channelId);
      if (!channel) continue;

      for (const leagueId in server.messages[dateRange]) {
        const messageIds = server.messages[dateRange][leagueId].flat();
        const leagueMatches = matchesByLeagues.get(leagueId);
        if (!messageIds || !leagueMatches) continue;

        const leagueName = LEAGUE_MAP.get(leagueId);
        const leagueMatchesChunks = chunkArray(leagueMatches, 6);

        // On met à jour chaque message avec le chunk correspondant.
        for (let i = 0; i < messageIds.length; i++) {
          const messageId = messageIds[i];
          const matchChunk = leagueMatchesChunks[i];
          if (!matchChunk) continue; // Au cas où le nombre de messages et de chunks ne correspond pas

          const newEmbed = createLeagueEmbed(leagueName, matchChunk);

          try {
            const originalMessage = await channel.messages.fetch(messageId);
            await originalMessage.edit({ embeds: [newEmbed] });
          } catch (editError) {
            if (editError.code === 10008) {
              // Unknown Message
              console.warn(
                `[Update] Message ${messageId} on server ${server.guildId} was deleted.`
              );
            } else {
              console.error(
                `[Update] Failed to edit message ${messageId}:`,
                editError.message
              );
            }
          }
        }
      }
    } catch (fetchChannelError) {
      console.error(
        `[Update] Failed to fetch channel for server ${server.guildId}:`,
        fetchChannelError.message
      );
    }
  }
}
