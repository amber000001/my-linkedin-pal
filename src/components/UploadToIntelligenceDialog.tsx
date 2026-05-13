import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, BarChart3, Calendar, FileText, Image, Smile } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PostGeneration } from "@/lib/history";

const POST_TYPES = [
  { value: "thought_leadership", label: "Thought Leadership" },
  { value: "observational", label: "Observational" },
  { value: "meme", label: "Meme" },
  { value: "personal", label: "Personal" },
];

const MODE_TO_POST_TYPE: Record<string, string> = {
  "thought-leadership": "thought_leadership",
  meme: "meme",
  "free-dump": "observational",
};

interface UploadToIntelligenceDialogProps {
  item: PostGeneration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadToIntelligenceDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: UploadToIntelligenceDialogProps) {
  const [datePosted, setDatePosted] = useState("");
  const [postType, setPostType] = useState("thought_leadership");
  const [impressions, setImpressions] = useState("");
  const [reactions, setReactions] = useState("");
  const [commentsInput, setCommentsInput] = useState("");
  const [hasMeme, setHasMeme] = useState(false);
  const [usesEmojis, setUsesEmojis] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens with a new item
  useState(() => {
    if (item && open) {
      setPostType(MODE_TO_POST_TYPE[item.post_type] || "thought_leadership");
      setHasMeme(item.post_type === "meme");
    }
  });

  const resetForm = () => {
    setDatePosted("");
    setPostType("thought_leadership");
    setImpressions("");
    setReactions("");
    setCommentsInput("");
    setHasMeme(false);
    setUsesEmojis(true);
  };

  const handleSubmit = async () => {
    if (!item) return;

    const topic = item.topic_dropdown_value || item.topic || "General";
    const imp = parseInt(impressions) || 0;
    const react = parseInt(reactions) || 0;
    const comm = parseInt(commentsInput) || 0;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("linkedin_posts").insert({
        topic,
        post_type: postType,
        post_text: item.generated_post,
        date_posted: datePosted || null,
        impressions: imp,
        reactions: react,
        comments: comm,
        has_meme: hasMeme,
        uses_emojis: usesEmojis,
      });

      if (error) throw error;

      toast.success("Post uploaded to intelligence repository ✨");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  const topicLabel = item.topic_dropdown_value || item.topic || "General";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="glass-static sm:max-w-lg border-border/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient text-lg">
            📚 Upload to Intelligence
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Preview of what we're uploading */}
          <div className="glass-static rounded-xl p-3 space-y-1">
            <p className="text-xs text-muted-foreground font-body">Post preview</p>
            <p className="text-sm text-foreground/90 font-body line-clamp-3">
              {item.generated_post}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Topic: <span className="text-foreground/80">{topicLabel}</span>
            </p>
          </div>

          {/* Post Type */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              <FileText className="h-3.5 w-3.5 inline mr-1" />
              Post Type
            </label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger className="glass border-border/40 text-foreground h-11 rounded-xl">
                <SelectValue placeholder="Select post type..." />
              </SelectTrigger>
              <SelectContent className="glass-static border-border/30">
                {POST_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value} className="text-sm">
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                Date Posted
              </label>
              <Input
                type="date"
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="glass border-border/40 text-foreground h-11 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-3 h-11">
              <Switch id="has-meme" checked={hasMeme} onCheckedChange={setHasMeme} />
              <Label htmlFor="has-meme" className="text-sm font-body text-secondary-foreground cursor-pointer">
                <Image className="h-3.5 w-3.5 inline mr-1" />
                Has Meme
              </Label>
            </div>
            <div className="flex items-center gap-3 h-11">
              <Switch id="uses-emojis" checked={usesEmojis} onCheckedChange={setUsesEmojis} />
              <Label htmlFor="uses-emojis" className="text-sm font-body text-secondary-foreground cursor-pointer">
                <Smile className="h-3.5 w-3.5 inline mr-1" />
                Uses Emojis
              </Label>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              <BarChart3 className="h-3.5 w-3.5 inline mr-1" />
              Performance Metrics
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Impressions</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
                  className="glass border-border/40 text-foreground h-10 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Reactions</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={reactions}
                  onChange={(e) => setReactions(e.target.value)}
                  className="glass border-border/40 text-foreground h-10 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Comments</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={commentsInput}
                  onChange={(e) => setCommentsInput(e.target.value)}
                  className="glass border-border/40 text-foreground h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="generate"
              size="lg"
              className="flex-1 rounded-xl"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Save to Intelligence Repository
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl"
              onClick={() => { resetForm(); onOpenChange(false); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
