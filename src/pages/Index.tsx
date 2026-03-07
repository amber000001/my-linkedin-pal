import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostInput } from "@/components/PostInput";
import { PostOutput } from "@/components/PostOutput";
import { generatePost, type PostMode, type GenerateRequest, type GenerateResponse } from "@/lib/api";
import { Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-5">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              LinkedIn Post Companion
            </h1>
            <p className="text-xs text-muted-foreground">Your voice. Scaled.</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as PostMode); setOutput(null); }}>
          <TabsList className="w-full bg-secondary/50 border border-border/50 h-12 p-1">
            <TabsTrigger value="meme" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md">
              🎭 Meme Post
            </TabsTrigger>
            <TabsTrigger value="thought-leadership" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md">
              💡 Thought Leadership
            </TabsTrigger>
            <TabsTrigger value="free-dump" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md">
              📝 Free Text Dump
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="meme">
              <PostInput
                mode="meme"
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="thought-leadership">
              <PostInput
                mode="thought-leadership"
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="free-dump">
              <PostInput
                mode="free-dump"
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Output */}
        {(output || isLoading) && (
          <div className="mt-8">
            <PostOutput
              output={output}
              isLoading={isLoading}
              mode={mode}
              onRefine={handleRefine}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
