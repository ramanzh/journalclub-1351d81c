import { useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET = "setup-images";

export function SetupImages({
  userId, value, onChange,
}: { userId: string; value: string[]; onChange: (v: string[]) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const paths: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) toast.error("آپلود ناموفق", { description: error.message });
      else paths.push(path);
    }
    setUploading(false);
    if (paths.length) {
      onChange([...(value ?? []), ...paths]);
      toast.success(`${paths.length} تصویر آپلود شد`);
    }
  };

  const remove = (path: string) => onChange((value ?? []).filter((p) => p !== path));

  return (
    <div className="space-y-3">
      {value && value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {value.map((p) => (
            <div key={p} className="relative group">
              <SetupImage path={p} />
              <Button type="button" variant="destructive" size="icon"
                className="absolute top-1 left-1 size-7 opacity-90"
                onClick={() => remove(p)}>
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-accent/30 transition">
        {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">
          {uploading ? "در حال آپلود..." : "تصاویر را انتخاب کنید"}
        </span>
        <input type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
          disabled={uploading} />
      </label>
    </div>
  );
}

export function SetupImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  if (!url) return <div className="w-full aspect-video bg-muted rounded-lg animate-pulse" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt="تصویر ستاپ" className="w-full aspect-video object-cover rounded-lg border border-border" />
    </a>
  );
}
