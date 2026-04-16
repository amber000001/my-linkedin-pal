import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import type { PostMode, GenerateRequest } from "@/lib/api";
import { TOPIC_CATEGORIES } from "@/lib/topics";

const TONE_TAGS = [
  { value: "funny", label: "😂 Funny" },
  { value: "sarcastic", label: "😏 Sarcastic" },
  { value: "quirky", label: "🤪 Quirky" },
  { value: "witty", label: "🧠 Witty" },
  { value: "thankful", label: "🙏 Thankful" },
  { value: "motivational", label: "💪 Motivational" },
  { value: "reflective", label: "🪞 Reflective" },
  { value: "bold", label: "🔥 Bold" },
  { value: "educational", label: "📚 Educational" },
  { value: "vulnerable", label: "💙 Vulnerable" },
];

interface PostInputProps {
  mode: PostMode;
  onGenerate: (request: Omit<GenerateRequest, "mode">) => void;
  isLoading: boolean;
  initialTopic?: string;
  initialFreeText?: string;
  initialUrl?: string;
  initialMemeTemplate?: string;
}

export function PostInput({ mode, onGenerate, isLoading, initialTopic, initialFreeText, initialUrl, initialMemeTemplate }: PostInputProps) {
  const [topic, setTopic] = useState(initialTopic || "");
  const [customTopic, setCustomTopic] = useState("");
  const [freeText, setFreeText] = useState(initialFreeText || "");
  const [url, setUrl] = useState(initialUrl || "");
  const [memeTemplate, setMemeTemplate] = useState(initialMemeTemplate || "");
  const [toneTags, setToneTags] = useState<string[]>([]);

  useEffect(() => {
    if (initialTopic) {
      const allTopics = TOPIC_CATEGORIES.flatMap(c => c.topics);
      if (allTopics.includes(initialTopic)) {
        setTopic(initialTopic);
      } else {
        setTopic("__custom");
        setCustomTopic(initialTopic);
      }
    }
  }, [initialTopic]);

  useEffect(() => { if (initialFreeText) setFreeText(initialFreeText); }, [initialFreeText]);
  useEffect(() => { if (initialUrl) setUrl(initialUrl); }, [initialUrl]);
  useEffect(() => { if (initialMemeTemplate) setMemeTemplate(initialMemeTemplate); }, [initialMemeTemplate]);

  const toggleToneTag = (tag: string) => {
    setToneTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    const effectiveTopic = topic === "__custom" ? customTopic : topic;
    onGenerate({
      topic: effectiveTopic || undefined,
      freeText: mode === "free-dump" ? freeText : undefined,
      url: url || undefined,
      memeTemplate: mode === "meme" ? memeTemplate || undefined : undefined,
      toneTags: mode === "free-dump" && toneTags.length > 0 ? toneTags : undefined,
    });
  };

  const effectiveTopic = topic === "__custom" ? customTopic.trim() : topic;
  const canGenerate =
    mode === "free-dump" ? freeText.trim().length > 0 : effectiveTopic.length > 0;

  return (
    <div className="space-y-4">
      {/* Topic dropdown - shown for all modes now */}
      {mode !== "free-dump" ? (
        <div>
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
            {mode === "meme" ? "🎭 Topic" : "💡 Topic"}
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
              <SelectGroup>
                <SelectLabel className="font-display text-xs text-muted-foreground">Other</SelectLabel>
                <SelectItem value="__custom" className="text-sm">Custom topic...</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {topic === "__custom" && (
            <Input
              placeholder="Type your custom topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl mt-2"
            />
          )}
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
            💡 Topic <span className="text-muted-foreground">(optional – helps categorize)</span>
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
              <SelectGroup>
                <SelectLabel className="font-display text-xs text-muted-foreground">Other</SelectLabel>
                <SelectItem value="__custom" className="text-sm">Custom topic...</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {topic === "__custom" && (
            <Input
              placeholder="Type your custom topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl mt-2"
            />
          )}
        </div>
      )}

      {mode === "free-dump" && (
        <>
          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              📝 Dump your raw thoughts
            </label>
            <Textarea
              placeholder="Paste rough notes, broken sentences, half-written drafts, copied examples..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 min-h-[180px] resize-y rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
              🎨 Tone <span className="text-muted-foreground">(pick as many as you like)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TONE_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleToneTag(tag.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-body transition-all duration-200 border ${
                    toneTags.includes(tag.value)
                      ? "bg-primary/20 border-primary/50 text-foreground glow-magic"
                      : "glass border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === "meme" && (
        <div>
          <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
            🖼️ Meme template or URL <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            placeholder="e.g. The Office congratulations meme, or paste a URL"
            value={memeTemplate}
            onChange={(e) => setMemeTemplate(e.target.value)}
            className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-secondary-foreground mb-1.5 block font-body">
          🔗 Reference URL <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          placeholder="Article, news link, or source URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="glass border-border/40 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl"
        />
      </div>

      <Button
        variant="generate"
        size="lg"
        className="w-full mt-2 rounded-xl"
        onClick={handleSubmit}
        disabled={!canGenerate || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Casting spell...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            ✨ Generate Post
          </>
        )}
      </Button>
    </div>
  );
}
