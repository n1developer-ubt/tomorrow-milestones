import { ObjectId, type Collection, type WithId } from "mongodb";
import type {
  MilestonePlan,
  MilestonePlanRepository,
  NewMilestonePlan,
} from "./milestone-plan-repository";

export type MilestonePlanDocument = Omit<MilestonePlan, "id">;

export const MILESTONE_PLANS_COLLECTION = "milestone_plans";

export class MongoMilestonePlanRepository implements MilestonePlanRepository {
  constructor(
    private readonly collection: Collection<MilestonePlanDocument>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(plan: NewMilestonePlan): Promise<MilestonePlan> {
    const document: MilestonePlanDocument = { ...plan, createdAt: this.now() };
    const { insertedId } = await this.collection.insertOne(document);
    return toMilestonePlan({ ...document, _id: insertedId });
  }

  async findById(id: string): Promise<MilestonePlan | null> {
    if (!ObjectId.isValid(id)) return null;
    const document = await this.collection.findOne({ _id: new ObjectId(id) });
    return document ? toMilestonePlan(document) : null;
  }

  async listLatest(limit: number): Promise<MilestonePlan[]> {
    const documents = await this.collection
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return documents.map(toMilestonePlan);
  }
}

export function toMilestonePlan({
  _id,
  ...rest
}: WithId<MilestonePlanDocument>): MilestonePlan {
  return { id: _id.toHexString(), ...rest };
}
