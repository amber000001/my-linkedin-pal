import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SEGMENTS = ["founder", "engineer", "pm", "designer", "recruiter", "other"];

interface Signal {
  id: string;
  segment: string;
  engagement_count: number;
  engagement_types: { reactions?: number; comments?: number; reshares?: number } | null;
  engager_name: string;
  measured_at: string;
  linkedin_post_id: string | null;
}
interface Post {
  id: string;
  topic: string;
  post_text: string;
  date_posted: string | null;
}

export default function AudienceResonance() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<{ segment: string; topic: string } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase
        .from("audience_signals")
        .select("id, segment, engagement_count, engagement_types, engager_name, measured_at, linkedin_post_id")
        .not("linkedin_post_id", "is", null),
      supabase.from("linkedin_posts").select("id, topic, post_text, date_posted"),
    ]).then(([s, p]) => {
      setSignals((s.data || []) as any);
      setPosts((p.data || []) as any);
      setLoading(false);
    });
  }, []);

  const postsById = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts]);

  const { topics, matrix, max, totals } = useMemo(() => {
    const topicSet = new Set<string>();
    const m = new Map<string, Map<string, number>>();
    const segTotals = new Map<string, number>();
    let mx = 0;
    for (const s of signals) {
      const post = postsById.get(s.linkedin_post_id || "");
      if (!post) continue;
      topicSet.add(post.topic);
      const row = m.get(s.segment) || new Map();
      const cur = (row.get(post.topic) || 0) + (s.engagement_count || 1);
      row.set(post.topic, cur);
      m.set(s.segment, row);
      mx = Math.max(mx, cur);
      segTotals.set(s.segment, (segTotals.get(s.segment) || 0) + (s.engagement_count || 1));
    }
    return { topics: Array.from(topicSet).sort(), matrix: m, max: mx, totals: segTotals };
  }, [signals, postsById]);

  const drillSignals = useMemo(() => {
    if (!drill) return [];
    return signals.filter((s) => {
      const post = postsById.get(s.linkedin_post_id || "");
      return post && post.topic === drill.topic && s.segment === drill.segment;
    });
  }, [drill, signals, postsById]);

  const cellColor = (v: number) => {
    if (!v || !max) return "hsl(var(--muted) / 0.3)";
    const intensity = Math.min(1, v / max);
    return `hsl(280 80% ${85 - intensity * 40}% / ${0.3 + intensity * 0.6})`;
  };

  const hasData = topics.length > 0 && signals.length > 0;

  return (
    <Card className="glass-static border-border/40">
      <CardHeader>
        <CardTitle className="font-display text-lg">Audience Resonance</CardTitle>
        <CardDescription>
          Which segments of your audience engage with which topics. Click any cell to see the tagged engagers and signals behind it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No tagged engagement on posts yet. Once you tag who engaged with specific posts, their segments will appear here mapped to topics.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground px-2 py-1 sticky left-0 bg-background">Segment</th>
                  {topics.map((t) => (
                    <th key={t} className="font-medium text-muted-foreground px-2 py-1 text-center whitespace-nowrap">{t}</th>
                  ))}
                  <th className="font-medium text-muted-foreground px-2 py-1 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map((seg) => {
                  const row = matrix.get(seg);
                  const total = totals.get(seg) || 0;
                  return (
                    <tr key={seg}>
                      <td className="px-2 py-1 font-medium capitalize sticky left-0 bg-background">{seg}</td>
                      {topics.map((t) => {
                        const v = row?.get(t) || 0;
                        return (
                          <td
                            key={t}
                            onClick={() => v && setDrill({ segment: seg, topic: t })}
                            className={`px-2 py-2 text-center rounded-md font-mono transition-all ${v ? "cursor-pointer hover:ring-2 hover:ring-primary/60" : ""}`}
                            style={{ background: cellColor(v), minWidth: 48 }}
                            title={v ? `${seg} × ${t}: ${v} — click for details` : ""}
                          >
                            {v || ""}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-center font-mono text-muted-foreground">{total || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              Darker = more engagement. Click a cell to drill into the engagers and posts behind that count.
            </p>
          </div>
        )}
      </CardContent>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="glass-static max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display capitalize">
              {drill?.segment} × {drill?.topic}
            </DialogTitle>
            <DialogDescription>
              {drillSignals.length} tagged engagement signal{drillSignals.length === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const byPost = new Map<string, Signal[]>();
            for (const s of drillSignals) {
              const arr = byPost.get(s.linkedin_post_id!) || [];
              arr.push(s);
              byPost.set(s.linkedin_post_id!, arr);
            }
            return (
              <div className="space-y-4">
                {Array.from(byPost.entries()).map(([postId, sigs]) => {
                  const post = postsById.get(postId);
                  if (!post) return null;
                  const totalReactions = sigs.reduce((s, x) => s + (x.engagement_types?.reactions || 0), 0);
                  const totalComments = sigs.reduce((s, x) => s + (x.engagement_types?.comments || 0), 0);
                  const totalReshares = sigs.reduce((s, x) => s + (x.engagement_types?.reshares || 0), 0);
                  return (
                    <div key={postId} className="rounded-lg border border-border/40 p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm line-clamp-3 flex-1">{post.post_text}</p>
                        {post.date_posted && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(post.date_posted).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[11px] text-muted-foreground font-mono">
                        <span>👏 {totalReactions}</span>
                        <span>💬 {totalComments}</span>
                        <span>🔁 {totalReshares}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
                        {sigs.map((s) => (
                          <span
                            key={s.id}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
                            title={`reactions: ${s.engagement_types?.reactions || 0}, comments: ${s.engagement_types?.comments || 0}, reshares: ${s.engagement_types?.reshares || 0}`}
                          >
                            {s.engager_name}
                            {s.engagement_count > 1 && <span className="text-muted-foreground ml-1">×{s.engagement_count}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
