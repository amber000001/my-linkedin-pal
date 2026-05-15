import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, Clock, Target } from "lucide-react";
import { toast } from "sonner";

interface Recommendation {
  topic: string;
  rationale: string;
  suggested_hook_pattern: string;
  suggested_time: string;
  confidence: number;
  predicted_lift: string;
  data_basis: string[];
  scores: {
    topic_fit: number;
    timing_fit: number;
    novelty: number;
    pattern_match: number;
    cadence_health: number;
    composite: number;
  };
}

interface Result {
  summary: string;
  recommendations: Recommendation[];
  meta: {
    posts_analyzed: number;
    baseline_reaction_rate: number;
    days_since_last_post: number;
  };
}

export default function AskElla() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const ask = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ella-recommend");
      if (error) throw error;
      setResult(data as Result);
    } catch (e: any) {
      toast.error(e.message || "Ella couldn't reach the data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-static border-border/40">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ask Ella
          </CardTitle>
          <CardDescription>
            Pull-mode strategist. Ella reads your repository and returns the top 3 things to post next, with rationale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={ask} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ella is thinking...</>
            ) : (
              <>What should I post next?</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {result.summary && (
            <Card className="glass-static border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed italic">"{result.summary}"</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {result.meta.posts_analyzed} posts · {result.meta.days_since_last_post} days since your last post · baseline {(result.meta.baseline_reaction_rate * 100).toFixed(2)}% rxn
                </p>
              </CardContent>
            </Card>
          )}

          {result.recommendations.length === 0 ? (
            <Card className="glass-static border-border/40">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Not enough data yet. Add posts with engagement metrics to the repository so Ella can reason.
              </CardContent>
            </Card>
          ) : (
            result.recommendations.map((r, i) => (
              <Card key={i} className="glass-static border-border/40 hover:glow-magic transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">#{i + 1} · composite {r.scores.composite}</div>
                      <CardTitle className="font-display text-base mt-1">{r.topic}</CardTitle>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-primary">{r.predicted_lift}</div>
                      <div className="text-muted-foreground">{Math.round(r.confidence * 100)}% confidence</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{r.rationale}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{r.suggested_time}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Hook: {r.suggested_hook_pattern}</span>
                    </div>
                  </div>
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Score breakdown</summary>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      <div>topic {r.scores.topic_fit}</div>
                      <div>timing {r.scores.timing_fit}</div>
                      <div>novelty {r.scores.novelty}</div>
                      <div>pattern {r.scores.pattern_match}</div>
                      <div>cadence {r.scores.cadence_health}</div>
                    </div>
                    <div className="mt-1">Data: {r.data_basis.join(", ")}</div>
                  </details>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
