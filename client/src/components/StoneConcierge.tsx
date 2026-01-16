import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, MessageSquare, Camera, Loader2 } from "lucide-react";

export function StoneConcierge() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { text: string; image?: string }) => {
      const res = await apiRequest("POST", "/api/ai/consultant", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Concierge Recommendation",
        description: "Expert consultation has been generated based on your space.",
      });
      // In a real app, we'd show the recommendation in a nice UI
      console.log(data.recommendation);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-primary/20 bg-background/50 backdrop-blur-md">
      <CardHeader className="text-center">
        <CardTitle className="font-serif text-3xl flex items-center justify-center gap-2">
          <Sparkles className="text-primary" />
          AI Stone Concierge
        </CardTitle>
        <CardDescription>
          Get expert architectural stone advice. Describe your project or upload a photo for a detailed project brief.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your vision (e.g., 'I want a dramatic kitchen island that becomes the focal point of a modern, minimalist home.')"
              className="min-h-[150px] bg-secondary/20"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="relative group">
              <Button variant="outline" className="w-full border-dashed">
                {image ? "Image Captured" : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Upload Reference Photo
                  </>
                )}
              </Button>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                accept="image/*"
              />
            </div>

            <Button 
              className="w-full bg-primary text-black hover:bg-white"
              disabled={(!text && !image) || mutation.isPending}
              onClick={() => mutation.mutate({ text, image: image || undefined })}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consulting Experts...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Get Expert Consultation
                </>
              )}
            </Button>
          </div>

          <div className="bg-primary/5 rounded-lg p-6 border border-primary/10 flex flex-col justify-between">
            <div>
              <h4 className="font-serif text-xl mb-4">Concierge Intelligence</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Our AI analyzes global market trends, quarry availability, and architectural compatibility to provide:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Slab matching based on color palette
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Edge profile recommendations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Maintenance & durability assessment
                </li>
              </ul>
            </div>
            {mutation.data && (
              <div className="mt-6 p-4 bg-background/50 rounded border border-primary/20 max-h-[150px] overflow-y-auto text-xs whitespace-pre-wrap">
                {mutation.data.recommendation}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
