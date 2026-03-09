import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TOPIC_CATEGORIES } from "@/lib/topics";

export function UploadPostDialog() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [postText, setPostText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpload = async () => {
    if (!topic || !postText.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("linkedin_posts").insert({
        topic,
        post_text: postText.trim(),
      });

      if (error) throw error;

      toast.success("Post uploaded to repository ✨");
      setTopic("");
      setPostText("");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="glass border-border/40 rounded-xl hover:glow-magic">
          <Upload className="h-4 w-4 mr-2" />
          Upload LinkedIn Post
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-lg border-border/30">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient text-lg">
            📚 Upload LinkedIn Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Topic Dropdown */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              📂 Topic
            </label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger className="glass border-border/40 text-foreground h-11 rounded-xl">
                <SelectValue placeholder="Select a topic..." />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/30 max-h-[300px]">
                {TOPIC_CATEGORIES.map((category) => (
                  <SelectGroup key={category.group}>
                    <SelectLabel className="font-display text-xs text-muted-foreground">
                      {category.group}
                    </SelectLabel>
                    {category.topics.map((t) => (
                      <SelectItem key={t} value={t} className="text-sm">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Text */}
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              📝 Post Text
            </label>
            <Textarea
              placeholder="Paste your full LinkedIn post here..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[200px] resize-y rounded-xl"
            />
          </div>

          <Button
            variant="generate"
            size="lg"
            className="w-full rounded-xl"
            onClick={handleUpload}
            disabled={!topic || !postText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Save to Repository
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
