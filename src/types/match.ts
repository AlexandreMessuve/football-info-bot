export interface Event {
    teamId: number;
    minute: string;
    type: string;
    player: string;
}

export interface Team {
    name: string;
    score: number;
    penalty: number;
    winner: boolean;
    events: Event[];
}

export interface League {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
    standings: boolean;
}

export interface Match {
    id: number;
    status: string;
    date: string;
    league: League;
    homeTeam: Team;
    awayTeam: Team;
}