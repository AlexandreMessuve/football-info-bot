import i18next from "i18next";

/**
 * Create a match field for a Discord embed.
 * @param embed
 * @param match
 */
export function createMatchField(embed, match) {
  const timeStampDateMatch = match.date;
  const matchTime = `<t:${timeStampDateMatch}:F> (<t:${timeStampDateMatch}:R>)`;
  const homeEventsString =
    match.homeTeam.events
      .map((event) => `${event.type} ${event.player} ${event.minute}'`)
      .join('\n\n') || ''; // '\u200B' est un espace vide pour éviter un champ vide

  const awayEventsString =
    match.awayTeam.events
      .map((event) => `${event.type} ${event.player} ${event.minute}'`)
      .join('\n\n') || '';

  const kickOff = i18next.t('kickOff');
  const finished = i18next.t('finished');
  const live = i18next.t('live');
  const halfTime = i18next.t('halfTime');
  let statusText;
  const statusShort = match.status.short;
  if (['1H', '2H', 'ET'].includes(statusShort)) {
    statusText = `🔴 **${live}** | ${match.status.elapsed}"`;
  } else if (['HT'].includes(statusShort)) {
    statusText = `⏸️ **${halfTime}**`;
  } else if (['FT', 'AET', 'PEN'].includes(statusShort)) {
    statusText = `🏁 **${finished}** ${matchTime}`;
  } else {
    statusText = `▶️ **${kickOff}**: ${matchTime}`;
  }

  const scoreOrVs = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD'].includes(
    statusShort
  )
    ? 'VS'
    : `${match.homeTeam.score} - ${match.awayTeam.score}`;
  let penalty = '';
  let homePenaltyScore = '\n\n';
  let awayPenaltyScore = '\n\n';
  const isDraw = !match.homeTeam.winner && !match.awayTeam.winner;
  const homeWin = match.homeTeam.winner ? ' ✅ ' : isDraw ? '' : ' ❌ ';
  const awayWin = match.awayTeam.winner ? ' ✅ ' : isDraw ? '' : ' ❌ ';

  if (match.status.short === 'PEN') {
    penalty = `\n\nPEN\n ${match.homeTeam.penalty} - ${match.awayTeam.penalty}`;
    homePenaltyScore =
      '\n\n' + ':soccer:'.repeat(match.homeTeam.penalty) + '\n\n';
    awayPenaltyScore =
      '\n\n' + ':soccer:'.repeat(match.awayTeam.penalty) + '\n\n';
  }
  embed.addFields(
    {
      name: '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯',
      value: statusText,
    },
    {
      name: '\n',
      value: `${match.homeTeam.name}${homeWin}${homePenaltyScore}${homeEventsString}`,
      inline: true,
    },
    {
      name: '\n',
      value: `**${scoreOrVs}** ${penalty}`,
      inline: true,
    },
    {
      name: '\n',
      value: `${match.awayTeam.name}${awayWin}${awayPenaltyScore}${awayEventsString}`,
      inline: true,
    }
  );

  return embed;
}