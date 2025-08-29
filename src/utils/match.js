import {
  getServerConfig,
  removeMessageId,
  setMessageId,
} from '../db/serverConfig.js';
import {changeLang, chunkArray, getDateRange} from './util.js';
import { getWeeklyMatchesByLeague } from '../api/footballApi.js';
import { EmbedBuilder } from 'discord.js';
import { createMatchField } from './embedHelper.js';
import LEAGUE_MAP from '../data/league.js';
import i18next from "i18next";
import {createLeagueEmbed} from "../tasks/scheduledTasks.js";
import {postStandingLeague} from "./standing.js";

/**
 * Finds and deletes a specific league message from a server.
 * @param {import('discord.js').Guild} guild The guild object.
 * @param {string} leagueId The league ID to remove.
 */
export async function deleteLeagueMessage(guild, leagueId) {
  const serverConfig = await getServerConfig(guild.id);
  const { dateFrom, dateTo } = getDateRange();
  const range = `${dateFrom}_${dateTo}`;

  // Safely get the messageId using optional chaining
  const messageIds = serverConfig?.messages?.[range]?.[leagueId];

  if (!messageIds || !serverConfig.channelId) {
    console.log(
      `[Delete] No message found for league ${leagueId} in server ${guild.name}.`
    );
    return;
  }
  try {
    const channel = await guild.channels.fetch(serverConfig.channelId);
    await channel.bulkDelete(messageIds.flat(), true);
    console.log(
      `[Delete] Successfully bulk delete ${messageIds.length} messages from channel ${channel.name}.`
    );

    await removeMessageId(guild.id, leagueId, range);
    console.log(
      `[Delete] Removed all message IDs for league ${leagueId} from database.`
    );
  } catch (error) {
    console.error(
      `[Delete] Failed to delete messages for league ${leagueId} in server ${guild.name}:`,
      error.message
    );
  }
}

/**
 * Creates and posts a new embed for a specific league.
 * @param {import('discord.js').Guild} guild The guild object.
 * @param {string} leagueId The league ID to add.
 */
export async function postLeagueMessage(guild, leagueId) {
  const serverConfig = await getServerConfig(guild.id);
  const { dateFrom, dateTo } = getDateRange();
  const range = `${dateFrom}_${dateTo}`;

  if (!serverConfig || !serverConfig.channelId) return;

  // Use await and fetch matches only for the needed league
  const matches = await getWeeklyMatchesByLeague(leagueId, dateFrom, dateTo);

  if (!matches || matches.length === 0) {
    console.log(`[Post] No matches found for league ${leagueId}.`);
    return;
  }

  try {
    const channel = await guild.channels.fetch(serverConfig.channelId);
    const leagueName = LEAGUE_MAP.get(leagueId);
    const matchesChunk = chunkArray(matches, 6);
    await changeLang(guild.id)
    await postStandingLeague(guild, leagueId, serverConfig.channelId)
    for (const matcheChunk of matchesChunk) {
      const embed = createLeagueEmbed(leagueName, matcheChunk);
      const sentMessage = await channel.send({ embeds: [embed] });
      // The setMessageId function handles all database logic
      await setMessageId(guild.id, leagueId, sentMessage.id, range);
      console.log(
        `[Post] Successfully posted message for ${leagueId} in server ${guild.name}.`
      );
    }
  } catch (error) {
    console.error(
      `[Post] Failed to post message for ${leagueId} in server ${guild.name}:`,
      error.message
    );
  }
}
