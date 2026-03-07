import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import type { PostMode, GenerateRequest } from "@/lib/api";

interface PostInputProps {
  mode: PostMode;
  onGenerate: (request: Omit<GenerateRequest, "mode">) => void;
  isLoading: boolean;
}

export function PostInput({ mode, onGenerate, isLoading }: PostInputProps) {
  const [topic, setTopic] = useState("");
  const [freeText, setFreeText] = useState("");
  const [url, setUrl] = useState("");
  const [memeTemplate, setMemeTemplate] = useState("");

  const handleSubmit = () => {
    onGenerate({
      topic: mode === "free-dump" ? undefined : topic,
      freeText: mode === "free-dump" ? freeText : undefined,
      url: url || undefined,
      memeTemplate: mode === "meme" ? memeTemplate || undefined : undefined,
    });
  };

  const canGenerate =
    mode === "free-dump" ? freeText.trim().length > 0 : topic.trim().length > 0;

  return (
    <div className="space-y-4">
      {mode !== "free-dump" && (
        <div>
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block">
            {mode === "meme" ? "Topic or trend" : "Topic, thought, or idea"}
          </label>
          <Input
            placeholder={
              mode === "meme"
                ? "e.g. Open rates are deceptive"
                : "e.g. Google Postmaster deprecation"
            }
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/50 h-11"
          />
        </div>
      )}

      {mode === "free-dump" && (
        <div>
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block">
            Dump your raw thoughts
          </label>
          <Textarea
            placeholder="Paste rough notes, broken sentences, half-written drafts, copied examples..."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/50 min-h-[180px] resize-y"
          />
        </div>
      )}

      {mode === "meme" && (
        <div>
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block">
            Meme template or URL <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            placeholder="e.g. The Office congratulations meme, or paste a URL"
            value={memeTemplate}
            onChange={(e) => setMemeTemplate(e.target.value)}
            className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/50 h-11"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-secondary-foreground mb-1.5 block">
          Reference URL <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          placeholder="Article, news link, or source URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/50 h-11"
        />
      </div>

      <Button
        variant="generate"
        size="lg"
        className="w-full mt-2"
        onClick={handleSubmit}
        disabled={!canGenerate || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Generate Post
          </>
        )}
      </Button>
    </div>
  );
}
