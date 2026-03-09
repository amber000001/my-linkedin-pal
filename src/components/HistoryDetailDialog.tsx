import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, RotateCcw, Upload, Star } from "lucide-react";
import type { PostGeneration } from "@/lib/history";

interface HistoryDetailDialogProps {
  item: PostGeneration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: () => void;
  onReuse: () => void;
  onUploadToIntelligence: () => void;
  onToggleFavorite: () => void;
  onUpdateStatus: (status: string) => void;
}

const MODE_LABELS: Record<string, string> = {
  "thought-leadership": "💡 Thought Leadership",
  "meme": "🎭 Meme Post",
  "free-dump": "📝 Free Dump",
};

export function HistoryDetailDialog({
  item,
  open,
  onOpenChange,
  onCopy,
  onReuse,
  onUploadToIntelligence,
  onToggleFavorite,
  onUpdateStatus,
}: HistoryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-static sm:max-w-2xl border-border/30 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient text-lg">
            📄 Generation Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs rounded-lg">
              {MODE_LABELS[item.post_type] || item.post_type}
            </Badge>
            {item.topic_dropdown_value && (
              <Badge variant="outline" className="text-xs rounded-lg">{item.topic_dropdown_value}</Badge>
            )}
            <Badge variant={item.status === "posted" ? "default" : "outline"} className="text-xs rounded-lg capitalize">
              {item.status}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>

          {/* Input info */}
          {(item.topic || item.input_text) && (
            <div className="glass-static rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground font-body">Input</p>
              {item.topic && <p className="text-sm text-foreground/80"><span className="text-muted-foreground">Topic:</span> {item.topic}</p>}
              {item.input_text && <p className="text-sm text-foreground/80 whitespace-pre-wrap"><span className="text-muted-foreground">Text:</span> {item.input_text}</p>}
              {item.input_url && <p className="text-sm text-foreground/80"><span className="text-muted-foreground">URL:</span> {item.input_url}</p>}
              {item.meme_template && <p className="text-sm text-foreground/80"><span className="text-muted-foreground">Meme Template:</span> {item.meme_template}</p>}
            </div>
          )}

          {/* Generated Post */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 font-body">✨ Generated Post</p>
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px] font-body glass-static rounded-xl p-4">
              {item.generated_post}
            </div>
          </div>

          {/* Alternate Hooks */}
          {item.alternate_hooks && item.alternate_hooks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 font-body">🪄 Alternate Hooks</p>
              <ul className="space-y-1">
                {item.alternate_hooks.map((hook, i) => (
                  <li key={i} className="text-sm text-foreground/80 pl-3 border-l-2 border-primary/30 py-1">{hook}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternate Draft */}
          {item.alternate_draft && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 font-body">🔮 Alternate Draft</p>
              <div className="whitespace-pre-wrap text-foreground/80 text-sm font-body glass-static rounded-xl p-4">
                {item.alternate_draft}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.hashtags.map((tag, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full glass-static text-primary">{tag}</span>
              ))}
            </div>
          )}

          {/* CTA */}
          {item.cta_options && (
            <div className="text-sm text-muted-foreground italic border-l-2 border-accent/30 pl-3">
              CTA: {item.cta_options}
            </div>
          )}

          {/* Meme Ideas */}
          {item.meme_ideas && item.meme_ideas.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 font-body">🎭 Meme Ideas</p>
              <ul className="space-y-1">
                {item.meme_ideas.map((idea, i) => (
                  <li key={i} className="text-sm text-foreground/80">{i + 1}. {idea}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onCopy}>
              <Copy className="h-4 w-4 mr-1" /> Copy Post
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onReuse}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reuse Draft
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onUploadToIntelligence}>
              <Upload className="h-4 w-4 mr-1" /> Upload to Intelligence
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onToggleFavorite}>
              <Star className={`h-4 w-4 mr-1 ${item.is_favorite ? "fill-accent text-accent" : ""}`} />
              {item.is_favorite ? "Unfavorite" : "Favorite"}
            </Button>
            {item.status === "draft" && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onUpdateStatus("posted")}>
                ✅ Mark Posted
              </Button>
            )}
            {item.status === "posted" && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onUpdateStatus("draft")}>
                Back to Draft
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
