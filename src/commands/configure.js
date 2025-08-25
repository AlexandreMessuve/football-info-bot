import {MessageFlags, SlashCommandBuilder} from "discord.js";
import i18next from "i18next";
import {setServerChannel} from "../db/serverConfig.js";

export default {
    data: new SlashCommandBuilder()
        .setName("configure")
        .setDescription("Configure the bot for this server")
        .setDescriptionLocalization('fr', 'Configuration du bot pour ce serveur')
        .addChannelOption(
            option => option.setName("channel")
                .setDescription('The channel for matches announcements')
                .setDescriptionLocalization('fr', 'Le canal pour les annonces de matchs')
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const channel = await interaction.options.getChannel('channel');
        await interaction.deferReply({flags: [MessageFlags.Ephemeral]});
        try {
            await setServerChannel(guildId, channel.id);
            await interaction.editReply({ content: i18next.t('configureChannelSuccess', {channelName: channel.name})});
        } catch (error) {
            console.error("[ERROR] configuration server",error);
            await interaction.editReply({ content: i18next.t('errorMessage')});
        }

    }
}