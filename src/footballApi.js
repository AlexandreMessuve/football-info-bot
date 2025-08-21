import axios from 'axios';

/**
 *
 * @param competitionId
 * @param dateFrom
 * @param dateTo
 * @returns {Promise<GuessedFile[]|boolean|((selectors: string) => boolean)|*[]>}
 */
export async function getDailyMatches(competitionId, dateFrom, dateTo) {
    const options = {
        method: 'GET',
        url: 'http://api.football-data.org/v4/matches',
        params: {
            competitions: competitionId,
            dateFrom: dateFrom,
            dateTo: dateTo,
        },
        headers: {
            'X-Auth-Token': process.env.FOOTBALL_API_KEY,
        }
    };

    try {
        const response = await axios.request(options);
        return response.data.matches; // Renvoie la liste des matchs
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs :", error);
        return [];
    }
}