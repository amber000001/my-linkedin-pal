import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostInput } from "@/components/PostInput";
import { PostOutput } from "@/components/PostOutput";
import { PostEditor } from "@/components/PostEditor";
import { MemeGenerator } from "@/components/MemeGenerator";
import { generatePost, type PostMode, type GenerateRequest, type GenerateResponse } from "@/lib/api";
import { Sparkles } from "lucide-react";
import { SparkleParticles } from "@/components/SparkleParticles";
import { toast } from "sonner";

const Index = () => {
  const [mode, setMode] = useState<PostMode>("thought-leadership");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<GenerateResponse | null>(null);

  const handleGenerate = async (request: Omit<GenerateRequest, "mode">) => {
    setIsLoading(true);
    setOutput(null);
    try {
      const result = await generatePost({ ...request, mode });
      setOutput(result);
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
      const result = await generatePost({
        mode,
        topic: `Refine this post: ${instruction}\n\nOriginal post:\n${output.mainPost}`,
      });
      setOutput(result);
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
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center glow-rainbow animate-float shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gradient">
              LinkedIn Post Companion
            </h1>
            <p className="text-xs text-muted-foreground font-body">Your voice. Scaled. ✨</p>
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
                  <PostInput mode="meme" onGenerate={handleGenerate} isLoading={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="thought-leadership">
                <div className="glass rounded-2xl p-6 sparkle-border">
                  <PostInput mode="thought-leadership" onGenerate={handleGenerate} isLoading={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="free-dump">
                <div className="glass rounded-2xl p-6 sparkle-border">
                  <PostInput mode="free-dump" onGenerate={handleGenerate} isLoading={isLoading} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Split Layout - Output Left, Editor Right */}
        {hasOutput && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Generated Output + Meme Generator */}
            <div className="space-y-6">
              <PostOutput output={output} isLoading={isLoading} mode={mode} onRefine={handleRefine} />
              {mode === "meme" && output?.memeIdeas && output.memeIdeas.length > 0 && (
                <MemeGenerator memeIdeas={output.memeIdeas} />
              )}
            </div>

            {/* Right Column - Editor */}
            <div>
              {output && <PostEditor output={output} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
