import {getAllServerConfig, setMessageId} from "./serverConfig.js";
import {getWeeklyMatchesByLeague} from "./footballApi.js";
import {createMatchField} from "./embedHelper.js";
import {EmbedBuilder} from "discord.js";
import {chunkArray, getDateRange} from "./util.js";

export const COMPETITION_MAP = new Map([
    ['39', 'Premier League :flag_gb:'],
    ['140', 'LaLiga :flag_es:'],
    ['78', 'Bundesliga :flag_de:'],
    ['135', 'Serie A :flag_it:'],
    ['61', 'Ligue 1 :flag_fr:'],
    ['94', 'Primeira Liga :flag_pt:'],
    ['88', 'Eredivisie :flag_nl:'],
    ['2', 'UEFA Champions League :flag_eu:'],
    ['3', 'UEFA Europa League :flag_eu:'],
    ['848', 'UEFA Europa Conference League :flag_eu:']
]);


async function getMatches(uniqueCompetitions, from, to) {
    const matchesByCompetitions = new Map();
    for (const c of uniqueCompetitions) {
        const matches = await getWeeklyMatchesByLeague(c.id, from, to);
        if (matches && matches.length > 0) {
            matchesByCompetitions.set(c.id, matches);
        }
    }
    return matchesByCompetitions;
}


function createCompetitionEmbed(competitionName, matchChunk) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📅 Programme - ${competitionName}`)
        .setThumbnail(matchChunk[0].league.logo)
        .setTimestamp();

    for (const match of matchChunk) {
        createMatchField(embed, match);
    }
    return embed;
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
                const competitionMatches = matchesByCompetitions.get(competition.id);
                if (!competitionMatches) continue;

                const competitionName = COMPETITION_MAP.get(competition.id);
                const competitionMatchesChunks = chunkArray(competitionMatches, 6);

                for (const matchChunk of competitionMatchesChunks) {
                    const embed = createCompetitionEmbed(competitionName, matchChunk);
                    const sentMessage = await channel.send({embeds: [embed]});
                    await setMessageId(server.guildId, competition.id, sentMessage.id, dateRange);
                }
            }
        } catch (err) {
            console.error(`Erreur (postWeekly) sur serveur ${server.guildId}:`, err.message);
        }
    }
}

// OPTIMISATION 4 : Simplification et correction de la logique de boucle.
export async function updateAllScores(client) {
    const servers = await getAllServerConfig();
    const uniqueCompetitions = new Set(servers.flatMap(s => s.competitions || []));
    if (uniqueCompetitions.size === 0) return;

    const {dateFrom, dateTo} = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;
    const matchesByCompetitions = await getMatches(uniqueCompetitions, dateFrom, dateTo);

    for (const server of servers) {
        if (!server.channelId || !server.messages?.[dateRange]) continue;
        try {
            const channel = await client.channels.fetch(server.channelId);
            if (!channel) continue;

            for (const competitionId in server.messages[dateRange]) {
                const messageIds = server.messages[dateRange][competitionId].flat();
                const competitionMatches = matchesByCompetitions.get(competitionId);
                if (!messageIds || !competitionMatches) continue;

                const competitionName = COMPETITION_MAP.get(competitionId);
                const competitionMatchesChunks = chunkArray(competitionMatches, 6);

                // On met à jour chaque message avec le chunk correspondant.
                for (let i = 0; i < messageIds.length; i++) {
                    const messageId = messageIds[i];
                    const matchChunk = competitionMatchesChunks[i];
                    if (!matchChunk) continue; // Au cas où le nombre de messages et de chunks ne correspond pas

                    const newEmbed = createCompetitionEmbed(competitionName, matchChunk);

                    try {
                        const originalMessage = await channel.messages.fetch(messageId);
                        await originalMessage.edit({embeds: [newEmbed]});
                    } catch (editError) {
                        if (editError.code === 10008) { // Unknown Message
                            console.warn(`[Update] Message ${messageId} on server ${server.guildId} was deleted.`);
                        } else {
                            console.error(`[Update] Failed to edit message ${messageId}:`, editError.message);
                        }
                    }
                }
            }
        } catch (fetchChannelError) {
            console.error(`[Update] Failed to fetch channel for server ${server.guildId}:`, fetchChannelError.message);
        }
    }
}