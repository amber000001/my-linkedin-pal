export const TOPIC_CATEGORIES = [
  // Core Deliverability
  { group: "Core Deliverability", topics: [
    "Email Deliverability",
    "Inbox Placement",
    "Reputation Monitoring",
    "Email Blocks & Bounce Codes",
    "Authentication (SPF / DKIM / DMARC)",
    "Postmaster & Ecosystem Updates",
  ]},
  // Email Marketing Strategy
  { group: "Email Marketing Strategy", topics: [
    "Segmentation Strategy",
    "Email Frequency & Fatigue",
    "Lifecycle Marketing",
    "Reactivation Campaigns",
    "Reachability & Database Health",
    "Customer Journey Design",
  ]},
  // Email Engagement & Metrics
  { group: "Email Engagement & Metrics", topics: [
    "Open Rate Myths",
    "Click Behaviour",
    "Brand Recall via Email",
    "Inbox Behaviour Insights",
  ]},
  // Observational Thought Leadership
  { group: "Observational Thought Leadership", topics: [
    "Real Inbox Observations",
    "Customer Experience Insights",
    "Audit Learnings",
    "Industry Reflections",
  ]},
  // Product & Innovation
  { group: "Product & Innovation", topics: [
    "Email Interactivity (AMP)",
    "Email Personalization",
    "AI in Email Marketing",
  ]},
  // Content & Communication
  { group: "Content & Communication", topics: [
    "Email Copywriting",
    "Email Creative Strategy",
    "Campaign Storytelling",
  ]},
  // Meme & Fun Content
  { group: "Meme & Fun Content", topics: [
    "Email Marketing Memes",
    "Deliverability Humor",
    "Friday Fun Posts",
  ]},
  // Community & Events
  { group: "Community & Events", topics: [
    "Webinar Promotion",
    "Industry Events",
    "Speaker Announcements",
  ]},
  // Personal / Career
  { group: "Personal / Career", topics: [
    "Career Updates",
    "Milestones",
    "Community Appreciation",
  ]},
];

export const ALL_TOPICS = TOPIC_CATEGORIES.flatMap(c => c.topics);
