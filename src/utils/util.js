import {endOfWeek, format, startOfWeek} from "date-fns";
import LEAGUE_MAP from "../data/league.js";
import {getServerConfig} from "../db/serverConfig.js";
export const delay = ms => new Promise(res => setTimeout(res, ms));

export async function getChoice(guildId, type) {
    const server = await getServerConfig(guildId);
    const configuredLeagues = new Set((server.leagues || []).map(l => l.id));
    if(type === 'remove' && configuredLeagues.length === 0) return [];

    const allLeagues = Array.from(LEAGUE_MAP.entries());
    let filteredLeagues = [];

    if (type === 'add'){
        filteredLeagues = allLeagues.filter(([id, name]) => !configuredLeagues.has(id))
    }else{
        filteredLeagues = allLeagues.filter(([id, name]) => configuredLeagues.has(id))
    }

    return filteredLeagues.map(([id, name]) => ({
        name,
        value: id
    }) );
}

export function getDateRange(){
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const sunday = endOfWeek(today, { weekStartsOn: 1 });
    const dateFrom = format(monday, 'yyyy-MM-dd');
    const dateTo = format(sunday, 'yyyy-MM-dd');
    return {
        dateFrom,
        dateTo
    };
}

/**
 * Divise un tableau en plusieurs sous-tableaux d'une taille maximale donnée.
 * @param {Array} array - Le tableau à diviser.
 * @param {number} chunkSize - La taille maximale de chaque sous-tableau.
 * @returns {Array<Array>} - Un tableau de sous-tableaux.
 */
export function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        chunks.push(chunk);
    }
    return chunks;
}