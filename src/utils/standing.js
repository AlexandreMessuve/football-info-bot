import {getStandingsByLeague} from "../api/footballApi.ts";
import {ActionRowBuilder, ButtonBuilder,ButtonStyle , Embed, EmbedBuilder} from "discord.js";
import i18next from "i18next";
import {changeLang, getDateRange} from "./util.ts";
import {addStanding, getServerConfig, removeMessageId, removeStandings} from "../db/serverConfig.ts";
import league from "../data/league.ts";
import LEAGUE_MAP from "../data/league.ts";


function createStandingsEmbed(league, standingsTitle) {
  const standings = league.standings;
  const embed = new EmbedBuilder()
    .setTitle(`🏆 ${standingsTitle}`)
    .setColor(0x1F8B4C)
    .setFooter({ text: i18next.t('lastUpdate') })
    .setTimestamp();
  for (const standing of standings) {
    const rank = standing.team.rank.toString();
    const teamName = standing.team.name;
    const points = standing.team.points.toString();
    const played = standing.team.played.toString();
    const win = standing.team.win.toString();
    const draw = standing.team.draw.toString();
    const lose = standing.team.lose.toString();
    const goalsFor = standing.team.goalsFor.toString();
    const goalsAgainst = standing.team.goalsAgainst.toString();
    const goalDiff = standing.team.goalsDiff > 0 ? `+${standing.team.goalsDiff}` : standing.team.goalsDiff.toString();
    const formString = (standing.team.form || ' N/A')
      .replace(/W/g, '✅').replace(/D/g, '⭕').replace(/L/g, '❌');

    const standingDescription = i18next.t('rowsStanding', {
      points,
      played,
      win,
      draw,
      lose,
      goalsFor,
      goalsAgainst,
      goalDiff,
      formString
    });
    embed.addFields({
      name: `**${rank}**. **${teamName}**`,
      value: standingDescription
    });
  }

  return embed;
}

export async function postStandingLeague(guild, leagueId, channelId) {
  const guildId = await guild.id;
  const channel = await guild.channels.fetch(channelId);
  const league = await getStandingsByLeague(leagueId);
  await changeLang(guildId);
  const server = await getServerConfig(guildId);
  const standings = server.standings || [];
  const existing = standings.find(s => s.leagueId === leagueId);
  let message;
  let isExisting = false;
  if (existing){
    message = await channel.messages.fetch(existing.messageId);
    if (message) {
      isExisting = true;
    }
  }
  const standingsTitle = i18next.t('standingsTitle', {
    leagueName: LEAGUE_MAP.get(leagueId),
  });
  const thread = await channel.threads.cache.find(t => t.name === standingsTitle) ||
    await channel.threads.create({
      name: standingsTitle,
      autoArchiveDuration: 10080, // 1 week in minutes (60, 1440, 4320, 10080)
      type: 11,
      reason: 'Thread for league standings',
    });
  if (league) {
    const embed = createStandingsEmbed(league, standingsTitle);
    if (isExisting){
      await message.edit({embeds: [embed]});
      console.log(`Updated standings for league ${league.name} in guild ${guild.name}`);
      return;
    }else{
          message =  await thread.send({embeds: [embed]});
          await addStanding(guildId, leagueId, message.id)
    }
    console.log(`Posted standings for league ${league.name} in guild ${guild.name}`);
  } else {
    console.log(`No standings found for league ID ${leagueId}`);
  }
}

export async function deleteStandingLeague(guild, leagueId) {
  const serverConfig = await getServerConfig(guild.id);

  if (!serverConfig.channelId) {
    console.log(
      `[Delete] No channel or message IDs found for standing league ${leagueId} in server ${guild.name}.`
    );
    return;
  }
  try {
    const channel = await guild.channels.fetch(serverConfig.channelId);
    if (!channel) {
      console.log(
        `[Delete] Channel with ID ${serverConfig.channelId} not found in server ${guild.name}.`
      );
      return;
    }
    await changeLang(guild.id);
    const standingsTitle = i18next.t('standingsTitle', {
      leagueName: LEAGUE_MAP.get(leagueId),
    })
    const thread = await channel.threads.cache.find(t => t.name === standingsTitle)
    if (!thread){
      console.log('[Delete] No thread found for standings.')
      return
    }
    await thread.delete();
    console.log('[DELETE] Successfully deleted thread.')
    await removeStandings(guild.id, leagueId);
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