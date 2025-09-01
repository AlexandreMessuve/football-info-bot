import { db } from './mongoConfig.js';
import 'dotenv/config';
import type { UpdateResult, WithId, Collection } from 'mongodb';
import type { Server } from '../types/servers.js';

function getServerCollection(): Collection<Server> {
  return db.collection<Server>('servers');
}
/**
 * Sets the channel for a specific guild in the database.
 * @param guildId
 * @param channelId
 * @param language
 * @returns {Promise<UpdateResult>}
 */
export async function setServerChannel(
  guildId: string,
  channelId: string,
  language: string
): Promise<UpdateResult> {
  try {
    const serverCollection = getServerCollection();
    return await serverCollection.updateOne(
      { guildId },
      {
        $set: {
          guildId,
          channelId,
          language,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[ERROR] setServerChannel:', err);
    throw err;
  }
}

/**
 * Adds a league to the specified guild in the database.
 * @param guildId
 * @param leagueId
 * @param leagueName
 * @returns {Promise<UpdateResult>}
 */
export async function addLeague(
  guildId: string,
  leagueId: string,
  leagueName: string
): Promise<UpdateResult> {
  const serverCollection = getServerCollection();
  return await serverCollection.updateOne(
    { guildId },
    {
      $addToSet: {
        ['leagues']: {
          id: leagueId,
          name: leagueName,
        },
      },
    },
    { upsert: true }
  );
}

/**
 * Adds a league to the specified guild in the database.
 * @param guildId
 * @param leagueId
 * @param standingMessageId
 * @returns {Promise<UpdateResult>}
 */
export async function addStanding(
  guildId: string,
  leagueId: string,
  standingMessageId: string
): Promise<UpdateResult> {
  const serverCollection = getServerCollection();
  return await serverCollection.updateOne(
    { guildId },
    {
      $addToSet: {
        ['standings']: {
          id: leagueId,
          messageId: standingMessageId,
        },
      },
    },
    { upsert: true }
  );
}
/**
 * Adds a league to the specified guild in the database.
 * @param guildId
 * @param leagueId
 * @returns {Promise<UpdateResult>}
 */
export async function removeStandings(
  guildId: string,
  leagueId: string
): Promise<UpdateResult> {
  const serverCollection = getServerCollection();
  return await serverCollection.updateOne(
    { guildId },
    {
      $pull: {
        standings: {
          id: leagueId,
        },
      },
    },
    { upsert: true }
  );
}

/**
 * Removes a league from the specified guild in the database.
 * @param guildId
 * @param leagueId
 * @returns {Promise<UpdateResult>}
 */
export async function removeLeagueDb(
  guildId: string,
  leagueId: string
): Promise<UpdateResult> {
  const serverCollection = getServerCollection();
  return await serverCollection.updateOne(
    { guildId },
    {
      $pull: {
        leagues: {
          id: leagueId,
        },
      },
    }
  );
}

/**
 * Sets a message ID for a specific league and date range in the database.
 * @param guildId
 * @param leagueId
 * @param messageId
 * @param dateRange
 * @returns {Promise<UpdateResult>}
 */
export async function setMessageId(
  guildId: string,
  leagueId: string,
  messageId: string,
  dateRange: string
): Promise<UpdateResult> {
  const serverCollection = getServerCollection();
  return await serverCollection.updateOne(
    { guildId },
    { $addToSet: { [`messages.${dateRange}.${leagueId}`]: messageId } },
    { upsert: true }
  );
}

/**
 * Removes a message ID for a specific league and date range in the database.
 * @param guildId
 * @param leagueId
 * @param dateRange
 * @returns {Promise<UpdateResult>}
 */
export async function removeMessageId(
  guildId: string,
  leagueId: string,
  dateRange: string
): Promise<UpdateResult> {
  const serverCollection = getServerCollection();
  return await serverCollection.updateOne(
    { guildId },
    { $unset: { [`messages.${dateRange}.${leagueId}`]: '' } },
    { upsert: true }
  );
}

/**
 * Retrieves all server configurations from the database.
 * @returns {Promise<WithId<Server>[]>}
 */
export async function getAllServerConfig(): Promise<WithId<Server>[]> {
  const serverCollection = getServerCollection();
  return await serverCollection.find({}).toArray();
}

/**
 * Retrieves the server configuration for a specific guild from the database.
 * @param guildId
 * @returns {Promise<Server|null>}
 */
export async function getServerConfig(guildId: string): Promise<Server | null> {
  const serverCollection = getServerCollection();
  return (await serverCollection.findOne({ guildId })) || null;
}
