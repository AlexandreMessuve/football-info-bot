import {
  getServerConfig,
  removeMessageId,
  setMessageId,
} from '../db/serverConfig.js';
import { changeLang, chunkArray, getDateRange } from './util.js';
import { getWeeklyMatchesByLeague } from '../api/footballApi.js';
import LEAGUE_MAP from '../data/league.js';
import { createLeagueEmbed } from '../tasks/scheduledTasks.js';
import { postStandingLeague } from './standing.js';
import type { EmbedBuilder, Guild, Message, TextChannel } from 'discord.js';
import type { Server } from '../types/servers.js';
import type { Match } from '../types/match.js';

/**
 * Finds and deletes a specific league message from a server.
 * @param {import('discord.js').Guild} guild The guild object.
 * @param {string} leagueId The league ID to remove.
 */
export async function deleteLeagueMessage(guild: Guild, leagueId: string) {
  const serverConfig: Server | null = await getServerConfig(guild.id);
  const { dateFrom, dateTo } = getDateRange();
  const range: string = `${dateFrom}_${dateTo}`;

  // Safely get the messageId using optional chaining
  const messageIds: string[] | undefined =
    serverConfig?.messages?.[range]?.[leagueId];

  if (!messageIds || !serverConfig?.channelId) {
    console.log(
      `[Delete] No message found for league ${leagueId} in server ${guild.name}.`
    );
    return;
  }
  try {
    const channel: TextChannel = (await guild.channels.fetch(
      serverConfig.channelId
    )) as TextChannel;
    await channel.bulkDelete(messageIds.flat(), true);
    console.log(
      `[Delete] Successfully bulk delete ${messageIds.length} messages from channel ${channel.name}.`
    );

    await removeMessageId(guild.id, leagueId, range);
    console.log(
      `[Delete] Removed all message IDs for league ${leagueId} from database.`
    );
  } catch (error) {
    if (error instanceof Error){
      console.error(
        `[Delete] Failed to delete messages for league ${leagueId} in server ${guild.name}:`,
        error.message
      );
    }else{
      console.error(
        `[Delete] Failed to delete messages for league ${leagueId} in server ${guild.name}:`,
        error
      );
    }
  }
}

/**
 * Creates and posts a new embed for a specific league.
 * @param {import('discord.js').Guild} guild The guild object.
 * @param {string} leagueId The league ID to add.
 * @return {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function postLeagueMessage(
  guild: Guild,
  leagueId: string
): Promise<void> {
  const serverConfig: Server | null = await getServerConfig(guild.id);
  if (!serverConfig || !serverConfig.channelId) return;
  const { dateFrom, dateTo } = getDateRange();
  const range: string = `${dateFrom}_${dateTo}`;

  // Use await and fetch matches only for the needed league
  const matches: Match[] = await getWeeklyMatchesByLeague(
    leagueId,
    dateFrom,
    dateTo
  );

  if (!matches || matches.length === 0) {
    console.log(`[Post] No matches found for league ${leagueId}.`);
    return;
  }

  try {
    const channel: TextChannel = (await guild.channels.fetch(
      serverConfig.channelId
    )) as TextChannel;
    const leagueName: string | undefined = LEAGUE_MAP.get(leagueId);
    if (!leagueName) {
      console.log(`[Post] League name not found for league ID ${leagueId}.`);
      return;
    }
    const matchesChunk: Match[][] = chunkArray(matches, 6);
    await changeLang(guild.id);
    await postStandingLeague(guild, leagueId, serverConfig.channelId);
    for (const matcheChunk of matchesChunk) {
      const embed: EmbedBuilder = createLeagueEmbed(leagueName, matcheChunk);
      const sentMessage: Message = await channel.send({ embeds: [embed] });
      // The setMessageId function handles all database logic
      await setMessageId(guild.id, leagueId, sentMessage.id, range);
      console.log(
        `[Post] Successfully posted message for ${leagueId} in server ${guild.name}.`
      );
    }
  } catch (error) {
    if (error instanceof Error){
      console.error(
        `[Post] Failed to post message for ${leagueId} in server ${guild.name}:`,
        error.message
      );
    }else{
      console.error(
        `[Post] Failed to post message for ${leagueId} in server ${guild.name}:`,
        error
      );
    }
  }
}
