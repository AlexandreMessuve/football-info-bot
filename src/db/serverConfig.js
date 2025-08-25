import {db} from "./mongoConfig.js";
import 'dotenv/config';

/**
 *
 * @param guildId
 * @param channelId
 * @returns {Promise<*>}
 */
export async function setServerChannel(guildId, channelId) {

    try {
            const serverCollection = db.collection('match');
            return await serverCollection.updateOne(
                {guildId},
                {$set: {
                        guildId,
                        channelId
                    }},
                {upsert: true}
            );
    }catch(err) {
        console.error("[ERROR] setServerChannel:", err);
        throw err;
    }

}

/**
 *
 * @param guildId
 * @param leagueId
 * @param leagueName
 * @returns {Promise<*>}
 */
export async function addLeague(guildId, leagueId, leagueName) {
    const serverCollection = db.collection('match');
    return await serverCollection.updateOne(
        {guildId},
        {
            $addToSet: {
                ['leagues']:
                    {
                        id: leagueId,
                        name: leagueName,
                    }
            }
        },
        {upsert: true}
    );
}

/**
 *
 * @param guildId
 * @param leagueId
 * @returns {Promise<*>}
 */
export async function removeLeagueDb(guildId, leagueId) {
    const serverCollection = db.collection('match');
    return await serverCollection.updateOne(
        {guildId},
        {
            $pull: {
                leagues: {
                    id: leagueId
                }
            }
        },
    );
}

/**
 *
 * @param guildId
 * @param leagueId
 * @param messageId
 * @param dateRange
 * @returns {Promise<*>}
 */
export async function setMessageId(guildId, leagueId, messageId, dateRange) {
    const serverCollection = db.collection('match');
    return await serverCollection.updateOne(
        {guildId},
        {$addToSet: {[`messages.${dateRange}.${leagueId}`]: [messageId]}},
        {upsert: true}
    );
}

/**
 *
 * @param guildId
 * @param leagueId
 * @param dateRange
 * @returns {Promise<*>}
 */
export async function removeMessageId(guildId, leagueId, dateRange) {
    const serverCollection = db.collection('match');
    return await serverCollection.updateOne(
        {guildId},
        {$unset: { [`messages.${dateRange}.${leagueId}`] : "" }},
        {upsert: true}
    )
}

/**
 *
 * @returns {Promise<*>}
 */
export async function getAllServerConfig() {
    const serverCollection = db.collection('match');
    return await serverCollection.find({}).toArray();
}

export async function getServerConfig(guildId) {
    const serverCollection = db.collection('match');
    return await serverCollection.findOne({guildId}) || null;
}

