import type {
  MilestonePlan,
  MilestonePlanRepository,
  NewMilestonePlan,
} from "@/lib/storage/milestone-plan-repository";

export class InMemoryMilestonePlanRepository implements MilestonePlanRepository {
  readonly plans = new Map<string, MilestonePlan>();

  async create(plan: NewMilestonePlan): Promise<MilestonePlan> {
    const count = this.plans.size + 1;
    const saved = {
      ...plan,
      id: `plan-${count}`,
      createdAt: new Date(Date.UTC(2026, 9, 21, 10, count)),
    };
    this.plans.set(saved.id, saved);
    return saved;
  }

  async findById(id: string): Promise<MilestonePlan | null> {
    return this.plans.get(id) ?? null;
  }

  async listLatest(limit: number): Promise<MilestonePlan[]> {
    return [...this.plans.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
