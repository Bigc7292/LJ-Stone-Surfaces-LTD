import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Wand2, Loader2 } from "lucide-react";

export function VisionaryReImager() {
  const [image, setImage] = useState<string | null>(null);
  const [stoneType, setStoneType] = useState("Calacatta Marble");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { image: string; stoneType: string }) => {
      const res = await apiRequest("POST", "/api/ai/re-imager", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Re-imaging Complete",
        description: "Your space has been re-imagined with " + stoneType,
      });
      setImage(data.imageUrl);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to re-imagine your space. Please try again.",
        variant: "destructive",
      });
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
    <Card className="w-full max-w-4xl mx-auto border-white/10 bg-secondary/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-serif text-3xl">Visionary Re-Imager</CardTitle>
        <CardDescription>
          Upload a photo of your kitchen or bathroom to see it transformed with our premium stone surfaces.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-video relative rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-background/50">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Upload your room photo</p>
                </div>
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                accept="image/*"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Stone Surface</label>
              <Select value={stoneType} onValueChange={setStoneType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose stone type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Calacatta Marble">Calacatta Marble</SelectItem>
                  <SelectItem value="Taj Mahal Quartzite">Taj Mahal Quartzite</SelectItem>
                  <SelectItem value="Blue Roma Quartzite">Blue Roma Quartzite</SelectItem>
                  <SelectItem value="Belvedere Granite">Belvedere Granite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              disabled={!image || mutation.isPending}
              onClick={() => image && mutation.mutate({ image, stoneType })}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Re-Imagine Space
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col justify-center bg-background/30 rounded-lg p-6 border border-white/5">
            <h4 className="font-serif text-xl mb-4 text-primary">How it works</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">01.</span>
                Upload a clear photo of your existing space.
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">02.</span>
                Select one of our exotic stone materials from the catalog.
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">03.</span>
                Our AI Visionary engine replaces the surfaces while maintaining lighting and perspective.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
