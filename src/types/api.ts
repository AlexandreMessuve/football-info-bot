// The shape of a single fixture from the /fixtures endpoint
export interface ApiFixture {
  fixture: {
    id: number;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

// The shape of an event from the /fixtures/events endpoint
export interface ApiEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
  };
  player: {
    name: string;
  };
  type: 'Goal' | 'Card';
  detail: string; // "Yellow Card", "Red Card", "Penalty", "Own Goal", etc.
}

// The shape of a team's standing from the /standings endpoint
export interface ApiStanding {
  rank: number;
  team: {
    name: string;
  };
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

// The shape of the top-level league object from the /standings endpoint
export interface ApiLeague {
  league: {
    id: number;
    name: string;
    logo: string;
    standings: ApiStanding[][]; // Standings are often grouped in an array of arrays
  };
}
