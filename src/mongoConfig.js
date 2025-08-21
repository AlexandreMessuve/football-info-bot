import { MongoClient, ServerApiVersion} from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGO_DB_URI;
if (!uri) {
    throw new Error('La variable d\'environnement MONGO_DB_URI est manquante');
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
        console.log("Connecté avec succès à MongoDB");
        return db;
    }catch (error){
        console.error("Impossible de se connecter à MongoDB",error);
        process.exit(1);
    }
}

export { db };