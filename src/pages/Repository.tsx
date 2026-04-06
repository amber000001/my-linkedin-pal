import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TOPIC_CATEGORIES, ALL_TOPICS } from "@/lib/topics";
import { SparkleParticles } from "@/components/SparkleParticles";
import {
  Search,
  ArrowLeft,
  Upload,
  Trash2,
  Copy,
  RotateCcw,
  Check,
  Loader2,
  BookOpen,
  Plus,
  ChevronRight,
  Eye,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Heart,
  Image,
  Calendar,
  Smile,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const POST_TYPES = [
  { value: "thought_leadership", label: "Thought Leadership" },
  { value: "observational", label: "Observational" },
  { value: "meme", label: "Meme" },
  { value: "personal", label: "Personal" },
];

interface PostStructure {
  hook?: string;
  observation?: string;
  explanation?: string;
  implications?: string;
  learnings?: string[];
  closing?: string;
  hashtags?: string[];
}

interface LinkedInPost {
  id: string;
  topic: string;
  post_text: string;
  post_type: string;
  has_meme: boolean;
  uses_emojis: boolean;
  date_posted: string | null;
  created_at: string;
  impressions: number;
  reactions: number;
  comments: number;
  reaction_rate: number;
  comment_rate: number;
  structure: PostStructure | null;
}

export default function Repository() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<LinkedInPost | null>(null);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  // Upload form state
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("thought_leadership");
  const [postText, setPostText] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [impressions, setImpressions] = useState("");
  const [reactions, setReactions] = useState("");
  const [commentsInput, setCommentsInput] = useState("");
  const [hasMeme, setHasMeme] = useState(false);
  const [usesEmojis, setUsesEmojis] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Structure fields
  const [hook, setHook] = useState("");
  const [observation, setObservation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [implications, setImplications] = useState("");
  const [learnings, setLearnings] = useState("");
  const [closing, setClosing] = useState("");
  const [hashtags, setHashtags] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("linkedin_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load repository");
    } else {
      setPosts((data || []) as unknown as LinkedInPost[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const searchable = [p.post_text, p.topic].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [posts, search]);

  const groupedByTopic = useMemo(() => {
    const groups: Record<string, LinkedInPost[]> = {};
    filtered.forEach((p) => {
      if (!groups[p.topic]) groups[p.topic] = [];
      groups[p.topic].push(p);
    });
    const orderedTopics = ALL_TOPICS.filter((t) => groups[t]);
    Object.keys(groups).forEach((t) => {
      if (!orderedTopics.includes(t)) orderedTopics.push(t);
    });
    return orderedTopics.map((t) => ({ topic: t, posts: groups[t] }));
  }, [filtered]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      counts[p.topic] = (counts[p.topic] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const resetForm = () => {
    setTopic("");
    setPostType("thought_leadership");
    setPostText("");
    setDatePosted("");
    setImpressions("");
    setReactions("");
    setCommentsInput("");
    setHasMeme(false);
    setUsesEmojis(true);
    setHook("");
    setObservation("");
    setExplanation("");
    setImplications("");
    setLearnings("");
    setClosing("");
    setHashtags("");
  };

  const handleUpload = async () => {
    if (!topic || !postText.trim() || !datePosted) {
      toast.error("Topic, post text, and date posted are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const imp = parseInt(impressions) || 0;
      const react = parseInt(reactions) || 0;
      const comm = parseInt(commentsInput) || 0;

      // Only build structure if at least one field is provided
      const hasAnyStructure = [hook, observation, explanation, implications, learnings, closing, hashtags].some(f => f.trim());
      
      let structure: Partial<PostStructure> | null = null;
      if (hasAnyStructure) {
        structure = {};
        if (hook.trim()) structure.hook = hook.trim();
        if (observation.trim()) structure.observation = observation.trim();
        if (explanation.trim()) structure.explanation = explanation.trim();
        if (implications.trim()) structure.implications = implications.trim();
        if (learnings.trim()) structure.learnings = learnings.split("\n").map((l) => l.trim()).filter(Boolean);
        if (closing.trim()) structure.closing = closing.trim();
        if (hashtags.trim()) structure.hashtags = hashtags.split(",").map((h) => h.trim()).filter(Boolean);
      }

      const { data, error } = await supabase.functions.invoke("save-linkedin-post", {
        body: {
          topic,
          post_type: postType,
          post_text: postText,
          date_posted: datePosted,
          impressions: imp,
          reactions: react,
          comments: comm,
          has_meme: hasMeme,
          uses_emojis: usesEmojis,
          structure,
        },
      });

      if (error) {
        let message = error.message || "Failed to upload post.";
        const errorWithContext = error as typeof error & {
          context?: { json?: () => Promise<{ error?: string }> };
        };

        if (errorWithContext.context?.json) {
          try {
            const details = await errorWithContext.context.json();
            if (details?.error) message = details.error;
          } catch {
            // fall back to the function error message
          }
        }

        throw new Error(message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Post uploaded to intelligence repository ✨");
      resetForm();
      setShowForm(false);
      fetchPosts();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to upload post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePost = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { error } = await supabase.from("linkedin_posts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (viewingPost?.id === id) setViewingPost(null);
      toast.success("Removed from repository");
    }
  };

  const copyPost = (post: LinkedInPost, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(post.post_text);
    setCopiedId(post.id);
    toast.success("Copied ✨");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPreview = (text: string) => {
    const firstLine = text.split("\n").find((l) => l.trim());
    if (!firstLine) return "No content";
    return firstLine.length > 120 ? firstLine.slice(0, 120) + "..." : firstLine;
  };

  const toggleTopic = (topic: string) => {
    setOpenTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toString();
  };

  const getPostTypeLabel = (val: string) => POST_TYPES.find((t) => t.value === val)?.label || val;

  const MetricsBadges = ({ post }: { post: LinkedInPost }) => {
    if (!post.impressions && !post.reactions && !post.comments) return null;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {post.impressions > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {formatNumber(post.impressions)}
          </span>
        )}
        {post.reactions > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3 w-3" />
            {formatNumber(post.reactions)}
          </span>
        )}
        {post.comments > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {formatNumber(post.comments)}
          </span>
        )}
        {post.has_meme && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border-border/40">
            <Image className="h-2.5 w-2.5 mr-0.5" />
            Meme
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SparkleParticles />
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-[10%] w-80 h-80 rounded-full blur-3xl animate-float"
          style={{ background: "radial-gradient(circle, hsl(320 100% 80% / 0.35) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-32 right-[15%] w-64 h-64 rounded-full blur-3xl animate-float"
          style={{ background: "radial-gradient(circle, hsl(180 100% 75% / 0.35) 0%, transparent 70%)", animationDelay: "1s" }}
        />
      </div>

      <header className="relative border-b border-border/30 px-6 py-5 glass-static">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center glow-rainbow animate-float shadow-lg">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gradient">Intelligence Repository</h1>
              <p className="text-xs text-muted-foreground font-body">
                {posts.length} posts training your voice
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="glass border-border/40 rounded-xl hover:glow-magic"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Post
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Upload Form */}
        {showForm && (
          <div className="glass-static rounded-2xl p-6 sparkle-border space-y-5">
            <h2 className="font-display text-lg font-semibold text-gradient">📚 Upload LinkedIn Post</h2>

            {/* Row 1: Topic + Post Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">📂 Topic</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="glass border-border/40 text-foreground h-11 rounded-xl">
                    <SelectValue placeholder="Select a topic..." />
                  </SelectTrigger>
                  <SelectContent className="glass-static border-border/30 max-h-[300px]">
                    {TOPIC_CATEGORIES.map((category) => (
                      <SelectGroup key={category.group}>
                        <SelectLabel className="font-display text-xs text-muted-foreground">
                          {category.group}
                        </SelectLabel>
                        {category.topics.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm">
                            {t}{topicCounts[t] ? ` (${topicCounts[t]})` : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
                  <FileText className="h-3.5 w-3.5 inline mr-1" />
                  Post Type
                </label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="glass border-border/40 text-foreground h-11 rounded-xl">
                    <SelectValue placeholder="Select post type..." />
                  </SelectTrigger>
                  <SelectContent className="glass-static border-border/30">
                    {POST_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value} className="text-sm">
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date + Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
                  <Calendar className="h-3.5 w-3.5 inline mr-1" />
                  Date Posted
                </label>
                <Input
                  type="date"
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="glass border-border/40 text-foreground h-11 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3 h-11">
                <Switch id="has-meme" checked={hasMeme} onCheckedChange={setHasMeme} />
                <Label htmlFor="has-meme" className="text-sm font-body text-secondary-foreground cursor-pointer">
                  <Image className="h-3.5 w-3.5 inline mr-1" />
                  Has Meme
                </Label>
              </div>
              <div className="flex items-center gap-3 h-11">
                <Switch id="uses-emojis" checked={usesEmojis} onCheckedChange={setUsesEmojis} />
                <Label htmlFor="uses-emojis" className="text-sm font-body text-secondary-foreground cursor-pointer">
                  <Smile className="h-3.5 w-3.5 inline mr-1" />
                  Uses Emojis
                </Label>
              </div>
            </div>

            {/* Full Post Text */}
            <div>
              <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">📝 Full Post Text</label>
              <Textarea
                placeholder="Paste your full LinkedIn post exactly as published..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[180px] resize-y rounded-xl"
              />
            </div>

            {/* Structure Breakdown (Optional) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-secondary-foreground font-body hover:text-foreground transition-colors group">
                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                  🧩 Structure Breakdown <span className="text-muted-foreground font-normal">(optional — for richer learning)</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hook (opening line)</label>
                  <Input
                    placeholder="The first line or thought..."
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Observation</label>
                  <Input
                    placeholder="Real-life observation or framing..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Explanation</label>
                <Textarea
                  placeholder="The descriptive middle section..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-y rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Implications</label>
                <Textarea
                  placeholder="What this means for marketers, brands..."
                  value={implications}
                  onChange={(e) => setImplications(e.target.value)}
                  className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[60px] resize-y rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Learnings (one per line)</label>
                <Textarea
                  placeholder="Actionable takeaways, one per line..."
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-y rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Closing</label>
                  <Input
                    placeholder="Final reflection..."
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hashtags (comma-separated)</label>
                  <Input
                    placeholder="#EmailMarketing, #Deliverability..."
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
              </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Performance Metrics */}
            <div>
              <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
                <BarChart3 className="h-3.5 w-3.5 inline mr-1" />
                Performance Metrics
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Impressions</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={impressions}
                    onChange={(e) => setImpressions(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Reactions</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={reactions}
                    onChange={(e) => setReactions(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Comments</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={commentsInput}
                    onChange={(e) => setCommentsInput(e.target.value)}
                    className="glass border-border/40 text-foreground h-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="generate"
                size="lg"
                className="flex-1 rounded-xl"
                onClick={handleUpload}
                disabled={!topic || !postText.trim() || !datePosted || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Save to Intelligence Repository
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="glass-static rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repository..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 glass border-border/40 h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Grouped Posts by Topic */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground font-body">Loading repository...</div>
        ) : groupedByTopic.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-body">
            {posts.length === 0
              ? "No posts in repository yet. Upload your LinkedIn posts to train the model! ✨"
              : "No posts match your search."}
          </div>
        ) : (
          <div className="space-y-3">
            {groupedByTopic.map(({ topic: groupTopic, posts: groupPosts }) => (
              <Collapsible
                key={groupTopic}
                open={openTopics[groupTopic] ?? false}
                onOpenChange={() => toggleTopic(groupTopic)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full glass-static rounded-2xl p-4 flex items-center justify-between hover:glow-magic transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          openTopics[groupTopic] ? "rotate-90" : ""
                        }`}
                      />
                      <span className="font-display text-sm font-semibold text-foreground">
                        {groupTopic}
                      </span>
                      <Badge variant="secondary" className="text-xs rounded-lg">
                        {groupPosts.length}
                      </Badge>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 pl-4">
                  {groupPosts.map((post) => (
                    <div
                      key={post.id}
                      className="glass-static rounded-xl p-4 sparkle-border cursor-pointer hover:glow-magic transition-all duration-200"
                      onClick={() => setViewingPost(post)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border-border/40">
                              {getPostTypeLabel(post.post_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {post.date_posted
                                ? new Date(post.date_posted + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <MetricsBadges post={post} />
                          </div>
                          <p className="text-sm text-foreground/80 font-body line-clamp-2">
                            {getPreview(post.post_text)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setViewingPost(post); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => copyPost(post, e)}>
                            {copiedId === post.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => deletePost(post.id, e)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </main>

      {/* View Post Dialog */}
      <Dialog open={!!viewingPost} onOpenChange={(open) => !open && setViewingPost(null)}>
        <DialogContent className="glass-static sm:max-w-2xl border-border/30 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient text-lg flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs rounded-lg">
                {viewingPost?.topic}
              </Badge>
              <Badge variant="outline" className="text-xs rounded-lg border-border/40">
                {viewingPost && getPostTypeLabel(viewingPost.post_type)}
              </Badge>
              {viewingPost?.has_meme && (
                <Badge variant="outline" className="text-xs rounded-lg border-border/40">
                  <Image className="h-3 w-3 mr-1" />
                  Meme
                </Badge>
              )}
              {viewingPost?.uses_emojis && (
                <Badge variant="outline" className="text-xs rounded-lg border-border/40">
                  <Smile className="h-3 w-3 mr-1" />
                  Emojis
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-body font-normal ml-auto">
                {viewingPost && (viewingPost.date_posted
                  ? new Date(viewingPost.date_posted + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : new Date(viewingPost.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                )}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Performance metrics panel */}
          {viewingPost && (viewingPost.impressions > 0 || viewingPost.reactions > 0 || viewingPost.comments > 0) && (
            <div className="glass rounded-xl p-4 grid grid-cols-5 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Impressions</p>
                <p className="text-sm font-semibold text-foreground">{formatNumber(viewingPost.impressions)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Reactions</p>
                <p className="text-sm font-semibold text-foreground">{formatNumber(viewingPost.reactions)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Comments</p>
                <p className="text-sm font-semibold text-foreground">{formatNumber(viewingPost.comments)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">React Rate</p>
                <p className="text-sm font-semibold text-foreground">{(viewingPost.reaction_rate * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Comment Rate</p>
                <p className="text-sm font-semibold text-foreground">{(viewingPost.comment_rate * 100).toFixed(2)}%</p>
              </div>
            </div>
          )}

          {/* Post Text */}
          <div>
            <div className="glass rounded-xl p-5 text-sm text-foreground/90 font-body whitespace-pre-line leading-relaxed max-h-[40vh] overflow-y-auto">
              {viewingPost?.post_text}
            </div>
          </div>

          {/* Structure Breakdown */}
          {viewingPost?.structure && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wider">🧩 Structure Breakdown</h3>
              <div className="glass rounded-xl p-4 space-y-3 text-sm">
                {viewingPost.structure.hook && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Hook:</span>
                    <p className="text-foreground/80 font-body">{viewingPost.structure.hook}</p>
                  </div>
                )}
                {viewingPost.structure.observation && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Observation:</span>
                    <p className="text-foreground/80 font-body">{viewingPost.structure.observation}</p>
                  </div>
                )}
                {viewingPost.structure.explanation && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Explanation:</span>
                    <p className="text-foreground/80 font-body">{viewingPost.structure.explanation}</p>
                  </div>
                )}
                {viewingPost.structure.implications && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Implications:</span>
                    <p className="text-foreground/80 font-body">{viewingPost.structure.implications}</p>
                  </div>
                )}
                {viewingPost.structure.learnings && viewingPost.structure.learnings.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Learnings:</span>
                    <ul className="list-disc list-inside text-foreground/80 font-body space-y-0.5 mt-0.5">
                      {viewingPost.structure.learnings.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {viewingPost.structure.closing && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Closing:</span>
                    <p className="text-foreground/80 font-body">{viewingPost.structure.closing}</p>
                  </div>
                )}
                {viewingPost.structure.hashtags && viewingPost.structure.hashtags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">Hashtags:</span>
                    {viewingPost.structure.hashtags.map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] rounded-md">{h}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => viewingPost && copyPost(viewingPost)}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive" onClick={() => viewingPost && deletePost(viewingPost.id)}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
