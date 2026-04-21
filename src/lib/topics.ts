export const TOPIC_CATEGORIES = [
  { group: "Core Deliverability", topics: ["Core deliverability"] },
  { group: "Email Marketing Strategy", topics: ["Strategy"] },
  { group: "Email Engagement & Metrics", topics: ["Engagement"] },
  { group: "Observational Thought Leadership", topics: ["Observational"] },
  { group: "Product & Innovation", topics: ["Product / innovation"] },
  { group: "Content & Communication", topics: ["Content / communication"] },
  { group: "Meme & Fun Content", topics: ["Meme / fun"] },
  { group: "Community & Events", topics: ["Events / community"] },
  { group: "Personal / Career", topics: ["Personal"] },
  { group: "News / Trending (ride the wave)", topics: ["News - Indian", "News - International"] },
];

export const ALL_TOPICS = TOPIC_CATEGORIES.flatMap(c => c.topics);

export const NEWS_TOPICS = ["News - Indian", "News - International"];
export function isNewsTopic(t?: string) {
  return !!t && NEWS_TOPICS.includes(t);
}
export function regionFromNewsTopic(t: string): "indian" | "international" | null {
  if (t === "News - Indian") return "indian";
  if (t === "News - International") return "international";
  return null;
}
