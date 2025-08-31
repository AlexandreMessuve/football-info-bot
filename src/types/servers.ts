export interface League {
    id: string;
    name: string;
}

export interface Standing {
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
    standings?: Standing[];
    messages?: DateMessage;
}