import type {
  MilestonePlan,
  MilestonePlanRepository,
  NewMilestonePlan,
} from "@/lib/storage/milestone-plan-repository";

export class InMemoryMilestonePlanRepository implements MilestonePlanRepository {
  readonly plans = new Map<string, MilestonePlan>();

  async create(plan: NewMilestonePlan): Promise<MilestonePlan> {
    const saved = {
      ...plan,
      id: `plan-${this.plans.size + 1}`,
      createdAt: new Date("2026-10-21T10:00:00Z"),
    };
    this.plans.set(saved.id, saved);
    return saved;
  }

  async findById(id: string): Promise<MilestonePlan | null> {
    return this.plans.get(id) ?? null;
  }
}
