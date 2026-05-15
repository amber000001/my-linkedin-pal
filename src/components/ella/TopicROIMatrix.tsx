import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

interface PostRow {
  topic: string;
  reaction_rate: number | null;
  impressions: number | null;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

export default function TopicROIMatrix() {
  const [posts, setPosts] = useState<PostRow[]>([]);

  useEffect(() => {
    supabase
      .from("linkedin_posts")
      .select("topic, reaction_rate, impressions")
      .then(({ data }) => setPosts((data || []) as any));
  }, []);

  const data = useMemo(() => {
    const byTopic = new Map<string, { rates: number[]; impressions: number }>();
    for (const p of posts) {
      if (!p.topic) continue;
      const e = byTopic.get(p.topic) || { rates: [], impressions: 0 };
      e.rates.push(p.reaction_rate || 0);
      e.impressions += p.impressions || 0;
      byTopic.set(p.topic, e);
    }
    return Array.from(byTopic.entries()).map(([topic, e]) => ({
      topic,
      count: e.rates.length,
      rate: (e.rates.reduce((s, v) => s + v, 0) / e.rates.length) * 100,
      impressions: e.impressions,
    }));
  }, [posts]);

  const medFreq = median(data.map((d) => d.count));
  const medRate = median(data.map((d) => d.rate));

  const quadrant = (count: number, rate: number) => {
    const high = rate >= medRate;
    const freq = count >= medFreq;
    if (high && freq) return { label: "Cash Cow", color: "hsl(var(--primary))" };
    if (high && !freq) return { label: "Hidden Gem", color: "hsl(160 80% 55%)" };
    if (!high && freq) return { label: "Treadmill", color: "hsl(40 95% 60%)" };
    return { label: "Dead Weight", color: "hsl(0 70% 60%)" };
  };

  return (
    <Card className="glass-static border-border/40">
      <CardHeader>
        <CardTitle className="font-display text-lg">Topic ROI Matrix</CardTitle>
        <CardDescription>
          Frequency × engagement. Quadrants split at the median. Dot size = total impressions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No posts yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <XAxis
                  type="number"
                  dataKey="count"
                  name="Posts"
                  label={{ value: "Post count", position: "insideBottom", offset: -10 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="rate"
                  name="Reaction rate"
                  label={{ value: "Reaction rate (%)", angle: -90, position: "insideLeft" }}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="impressions" range={[60, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d: any = payload[0].payload;
                    const q = quadrant(d.count, d.rate);
                    return (
                      <div className="glass-static border border-border/40 rounded-lg p-3 text-xs">
                        <div className="font-semibold">{d.topic}</div>
                        <div className="text-muted-foreground mt-1">
                          {d.count} posts · {d.rate.toFixed(2)}% rxn · {d.impressions.toLocaleString()} impr
                        </div>
                        <div className="mt-1" style={{ color: q.color }}>{q.label}</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={medFreq} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ReferenceLine y={medRate} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Scatter data={data}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={quadrant(d.count, d.rate).color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: "hsl(var(--primary))" }} /> Cash Cow</div>
              <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: "hsl(160 80% 55%)" }} /> Hidden Gem</div>
              <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: "hsl(40 95% 60%)" }} /> Treadmill</div>
              <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: "hsl(0 70% 60%)" }} /> Dead Weight</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
