import {getStandingsByLeague} from "../api/footballApi.js";
import {Embed, EmbedBuilder} from "discord.js";

export async function postStandingLeague(guild, leagueId, channelId){
        const guildId = await guild.id;
        const channel = await guild.channels.fetch(channelId);
        const league = await getStandingsByLeague(leagueId);
        const thread = await channel.threads.cache.find(t => t.name === `standings-${league.name}`) ||
        await channel.threads.create({
            name: `standings-${league.name}`,
            autoArchiveDuration: 60,
            reason: 'Thread for league standings',
        });
        if(league){
            const standings = league.standings;
            const embed = new EmbedBuilder()
                .setTitle(`${league.name} - Classement`)
                .setColor(0x1F8B4C)
                .setTimestamp();
            embed.addFields({
                    name: 'POS | Pts | J | G | N | P | BP | BC | Diff | Forme | Équipe',
                    value: '\u200B'
            });
            for (const standing of standings) {
                const team = standing.team.name;
                const points = standing.team.points;
                const played = standing.team.played;
                const wins = standing.team.win;
                const draws = standing.team.draw;
                const losses = standing.team.lose;
                const goalsFor = standing.team.goalsFor;
                const goalsAgainst = standing.team.goalsAgainst;
                const goalDifference = standing.team.goalsDiff;
                console.log(standing)
                embed.addFields({
                    name: `${standing.team.rank.toString().padStart(2, ' ')} | ${points.toString().padStart(3, ' ')} | ${played.toString().padStart(1, ' ')} | ${wins.toString().padStart(1, ' ')} | ${draws.toString().padStart(1, ' ')} | ${losses.toString().padStart(1, ' ')} | ${goalsFor.toString().padStart(2, ' ')} | ${goalsAgainst.toString().padStart(2, ' ')} | ${goalDifference.toString().padStart(3, ' ')} | ${standing.team.form} | ${team.padEnd(20, ' ')}`,
                    value: '\u200B'
                });
            }
            await thread.send({embeds: [embed]});
            console.log(`Posted standings for league ${league.league.name} in guild ${guild.name}`);
        }
}