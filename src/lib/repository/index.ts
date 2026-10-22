import "server-only";
import { MongoClient, type Db } from "mongodb";
import { getEnv } from "@/lib/env";
import {
  MILESTONE_PLANS_COLLECTION,
  MongoMilestonePlanRepository,
  type MilestonePlanDocument,
} from "./mongo";
import type { MilestonePlanRepository } from "./repository";

type MongoGlobal = { mongoClientPromise?: Promise<MongoClient> };

const globalForMongo = globalThis as unknown as MongoGlobal;

function getClient(): Promise<MongoClient> {
  globalForMongo.mongoClientPromise ??= new MongoClient(
    getEnv().MONGODB_URI,
  ).connect();
  return globalForMongo.mongoClientPromise;
}

async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getEnv().MONGODB_DB);
}

export async function getMilestonePlanRepository(): Promise<MilestonePlanRepository> {
  const db = await getDb();
  return new MongoMilestonePlanRepository(
    db.collection<MilestonePlanDocument>(MILESTONE_PLANS_COLLECTION),
  );
}
