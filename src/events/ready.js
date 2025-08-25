import {postWeeklyOverviews, updateAllScores} from "../tasks/scheduledTasks.js";
import * as cron from "node-cron";

export default async (client) => {
    await client.user.setPresence({
        status: 'online'
    })
    console.log(`[SYS]! ${await client.user.username} Start success`);
    cron.schedule('0 8 * * 1', () => {
        console.log('🗓️ Send matches of the week...');
        postWeeklyOverviews(client);
    }, {
        timezone: "Europe/Paris"
    });
    setInterval(() => {
        const hoursNow = new Date().getHours() + 1;
        if(hoursNow >= 12 && hoursNow <= 23){
            console.log('🔄️ Verify and update matches...');
            updateAllScores(client);
        }
    }, (1000 * 60 * 5));
}