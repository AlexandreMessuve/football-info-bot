import {
  SlashCommandBuilder,
  ChannelType,
  type ChatInputCommandInteraction,
  type TextChannel,
} from 'discord.js';
import i18next from 'i18next';
import { setServerChannel } from '../db/serverConfig.js';

/**
 * Configure the bot for this server
 */
export default {
  data: new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure the bot for this server')
    .setDescriptionLocalizations({
      fr: 'Configuration du bot pour ce serveur',
      'es-ES': 'Configurar el bot para este servidor',
    })
    .addChannelOption((option) =>
      option
        .setName('match_channel')
        .setDescription('The channel for matches announcements')
        .setDescriptionLocalizations({
          fr: 'Le canal pour les annonces de matchs',
          'es-ES': 'El canal para los anuncios de partidos',
        })
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('language')
        .setDescription('The language for the bot')
        .setDescriptionLocalizations({
          fr: 'La langue du bot',
          'es-ES': 'El idioma del bot',
        })
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Français', value: 'fr' },
          { name: 'Español', value: 'es' }
        )
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId: string | null = interaction.guildId;
    const channel: TextChannel | null =
      interaction.options.getChannel('match_channel');
    const language: string | null = interaction.options.getString('language');
    if (
      !guildId ||
      !channel ||
      channel.type !== ChannelType.GuildText ||
      !language
    ) {
      await interaction.editReply({
        content: i18next.t('errorMessage'),
      });
      return;
    }
    await i18next.changeLanguage(language);
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
