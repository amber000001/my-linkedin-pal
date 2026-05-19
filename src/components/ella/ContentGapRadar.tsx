import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, TrendingUp, Radar } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Trend {
  id: string;
  topic: string;
  source: string;
  volume_score: number;
  growth_rate: number;
  relevance_to_user: number;
  created_at: string;
  expires_at: string | null;
}

interface PostMatch {
  topic: string;
  date_posted: string | null;
  reaction_rate: number | null;
}

function tokens(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const t of a) if (b.has(t)) count++;
  return count;
}

export default function ContentGapRadar() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [userPosts, setUserPosts] = useState<PostMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: lp }] = await Promise.all([
      supabase
        .from("trending_topics")
        .select("*")
        .order("relevance_to_user", { ascending: false })
        .order("growth_rate", { ascending: false }),
      supabase
        .from("linkedin_posts")
        .select("topic, post_text, date_posted, reaction_rate")
        .order("date_posted", { ascending: false })
        .limit(200),
    ]);
    setTrends((t || []) as Trend[]);
    setUserPosts(
      ((lp || []) as any[]).map((p) => ({
        topic: `${p.topic || ""} ${(p.post_text || "").slice(0, 200)}`.trim(),
        date_posted: p.date_posted,
        reaction_rate: p.reaction_rate,
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const ingest = async () => {
    setIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-trends");
      if (error) throw error;
      toast.success(`Ingested ${data?.ingested ?? 0} fresh trends 🌊`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not refresh trends");
    } finally {
      setIngesting(false);
    }
  };

  const matchFor = (trend: Trend): PostMatch | null => {
    const tt = tokens(trend.topic);
    let best: { p: PostMatch; score: number } | null = null;
    for (const p of userPosts) {
      const s = overlap(tt, tokens(p.topic));
      if (s > 0 && (!best || s > best.score)) best = { p, score: s };
    }
    return best?.p || null;
  };

  const heatLabel = (g: number) => (g >= 2 ? "🔥🔥🔥" : g >= 1.5 ? "🔥🔥" : "🔥");

  return (
    <Card className="glass-static border-border/40">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Radar className="h-4 w-4" /> Content Gap Radar
            <Badge variant="outline" className="text-xs">Board 5</Badge>
          </CardTitle>
          <CardDescription>
            What's hot in your niche this week — and whether you've ridden the wave.
          </CardDescription>
        </div>
        <Button onClick={ingest} disabled={ingesting} variant="outline" size="sm" className="glass border-border/40 rounded-xl">
          {ingesting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
          Refresh trends
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : trends.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">No trends yet. Hit Refresh to pull this week's signals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-2">
              <div className="col-span-7">Trending topic</div>
              <div className="col-span-5">Your last post on it</div>
            </div>
            {trends.map((t) => {
              const match = matchFor(t);
              const isGap = !match;
              return (
                <div
                  key={t.id}
                  className={`grid grid-cols-12 gap-3 p-3 rounded-2xl border ${isGap ? "border-pink-400/50 bg-pink-500/5" : "border-border/30"}`}
                >
                  <div className="col-span-7 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{heatLabel(t.growth_rate)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug">{t.topic}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[10px] py-0">{t.source}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            relevance {(t.relevance_to_user * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            · growth {t.growth_rate.toFixed(1)}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-5 text-xs">
                    {match ? (
                      <div className="space-y-0.5">
                        <p className="text-foreground line-clamp-2">{match.topic.slice(0, 120)}</p>
                        <p className="text-muted-foreground">
                          {match.date_posted ? formatDistanceToNow(new Date(match.date_posted), { addSuffix: true }) : "no date"}
                          {match.reaction_rate ? ` · ${(match.reaction_rate * 100).toFixed(1)}% rxn` : ""}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-pink-400 font-medium">
                        <TrendingUp className="h-3 w-3" /> Gap — never posted
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
