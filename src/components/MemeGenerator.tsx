import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MemeGeneratorProps {
  memeIdeas: string[];
}

interface GeneratedMeme {
  idea: string;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function MemeGenerator({ memeIdeas }: MemeGeneratorProps) {
  const [memes, setMemes] = useState<GeneratedMeme[]>(
    memeIdeas.map((idea) => ({
      idea,
      imageUrl: null,
      loading: false,
      error: null,
    }))
  );

  const generateMeme = async (index: number) => {
    const updatedMemes = [...memes];
    updatedMemes[index] = { ...updatedMemes[index], loading: true, error: null };
    setMemes(updatedMemes);

    try {
      const { data, error } = await supabase.functions.invoke("generate-meme-image", {
        body: { caption: memes[index].idea },
      });

      if (error) throw error;

      const finalMemes = [...memes];
      finalMemes[index] = {
        ...finalMemes[index],
        imageUrl: data.imageUrl,
        loading: false,
      };
      setMemes(finalMemes);
      toast.success("Meme generated! ✨");
    } catch (e) {
      console.error(e);
      const finalMemes = [...memes];
      finalMemes[index] = {
        ...finalMemes[index],
        loading: false,
        error: "Failed to generate meme",
      };
      setMemes(finalMemes);
      toast.error("Failed to generate meme image");
    }
  };

  const downloadMeme = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meme-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Meme downloaded! 🎉");
    } catch {
      toast.error("Failed to download meme");
    }
  };

  if (memeIdeas.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 sparkle-border">
      <h3 className="font-display text-lg font-semibold text-gradient mb-4">
        🎭 Meme Ideas & Generator
      </h3>
      <div className="space-y-4">
        {memes.map((meme, i) => (
          <div
            key={i}
            className="glass-strong rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-foreground/90 text-sm flex-1">
                <span className="text-primary font-medium">{i + 1}.</span> {meme.idea}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMeme(i)}
                disabled={meme.loading}
                className="shrink-0"
              >
                {meme.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {meme.imageUrl && (
              <div className="relative group">
                <img
                  src={meme.imageUrl}
                  alt={`Meme: ${meme.idea}`}
                  className="w-full rounded-lg shadow-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadMeme(meme.imageUrl!, i)}
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}

            {meme.error && (
              <p className="text-destructive text-xs">{meme.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
