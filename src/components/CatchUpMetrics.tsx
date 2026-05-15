import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";

interface PostedGen {
  id: string;
  final_post: string;
  posted_at: string;
  mode: string;
  topic: string | null;
  outcomes: { hours_since_posting: number }[];
}

interface PendingWindow {
  post: PostedGen;
  window: 24 | 168 | 720;
  hoursElapsed: number;
}

const WINDOW_LABEL: Record<number, string> = {
  24: "24h check-in",
  168: "7-day check-in",
  720: "30-day check-in",
};

export function CatchUpMetrics({ refreshKey }: { refreshKey: number }) {
  const [pending, setPending] = useState<PendingWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { imp: string; rx: string; cm: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("generated_posts")
      .select("id, final_post, posted_at, mode, topic, generated_post_outcomes(hours_since_posting)")
      .eq("status", "posted")
      .not("posted_at", "is", null)
      .order("posted_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const buckets: PendingWindow[] = [];
    for (const row of (data || []) as any[]) {
      const postedAt = new Date(row.posted_at).getTime();
      const hoursElapsed = Math.floor((now - postedAt) / (1000 * 60 * 60));
      const haveAt = new Set<number>((row.generated_post_outcomes || []).map((o: any) => o.hours_since_posting));
      const post: PostedGen = {
        id: row.id,
        final_post: row.final_post,
        posted_at: row.posted_at,
        mode: row.mode,
        topic: row.topic,
        outcomes: row.generated_post_outcomes || [],
      };
      ([24, 168, 720] as const).forEach((w) => {
        if (hoursElapsed >= w && !haveAt.has(w)) {
          buckets.push({ post, window: w, hoursElapsed });
        }
      });
    }
    // Show most overdue first
    buckets.sort((a, b) => b.hoursElapsed - a.hoursElapsed);
    setPending(buckets);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, [refreshKey]);

  const setDraft = (key: string, field: "imp" | "rx" | "cm", value: string) => {
    setDrafts((d) => ({ ...d, [key]: { imp: "", rx: "", cm: "", ...d[key], [field]: value } }));
  };

  const submit = async (pw: PendingWindow) => {
    const key = `${pw.post.id}-${pw.window}`;
    const d = drafts[key] || { imp: "", rx: "", cm: "" };
    const imp = parseInt(d.imp) || 0;
    const rx = parseInt(d.rx) || 0;
    const cm = parseInt(d.cm) || 0;
    if (imp === 0 && rx === 0 && cm === 0) {
      toast.error("Enter at least one metric.");
      return;
    }
    setSavingId(key);
    const { error } = await supabase.from("generated_post_outcomes").insert({
      generated_post_id: pw.post.id,
      hours_since_posting: pw.window,
      impressions: imp,
      reactions: rx,
      comments: cm,
    });
    setSavingId(null);
    if (error) {
      console.error(error);
      toast.error("Failed to save metrics.");
      return;
    }
    toast.success(`${WINDOW_LABEL[pw.window]} saved ✨`);
    setDrafts((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    fetchPending();
  };

  if (loading) return null;
  if (pending.length === 0) return null;

  return (
    <div className="glass-static rounded-2xl p-5 sparkle-border">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold text-gradient">Catch up on metrics</h2>
        <Badge variant="outline" className="ml-1 rounded-lg text-xs">{pending.length} pending</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4 font-body">
        Posts due for a 24h, 7-day, or 30-day check-in. Logging these powers the learning engine.
      </p>

      <div className="space-y-3">
        {pending.map((pw) => {
          const key = `${pw.post.id}-${pw.window}`;
          const d = drafts[key] || { imp: "", rx: "", cm: "" };
          const preview = (pw.post.final_post || "").split("\n").find((l) => l.trim()) || "";
          return (
            <div key={key} className="glass rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="text-xs rounded-lg">{WINDOW_LABEL[pw.window]}</Badge>
                {pw.post.topic && <Badge variant="outline" className="text-xs rounded-lg">{pw.post.topic}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  Posted {pw.hoursElapsed}h ago
                </span>
              </div>
              <p className="text-sm text-foreground/80 font-body line-clamp-1">{preview}</p>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" min="0" placeholder="Impressions" value={d.imp} onChange={(e) => setDraft(key, "imp", e.target.value)} className="glass border-border/40 h-9 rounded-lg text-sm" />
                <Input type="number" min="0" placeholder="Reactions" value={d.rx} onChange={(e) => setDraft(key, "rx", e.target.value)} className="glass border-border/40 h-9 rounded-lg text-sm" />
                <Input type="number" min="0" placeholder="Comments" value={d.cm} onChange={(e) => setDraft(key, "cm", e.target.value)} className="glass border-border/40 h-9 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="generate" className="h-8 text-xs rounded-lg" onClick={() => submit(pw)} disabled={savingId === key}>
                  {savingId === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />}
                  Save metrics
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
