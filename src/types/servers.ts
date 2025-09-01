export interface League {
  id: string;
  name: string;
}

export interface Standings {
  id: string;
  messageId: string;
}

export interface LeagueMessages {
  [leagueId: string]: string[];
}

export interface DateMessage {
  [dateRange: string]: LeagueMessages;
}

export interface Server {
  guildId: string;
  channelId: string;
  language: string;
  leagues?: League[];
  standings?: Standings[];
  messages?: DateMessage;
}
