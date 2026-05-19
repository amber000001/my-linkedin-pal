import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ArrowRight } from "lucide-react";

interface Rec {
  topic: string;
  rationale: string;
  predicted_lift: string;
  suggested_time: string;
  scores: { composite: number };
}

const DISMISS_KEY = "ella-ambient-dismissed-at";
const DISMISS_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h cool-down

export default function AmbientSuggestion() {
  const navigate = useNavigate();
  const [rec, setRec] = useState<Rec | null>(null);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_WINDOW_MS) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("ella-recommend");
        if (error || cancelled) return;
        const top: Rec | undefined = data?.recommendations?.[0];
        if (top && top.scores?.composite >= 0.5) setRec(top);
      } catch {
        /* silent ambient */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!rec) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setRec(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass rounded-2xl p-4 border border-border/40 sparkle-border relative animate-fade-in">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 flex items-center justify-center glow-rainbow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display text-gradient mb-0.5">Ella suggests</p>
            <p className="text-sm font-medium leading-snug">
              Post about <span className="text-gradient">{rec.topic}</span> — {rec.predicted_lift}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.rationale}</p>
            <p className="text-[11px] text-muted-foreground mt-1">⏰ {rec.suggested_time}</p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/ella")}
            className="shrink-0 rounded-xl"
            variant="outline"
          >
            Open Ella <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
