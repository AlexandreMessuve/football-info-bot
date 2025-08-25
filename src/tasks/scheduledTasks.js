import {getAllServerConfig, setMessageId} from "../db/serverConfig.js";
import {getWeeklyMatchesByLeague} from "../api/footballApi.js";
import {createMatchField} from "../utils/embedHelper.js";
import {EmbedBuilder} from "discord.js";
import {chunkArray, getDateRange} from "../utils/util.js";
import LEAGUE_MAP from "../data/league.js";

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


function createLeagueEmbed(leagueName, matchChunk) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📅 Programme - ${leagueName}`)
        .setThumbnail(matchChunk[0].league.logo)
        .setTimestamp();

    for (const match of matchChunk) {
        createMatchField(embed, match);
    }
    return embed;
}

export async function postWeeklyOverviews(client) {
    const servers = await getAllServerConfig();
    const uniqueLeagues = new Set(servers.flatMap(s => s.leagues || []));
    if (uniqueLeagues.size === 0) return;

    const {dateFrom, dateTo} = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;
    const matchesByLeagues = await getMatches(uniqueLeagues, dateFrom, dateTo);

    for (const server of servers) {
        if (!server.channelId || !server.leagues) continue;
        try {
            const channel = await client.channels.fetch(server.channelId);
            for (const league of server.leagues) {
                const leagueMatches = matchesByLeagues.get(league.id);
                if (!leagueMatches) continue;

                const leagueName = LEAGUE_MAP.get(league.id);
                const leagueMatchesChunks = chunkArray(leagueMatches, 6);

                for (const matchChunk of leagueMatchesChunks) {
                    const embed = createLeagueEmbed(leagueName, matchChunk);
                    const sentMessage = await channel.send({embeds: [embed]});
                    await setMessageId(server.guildId, league.id, sentMessage.id, dateRange);
                }
            }
        } catch (err) {
            console.error(`Erreur (postWeekly) sur serveur ${server.guildId}:`, err.message);
        }
    }
}


export async function updateAllScores(client) {
    const servers = await getAllServerConfig();
    const uniqueLeagues = new Set(servers.flatMap(s => s.leagues || []));
    if (uniqueLeagues.size === 0) return;

    const {dateFrom, dateTo} = getDateRange();
    const dateRange = `${dateFrom}_${dateTo}`;
    const matchesByLeagues = await getMatches(uniqueLeagues, dateFrom, dateTo);

    for (const server of servers) {
        if (!server.channelId || !server.messages?.[dateRange]) continue;
        try {
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