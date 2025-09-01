import {
  type ChatInputCommandInteraction,
  type Guild,
  type SlashCommandBuilder,
} from 'discord.js';

interface BaseCommand {
  data: SlashCommandBuilder;
}

interface StandardCommand extends BaseCommand {
  commandType: 'standard';
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

interface LeagueCommand extends BaseCommand {
  commandType: 'league';
  execute: (
    leagueId: string,
    leagueName: string,
    guild: Guild,
    interaction: ChatInputCommandInteraction
  ) => Promise<void>;
}

export type Command = StandardCommand | LeagueCommand;
