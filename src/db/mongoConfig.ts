import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config';

const uri: string | undefined = process.env.MONGO_DB_URI;
if (!uri) {
  throw new Error('ENV variable MONGO_DB_URI must be set');
}

const client: MongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;

/**
 * Connect to MongoDB and return the database instance.
 */
export async function connectDB() {
  try {
    await client.connect();
    db = client.db('footballinfo');
    console.log('[SUCCESS] MongoDB connect successfully');
  } catch (error) {
    console.error('[ERROR] MongoDB connection error:', error);
    process.exit(1);
  }
}

export { db };
