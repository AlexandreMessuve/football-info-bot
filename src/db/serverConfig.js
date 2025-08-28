import {db} from "./mongoConfig.js";
import 'dotenv/config';

/**
 * Sets the channel for a specific guild in the database.
 * @param guildId
 * @param channelId
 * @returns {Promise<*>}
 */
export async function setServerChannel(guildId, channelId) {

    try {
            const serverCollection = db.collection('servers');
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
 * Adds a league to the specified guild in the database.
 * @param guildId
 * @param leagueId
 * @param leagueName
 * @returns {Promise<*>}
 */
export async function addLeague(guildId, leagueId, leagueName) {
    const serverCollection = db.collection('servers');
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
 * Removes a league from the specified guild in the database.
 * @param guildId
 * @param leagueId
 * @returns {Promise<*>}
 */
export async function removeLeagueDb(guildId, leagueId) {
    const serverCollection = db.collection('servers');
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
 * Sets a message ID for a specific league and date range in the database.
 * @param guildId
 * @param leagueId
 * @param messageId
 * @param dateRange
 * @returns {Promise<*>}
 */
export async function setMessageId(guildId, leagueId, messageId, dateRange) {
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        {guildId},
        {$addToSet: {[`messages.${dateRange}.${leagueId}`]: [messageId]}},
        {upsert: true}
    );
}

/**
 * Removes a message ID for a specific league and date range in the database.
 * @param guildId
 * @param leagueId
 * @param dateRange
 * @returns {Promise<*>}
 */
export async function removeMessageId(guildId, leagueId, dateRange) {
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        {guildId},
        {$unset: { [`messages.${dateRange}.${leagueId}`] : "" }},
        {upsert: true}
    )
}

/**
 * Retrieves all server configurations from the database.
 * @returns {Promise<*>}
 */
export async function getAllServerConfig() {
    const serverCollection = db.collection('servers');
    return await serverCollection.find({}).toArray();
}

/**
 * Retrieves the server configuration for a specific guild from the database.
 * @param guildId
 * @returns {Promise<*|null>}
 */
export async function getServerConfig(guildId) {
    const serverCollection = db.collection('servers');
    return await serverCollection.findOne({guildId}) || null;
}

