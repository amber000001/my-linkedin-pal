import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus, Save } from "lucide-react";
import { toast } from "sonner";

const SEGMENTS = ["founder", "engineer", "pm", "designer", "recruiter", "other"];

interface Engager {
  id?: string;
  engager_name: string;
  segment: string;
  isNew?: boolean;
}

export default function AudienceOnboarding() {
  const [engagers, setEngagers] = useState<Engager[]>([]);
  const [newName, setNewName] = useState("");
  const [newSegment, setNewSegment] = useState("founder");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("audience_signals")
      .select("id, engager_name, segment")
      .is("linkedin_post_id", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => setEngagers((data || []) as any));
  }, []);

  const addRow = () => {
    if (!newName.trim()) return;
    setEngagers([{ engager_name: newName.trim(), segment: newSegment, isNew: true }, ...engagers]);
    setNewName("");
  };

  const removeRow = async (idx: number) => {
    const e = engagers[idx];
    if (e.id) {
      await supabase.from("audience_signals").delete().eq("id", e.id);
    }
    setEngagers(engagers.filter((_, i) => i !== idx));
  };

  const updateSegment = (idx: number, segment: string) => {
    const next = [...engagers];
    next[idx] = { ...next[idx], segment };
    setEngagers(next);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const toInsert = engagers.filter((e) => e.isNew).map((e) => ({
        engager_name: e.engager_name,
        segment: e.segment,
      }));
      const toUpdate = engagers.filter((e) => e.id);
      if (toInsert.length) {
        const { error } = await supabase.from("audience_signals").insert(toInsert);
        if (error) throw error;
      }
      for (const e of toUpdate) {
        await supabase.from("audience_signals").update({ segment: e.segment }).eq("id", e.id!);
      }
      toast.success("Audience saved");
      const { data } = await supabase
        .from("audience_signals")
        .select("id, engager_name, segment")
        .is("linkedin_post_id", null)
        .order("created_at", { ascending: false });
      setEngagers((data || []) as any);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-static border-border/40">
      <CardHeader>
        <CardTitle className="font-display text-lg">Audience tagging</CardTitle>
        <CardDescription>
          Paste your top 30–50 engagers and tag who they are. This powers the Audience Resonance board (Phase 4) and helps Ella weigh which segments care about which topics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Engager name"
            className="glass border-border/40"
            onKeyDown={(e) => e.key === "Enter" && addRow()}
          />
          <Select value={newSegment} onValueChange={setNewSegment}>
            <SelectTrigger className="w-40 glass border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addRow} variant="outline" className="glass border-border/40">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-1">
          {engagers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No engagers tagged yet.</p>
          ) : (
            engagers.map((e, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30">
                <span className="flex-1 text-sm">{e.engager_name}</span>
                <Select value={e.segment} onValueChange={(v) => updateSegment(idx, v)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => removeRow(idx)} variant="ghost" size="icon" className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Button onClick={saveAll} disabled={saving || engagers.length === 0} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save audience"}
        </Button>
      </CardContent>
    </Card>
  );
}
