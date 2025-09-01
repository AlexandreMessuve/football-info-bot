import i18next from 'i18next';
import type { EmbedBuilder } from 'discord.js';
import type { Match, Event } from '../types/match.js';

/**
 * Create a match field for a Discord embed.
 * @param embed
 * @param match
 */
export function createMatchField(
  embed: EmbedBuilder,
  match: Match
): EmbedBuilder {
  const timeStampDateMatch: number = match.date;
  const matchTime: string = `<t:${timeStampDateMatch}:F> (<t:${timeStampDateMatch}:R>)`;
  const homeEventsString: string =
    match.homeTeam.events
      .map((event: Event) => `${event.type} ${event.player} ${event.minute}'`)
      .join('\n\n') || '';

  const awayEventsString: string =
    match.awayTeam.events
      .map((event: Event) => `${event.type} ${event.player} ${event.minute}'`)
      .join('\n\n') || '';

  const kickOff: string = i18next.t('kickOff');
  const finished: string = i18next.t('finished');
  const live: string = i18next.t('live');
  const halfTime: string = i18next.t('halfTime');
  let statusText: string;
  const statusShort: string = match.status.short;
  if (['1H', '2H', 'ET'].includes(statusShort)) {
    statusText = `🔴 **${live}** | ${match.status.elapsed}"`;
  } else if (['HT'].includes(statusShort)) {
    statusText = `⏸️ **${halfTime}**`;
  } else if (['FT', 'AET', 'PEN'].includes(statusShort)) {
    statusText = `🏁 **${finished}** ${matchTime}`;
  } else {
    statusText = `▶️ **${kickOff}**: ${matchTime}`;
  }

  const scoreOrVs: string = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD'].includes(
    statusShort
  )
    ? 'VS'
    : `${match.homeTeam.score} - ${match.awayTeam.score}`;
  let penalty: string = '';
  let homePenaltyScore: string = '\n\n';
  let awayPenaltyScore: string = '\n\n';
  const isDraw: boolean = !match.homeTeam.winner && !match.awayTeam.winner;
  const homeWin: string = match.homeTeam.winner ? ' ✅ ' : isDraw ? '' : ' ❌ ';
  const awayWin: string = match.awayTeam.winner ? ' ✅ ' : isDraw ? '' : ' ❌ ';

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
