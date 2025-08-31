import EventMatch from "./EventMatch.js";

export default class Match {
    private _id: number;
    private _homeTeam: string;
    private _awayTeam: string;
    private _homeScore: number;
    private _awayScore: number;
    private _date: Date;
    private _events: EventMatch[]
    

    constructor(
        id: number,
        homeTeam: string,
        awayTeam: string,
        homeScore: number,
        awayScore: number,
        date: Date,
        events: EventMatch[]
    ) {
        this._id = id;
        this._homeTeam = homeTeam;
        this._awayTeam = awayTeam;
        this._homeScore = homeScore;
        this._awayScore = awayScore;
        this._date = date;
        this._events = events;
    }
    
    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }
    public get homeTeam(): string {
        return this._homeTeam;
    }
    public set homeTeam(value: string) {
        this._homeTeam = value;
    }
    public get awayTeam(): string {
        return this._awayTeam;
    }
    public set awayTeam(value: string){
        this._awayTeam = value;
    }
    public get homeScore(): number {
        return this._homeScore;
    }
    public set homeScore(value: number) {
        this._homeScore = value;
    }
    public get awayScore(): number {
        return this._awayScore;
    }
    public set awayScore(value: number) {
        this._awayScore = value;
    }
    public get date(): Date {
        return this._date;
    }
    public set date(value: Date) {
        this._date = value;
    }
    public get events(): EventMatch[]{
        return this._events;
    }
    public set events(value: EventMatch[]){
        this._events = value;
    }
}