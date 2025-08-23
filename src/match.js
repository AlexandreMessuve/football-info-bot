import { getServerConfig, removeMessageId, setMessageId } from "./serverConfig.js";
import {chunkArray, getDateRange} from "./util.js";
import {getWeeklyMatchesByLeague} from "./footballApi.js"; // Renamed for clarity
import { EmbedBuilder } from "discord.js";
import { createMatchField } from "./embedHelper.js";
import { COMPETITION_MAP } from "./scheduledTasks.js"; // Assuming this is your map of names

/**
 * Finds and deletes a specific competition message from a server.
 * @param {import('discord.js').Guild} guild The guild object.
 * @param {string} competitionId The competition ID to remove.
 */
export async function deleteCompetitionMessage(guild, competitionId) {
    const serverConfig = await getServerConfig(guild.id);
    const { dateFrom, dateTo } = getDateRange();
    const range = `${dateFrom}_${dateTo}`;

    // Safely get the messageId using optional chaining
    const messageIds = serverConfig?.messages?.[range]?.[competitionId];

    if (!messageIds || !serverConfig.channelId) {
        console.log(`[Delete] No message found for competition ${competitionId} in server ${guild.name}.`);
        return;
    }
        try {
            const channel = await guild.channels.fetch(serverConfig.channelId);
            await channel.bulkDelete(messageIds.flat(), true);
            console.log(`[Delete] Successfully bulk delete ${messageIds.length} messages from channel ${channel.name}.`);

            await removeMessageId(guild.id, competitionId, range);
            console.log(`[Delete] Removed all message IDs for competition ${competitionId} from database.`);
        } catch (error) {
            console.error(`[Delete] Failed to delete messages for competition ${competitionId} in server ${guild.name}:`, error.message);
        }
}

/**
 * Creates and posts a new embed for a specific competition.
 * @param {import('discord.js').Guild} guild The guild object.
 * @param {string} competitionId The competition ID to add.
 */
export async function postCompetitionMessage(guild, competitionId) {
    const serverConfig = await getServerConfig(guild.id);
    const { dateFrom, dateTo } = getDateRange();
    const range = `${dateFrom}_${dateTo}`;

    if (!serverConfig || !serverConfig.channelId) return;

    // Use await and fetch matches only for the needed competition
    const matches = await getWeeklyMatchesByLeague(competitionId, dateFrom, dateTo);

    if (!matches || matches.length === 0) {
        console.log(`[Post] No matches found for competition ${competitionId}.`);
        return;
    }

    try {
        const channel = await guild.channels.fetch(serverConfig.channelId);

        const competitionName = COMPETITION_MAP.filter((k,v) => k === competitionId)[0].name;
        const matchesChunk = chunkArray(matches, 6);
        for (const matcheChunk of matchesChunk) {
                    let embed = new EmbedBuilder()
                        .setColor("#0099ff")
                        .setTitle(`📅 Programme - ${competitionName}`)
                        .setThumbnail(matcheChunk[0].league.logo)
                        .setTimestamp();

                    for(const match of matcheChunk) {
                        embed = createMatchField(embed, match);
                    }

                    const sentMessage = await channel.send({ embeds: [embed] });

                    // The setMessageId function handles all database logic
                    await setMessageId(guild.id, competitionId, sentMessage.id, range);
                    console.log(`[Post] Successfully posted message for ${competitionId} in server ${guild.name}.`);

        }
    } catch (error) {
        console.error(`[Post] Failed to post message for ${competitionId} in server ${guild.name}:`, error.message);
    }
}