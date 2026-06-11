/**
 * Rotating Planty one-liners for the dashboard welcome card.
 * Short, funny, direct. Website voice. No em dashes, no generic AI talk.
 */

export const PLANTY_MESSAGES = [
  "Stop killing your plants.",
  "Good news. Your plants still have a chance.",
  "Planty clocked in. Let's keep something alive.",
  "Your ficus filed a complaint.",
  "Water first. Panic later.",
  "Today's goal: fewer crispy leaves.",
  "Plants can't text for help. That's why we're here.",
  "Keep calm and don't overwater.",
  "The tomatoes are watching.",
  "Your garden has trust issues.",
  "Plant murder rate: hopefully zero.",
  "Let's make the neighbors jealous.",
  "Yellow leaves are a cry for help.",
  "Nice. You opened the app before the plant died.",
  "One small task for you. One giant win for your basil.",
  "Your plants are dramatic. We brought notes.",
  "Compost is not the goal.",
  "Your garden command center is online.",
  "The bougainvillea has demands.",
  "Some heroes wear capes. You checked the soil.",
  "Check the soil before you panic.",
  "Brown tips are feedback. Rude feedback.",
  "Your monstera knows when you skip a day.",
  "Roots first. Vibes second.",
  "Today is a great day to not overwater.",
  "Your succulents would like less attention, actually.",
  "Dead leaves off, confidence up.",
  "The fern is fine. Probably. Let's check.",
  "Let's keep this thing alive.",
  "Your plant isn't dead yet.",
  "Nice. New growth.",
  "Congratulations. You have not killed it.",
  "Plant drama detected.",
  "That leaf looks suspicious.",
  "Good news. It's probably fixable.",
  "You're doing better than last week.",
  "One less plant funeral.",
] as const;

const LAST_INDEX_KEY = "plantpal-planty-message-index";

/**
 * Pick the next message in rotation. Advances on every app open so the same
 * line never shows twice in a row. Falls back to a day-seeded pick when
 * localStorage is unavailable.
 */
export function getPlantyMessage(): string {
  let index = Math.floor(Date.now() / 86_400_000) % PLANTY_MESSAGES.length;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LAST_INDEX_KEY);
      if (raw !== null) {
        const last = Number(raw);
        if (!Number.isNaN(last)) index = (last + 1) % PLANTY_MESSAGES.length;
      }
      localStorage.setItem(LAST_INDEX_KEY, String(index));
    } catch {
      /* day-seeded pick still works */
    }
  }

  return PLANTY_MESSAGES[index];
}
