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
];

export const ALL_TOPICS = TOPIC_CATEGORIES.flatMap(c => c.topics);
