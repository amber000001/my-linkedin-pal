import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOPIC_CATEGORIES, ALL_TOPICS } from "@/lib/topics";
import { SparkleParticles } from "@/components/SparkleParticles";
import { Sparkles, Search, ArrowLeft, Star, Copy, Trash2, RotateCcw, Upload, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { HistoryDetailDialog } from "@/components/HistoryDetailDialog";
import { UploadToIntelligenceDialog } from "@/components/UploadToIntelligenceDialog";
import { MarkPostedDialog } from "@/components/MarkPostedDialog";
import { CatchUpMetrics } from "@/components/CatchUpMetrics";
import type { PostGeneration } from "@/lib/history";

const MODE_LABELS: Record<string, string> = {
  "thought-leadership": "💡 Thought",
  "meme": "🎭 Meme",
  "free-dump": "📝 Free Dump",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "posted", label: "Posted" },
  { value: "archived", label: "Archived" },
];

export default function History() {
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<PostGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PostGeneration | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadItem, setUploadItem] = useState<PostGeneration | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [markPostedItem, setMarkPostedItem] = useState<PostGeneration | null>(null);
  const [markPostedOpen, setMarkPostedOpen] = useState(false);
  const [catchUpKey, setCatchUpKey] = useState(0);

  const fetchGenerations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("post_generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load history");
    } else {
      setGenerations((data || []) as PostGeneration[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const filtered = useMemo(() => {
    return generations.filter((g) => {
      if (filterTopic !== "all" && g.topic_dropdown_value !== filterTopic && g.topic !== filterTopic) return false;
      if (filterMode !== "all" && g.post_type !== filterMode) return false;
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      if (filterFavorite && !g.is_favorite) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const searchable = [g.generated_post, g.topic, g.topic_dropdown_value, g.input_text].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [generations, filterTopic, filterMode, filterStatus, filterFavorite, search]);

  const toggleFavorite = async (item: PostGeneration) => {
    const { error } = await supabase
      .from("post_generations")
      .update({ is_favorite: !item.is_favorite })
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to update");
    } else {
      setGenerations((prev) =>
        prev.map((g) => (g.id === item.id ? { ...g, is_favorite: !g.is_favorite } : g))
      );
    }
  };

  const updateStatus = async (item: PostGeneration, status: string) => {
    // "posted" goes through the Mark-as-Posted modal; everything else updates inline.
    if (status === "posted") {
      setMarkPostedItem(item);
      setMarkPostedOpen(true);
      return;
    }
    const { error } = await supabase
      .from("post_generations")
      .update({ status })
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setGenerations((prev) =>
        prev.map((g) => (g.id === item.id ? { ...g, status } : g))
      );
      toast.success(`Marked as ${status}`);
    }
  };

  const handleMarkPostedSuccess = () => {
    if (markPostedItem) {
      setGenerations((prev) =>
        prev.map((g) => (g.id === markPostedItem.id ? { ...g, status: "posted" } : g))
      );
    }
    setCatchUpKey((k) => k + 1);
  };

  const deleteItem = async (item: PostGeneration) => {
    const { error } = await supabase
      .from("post_generations")
      .delete()
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setGenerations((prev) => prev.filter((g) => g.id !== item.id));
      toast.success("Deleted");
    }
  };

  const copyPost = (item: PostGeneration) => {
    navigator.clipboard.writeText(item.generated_post);
    setCopiedId(item.id);
    toast.success("Copied to clipboard ✨");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openUploadDialog = (item: PostGeneration) => {
    setUploadItem(item);
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    // Optionally refresh or show confirmation
  };

  const reuseItem = (item: PostGeneration) => {
    const params = new URLSearchParams();
    params.set("reuse", item.id);
    navigate(`/?${params.toString()}`);
  };

  const getHookPreview = (post: string) => {
    const firstLine = post.split("\n").find((l) => l.trim());
    if (!firstLine) return "No content";
    return firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SparkleParticles />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-80 h-80 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(320 100% 80% / 0.35) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-[15%] w-64 h-64 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(180 100% 75% / 0.35) 0%, transparent 70%)', animationDelay: '1s' }} />
      </div>

      <header className="relative border-b border-border/30 px-6 py-5 glass-static">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center glow-rainbow animate-float shadow-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gradient">Post History</h1>
              <p className="text-xs text-muted-foreground font-body">{generations.length} generations saved</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="glass-static rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 glass border-border/40 h-10 rounded-xl"
              />
            </div>
            <Select value={filterTopic} onValueChange={setFilterTopic}>
              <SelectTrigger className="w-[200px] glass border-border/40 h-10 rounded-xl">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent className="glass-static border-border/30 max-h-[300px]">
                <SelectItem value="all">All Topics</SelectItem>
                {ALL_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="w-[160px] glass border-border/40 h-10 rounded-xl">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent className="glass-static border-border/30">
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="thought-leadership">💡 Thought</SelectItem>
                <SelectItem value="meme">🎭 Meme</SelectItem>
                <SelectItem value="free-dump">📝 Free Dump</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] glass border-border/40 h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="glass-static border-border/30">
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={filterFavorite ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterFavorite(!filterFavorite)}
              className="rounded-xl h-10 px-4"
            >
              <Star className={`h-4 w-4 mr-1 ${filterFavorite ? "fill-current" : ""}`} />
              Favorites
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground font-body">Loading history...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-body">
            {generations.length === 0 ? "No generations yet. Go create some posts! ✨" : "No results match your filters."}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div key={item.id} className="glass-static rounded-2xl p-5 sparkle-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary" className="text-xs rounded-lg">
                        {MODE_LABELS[item.post_type] || item.post_type}
                      </Badge>
                      {item.topic_dropdown_value && (
                        <Badge variant="outline" className="text-xs rounded-lg">
                          {item.topic_dropdown_value}
                        </Badge>
                      )}
                      <Badge
                        variant={item.status === "posted" ? "default" : "outline"}
                        className="text-xs rounded-lg capitalize"
                      >
                        {item.status}
                      </Badge>
                      {item.is_favorite && (
                        <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 font-body line-clamp-2">
                      {getHookPreview(item.generated_post)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedItem(item)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => copyPost(item)}>
                    {copiedId === item.id ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => reuseItem(item)}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reuse
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => toggleFavorite(item)}
                  >
                    <Star className={`h-3.5 w-3.5 mr-1 ${item.is_favorite ? "fill-accent text-accent" : ""}`} />
                    {item.is_favorite ? "Unfavorite" : "Favorite"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openUploadDialog(item)}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload to Intelligence
                  </Button>
                  {item.status !== "posted" && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => updateStatus(item, "posted")}>
                      ✅ Mark Posted
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => deleteItem(item)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedItem && (
        <HistoryDetailDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onCopy={() => copyPost(selectedItem)}
          onReuse={() => reuseItem(selectedItem)}
          onUploadToIntelligence={() => openUploadDialog(selectedItem)}
          onToggleFavorite={() => toggleFavorite(selectedItem)}
          onUpdateStatus={(status) => updateStatus(selectedItem, status)}
        />
      )}

      <UploadToIntelligenceDialog
        item={uploadItem}
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
