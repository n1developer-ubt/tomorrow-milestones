import type {
  MilestonePlan,
  MilestonePlanRepository,
  NewMilestonePlan,
} from "@/lib/storage/milestone-plan-repository";

export class InMemoryMilestonePlanRepository implements MilestonePlanRepository {
  readonly plans = new Map<string, MilestonePlan>();

  async create(plan: NewMilestonePlan): Promise<MilestonePlan> {
    const count = this.plans.size + 1;
    const timestamp = new Date(Date.UTC(2026, 9, 21, 10, count));
    const saved = {
      ...structuredClone(plan),
      id: `plan-${count}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.plans.set(saved.id, saved);
    return structuredClone(saved);
  }

  async findById(id: string): Promise<MilestonePlan | null> {
    const plan = this.plans.get(id);
    return plan ? structuredClone(plan) : null;
  }

  async listLatest(limit: number): Promise<MilestonePlan[]> {
    return [...this.plans.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((plan) => structuredClone(plan));
  }

  async update(plan: MilestonePlan): Promise<MilestonePlan> {
    const updated = { ...structuredClone(plan), updatedAt: new Date() };
    this.plans.set(plan.id, updated);
    return structuredClone(updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.plans.delete(id);
  }
}
