import { ObjectId, type Collection, type WithId } from "mongodb";
import type {
  MilestonePlan,
  MilestonePlanRepository,
  NewMilestonePlan,
} from "./repository";

export type MilestonePlanDocument = Omit<MilestonePlan, "id">;

export const MILESTONE_PLANS_COLLECTION = "milestone_plans";

export class MongoMilestonePlanRepository implements MilestonePlanRepository {
  constructor(
    private readonly collection: Collection<MilestonePlanDocument>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(plan: NewMilestonePlan): Promise<MilestonePlan> {
    const timestamp = this.now();
    const document: MilestonePlanDocument = {
      ...plan,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
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

  async update({ id, ...plan }: MilestonePlan): Promise<MilestonePlan> {
    const document: MilestonePlanDocument = { ...plan, updatedAt: this.now() };
    await this.collection.replaceOne({ _id: new ObjectId(id) }, document);
    return { ...document, id };
  }

  async delete(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}

export function toMilestonePlan({
  _id,
  ...rest
}: WithId<MilestonePlanDocument>): MilestonePlan {
  return { id: _id.toHexString(), ...rest };
}
