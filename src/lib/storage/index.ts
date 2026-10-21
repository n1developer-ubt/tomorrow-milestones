import "server-only";
import { getDb } from "@/lib/db/mongo";
import type { MilestonePlanRepository } from "./milestone-plan-repository";
import {
  MILESTONE_PLANS_COLLECTION,
  MongoMilestonePlanRepository,
  type MilestonePlanDocument,
} from "./mongo-milestone-plan-repository";

export async function getMilestonePlanRepository(): Promise<MilestonePlanRepository> {
  const db = await getDb();
  return new MongoMilestonePlanRepository(
    db.collection<MilestonePlanDocument>(MILESTONE_PLANS_COLLECTION),
  );
}
