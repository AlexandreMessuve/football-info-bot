import {db} from "./mongoConfig.js";
import 'dotenv/config';

/**
 *
 * @param guildId
 * @param channelId
 * @returns {Promise<*>}
 */
export async function setServerChannel(guildId, channelId) {
    const serverCollection = db.collection('match');
    return await serverCollection.insertOne(
        {$set: {
            discordServer: {
                guildId,
                channelId
            }

            }},
        {upsert: true}
    );
}

/**
 *
 * @param guildId
 * @param competitionId
 * @param competitionName
 * @returns {Promise<*>}
 */
export async function addCompetition(guildId, competitionId, competitionName) {
    const serverCollection = db.collection('match');
    const existingConfig = await getServerConfig(guildId);
    return await serverCollection.updateOne(
        {_id: existingConfig._id},
        {
            $addToSet: {
                [`competitions`]:
                    {
                        id: competitionId,
                        name: competitionName,
                    }
            }
        },
        {upsert: true}
    );
}

/**
 *
 * @param guildId
 * @param competitionId
 * @returns {Promise<*>}
 */
export async function removeCompetition(guildId, competitionId) {
    const serverCollection = db.collection('match');
    const existingConfig = await getServerConfig(guildId);
    return await serverCollection.updateOne(
        {_id: existingConfig._id},
        {
            $pull: {
                ['competitions']: {
                    id: competitionId
                }
            }
        },
    );
}

/**
 *
 * @param guildId
 * @param competitionId
 * @param messageId
 * @param dateRange
 * @returns {Promise<*>}
 */
export async function setMessageId(guildId, competitionId, messageId, dateRange) {
    const serverCollection = db.collection('match');
    const existingConfig = await getServerConfig(guildId);
    return await serverCollection.updateOne(
        {_id: existingConfig._id},
        {$addToSet: {[`messages.${dateRange}.${competitionId}`]: [messageId]}},
        {upsert: true}
    );
}

/**
 *
 * @param guildId
 * @param competitionId
 * @param dateRange
 * @returns {Promise<*>}
 */
export async function removeMessageId(guildId, competitionId, dateRange) {
    const serverCollection = db.collection('match');
    const existingConfig = await getServerConfig(guildId);
    return await serverCollection.updateOne(
        {_id: existingConfig._id},
        {$unset: { [`messages.${dateRange}.${competitionId}`] : "" }},
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

