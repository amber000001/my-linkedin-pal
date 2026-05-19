import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Row {
  hook_pattern: string | null;
  created_at: string;
  linkedin_post_id: string | null;
}
interface PostRow {
  id: string;
  reaction_rate: number | null;
  comment_rate: number | null;
  date_posted: string | null;
}

type Window = "30d" | "90d" | "lifetime";

export default function HookPatternLeaderboard() {
  const [generated, setGenerated] = useState<Row[]>([]);
  const [posts, setPosts] = useState<Map<string, PostRow>>(new Map());
  const [baseline, setBaseline] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: gen } = await supabase
        .from("generated_posts")
        .select("hook_pattern, created_at, linkedin_post_id")
        .not("hook_pattern", "is", null)
        .not("linkedin_post_id", "is", null);
      const rows = (gen || []) as Row[];
      setGenerated(rows);

      const ids = [...new Set(rows.map((r) => r.linkedin_post_id).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: lp } = await supabase
          .from("linkedin_posts")
          .select("id, reaction_rate, comment_rate, date_posted")
          .in("id", ids);
        const m = new Map<string, PostRow>();
        for (const p of (lp || []) as PostRow[]) m.set(p.id, p);
        setPosts(m);
      }

      const { data: all } = await supabase
        .from("linkedin_posts")
        .select("reaction_rate")
        .not("reaction_rate", "is", null);
      const rates = (all || []).map((r: any) => r.reaction_rate as number).filter((n) => n > 0);
      setBaseline(rates.length ? rates.reduce((s, v) => s + v, 0) / rates.length : 0);
    })();
  }, []);

  const buildStats = (windowDays: number | null) => {
    const cutoff = windowDays ? Date.now() - windowDays * 86_400_000 : 0;
    const byPattern = new Map<string, { rates: number[]; n: number }>();
    for (const g of generated) {
      if (!g.hook_pattern || !g.linkedin_post_id) continue;
      const post = posts.get(g.linkedin_post_id);
      if (!post?.reaction_rate) continue;
      const ts = post.date_posted ? new Date(post.date_posted).getTime() : new Date(g.created_at).getTime();
      if (ts < cutoff) continue;
      const entry = byPattern.get(g.hook_pattern) || { rates: [], n: 0 };
      entry.rates.push(post.reaction_rate);
      entry.n += 1;
      byPattern.set(g.hook_pattern, entry);
    }
    return Array.from(byPattern.entries())
      .map(([pattern, v]) => ({
        pattern,
        n: v.n,
        avg: v.rates.reduce((s, x) => s + x, 0) / v.rates.length,
        lift: baseline > 0 ? v.rates.reduce((s, x) => s + x, 0) / v.rates.length / baseline : 0,
      }))
      .sort((a, b) => b.avg - a.avg);
  };

  const data = useMemo(
    () => ({
      "30d": buildStats(30),
      "90d": buildStats(90),
      lifetime: buildStats(null),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generated, posts, baseline],
  );

  const maxAvg = Math.max(0.01, ...Object.values(data).flat().map((d) => d.avg));

  const renderBars = (rows: ReturnType<typeof buildStats>) => {
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Not enough closed-loop data yet. Mark generated posts as Posted and add their metrics to populate this board.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.pattern} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{r.pattern.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground text-xs">
                {(r.avg * 100).toFixed(2)}% rxn · {r.lift.toFixed(1)}x baseline · n={r.n}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, (r.avg / maxAvg) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="glass-static border-border/40">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          Hook Pattern Leaderboard
          <Badge variant="outline" className="text-xs">Board 3</Badge>
        </CardTitle>
        <CardDescription>
          Which hook patterns are working — and watch for drift across windows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lifetime">
          <TabsList className="glass-strong rounded-xl">
            <TabsTrigger value="30d" className="rounded-lg">Last 30d</TabsTrigger>
            <TabsTrigger value="90d" className="rounded-lg">Last 90d</TabsTrigger>
            <TabsTrigger value="lifetime" className="rounded-lg">Lifetime</TabsTrigger>
          </TabsList>
          <TabsContent value="30d" className="mt-4">{renderBars(data["30d"])}</TabsContent>
          <TabsContent value="90d" className="mt-4">{renderBars(data["90d"])}</TabsContent>
          <TabsContent value="lifetime" className="mt-4">{renderBars(data.lifetime)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
