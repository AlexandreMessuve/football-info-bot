import {MessageFlags, SlashCommandBuilder} from "discord.js";
import i18next from "i18next";
import {addLeague, getServerConfig} from "../db/serverConfig.js";
import {postLeagueMessage} from "../utils/match.js";
import {fetchDailyMatchesByLeague} from "../tasks/scheduledTasks.js";

export default {
    data: new SlashCommandBuilder()
        .setName("add-league")
        .setDescription("Add a new league to the system")
        .setDescriptionLocalization('fr', 'Ajouter un nouveau championnat à surveiller')
        .addStringOption(
            option => option.setName("league")
                .setDescription('The name of the league to add (e.g., Premier League, La Liga)')
                .setDescriptionLocalization('fr', 'Le nom du championnat à ajouter (ex : Premier League, La Liga)')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(leagueId, leagueName,guild, interaction) {
        const server = await getServerConfig(guild.id);
        if (server.leagues && server.leagues.some(l => l.id === leagueId)) {
            await interaction.editReply({
                content: i18next.t('addLeagueAlreadyExists', {leagueName})
            })
            return;
        }
        try {
            await Promise.all([
                addLeague(guild.id, leagueId, leagueName),
                postLeagueMessage(guild, leagueId),
                fetchDailyMatchesByLeague()
            ]);
            await interaction.editReply(i18next.t('addLeagueSuccess', {leagueName}));
        } catch (e) {
            await interaction.editReply({
                content: i18next.t('errorMessage')
            });
            console.error("[ERROR] addLeague command failed:", e);
        }

    }
}