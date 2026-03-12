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
} from "lucide-react";
import { toast } from "sonner";

interface LinkedInPost {
  id: string;
  topic: string;
  post_text: string;
  created_at: string;
  date_posted: string | null;
  impressions: number;
  reactions: number;
  comments: number;
  has_meme: boolean;
  reaction_rate: number;
  comment_rate: number;
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
  const [postText, setPostText] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [impressions, setImpressions] = useState("");
  const [reactions, setReactions] = useState("");
  const [commentsInput, setCommentsInput] = useState("");
  const [hasMeme, setHasMeme] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setPosts((data || []) as LinkedInPost[]);
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
    setPostText("");
    setDatePosted("");
    setImpressions("");
    setReactions("");
    setCommentsInput("");
    setHasMeme(false);
  };

  const handleUpload = async () => {
    if (!topic || !postText.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("linkedin_posts").insert({
        topic,
        post_text: postText.trim(),
        date_posted: datePosted || null,
        impressions: parseInt(impressions) || 0,
        reactions: parseInt(reactions) || 0,
        comments: parseInt(commentsInput) || 0,
        has_meme: hasMeme,
      });
      if (error) throw error;
      toast.success("Post uploaded to repository ✨");
      resetForm();
      setShowForm(false);
      fetchPosts();
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload post.");
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
          <div className="glass-static rounded-2xl p-6 sparkle-border space-y-4">
            <h2 className="font-display text-lg font-semibold text-gradient">📚 Upload LinkedIn Post</h2>

            {/* Topic */}
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

            {/* Post Text */}
            <div>
              <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">📝 Post Text</label>
              <Textarea
                placeholder="Paste your full LinkedIn post here..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[180px] resize-y rounded-xl"
              />
            </div>

            {/* Date Posted */}
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

            {/* Has Meme */}
            <div className="flex items-center gap-3">
              <Switch id="has-meme" checked={hasMeme} onCheckedChange={setHasMeme} />
              <Label htmlFor="has-meme" className="text-sm font-body text-secondary-foreground cursor-pointer">
                <Image className="h-3.5 w-3.5 inline mr-1" />
                Post includes a meme
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="generate"
                size="lg"
                className="flex-1 rounded-xl"
                onClick={handleUpload}
                disabled={!topic || !postText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Save to Repository
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
            <DialogTitle className="font-display text-gradient text-lg flex items-center gap-2">
              <Badge variant="secondary" className="text-xs rounded-lg">
                {viewingPost?.topic}
              </Badge>
              {viewingPost?.has_meme && (
                <Badge variant="outline" className="text-xs rounded-lg border-border/40">
                  <Image className="h-3 w-3 mr-1" />
                  Meme
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
                <p className="text-sm font-semibold text-foreground">{viewingPost.reaction_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Comment Rate</p>
                <p className="text-sm font-semibold text-foreground">{viewingPost.comment_rate}%</p>
              </div>
            </div>
          )}

          <div>
            <div className="glass rounded-xl p-5 text-sm text-foreground/90 font-body whitespace-pre-line leading-relaxed max-h-[55vh] overflow-y-auto">
              {viewingPost?.post_text}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => viewingPost && copyPost(viewingPost)}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive" onClick={() => viewingPost && deletePost(viewingPost.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
