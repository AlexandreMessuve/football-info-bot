import { getAllServerConfig, setMessageId } from "./serverConfig.js";
import { getDailyMatches } from "./footballApi.js";
import { createMatchField } from "./embedHelper.js";
import { EmbedBuilder } from "discord.js";
import {getDateRange} from "./util.js";

export const COMPETITION_NAMES = [
    { name: 'Premier League :flag_gb:', value: '2021'},
    { name: 'LaLiga :flag_es:', value: '2014'},
    { name: 'Bundesliga :flag_de:', value: '2002'},
    { name: 'Serie A :flag_it:', value: '2019'},
    { name: 'Ligue 1 :flag_fr:', value: '2015'},
    { name: 'Primeira Liga :flag_pt:', value: '2017'},
    { name: 'Eredivisie :flag_nl:', value: '2003'},
    { name: 'UEFA Champions League :flag_eu:', value: '2001'}
]



export async function postWeeklyOverviews(client) {
    const servers = await getAllServerConfig();
    const uniqueCompetitions = new Set(servers.flatMap(s => s.competitionId || []));
    if (uniqueCompetitions.size === 0) return;
    const { dateFrom, dateTo } = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;

    const allMatches = await getDailyMatches([...uniqueCompetitions], dateFrom, dateTo);
    const matchesByCompetition = allMatches.reduce((acc, match) => {
        const id = match.competition.id;
        if (!acc[id]) {
            acc[id] = [];
        }
        acc[id].push(match);
        return acc;
    });

    for (const server of servers) {
        if (!server.channelId || !server.competitions) continue;
        try {
            const channel = await client.channels.fetch(server.channelId);
            for (const competitionId of server.competitions) {
                const competitionMatches = matchesByCompetition[competitionId];
                if (!competitionMatches) continue;

                const competitionName = COMPETITION_NAMES.filter(c => c.value === competitionId)[0].name;
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`📅 Programme - ${competitionName}`)
                    .setTimestamp();

                const fields = competitionMatches.map(createMatchField);
                embed.addFields(fields.slice(0, 25));

                const sentMessage = await channel.send({ embeds: [embed] });
                await setMessageId(server._id, competitionId, sentMessage.id, dateRange);
            }
        } catch (err) {
            console.error(`Erreur (postWeekly) sur serveur ${server._id}:`, err.message);
        }
    }
}

// This function runs every 15 minutes to update scores
export async function updateAllScores(client) {
    const servers = await getAllServerConfig();
    const uniqueCompetitions = new Set(servers.flatMap(s => s.competitionId || []));

    if (uniqueCompetitions.size === 0) {
        console.log("[Update] No competitions to update.");
        return;
    }

    const { dateFrom, dateTo } = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;

    const allMatches = await getDailyMatches([...uniqueCompetitions], dateFrom, dateTo);
    const matchesByCompetition = allMatches.reduce((acc, match) => {
        const id = match.competition.id;
        if (!acc[id]) acc[id] = [];
        acc[id].push(match);
        return acc;
    }, {});

    for (const server of servers) {
        if (!server.channelId || !server.messages?.[dateRange]) continue;

        try {
            const channel = await client.channels.fetch(server.channelId);
            if (!channel) continue;

            for (const competitionId in server.messages[dateRange]) {
                const messageId = server.messages[dateRange][competitionId];
                const competitionMatches = matchesByCompetition[competitionId];

                if (!messageId || !competitionMatches) continue;
                const competitionName = COMPETITION_NAMES.filter(c => c.value === competitionId)[0].name;
                const newEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`📅 Programme - ${competitionName}`)
                    .setTimestamp();

                const fields = competitionMatches.map(createMatchField);
                newEmbed.addFields(fields.slice(0, 25));

                try {
                    const originalMessage = await channel.messages.fetch(messageId);
                    await originalMessage.edit({ embeds: [newEmbed] });
                } catch (editError) {
                    if (editError.code === 10008) { // Unknown Message
                        console.warn(`[Update] Message ${messageId} on server ${server._id} was deleted. Consider cleaning the DB.`);
                    } else {
                        console.error(`[Update] Failed to edit message ${messageId}:`, editError.message);
                    }
                }
            }
        } catch (fetchChannelError) {
            console.error(`[Update] Failed to fetch channel for server ${server._id}:`, fetchChannelError.message);
        }
    }
}
