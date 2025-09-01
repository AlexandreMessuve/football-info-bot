export interface Standing {
  name: string;
  rank: number;
  points: number;
  form: string;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
}

export interface League {
  id: number;
  name: string;
  logo: string;
  standings: Standing[];
}
