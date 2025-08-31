import {
  fetchDailyMatchesByLeague,
  postWeeklyOverviews,
  updateAllScores,
} from '../tasks/scheduledTasks.js';
import * as cron from 'node-cron';
import { getMatches } from '../data/matches.ts';

/**
 * Event triggered when the bot is ready
 * @param client
 * @returns {Promise<void>}
 */
export default async (client) => {
  await client.user.setPresence({
    status: 'online',
  });
  console.log(`[SYS]! ${await client.user.username} Start success`);
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

  cron.schedule('5 0 * * *', fetchDailyMatchesByLeague, {
    timezone: 'Europe/Paris',
  });
  cron.schedule('* * * * *', () => {
    const matches = getMatches().flat();
    if (matches && matches.length === 0) {
      console.log('⏳ No match today.');
      return;
    }
    const now = Math.floor(new Date().getTime() / 1000);
    const twoHoursInSeconds = 2.35 * 60 * 60; // 2 hours
    const isAnyMatchLive = matches.some((m) => {
      const startTime = m.date;
      const endTime = m.date + twoHoursInSeconds;
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
