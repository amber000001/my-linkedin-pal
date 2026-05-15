import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Sparkles, Users } from "lucide-react";
import SparkleParticles from "@/components/SparkleParticles";
import PerformanceHeatmap from "@/components/ella/PerformanceHeatmap";
import TopicROIMatrix from "@/components/ella/TopicROIMatrix";
import AskElla from "@/components/ella/AskElla";
import AudienceOnboarding from "@/components/ella/AudienceOnboarding";

export default function Ella() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SparkleParticles />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-80 h-80 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(280 100% 80% / 0.35) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-[15%] w-64 h-64 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, hsl(160 100% 75% / 0.35) 0%, transparent 70%)', animationDelay: '1s' }} />
      </div>

      <header className="relative border-b border-border/30 px-6 py-5 glass-static">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 flex items-center justify-center glow-rainbow animate-float shadow-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gradient">Ella</h1>
              <p className="text-xs text-muted-foreground font-body">Your proactive content strategist ✨</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="ask" className="space-y-6">
          <TabsList className="glass-strong h-12 p-1.5 rounded-2xl">
            <TabsTrigger value="ask" className="rounded-xl data-[state=active]:glass data-[state=active]:glow-rainbow">
              <Sparkles className="h-4 w-4 mr-2" /> Ask Ella
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl data-[state=active]:glass data-[state=active]:glow-rainbow">
              <BarChart3 className="h-4 w-4 mr-2" /> Insights
            </TabsTrigger>
            <TabsTrigger value="audience" className="rounded-xl data-[state=active]:glass data-[state=active]:glow-rainbow">
              <Users className="h-4 w-4 mr-2" /> Audience
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ask">
            <div className="max-w-3xl mx-auto">
              <AskElla />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <PerformanceHeatmap />
            <TopicROIMatrix />
            <p className="text-xs text-muted-foreground text-center">
              Boards 3 (Hook Patterns), 4 (Audience Resonance), and 5 (Content Gap Radar) ship in Phase 2.
            </p>
          </TabsContent>

          <TabsContent value="audience">
            <div className="max-w-3xl mx-auto">
              <AudienceOnboarding />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
