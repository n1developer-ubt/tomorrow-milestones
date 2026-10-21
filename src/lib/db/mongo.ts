import "server-only";
import { MongoClient, type Db } from "mongodb";
import { getEnv } from "@/lib/env";

type MongoGlobal = { mongoClientPromise?: Promise<MongoClient> };

const globalForMongo = globalThis as unknown as MongoGlobal;

function getClient(): Promise<MongoClient> {
  globalForMongo.mongoClientPromise ??= new MongoClient(
    getEnv().MONGODB_URI,
  ).connect();
  return globalForMongo.mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getEnv().MONGODB_DB);
}
