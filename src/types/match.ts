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
  logo: string;
}

export interface Status {
  long: string;
  short: string;
  elapsed: number | null;
  extra: number | null;
}

export interface Match {
  id: number;
  status: Status;
  date: number;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
}
