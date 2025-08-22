/**
 *
 * @param match
 * @returns {{name: string, value: string}}
 */
export function createMatchField(match) {
    const homeTeam = match.homeTeam.name;
    const awayTeam = match.awayTeam.name;
    const matchTime = '<t:' + Math.floor(new Date(match.utcDate).getTime() / 1000) + ':R>';

    let name = `⚽ ${homeTeam} vs ${awayTeam}`;
    let value;
    let score;

    switch (match.status) {
        case 'IN_PLAY':
            score = `${match.score.halfTime.home ?? 0} - ${match.score.halfTime.away ?? 0}`;
            name = `⚽ ${homeTeam} **${score}** ${awayTeam}`;
            value = `🔴 **En direct** | Mi-temps`;
            break;
        case 'FINISHED':
            score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
            name = `⚽ ${homeTeam} **${score}** ${awayTeam}`;
            value = `🏁 **Terminé** ${matchTime}`;
            break;
        default: // SCHEDULED / TIMED
            value = `▶️ **Coup d'envoi**: ${matchTime}`;
            break;
    }
    return { name, value };
}
