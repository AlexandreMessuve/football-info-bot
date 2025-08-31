import { MessageFlags, SlashCommandBuilder, ChannelType } from 'discord.js';
import i18next from 'i18next';
import { setServerChannel } from '../db/serverConfig.ts';

/**
 * Configure the bot for this server
 */
export default {
  data: new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure the bot for this server')
    .setDescriptionLocalizations(
        {
            'fr': 'Configuration du bot pour ce serveur',
            'es-ES': 'Configurar el bot para este servidor'
        }
    )
    .addChannelOption((option) =>
      option
        .setName('match_channel')
        .setDescription('The channel for matches announcements')
        .setDescriptionLocalizations(
            {
                'fr': 'Le canal pour les annonces de matchs',
                'es-ES': 'El canal para los anuncios de partidos'
            }
        )
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('language')
        .setDescription('The language for the bot')
        .setDescriptionLocalizations(
            {
                'fr': 'La langue du bot',
                'es-ES': 'El idioma del bot'
            }
        )
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Français', value: 'fr' },
          { name: 'Español', value: 'es' }
        )
        .setRequired(true)
    )

  ,

  async execute(interaction) {
    const guildId = interaction.guildId;
    const channel = await interaction.options.getChannel('match_channel');
    const language = interaction.options.getString('language');
    await i18next.changeLanguage(language);
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    try {
      await setServerChannel(guildId, channel.id, language);
      await interaction.editReply({
        content: i18next.t('configureChannelSuccess', {
          channelName: channel.name,
        }),
      });
    } catch (error) {
      console.error('[ERROR] configuration server', error);
      await interaction.editReply({ content: i18next.t('errorMessage') });
    }
  },
};
