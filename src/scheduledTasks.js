import {getAllServerConfig, setMessageId} from "./serverConfig.js";
import {getWeeklyMatchesByLeague} from "./footballApi.js";
import {createMatchField} from "./embedHelper.js";
import {EmbedBuilder} from "discord.js";
import {chunkArray, getDateRange} from "./util.js";

export const COMPETITION_NAMES = [
    {name: 'Premier League :flag_gb:', value: '39'},
    { name: 'LaLiga :flag_es:', value: '140'},
    { name: 'Bundesliga :flag_de:', value: '78'},
    { name: 'Serie A :flag_it:', value: '135'},
    {name: 'Ligue 1 :flag_fr:', value: '61'},
    { name: 'Primeira Liga :flag_pt:', value: '94'},
    { name: 'Eredivisie :flag_nl:', value: '88'},
    { name: 'UEFA Champions League :flag_eu:', value: '2'},
    { name: 'UEFA Europa League :flag_eu:', value: '3' },
    { name: 'UEFA Europa Conference League :flag_eu:', value: '848' }
]

async function getMatches(uniqueCompetitions, from, to) {
    const matchesByCompetitions = [];
    for (const c of uniqueCompetitions) {
        const matches = await getWeeklyMatchesByLeague(c.id, from, to);
        if (!matches) continue;
        if (!matchesByCompetitions[c.id]) {
            matchesByCompetitions[c.id] = [];
        }
        matchesByCompetitions[c.id].push(matches);
    }
    return matchesByCompetitions;
}

export async function postWeeklyOverviews(client) {
    const servers = await getAllServerConfig();
    const uniqueCompetitions = new Set(servers.flatMap(s => s.competitions || []));
    if (uniqueCompetitions.size === 0) return;
    const {dateFrom, dateTo} = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;
    const matchesByCompetitions = await getMatches(uniqueCompetitions, dateFrom, dateTo);

    for (const server of servers) {
        if (!server.channelId || !server.competitions) continue;
        try {
            const channel = await client.channels.fetch(server.channelId);
            for (const competition of server.competitions) {
                const competitionMatches = matchesByCompetitions[competition.id];
                if (!competitionMatches) continue;

                const competitionName = COMPETITION_NAMES.filter(c => c.value === competition.id)[0].name;
                const competitionMatchesChunk = chunkArray(competitionMatches, 6);
                for (const matchChunk of competitionMatchesChunk) {
                    let embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`📅 Programme - ${competitionName}`)
                        .setThumbnail(matchChunk[0][0].league.logo)
                        .setTimestamp();

                    for (const match of matchChunk) {
                        embed = createMatchField(embed, match);
                    }

                    const sentMessage = await channel.send({embeds: [embed]});
                    await setMessageId(server.guildId, competition.id, sentMessage.id, dateRange);
                }
            }
        } catch (err) {
            console.error(`Erreur (postWeekly) sur serveur ${server.guildId}:`, err.message);
        }
    }
}

// This function runs every 15 minutes to update scores
export async function updateAllScores(client) {
    const servers = await getAllServerConfig();
    const uniqueCompetitions = new Set(servers.flatMap(s => s.competitions || []));

    if (uniqueCompetitions.size === 0) {
        console.log("[Update] No competitions to update.");
        return;
    }

    const {dateFrom, dateTo} = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;

    const matchesByCompetitions = await getMatches(uniqueCompetitions, dateFrom, dateTo);

    for (const server of servers) {
        if (!server.channelId || !server.messages?.[dateRange]) continue;

        try {
            const channel = await client.channels.fetch(server.channelId);
            if (!channel) continue;

            for (const competitionId in server.messages[dateRange]) {
                const messageIds = server.messages[dateRange][competitionId];
                const competitionMatches = matchesByCompetitions[competitionId];

                if (!messageIds || !competitionMatches) continue;
                for (const messageId of messageIds) {
                    const competitionName = COMPETITION_NAMES.filter(c => c.value === competitionId)[0].name;
                    const competitionMatchesChunk = chunkArray(competitionMatches, 6);
                    for (const chunkMatches of competitionMatchesChunk) {
                        let newEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle(`📅 Programme - ${competitionName}`)
                            .setThumbnail(chunkMatches[0][0].league.logo)
                            .setTimestamp();

                        for (const match of chunkMatches) {
                            newEmbed = createMatchField(newEmbed, match);
                        }

                        try {
                            const originalMessage = await channel.messages.fetch(messageId);
                            await originalMessage.edit({embeds: [newEmbed]});
                        } catch (editError) {
                            if (editError.code === 10008) { // Unknown Message
                                console.warn(`[Update] Message ${messageId} on server ${server.guildId} was deleted. Consider cleaning the DB.`);
                            } else {
                                console.error(`[Update] Failed to edit message ${messageId}:`, editError.message);
                            }
                        }
                    }

                }

            }
        } catch (fetchChannelError) {
            console.error(`[Update] Failed to fetch channel for server ${server.guildId}:`, fetchChannelError.message);
        }
    }
}
