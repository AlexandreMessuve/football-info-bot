import {db} from "./mongoConfig.js";
import 'dotenv/config';

/**
 *
 * @param guildId
 * @param channelId
 * @returns {Promise<*>}
 */
export async function setServerChannel(guildId, channelId){
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        { _id: guildId },
        { $set: { channelId } },
        { upsert: true }
    );
}

/**
 *
 * @param guildId
 * @param competitionId
 * @returns {Promise<*>}
 */
export async function addCompetition(guildId, competitionId){
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        { _id: guildId },
        { $addToSet: { competitionId } },
        { upsert: true }
    );
}

/**
 *
 * @param guildId
 * @param competitionId
 * @returns {Promise<*>}
 */
export async function removeCompetition(guildId, competitionId){
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        { _id: guildId },
        { $pull: { competitionId } },
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
export async function setMessageId(guildId, competitionId, messageId, dateRange){
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        { _id: guildId },
        { $set: { [`messages.${dateRange}.${competitionId}`] : messageId} },
        { upsert: true }
    );
}

/**
 *
 * @param guildId
 * @param messageId
 * @returns {Promise<*>}
 */
export async function removeMessageId(guildId, messageId){
    const serverCollection = db.collection('servers');
    return await serverCollection.updateOne(
        { _id: guildId },
        { $pull: { messageId } },
        { upsert: true }
    )
}

/**
 *
 * @returns {Promise<*>}
 */
export async function getAllServerConfig(){
    const serverCollection = db.collection('servers');
    return await serverCollection.find({}).toArray();
}

export async function getServerConfig(guildId){
    const serverCollection = db.collection('servers');
    return await serverCollection.findOne({ _id: guildId }) || null;
}

