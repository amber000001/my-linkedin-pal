import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SEGMENTS = ["founder", "engineer", "pm", "designer", "recruiter", "other"];

interface Signal {
  segment: string;
  engagement_count: number;
  linkedin_post_id: string | null;
}
interface Post {
  id: string;
  topic: string;
}

export default function AudienceResonance() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("audience_signals").select("segment, engagement_count, linkedin_post_id").not("linkedin_post_id", "is", null),
      supabase.from("linkedin_posts").select("id, topic"),
    ]).then(([s, p]) => {
      setSignals((s.data || []) as any);
      setPosts((p.data || []) as any);
      setLoading(false);
    });
  }, []);

  const { topics, matrix, max, totals } = useMemo(() => {
    const postTopic = new Map(posts.map((p) => [p.id, p.topic]));
    const topicSet = new Set<string>();
    const m = new Map<string, Map<string, number>>(); // segment -> topic -> count
    const segTotals = new Map<string, number>();
    let mx = 0;
    for (const s of signals) {
      const topic = postTopic.get(s.linkedin_post_id || "");
      if (!topic) continue;
      topicSet.add(topic);
      const row = m.get(s.segment) || new Map();
      const cur = (row.get(topic) || 0) + (s.engagement_count || 1);
      row.set(topic, cur);
      m.set(s.segment, row);
      mx = Math.max(mx, cur);
      segTotals.set(s.segment, (segTotals.get(s.segment) || 0) + (s.engagement_count || 1));
    }
    return {
      topics: Array.from(topicSet).sort(),
      matrix: m,
      max: mx,
      totals: segTotals,
    };
  }, [signals, posts]);

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
          Which segments of your audience engage with which topics. Tag engagers on your posts in the Audience tab to populate this board.
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
                    <th key={t} className="font-medium text-muted-foreground px-2 py-1 text-center whitespace-nowrap">
                      {t}
                    </th>
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
                            className="px-2 py-2 text-center rounded-md font-mono"
                            style={{ background: cellColor(v), minWidth: 48 }}
                            title={`${seg} × ${t}: ${v}`}
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
              Darker = more engagement. Use this to spot which segments quietly carry which topics — and which segments you've stopped reaching.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
