import {
  fetchDailyMatchesByLeague,
  postWeeklyOverviews,
  updateAllScores,
} from '../tasks/scheduledTasks.js';
import * as cron from 'node-cron';
import { getMatches } from '../data/matches.js';
import type { Client } from 'discord.js';
import type { Match } from '../types/match.js';

/**
 * Event triggered when the bot is ready
 * @param client
 * @returns {Promise<void>}
 */
export default async (client: Client): Promise<void> => {
  if (!client.user || !client.application) {
    console.error('[SYS]! Client user or application is not defined.');
    return;
  }
  client.user.setPresence({
    status: 'online',
  });
  console.log(`[SYS]! ${client.user.username} Start success`);
  cron.schedule(
    '0 8 * * 1',
    () => {
      console.log('🗓️ Send matches of the week...');
      postWeeklyOverviews(client);
    },
    {
      timezone: 'Europe/Paris',
    }
  );
  await fetchDailyMatchesByLeague();

  cron.schedule('0 8 * * *', fetchDailyMatchesByLeague, {
    timezone: 'Europe/Paris',
  });
  cron.schedule('* * * * *', () => {
    const matches: Match[] = getMatches().flat();
    if (matches && matches.length === 0) {
      console.log('⏳ No match today.');
      return;
    }
    const now: number = Math.floor(new Date().getTime() / 1000);
    const twoHoursInSeconds: number = 2.35 * 60 * 60; // 2 hours
    const isAnyMatchLive: boolean = matches.some((m: Match): boolean => {
      const startTime: number = m.date;
      const endTime: number = m.date + twoHoursInSeconds;
      return now >= startTime && now <= endTime;
    });
    if (isAnyMatchLive) {
      console.log('🔄️ Verify and update matches...');
      updateAllScores(client);
    } else {
      console.log('⏳ No live matches at the moment.');
    }
  });
};
