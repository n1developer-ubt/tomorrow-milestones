import { ObjectId, type Collection } from "mongodb";
import { describe, expect, it, vi } from "vitest";
import { newMilestonePlanFactory } from "@/test/factories";
import {
  MongoMilestonePlanRepository,
  type MilestonePlanDocument,
} from "./mongo-milestone-plan-repository";

const createdAt = new Date("2026-10-21T10:00:00Z");

function setup() {
  const insertedId = new ObjectId();
  const insertOne = vi.fn().mockResolvedValue({ insertedId });
  const findOne = vi.fn();
  const toArray = vi.fn().mockResolvedValue([]);
  const cursor = { sort: vi.fn(), limit: vi.fn(), toArray };
  cursor.sort.mockReturnValue(cursor);
  cursor.limit.mockReturnValue(cursor);
  const collection = {
    insertOne,
    findOne,
    find: vi.fn().mockReturnValue(cursor),
  } as unknown as Collection<MilestonePlanDocument>;
  const repository = new MongoMilestonePlanRepository(
    collection,
    () => createdAt,
  );
  return { repository, insertOne, findOne, insertedId, cursor };
}

describe("MongoMilestonePlanRepository", () => {
  it("creates a plan with a timestamp and returns it with a string id", async () => {
    const { repository, insertOne, insertedId } = setup();
    const plan = newMilestonePlanFactory.build();

    const saved = await repository.create(plan);

    expect(insertOne).toHaveBeenCalledWith({ ...plan, createdAt });
    expect(saved).toEqual({ ...plan, createdAt, id: insertedId.toHexString() });
  });

  it("finds a plan by id", async () => {
    const { repository, findOne } = setup();
    const _id = new ObjectId();
    const plan = newMilestonePlanFactory.build();
    findOne.mockResolvedValue({ ...plan, createdAt, _id });

    const found = await repository.findById(_id.toHexString());

    expect(findOne).toHaveBeenCalledWith({ _id });
    expect(found).toEqual({ ...plan, createdAt, id: _id.toHexString() });
  });

  it("returns null when the plan does not exist", async () => {
    const { repository, findOne } = setup();
    findOne.mockResolvedValue(null);

    await expect(
      repository.findById(new ObjectId().toHexString()),
    ).resolves.toBeNull();
  });

  it("returns null for an invalid id without querying", async () => {
    const { repository, findOne } = setup();

    await expect(repository.findById("not-an-id")).resolves.toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });

  it("lists the latest plans newest first with a limit", async () => {
    const { repository, cursor } = setup();
    const _id = new ObjectId();
    const plan = newMilestonePlanFactory.build();
    cursor.toArray.mockResolvedValue([{ ...plan, createdAt, _id }]);

    const plans = await repository.listLatest(5);

    expect(cursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(cursor.limit).toHaveBeenCalledWith(5);
    expect(plans).toEqual([{ ...plan, createdAt, id: _id.toHexString() }]);
  });
});
