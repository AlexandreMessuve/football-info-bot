import { getStandingsByLeague } from '../api/footballApi.js';
import {
  EmbedBuilder,
  type Guild,
  type GuildBasedChannel,
  type Message,
  type TextChannel,
  type TextThreadChannel,
} from 'discord.js';
import i18next from 'i18next';
import { changeLang } from './util.js';
import {
  addStanding,
  getServerConfig,
  removeStandings,
} from '../db/serverConfig.js';
import LEAGUE_MAP from '../data/league.js';
import type { League, Standing } from '../types/standing.ts';
import type { Server, Standings } from '../types/servers.js';

/**
 * Create an embed for league standings
 * @param league
 * @param standingsTitle
 */
function createStandingsEmbed(
  league: League,
  standingsTitle: string
): EmbedBuilder {
  const standings: Standing[] = league.standings;
  const embed: EmbedBuilder = new EmbedBuilder()
    .setTitle(`🏆 ${standingsTitle}`)
    .setColor(0x1f8b4c)
    .setFooter({ text: i18next.t('lastUpdate') })
    .setTimestamp();
  for (const standing of standings) {
    const rank: string = standing.rank.toString();
    const teamName: string = standing.name;
    const points: string = standing.points.toString();
    const played: string = standing.played.toString();
    const win: string = standing.win.toString();
    const draw: string = standing.draw.toString();
    const lose: string = standing.lose.toString();
    const goalsFor: string = standing.goalsFor.toString();
    const goalsAgainst: string = standing.goalsAgainst.toString();
    const goalDiff: string =
      standing.goalsDiff > 0
        ? `+${standing.goalsDiff}`
        : standing.goalsDiff.toString();
    const formString: string = (standing.form || ' N/A')
      .replace(/W/g, '✅')
      .replace(/D/g, '⭕')
      .replace(/L/g, '❌');

    const standingDescription: string = i18next.t('rowsStanding', {
      points,
      played,
      win,
      draw,
      lose,
      goalsFor,
      goalsAgainst,
      goalDiff,
      formString,
    });
    embed.addFields({
      name: `**${rank}**. **${teamName}**`,
      value: standingDescription,
    });
  }

  return embed;
}

/**
 * Post or update standings for a league in a guild channel
 * @param guild
 * @param leagueId
 * @param channelId
 */
export async function postStandingLeague(
  guild: Guild,
  leagueId: string,
  channelId: string
): Promise<void> {
  const guildId: string = guild.id;
  const channel: GuildBasedChannel | null =
    await guild.channels.fetch(channelId);
  const league: League | null = await getStandingsByLeague(leagueId);
  await changeLang(guildId);
  const server: Server | null = await getServerConfig(guildId);
  if (!server || !channel || !channel.isTextBased()) {
    console.log(
      `[Post] No channel or message IDs found for standing league ${leagueId} in server ${guild.name}.`
    );
    return;
  }
  const textChannel: TextChannel = channel as TextChannel;
  const standings: Standings[] = server.standings || [];
  const existing: Standings | null =
    standings.find((s) => s.id === leagueId) || null;
  let message: Message | null = null;
  let isExisting: boolean = false;
  if (existing) {
    message = await textChannel.messages.fetch(existing.messageId);
    if (message) {
      isExisting = true;
    }
  }
  const standingsTitle: string = i18next.t('standingsTitle', {
    leagueName: LEAGUE_MAP.get(leagueId),
  });
  const thread: TextThreadChannel =
    textChannel.threads.cache.find(
      (t: TextThreadChannel) => t.name === standingsTitle
    ) ||
    (await textChannel.threads.create({
      name: standingsTitle,
      autoArchiveDuration: 10080, // 1 week in minutes (60, 1440, 4320, 10080)
      type: 11,
      reason: 'Thread for league standings',
    }));
  if (league) {
    const embed: EmbedBuilder = createStandingsEmbed(league, standingsTitle);
    if (isExisting && message) {
      await message.edit({ embeds: [embed] });
      console.log(
        `Updated standings for league ${league.name} in guild ${guild.name}`
      );
    } else {
      message = await thread.send({ embeds: [embed] });
      await addStanding(guildId, leagueId, message.id);
      console.log(
        `Posted standings for league ${league.name} in guild ${guild.name}`
      );
    }
  } else {
    console.log(`No standings found for league ID ${leagueId}`);
  }
}

/**
 * Delete standings for a league in a guild channel
 * @param guild
 * @param leagueId
 */
export async function deleteStandingLeague(
  guild: Guild,
  leagueId: string
): Promise<void> {
  const serverConfig: Server | null = await getServerConfig(guild.id);

  if (!serverConfig) {
    console.log(
      `[Delete] No server configuration found for server ${guild.name}.`
    );
    return;
  }
  if (serverConfig && !serverConfig.channelId) {
    console.log(
      `[Delete] No channel or message IDs found for standing league ${leagueId} in server ${guild.name}.`
    );
    return;
  }
  try {
    const channel: TextChannel | null = (await guild.channels.fetch(
      serverConfig.channelId
    )) as TextChannel;
    if (!channel) {
      console.log(
        `[Delete] Channel with ID ${serverConfig.channelId} not found in server ${guild.name}.`
      );
      return;
    }
    await changeLang(guild.id);
    const standingsTitle: string = i18next.t('standingsTitle', {
      leagueName: LEAGUE_MAP.get(leagueId),
    });
    const thread: TextThreadChannel | null =
      channel.threads.cache.find(
        (t: TextThreadChannel) => t.name === standingsTitle
      ) || null;
    if (!thread) {
      console.log('[Delete] No thread found for standings.');
      await removeStandings(guild.id, leagueId);
      console.log(
        `[Delete] Thread not found, but removed any dangling database entries for league ${leagueId}.`
      );
      return;
    }
    await thread.delete();
    console.log('[DELETE] Successfully deleted thread.');
    await removeStandings(guild.id, leagueId);
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
