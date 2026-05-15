import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostInput } from "@/components/PostInput";
import { PostOutput } from "@/components/PostOutput";
import { PostEditor } from "@/components/PostEditor";
import { MemeGenerator } from "@/components/MemeGenerator";
import { UploadPostDialog } from "@/components/UploadPostDialog";
import { generatePost, type PostMode, type GenerateRequest, type GenerateResponse } from "@/lib/api";
import { Sparkles, Clock, BookOpen } from "lucide-react";
import { SparkleParticles } from "@/components/SparkleParticles";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PostGeneration } from "@/lib/history";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<PostMode>("thought-leadership");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<GenerateResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<Omit<GenerateRequest, "mode"> | null>(null);
  const [reuseTopic, setReuseTopic] = useState<string | undefined>();
  const [reuseFreeText, setReuseFreeText] = useState<string | undefined>();
  const [reuseUrl, setReuseUrl] = useState<string | undefined>();
  const [reuseMemeTemplate, setReuseMemeTemplate] = useState<string | undefined>();

  // Handle reuse from history
  useEffect(() => {
    const reuseId = searchParams.get("reuse");
    if (!reuseId) return;

    const loadReuse = async () => {
      const { data, error } = await supabase
        .from("post_generations")
        .select("*")
        .eq("id", reuseId)
        .single();

      if (error || !data) {
        toast.error("Could not load draft");
        return;
      }
      const item = data as PostGeneration;
      setMode(item.post_type as PostMode);
      setReuseTopic(item.topic_dropdown_value || item.topic || undefined);
      setReuseFreeText(item.input_text || undefined);
      setReuseUrl(item.input_url || undefined);
      setReuseMemeTemplate(item.meme_template || undefined);
      // Load the previously generated output so the editor opens ready to edit
      setOutput({
        mainPost: item.generated_post,
        alternateHooks: item.alternate_hooks || [],
        memeIdeas: item.meme_ideas || [],
        alternateDraft: item.alternate_draft || undefined,
        hashtags: item.hashtags || [],
        cta: item.cta_options || undefined,
        commentReplies: item.comment_replies || [],
      });
      setLastRequest({
        topic: item.topic_dropdown_value || item.topic || undefined,
        freeText: item.input_text || undefined,
        url: item.input_url || undefined,
        memeTemplate: item.meme_template || undefined,
      });
      setSearchParams({}, { replace: true });
      toast.success("Draft loaded for editing ✨");
    };
    loadReuse();
  }, [searchParams, setSearchParams]);

  const saveGeneration = async (
    request: Omit<GenerateRequest, "mode">,
    result: GenerateResponse
  ) => {
    try {
      await supabase.from("post_generations").insert({
        topic: request.topic || null,
        post_type: mode,
        topic_dropdown_value: request.topic || null,
        input_text: request.freeText || null,
        input_url: request.url || null,
        meme_template: request.memeTemplate || null,
        generated_post: result.mainPost,
        alternate_hooks: (result.alternateHooks || []) as any,
        cta_options: result.cta || null,
        hashtags: (result.hashtags || []) as any,
        meme_caption: null,
        alternate_draft: result.alternateDraft || null,
        comment_replies: (result.commentReplies || []) as any,
        meme_ideas: (result.memeIdeas || []) as any,
        status: "draft",
        is_favorite: false,
        generated_post_id: result.generatedPostId || null,
      } as any);
    } catch (e) {
      console.error("Failed to save generation:", e);
    }
  };

  const handleGenerate = async (request: Omit<GenerateRequest, "mode">) => {
    setIsLoading(true);
    setOutput(null);
    setLastRequest(request);
    try {
      const result = await generatePost({ ...request, mode });
      setOutput(result);
      await saveGeneration(request, result);
    } catch (e) {
      console.error(e);
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!output) return;
    setIsLoading(true);
    try {
      const refinedRequest = {
        topic: `Refine this post: ${instruction}\n\nOriginal post:\n${output.mainPost}`,
      };
      const result = await generatePost({
        mode,
        ...refinedRequest,
      });
      setOutput(result);
      await saveGeneration(refinedRequest, result);
    } catch (e) {
      console.error(e);
      toast.error("Refinement failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasOutput = output || isLoading;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SparkleParticles />

      {/* Floating rainbow orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-80 h-80 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(320 100% 80% / 0.35) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-[15%] w-64 h-64 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(180 100% 75% / 0.35) 0%, transparent 70%)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse-glow" style={{ background: 'radial-gradient(circle, hsl(50 100% 80% / 0.25) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/30 px-6 py-5 glass-static">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center glow-rainbow animate-float shadow-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gradient">
                LinkedIn Post Companion
              </h1>
              <p className="text-xs text-muted-foreground font-body">Your voice. Scaled. ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="glass border-border/40 rounded-xl hover:glow-magic"
              onClick={() => navigate("/ella")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ella
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="glass border-border/40 rounded-xl hover:glow-magic"
              onClick={() => navigate("/repository")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Repository
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="glass border-border/40 rounded-xl hover:glow-magic"
              onClick={() => navigate("/history")}
            >
              <Clock className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Generate Post - Centered */}
        <div className="max-w-2xl mx-auto">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as PostMode); setOutput(null); }}>
            <TabsList className="w-full glass-strong h-14 p-1.5 rounded-2xl">
              <TabsTrigger value="meme" className="flex-1 rounded-xl data-[state=active]:glass data-[state=active]:text-foreground data-[state=active]:glow-rainbow data-[state=active]:shadow-lg transition-all duration-300">
                🎭 Meme
              </TabsTrigger>
              <TabsTrigger value="thought-leadership" className="flex-1 rounded-xl data-[state=active]:glass data-[state=active]:text-foreground data-[state=active]:glow-rainbow data-[state=active]:shadow-lg transition-all duration-300">
                💡 Thought
              </TabsTrigger>
              <TabsTrigger value="free-dump" className="flex-1 rounded-xl data-[state=active]:glass data-[state=active]:text-foreground data-[state=active]:glow-rainbow data-[state=active]:shadow-lg transition-all duration-300">
                📝 Free Dump
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="meme">
                <div className="glass rounded-2xl p-6 sparkle-border">
                  <PostInput mode="meme" onGenerate={handleGenerate} isLoading={isLoading} initialTopic={reuseTopic} initialUrl={reuseUrl} initialMemeTemplate={reuseMemeTemplate} />
                </div>
              </TabsContent>
              <TabsContent value="thought-leadership">
                <div className="glass rounded-2xl p-6 sparkle-border">
                  <PostInput mode="thought-leadership" onGenerate={handleGenerate} isLoading={isLoading} initialTopic={reuseTopic} initialUrl={reuseUrl} />
                </div>
              </TabsContent>
              <TabsContent value="free-dump">
                <div className="glass rounded-2xl p-6 sparkle-border">
                  <PostInput mode="free-dump" onGenerate={handleGenerate} isLoading={isLoading} initialFreeText={reuseFreeText} initialUrl={reuseUrl} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Split Layout - Output Left, Editor Right */}
        {hasOutput && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <PostOutput output={output} isLoading={isLoading} mode={mode} onRefine={handleRefine} />
            </div>
            <div className="space-y-6">
              {mode === "meme" && output?.memeIdeas && output.memeIdeas.length > 0 && (
                <MemeGenerator memeIdeas={output.memeIdeas} />
              )}
              {output && <PostEditor output={output} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
