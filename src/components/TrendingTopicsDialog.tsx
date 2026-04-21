import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrendingTopic {
  title: string;
  summary: string;
  angle: string;
  source_url: string;
  source_name: string;
  category: string;
  heat: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: "indian" | "international";
  onSelect: (topic: TrendingTopic) => void;
}

export function TrendingTopicsDialog({ open, onOpenChange, region, onSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  const fetchTopics = async () => {
    setLoading(true);
    setTopics([]);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-trending-topics", {
        body: { region },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTopics(data?.topics || []);
      if (!data?.topics?.length) toast.error("No trending topics returned. Try refreshing.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not fetch trending topics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, region]);

  const regionLabel = region === "indian" ? "🇮🇳 Indian" : "🌍 International";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-3xl max-h-[85vh] overflow-y-auto border-border/40 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gradient flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {regionLabel} Trending - last 7 days
          </DialogTitle>
          <DialogDescription className="font-body">
            Pick a wave to ride. Clicking a topic loads it as your reference - then choose Meme, Thought, or Free Dump.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTopics}
            disabled={loading}
            className="glass border-border/40 rounded-xl"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-body">Scanning the last 7 days for waves worth riding...</p>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <div className="space-y-3">
            {topics.map((t, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-4 border border-border/30 hover:border-primary/40 transition-all hover:glow-magic cursor-pointer group"
                onClick={() => {
                  onSelect(t);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-base font-bold text-foreground group-hover:text-gradient flex-1">
                    {t.title}
                  </h3>
                  <span className="text-lg shrink-0">{t.heat}</span>
                </div>
                <p className="text-sm text-secondary-foreground font-body mb-2">{t.summary}</p>
                <p className="text-xs text-primary font-body italic mb-3">💡 Angle: {t.angle}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{t.category}</Badge>
                    <span className="text-xs text-muted-foreground">{t.source_name}</span>
                  </div>
                  <a
                    href={t.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
