import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_TOPICS } from "@/lib/topics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BUCKETS = [
  { label: "6–11", start: 6, end: 11 },
  { label: "11–14", start: 11, end: 14 },
  { label: "14–18", start: 14, end: 18 },
  { label: "18–23", start: 18, end: 23 },
];

interface Cell {
  rates: number[];
  n: number;
}

export default function PerformanceHeatmap() {
  const [posts, setPosts] = useState<Array<{ topic: string; date_posted: string; reaction_rate: number | null }>>([]);
  const [topicFilter, setTopicFilter] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("linkedin_posts")
      .select("topic, date_posted, reaction_rate")
      .not("date_posted", "is", null)
      .then(({ data }) => setPosts((data || []) as any));
  }, []);

  const filtered = topicFilter === "all" ? posts : posts.filter((p) => p.topic === topicFilter);
  const grid: Cell[][] = DAYS.map(() => BUCKETS.map(() => ({ rates: [], n: 0 })));

  for (const p of filtered) {
    if (!p.date_posted) continue;
    const d = new Date(p.date_posted);
    const dow = (d.getUTCDay() + 6) % 7; // Mon=0
    const hour = d.getUTCHours();
    const bIdx = BUCKETS.findIndex((b) => hour >= b.start && hour < b.end);
    if (bIdx < 0) continue;
    grid[dow][bIdx].rates.push(p.reaction_rate || 0);
    grid[dow][bIdx].n += 1;
  }

  const allRates = filtered.map((p) => p.reaction_rate || 0).filter((r) => r > 0);
  const baseline = allRates.length ? allRates.reduce((s, v) => s + v, 0) / allRates.length : 0;

  const cellColor = (cell: Cell) => {
    if (cell.n < 3) return "bg-muted/30";
    const avg = cell.rates.reduce((s, v) => s + v, 0) / cell.rates.length;
    const lift = baseline > 0 ? avg / baseline : 1;
    if (lift >= 2) return "bg-green-500/60";
    if (lift >= 1.5) return "bg-green-400/45";
    if (lift >= 1.1) return "bg-yellow-300/40";
    if (lift >= 0.7) return "bg-orange-300/40";
    return "bg-red-400/45";
  };

  return (
    <Card className="glass-static border-border/40">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-display text-lg">Performance Heatmap</CardTitle>
          <CardDescription>When does your audience actually engage? Cells with fewer than 3 posts are greyed out.</CardDescription>
        </div>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-48 glass border-border/40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {ALL_TOPICS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No dated posts yet. Add `date_posted` in the repository to populate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2"></th>
                  {BUCKETS.map((b) => (
                    <th key={b.label} className="font-medium text-muted-foreground p-2">{b.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dIdx) => (
                  <tr key={day}>
                    <td className="font-medium text-muted-foreground p-2">{day}</td>
                    {grid[dIdx].map((cell, bIdx) => {
                      const avg = cell.n ? cell.rates.reduce((s, v) => s + v, 0) / cell.rates.length : 0;
                      return (
                        <td key={bIdx} className="p-1">
                          <div
                            className={`${cellColor(cell)} rounded-lg p-2 text-center transition-all hover:scale-105`}
                            title={cell.n < 3 ? `Low data (n=${cell.n})` : `n=${cell.n}, avg ${(avg * 100).toFixed(1)}% rxn`}
                          >
                            <div className="font-semibold">
                              {cell.n < 3 ? "—" : `${(avg * 100).toFixed(1)}%`}
                            </div>
                            <div className="text-[10px] text-muted-foreground">n={cell.n}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Baseline reaction rate: {(baseline * 100).toFixed(2)}%. Green = above baseline, red = below.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
