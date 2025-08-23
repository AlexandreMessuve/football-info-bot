import {endOfWeek, format, startOfWeek} from "date-fns";

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