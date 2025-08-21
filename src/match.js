import { getServerConfig, removeMessageId, setMessageId } from "./serverConfig.js";
import { getDateRange } from "./util.js";
import { getDailyMatches } from "./footballApi.js"; // Renamed for clarity
import { EmbedBuilder } from "discord.js";
import { createMatchField } from "./embedHelper.js";
import { COMPETITION_NAMES } from "./scheduledTasks.js"; // Assuming this is your map of names

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
    const messageId = serverConfig?.messages?.[range]?.[competitionId];

    if (!messageId || !serverConfig.channelId) {
        console.log(`[Delete] No message found for competition ${competitionId} in server ${guild.name}.`);
        return;
    }

    try {
        const channel = await guild.channels.fetch(serverConfig.channelId);
        await channel.messages.delete(messageId);
        console.log(`[Delete] Successfully deleted message ${messageId} from channel ${channel.name}.`);
    } catch (error) {
        if (error.code === 10008) { // Unknown Message
            console.warn(`[Delete] Message ${messageId} was already deleted on Discord.`);
        } else {
            console.error(`[Delete] Failed to delete message ${messageId}:`, error.message);
        }
    } finally {
        // Always try to remove the reference from the DB
        await removeMessageId(guild.id, competitionId, range);
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
    const matches = await getDailyMatches(competitionId, dateFrom, dateTo);

    if (!matches || matches.length === 0) {
        console.log(`[Post] No matches found for competition ${competitionId}.`);
        return;
    }

    try {
        const channel = await guild.channels.fetch(serverConfig.channelId);

        const competitionName = COMPETITION_NAMES.filter(c => c.value === competitionId)[0].name;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📅 Programme - ${competitionName}`)
            .setTimestamp();

        const fields = matches.map(createMatchField);
        embed.addFields(fields.slice(0, 25)); // Safety limit

        const sentMessage = await channel.send({ embeds: [embed] });

        // The setMessageId function handles all database logic
        await setMessageId(guild.id, competitionId, sentMessage.id, range);
        console.log(`[Post] Successfully posted message for ${competitionId} in server ${guild.name}.`);

    } catch (error) {
        console.error(`[Post] Failed to post message for ${competitionId} in server ${guild.name}:`, error.message);
    }
}