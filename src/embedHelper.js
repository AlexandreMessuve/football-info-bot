/**
 *
 * @param embed
 * @param match
 */
export function createMatchField(embed, match) {
    const timeStampDateMatch = match.date;
    const matchTime = `<t:${timeStampDateMatch}:F> (<t:${timeStampDateMatch}:R>)`;
    const formatedMatch = formatMatchForUI(match);
    const homeEventsString = formatedMatch.homeTeam.events
        .map(event => `${event.type} ${event.player} ${event.minute}'`)
        .join('\n') || '\u200B'; // '\u200B' est un espace vide pour éviter un champ vide

    const awayEventsString = formatedMatch.awayTeam.events
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

    const scoreOrVs = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD'].includes(statusShort) ? 'VS' : `${formatedMatch.homeTeam.score} - ${formatedMatch.awayTeam.score}`;
        embed.addFields(
            {
                name: formatedMatch.homeTeam.name,
                value: homeEventsString,
                inline: true
            },
            {
                name: scoreOrVs,
                value: '\u200B',
                inline: true
            },
            {
                name: formatedMatch.awayTeam.name,
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

function formatMatchForUI(match) {
    const formattedMatch = {
        league: match.league.name,
        status: match.status.long,
        homeTeam: {
            name: match.teams.home.name,
            score: match.goals.home ?? 0,
            events: []
        },
        awayTeam: {
            name: match.teams.away.name,
            score: match.goals.away ?? 0,
            events: []
        }
    };

    console.log(formattedMatch);
    if (match.events && match.events.length > 0) {
        match.events.forEach(event => {
            const simpleEvent = {
                minute: event.time.elapsed + '"',
                player: event.player.name,
                type: event.type === 'Card' ? (event.detail === 'Yellow Card' ? '🟨 ' : '🟥 ') : `⚽ ${event.detail === 'Penalty' ? '(pen)' : ''}`,
                detail: event.detail
            };

            if (event.team.id === match.teams.home.id) {
                formattedMatch.homeTeam.events.push(simpleEvent);
            } else if (event.team.id === match.teams.away.id) {
                formattedMatch.awayTeam.events.push(simpleEvent);
            }
        });
    }

    return formattedMatch;
}



