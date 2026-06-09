export type GrowType =
  | "houseplants"
  | "fruit_trees"
  | "bonsai"
  | "garden"
  | "yard_landscape"
  | "vegetables_herbs";

export type BiggestProblem =
  | "forget_watering"
  | "yellow_leaves"
  | "pests"
  | "not_enough_flowers"
  | "not_enough_fruit"
  | "dont_know_what_to_buy"
  | "other";

export interface WaitlistSignup {
  id: string;
  name: string;
  email: string;
  zip_code: string;
  grow_types: GrowType[];
  biggest_problem: BiggestProblem;
  source: string;
  created_at: string;
}

export interface WaitlistSubmitInput {
  name: string;
  email: string;
  zip_code: string;
  grow_types: GrowType[];
  biggest_problem: BiggestProblem;
  source?: string;
}

export const GROW_TYPE_OPTIONS: { value: GrowType; label: string }[] = [
  { value: "houseplants", label: "Houseplants" },
  { value: "fruit_trees", label: "Fruit trees" },
  { value: "bonsai", label: "Bonsai" },
  { value: "garden", label: "Garden" },
  { value: "yard_landscape", label: "Yard / landscape" },
  { value: "vegetables_herbs", label: "Vegetables / herbs" },
];

export const PROBLEM_OPTIONS: { value: BiggestProblem; label: string }[] = [
  { value: "forget_watering", label: "Forget watering" },
  { value: "yellow_leaves", label: "Yellow leaves" },
  { value: "pests", label: "Pests" },
  { value: "not_enough_flowers", label: "Not enough flowers" },
  { value: "not_enough_fruit", label: "Not enough fruit" },
  { value: "dont_know_what_to_buy", label: "Do not know what to buy" },
  { value: "other", label: "Other" },
];

const STORAGE_KEY = "plantpal-waitlist-signups";

export function saveWaitlistLocal(entry: WaitlistSignup): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadWaitlistLocal();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing]));
  } catch {
    /* ignore */
  }
}

export function loadWaitlistLocal(): WaitlistSignup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WaitlistSignup[]) : [];
  } catch {
    return [];
  }
}

export async function submitWaitlist(
  input: WaitlistSubmitInput
): Promise<{ ok: boolean; storage: "supabase" | "local"; error?: string }> {
  const payload = {
    ...input,
    source: input.source ?? "website",
  };

  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as {
      ok: boolean;
      storage?: "supabase" | "local";
      error?: string;
    };

    if (json.ok && json.storage === "supabase") {
      return { ok: true, storage: "supabase" };
    }
  } catch {
    /* fall through to local */
  }

  const entry: WaitlistSignup = {
    id: crypto.randomUUID(),
    ...payload,
    created_at: new Date().toISOString(),
  };
  saveWaitlistLocal(entry);
  return { ok: true, storage: "local" };
}
