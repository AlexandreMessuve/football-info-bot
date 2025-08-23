/**
 *
 * @param embed
 * @param match
 */
export function createMatchField(embed, match) {
    const timeStampDateMatch = match.date;
    const matchTime = `<t:${timeStampDateMatch}:F> (<t:${timeStampDateMatch}:R>)`;
    const homeEventsString = match.homeTeam.events
        .map(event => `${event.type} ${event.player} ${event.minute}'`)
        .join('\n') || '\u200B'; // '\u200B' est un espace vide pour éviter un champ vide

    const awayEventsString = match.awayTeam.events
        .map(event => `${event.type} ${event.player} ${event.minute}'`)
        .join('\n') || '\u200B';

    let statusText;
    const statusShort = match.status.short;
    if (['1H', '2H', 'ET'].includes(statusShort)) {
        statusText = `🔴 **En direct** | ${match.status.elapsed}"`;
    } else if (['HT'].includes(statusShort)) {
        statusText = '⏸️ **Mi-temps**';
    } else if (['FT', 'AET', 'PEN'].includes(statusShort)) {
        statusText = `🏁 **Terminé** ${matchTime}`;
    } else {
        statusText = `▶️ **Coup d'envoi**: ${matchTime}`;
    }

    const scoreOrVs = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD'].includes(statusShort) ? 'VS' : `${match.homeTeam.score} - ${match.awayTeam.score}`;
        embed.addFields(
            {
                name: match.homeTeam.name,
                value: homeEventsString,
                inline: true
            },
            {
                name: scoreOrVs,
                value: '\u200B',
                inline: true
            },
            {
                name: match.awayTeam.name,
                value: awayEventsString,
                inline: true
            },
            {
                name: statusText,
                value: '\u200B',
            }
        );


    return embed;
}



