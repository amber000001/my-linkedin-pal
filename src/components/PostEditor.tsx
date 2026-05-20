import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Copy, Check, Plus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { GenerateResponse } from "@/lib/api";
import type { PostGeneration } from "@/lib/history";
import { MarkPostedDialog } from "@/components/MarkPostedDialog";

interface PostEditorProps {
  output: GenerateResponse | null;
  generation?: PostGeneration | null;
  onMarkedPosted?: () => void;
}

export function PostEditor({ output, generation, onMarkedPosted }: PostEditorProps) {
  const [postContent, setPostContent] = useState("");
  const [hooks, setHooks] = useState<string[]>([""]);
  const [copied, setCopied] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);

  // Sync with output when it changes
  const syncFromOutput = () => {
    if (output) {
      setPostContent(output.mainPost || "");
      setHooks(output.alternateHooks || [""]);
    }
  };

  const copyToClipboard = () => {
    const fullPost = postContent + (hooks.filter(h => h.trim()).length > 0 
      ? "\n\n---\nAlternate Hooks:\n" + hooks.filter(h => h.trim()).join("\n") 
      : "");
    navigator.clipboard.writeText(fullPost);
    setCopied(true);
    toast.success("Post copied to clipboard ✨");
    setTimeout(() => setCopied(false), 2000);
  };

  const addHook = () => setHooks([...hooks, ""]);
  
  const updateHook = (index: number, value: string) => {
    const newHooks = [...hooks];
    newHooks[index] = value;
    setHooks(newHooks);
  };

  const removeHook = (index: number) => {
    if (hooks.length > 1) {
      setHooks(hooks.filter((_, i) => i !== index));
    }
  };

  const insertHook = (hook: string) => {
    setPostContent(hook + "\n\n" + postContent.replace(/^.*?\n\n/, ""));
  };

  const handleMarkPosted = () => {
    if (!generation) {
      toast.error("Generate or load a draft before marking as posted.");
      return;
    }
    setMarkOpen(true);
  };

  return (
    <div className="glass rounded-2xl p-6 sparkle-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-gradient">
          ✏️ Post Editor
        </h3>
        <div className="flex gap-2">
          {output && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncFromOutput}
              className="text-xs"
            >
              Load Generated
            </Button>
          )}
          <Button
            variant="generate"
            size="sm"
            onClick={handleMarkPosted}
            disabled={!generation || !postContent.trim()}
            className="text-xs rounded-lg"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Mark as Posted
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="text-muted-foreground hover:text-foreground hover:glow-magic"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Post Editor */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
            📝 Post Content
          </label>
          <Textarea
            placeholder="Compose your LinkedIn post here..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[200px] h-full resize-none rounded-xl"
          />
        </div>

        {/* Hooks Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-secondary-foreground font-body">
              🪝 Alternate Hooks
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addHook}
              className="h-7 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Hook
            </Button>
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {hooks.map((hook, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Hook ${i + 1}...`}
                  value={hook}
                  onChange={(e) => updateHook(i, e.target.value)}
                  className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 h-9 rounded-lg flex-1 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHook(hook)}
                  className="h-9 px-2 text-xs text-primary"
                  disabled={!hook.trim()}
                >
                  Use
                </Button>
                {hooks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHook(i)}
                    className="h-9 px-2 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hashtags from output */}
        {output?.hashtags && output.hashtags.length > 0 && (
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-2 block font-body">
              #️⃣ Suggested Hashtags (click to add)
            </label>
            <div className="flex flex-wrap gap-2">
              {output.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full glass text-primary cursor-pointer hover:glow-magic transition-all duration-300"
                  onClick={() => setPostContent(postContent + " " + tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <MarkPostedDialog
        item={generation ?? null}
        open={markOpen}
        onOpenChange={setMarkOpen}
        initialFinalText={postContent}
        onSuccess={() => {
          onMarkedPosted?.();
        }}
      />
    </div>
  );
}
