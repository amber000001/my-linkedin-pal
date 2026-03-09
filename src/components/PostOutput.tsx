import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PostMode, GenerateResponse } from "@/lib/api";

interface PostOutputProps {
  output: GenerateResponse | null;
  isLoading: boolean;
  mode: PostMode;
  onRefine: (instruction: string) => void;
}

const REFINE_OPTIONS = [
  "Make it sharper",
  "Make it more personal",
  "Add meme angle",
  "Add hashtags",
  "Shorten slightly",
  "Make it more reflective",
];

export function PostOutput({ output, isLoading, mode, onRefine }: PostOutputProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard ✨");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4 sparkle-border">
        <div className="flex items-center gap-2 text-primary">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium font-body">Weaving your post with magic...</span>
        </div>
        <Skeleton className="h-4 w-full bg-secondary/50" />
        <Skeleton className="h-4 w-5/6 bg-secondary/50" />
        <Skeleton className="h-4 w-4/6 bg-secondary/50" />
        <Skeleton className="h-4 w-full bg-secondary/50" />
        <Skeleton className="h-4 w-3/6 bg-secondary/50" />
      </div>
    );
  }

  if (!output) return null;

  return (
    <div className="space-y-6">
      {/* Main Post */}
      <div className="glass rounded-2xl p-6 sparkle-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-gradient">
            {mode === "meme" ? "✨ Meme Caption & Post" : "✨ Your Post"}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(output.mainPost)}
            className="text-muted-foreground hover:text-foreground hover:glow-magic"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px] font-body">
          {output.mainPost}
        </div>
      </div>

      {/* Alternate Hooks */}
      {output.alternateHooks && output.alternateHooks.length > 0 && (
        <div className="glass rounded-2xl p-6 sparkle-border">
          <h3 className="font-display text-sm font-semibold text-secondary-foreground mb-3">
            🪄 Alternate Hooks
          </h3>
          <ul className="space-y-2">
            {output.alternateHooks.map((hook, i) => (
              <li
                key={i}
                className="text-foreground/80 text-sm pl-3 border-l-2 border-primary/30 cursor-pointer hover:border-primary hover:glow-magic transition-all duration-300 rounded-r-lg py-1"
                onClick={() => copyToClipboard(hook)}
              >
                {hook}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meme Ideas */}
      {output.memeIdeas && output.memeIdeas.length > 0 && (
        <div className="glass rounded-2xl p-6 sparkle-border">
          <h3 className="font-display text-sm font-semibold text-secondary-foreground mb-3">
            🎭 Meme Ideas
          </h3>
          <ul className="space-y-2">
            {output.memeIdeas.map((idea, i) => (
              <li key={i} className="text-foreground/80 text-sm flex gap-2">
                <span className="text-accent font-medium">{i + 1}.</span>
                {idea}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternate Draft */}
      {output.alternateDraft && (
        <div className="glass rounded-2xl p-6 sparkle-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-secondary-foreground">
              🔮 Tighter Alternate
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(output.alternateDraft!)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed text-sm font-body">
            {output.alternateDraft}
          </div>
        </div>
      )}

      {/* Hashtags */}
      {output.hashtags && output.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {output.hashtags.map((tag, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1.5 rounded-full glass text-primary cursor-pointer hover:glow-magic transition-all duration-300"
              onClick={() => copyToClipboard(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      {output.cta && (
        <div className="text-sm text-muted-foreground italic border-l-2 border-accent/30 pl-3">
          CTA: {output.cta}
        </div>
      )}

      {/* Refine Buttons */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-body">🪄 Refine</p>
        <div className="flex flex-wrap gap-2">
          {REFINE_OPTIONS.map((opt) => (
            <Button key={opt} variant="refine" size="sm" onClick={() => onRefine(opt)}>
              {opt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
