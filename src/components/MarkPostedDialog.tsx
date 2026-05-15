import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, ThumbsUp, ThumbsDown, FileText, BarChart3, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TOPIC_CATEGORIES } from "@/lib/topics";
import type { PostGeneration } from "@/lib/history";

// Levenshtein distance — small inputs (LinkedIn posts), O(n*m) is fine.
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

const MODE_TO_POST_TYPE: Record<string, string> = {
  "thought-leadership": "thought_leadership",
  meme: "meme",
  "free-dump": "observational",
};

interface MarkPostedDialogProps {
  item: PostGeneration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MarkPostedDialog({ item, open, onOpenChange, onSuccess }: MarkPostedDialogProps) {
  const [finalText, setFinalText] = useState("");
  const [topic, setTopic] = useState("");
  const [datePosted, setDatePosted] = useState(() => new Date().toISOString().slice(0, 10));
  const [satisfaction, setSatisfaction] = useState<"positive" | "negative" | null>(null);
  const [editReason, setEditReason] = useState("");
  const [impressions, setImpressions] = useState("");
  const [reactions, setReactions] = useState("");
  const [commentsInput, setCommentsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item && open) {
      setFinalText(item.generated_post || "");
      setTopic(item.topic_dropdown_value || item.topic || "");
      setDatePosted(new Date().toISOString().slice(0, 10));
      setSatisfaction(null);
      setEditReason("");
      setImpressions("");
      setReactions("");
      setCommentsInput("");
    }
  }, [item, open]);

  if (!item) return null;

  const distance = editDistance(item.generated_post || "", finalText);
  const editPct = item.generated_post
    ? Math.min(100, Math.round((distance / Math.max(item.generated_post.length, 1)) * 100))
    : 0;

  const handleSubmit = async () => {
    if (!finalText.trim()) {
      toast.error("Please confirm the final post text.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTopic = topic.trim() || "General";
      const imp = parseInt(impressions) || 0;
      const react = parseInt(reactions) || 0;
      const comm = parseInt(commentsInput) || 0;
      const hasMetrics = imp > 0 || react > 0 || comm > 0;
      const postType = MODE_TO_POST_TYPE[item.post_type] || "thought_leadership";
      const postedAtIso = datePosted ? new Date(`${datePosted}T12:00:00Z`).toISOString() : new Date().toISOString();

      // 1. Insert into intelligence repository (linkedin_posts)
      const { data: lpRow, error: lpErr } = await supabase
        .from("linkedin_posts")
        .insert({
          topic: finalTopic,
          post_type: postType,
          post_text: finalText,
          date_posted: datePosted || null,
          impressions: imp,
          reactions: react,
          comments: comm,
          has_meme: item.post_type === "meme",
          uses_emojis: /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u.test(finalText),
        })
        .select("id")
        .single();
      if (lpErr) throw lpErr;
      const linkedinPostId = lpRow?.id ?? null;

      // 2. Update the analytics row (generated_posts) if linked
      if (item.generated_post_id) {
        const { error: gpErr } = await supabase
          .from("generated_posts")
          .update({
            status: "posted",
            posted_at: postedAtIso,
            linkedin_post_id: linkedinPostId,
            edit_distance: distance,
            edit_reason: editReason.trim() || null,
            user_satisfaction: satisfaction,
            final_post: finalText,
          })
          .eq("id", item.generated_post_id);
        if (gpErr) console.error("generated_posts update error:", gpErr);

        // 3. If initial metrics provided, capture as a t=0 outcome row
        if (hasMetrics) {
          const { error: ocErr } = await supabase.from("generated_post_outcomes").insert({
            generated_post_id: item.generated_post_id,
            hours_since_posting: 0,
            impressions: imp,
            reactions: react,
            comments: comm,
          });
          if (ocErr) console.error("outcome insert error:", ocErr);
        }
      }

      // 4. Mark history row as posted
      const { error: pgErr } = await supabase
        .from("post_generations")
        .update({ status: "posted" })
        .eq("id", item.id);
      if (pgErr) console.error("post_generations update error:", pgErr);

      toast.success("Marked as posted ✨");
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Failed to mark as posted. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-static sm:max-w-2xl border-border/30 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient text-lg">✅ Mark as Posted</DialogTitle>
          <DialogDescription className="font-body text-xs">
            Confirm the version you actually posted. We'll learn from your edits and feed the engagement loop.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Final text */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              <FileText className="h-3.5 w-3.5 inline mr-1" />
              Final post text
            </label>
            <Textarea
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              rows={10}
              className="glass border-border/40 text-foreground rounded-xl font-body text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Edit distance: <span className="text-foreground/80">{distance} chars</span> ({editPct}% changed)
            </p>
          </div>

          {/* Topic + date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
                <FolderOpen className="h-3.5 w-3.5 inline mr-1" /> Topic
              </label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="glass border-border/40 text-foreground h-10 rounded-xl">
                  <SelectValue placeholder="Select a topic..." />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border/30 max-h-[280px]">
                  {TOPIC_CATEGORIES.map((category) => (
                    <SelectGroup key={category.group}>
                      <SelectLabel className="font-display text-xs text-muted-foreground">
                        {category.group}
                      </SelectLabel>
                      {category.topics.map((t) => (
                        <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
                <Calendar className="h-3.5 w-3.5 inline mr-1" /> Date posted
              </label>
              <Input
                type="date"
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="glass border-border/40 text-foreground h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Satisfaction */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              How happy were you with the generation?
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={satisfaction === "positive" ? "default" : "outline"}
                size="sm"
                onClick={() => setSatisfaction(satisfaction === "positive" ? null : "positive")}
                className="rounded-xl"
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Loved it
              </Button>
              <Button
                type="button"
                variant={satisfaction === "negative" ? "default" : "outline"}
                size="sm"
                onClick={() => setSatisfaction(satisfaction === "negative" ? null : "negative")}
                className="rounded-xl"
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Needed work
              </Button>
            </div>
          </div>

          {/* Edit reason */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              What did you change & why? <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={2}
              placeholder="e.g. tightened the hook, swapped CTA, removed an emoji"
              className="glass border-border/40 text-foreground rounded-xl font-body text-sm"
            />
          </div>

          {/* Optional initial metrics */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              <BarChart3 className="h-3.5 w-3.5 inline mr-1" /> Initial metrics <span className="text-muted-foreground">(optional — you'll be reminded at 24h, 7d, 30d)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Impressions</Label>
                <Input type="number" min="0" placeholder="0" value={impressions} onChange={(e) => setImpressions(e.target.value)} className="glass border-border/40 h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Reactions</Label>
                <Input type="number" min="0" placeholder="0" value={reactions} onChange={(e) => setReactions(e.target.value)} className="glass border-border/40 h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Comments</Label>
                <Input type="number" min="0" placeholder="0" value={commentsInput} onChange={(e) => setCommentsInput(e.target.value)} className="glass border-border/40 h-10 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="generate" size="lg" className="flex-1 rounded-xl" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<>✅ Confirm posted</>)}
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
