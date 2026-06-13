/**
 * Turn F5Bot / mention trend counts into blog and marketing content angles.
 * PlantPal voice. No "AI" in output copy.
 */

export interface TopicTrend {
  topic: string;
  count: number;
}

export interface ContentIdea {
  title: string;
  contentAngle: string;
  topic: string;
}

const TOPIC_IDEAS: Record<string, { title: string; angle: string }> = {
  "yellow leaves": {
    title: "Why your plant is turning yellow and judging you quietly",
    angle:
      "Explain the top five reasons leaves turn yellow and what to do next. Overwatering first, because the internet always overwatering.",
  },
  watering: {
    title: "Your plant is not thirsty. You are just nervous.",
    angle: "How to tell when to water, when to wait, and how to stop drowning your pots.",
  },
  pests: {
    title: "Something is living on your plant rent-free",
    angle: "Identify common pests, what damage looks like, and the first three things to try before panic.",
  },
  fungus: {
    title: "That spot on the leaf is not 'character'",
    angle: "Powdery mildew, leaf spot, and when humidity becomes the villain.",
  },
  "root rot": {
    title: "Root rot: the plant crime scene in a pot",
    angle: "Signs, rescue steps, and how to avoid repeating the same watering mistake.",
  },
  fertilizer: {
    title: "Feed your plants without turning the soil into a chemistry lab",
    angle: "When to fertilize, when to stop, and why more is not more.",
  },
  pruning: {
    title: "Prune like you mean it (but not like you're mad at it)",
    angle: "Basic pruning rules for houseplants, herbs, and backyard trees.",
  },
  "heat stress": {
    title: "Your plant did not sign up for this heat wave",
    angle: "Shade, water timing, and recovery after a brutal week.",
  },
  frost: {
    title: "Frost is coming. Your citrus is not amused.",
    angle: "Cover, move, and protect plants before the temperature drops.",
  },
  houseplants: {
    title: "Houseplants are dramatic indoors too",
    angle: "Light, humidity, and the most common beginner mistakes in living rooms.",
  },
  "fruit trees": {
    title: "Backyard fruit trees: less mystery, more fruit",
    angle: "Watering, feeding, and the seasonal rhythm citrus and stone fruit need.",
  },
  vegetables: {
    title: "Vegetable garden survival guide for real humans",
    angle: "Tomatoes, basil, and the gap between Pinterest gardens and yours.",
  },
};

function defaultIdea(topic: string, count: number): ContentIdea {
  const label = topic === "unknown" ? "plant care" : topic;
  return {
    topic,
    title: `What gardeners are asking about ${label} right now`,
    contentAngle: `${count} recent mentions flagged ${label}. Answer the questions people are actually asking this week.`,
  };
}

/** Build content ideas from ranked topic counts (e.g. from F5Bot ingest). */
export function contentIdeasFromTopics(trends: TopicTrend[], limit = 5): ContentIdea[] {
  const sorted = [...trends].sort((a, b) => b.count - a.count).slice(0, limit);
  return sorted.map(({ topic, count }) => {
    const preset = TOPIC_IDEAS[topic.toLowerCase()];
    if (preset) {
      return { topic, title: preset.title, contentAngle: preset.angle };
    }
    return defaultIdea(topic, count);
  });
}

/** PlantPal-voice one-liner for a trending topic count. */
export function trendPulseLine(topic: string, count: number): string {
  const key = topic.toLowerCase();
  if (key === "yellow leaves") return "Plants are complaining about yellow leaves again.";
  if (key === "watering" || key === "overwatering")
    return "The internet is currently overwatering things.";
  if (key === "pests") return "Bugs are trending. Your plants did not vote for this.";
  if (key === "basil") return "Basil is having a rough week.";
  if (key === "monstera") return "Monsteras are in the group chat again.";
  if (count >= 10) return `${topic} is getting a lot of side-eye online lately.`;
  if (count >= 3) return `${topic} keeps showing up in plant drama threads.`;
  return `${topic} popped up in recent garden chatter.`;
}
