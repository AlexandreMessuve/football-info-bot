import { MongoClient, ServerApiVersion} from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGO_DB_URI;
if (!uri) {
    throw new Error('ENV variable MONGO_DB_URI must be set');
}

const client = new MongoClient(uri,{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

let db;

export async function connectDB(){
    try {
        await client.connect();
        db = client.db("footballinfo");
        console.log("[SUCCESS] MongoDB connect successfully");
        return db;
    }catch (error){
        console.error("[ERROR] MongoDB connection error:", error);
        process.exit(1);
    }
}

export { db };