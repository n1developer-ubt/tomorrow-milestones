import type { MilestoneChange } from "@/lib/milestones/diff";
import type { DraftMilestone, Milestone } from "@/lib/validation/milestone";
import {
  addTokenUsage,
  EMPTY_TOKEN_USAGE,
  type TokenUsage,
} from "@/lib/validation/token-usage";

export type CardStatus = "pending" | "accepted" | "rejected";

export type CardChange = "added" | "modified";

export type ReviewCard = {
  milestone: DraftMilestone;
  status: CardStatus;
  edited: boolean;
  change?: CardChange;
  previous?: DraftMilestone;
};

export type ReviewState = {
  cards: ReviewCard[];
  removed: DraftMilestone[];
  usage: TokenUsage;
};

export type ReviewAction =
  | { type: "generated"; milestones: DraftMilestone[]; usage: TokenUsage }
  | {
      type: "refinedSet";
      milestones: DraftMilestone[];
      changes: MilestoneChange[];
      usage: TokenUsage;
    }
  | { type: "refinedItem"; milestone: DraftMilestone; usage: TokenUsage }
  | { type: "setStatus"; id: string; status: CardStatus }
  | { type: "edit"; id: string; text: Milestone }
  | { type: "revert"; id: string }
  | { type: "restoreRemoved"; id: string }
  | { type: "acceptAll" };

export const INITIAL_REVIEW_STATE: ReviewState = {
  cards: [],
  removed: [],
  usage: EMPTY_TOKEN_USAGE,
};

export function reviewReducer(
  state: ReviewState,
  action: ReviewAction,
): ReviewState {
  switch (action.type) {
    case "generated":
      return {
        cards: action.milestones.map(newCard),
        removed: [],
        usage: addTokenUsage(state.usage, action.usage),
      };
    case "refinedSet":
      return applyRefinedSet(state, action);
    case "refinedItem":
      return {
        ...state,
        usage: addTokenUsage(state.usage, action.usage),
        cards: updateCard(state.cards, action.milestone.id, (card) =>
          textEquals(card.milestone, action.milestone)
            ? card
            : {
                ...card,
                milestone: action.milestone,
                status: "pending",
                change: "modified",
                previous: card.milestone,
              },
        ),
      };
    case "setStatus":
      return {
        ...state,
        cards: updateCard(state.cards, action.id, (card) => ({
          ...card,
          status: action.status,
          milestone: {
            ...card.milestone,
            locked: action.status === "accepted",
          },
        })),
      };
    case "acceptAll":
      return {
        ...state,
        cards: state.cards.map((card) =>
          card.status === "pending"
            ? {
                ...card,
                status: "accepted",
                milestone: { ...card.milestone, locked: true },
              }
            : card,
        ),
      };
    case "edit":
      return {
        ...state,
        cards: updateCard(state.cards, action.id, (card) =>
          textEquals(card.milestone, action.text)
            ? card
            : {
                ...card,
                milestone: { ...card.milestone, ...action.text },
                edited: true,
              },
        ),
      };
    case "revert":
      return {
        ...state,
        cards: updateCard(state.cards, action.id, (card) =>
          card.previous
            ? {
                milestone: card.previous,
                status: card.previous.locked ? "accepted" : "pending",
                edited: false,
              }
            : card,
        ),
      };
    case "restoreRemoved": {
      const restored = state.removed.find((m) => m.id === action.id);
      if (!restored) return state;
      return {
        ...state,
        removed: state.removed.filter((m) => m.id !== action.id),
        cards: [...state.cards, newCard(restored)],
      };
    }
  }
}

export function draftMilestones(state: ReviewState): DraftMilestone[] {
  return state.cards
    .filter((card) => card.status !== "rejected")
    .map((card) => card.milestone);
}

function applyRefinedSet(
  state: ReviewState,
  action: Extract<ReviewAction, { type: "refinedSet" }>,
): ReviewState {
  const cardsById = new Map(
    state.cards.map((card) => [card.milestone.id, card]),
  );
  const changesById = new Map(action.changes.map((c) => [c.id, c]));

  const cards = action.milestones.map((milestone): ReviewCard => {
    const existing = cardsById.get(milestone.id);
    const change = changesById.get(milestone.id);
    if (!existing) return { ...newCard(milestone), change: "added" };
    if (change?.kind !== "modified") return existing;
    return {
      milestone,
      status: "pending",
      edited: false,
      change: "modified",
      previous: existing.milestone,
    };
  });

  const removed = action.changes.flatMap((change) =>
    change.kind === "removed" ? [change.before] : [],
  );
  const rejected = state.cards.filter(
    (card) =>
      card.status === "rejected" &&
      !action.milestones.some((m) => m.id === card.milestone.id),
  );

  return {
    cards: [...cards, ...rejected],
    removed: [...state.removed, ...removed],
    usage: addTokenUsage(state.usage, action.usage),
  };
}

function newCard(milestone: DraftMilestone): ReviewCard {
  return { milestone, status: "pending", edited: false };
}

function updateCard(
  cards: ReviewCard[],
  id: string,
  update: (card: ReviewCard) => ReviewCard,
): ReviewCard[] {
  return cards.map((card) => (card.milestone.id === id ? update(card) : card));
}

function textEquals(a: Milestone, b: Milestone): boolean {
  return a.title === b.title && a.description === b.description;
}
