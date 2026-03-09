import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostInput } from "@/components/PostInput";
import { PostOutput } from "@/components/PostOutput";
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sparkle particles */}
      <SparkleParticles />

      {/* Floating rainbow orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-80 h-80 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(280 100% 85% / 0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-[15%] w-64 h-64 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(200 100% 85% / 0.3) 0%, transparent 70%)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse-glow" style={{ background: 'radial-gradient(circle, hsl(40 100% 85% / 0.2) 0%, transparent 70%)' }} />
        <div className="absolute top-32 right-[20%] w-48 h-48 rounded-full blur-2xl animate-float" style={{ background: 'radial-gradient(circle, hsl(120 100% 85% / 0.25) 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/30 px-6 py-5 glass">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center glow-rainbow animate-float shadow-lg">
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

      {/* Main */}
      <main className="relative mx-auto max-w-3xl px-6 py-8">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as PostMode); setOutput(null); }}>
          <TabsList className="w-full glass-strong h-14 p-1.5 rounded-2xl">
            <TabsTrigger value="meme" className="flex-1 rounded-xl data-[state=active]:glass data-[state=active]:text-foreground data-[state=active]:glow-rainbow data-[state=active]:shadow-lg transition-all duration-300">
              🎭 Meme Post
            </TabsTrigger>
            <TabsTrigger value="thought-leadership" className="flex-1 rounded-xl data-[state=active]:glass data-[state=active]:text-foreground data-[state=active]:glow-rainbow data-[state=active]:shadow-lg transition-all duration-300">
              💡 Thought Leadership
            </TabsTrigger>
            <TabsTrigger value="free-dump" className="flex-1 rounded-xl data-[state=active]:glass data-[state=active]:text-foreground data-[state=active]:glow-rainbow data-[state=active]:shadow-lg transition-all duration-300">
              📝 Free Text Dump
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

        {/* Output */}
        {(output || isLoading) && (
          <div className="mt-8">
            <PostOutput output={output} isLoading={isLoading} mode={mode} onRefine={handleRefine} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
