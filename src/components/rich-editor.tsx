import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Heading2, List, ListOrdered, Link as LinkIcon, ImagePlus, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRef } from "react";

export function RichEditor({
  value,
  onChange,
  userId,
}: { value: string; onChange: (html: string) => void; userId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[280px] px-4 py-3 text-right",
        dir: "rtl",
      },
    },
  });

  if (!editor) return null;

  const handleImage = async (file: File) => {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("journal-images").upload(path, file);
    if (error) return toast.error("آپلود ناموفق", { description: error.message });
    const { data } = await supabase.storage.from("journal-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) editor.chain().focus().setImage({ src: data.signedUrl }).run();
  };

  const addLink = () => {
    const url = prompt("آدرس لینک:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const Btn = ({ on, active, children }: { on: () => void; active?: boolean; children: React.ReactNode }) => (
    <Button type="button" variant="ghost" size="sm" onClick={on}
      className={active ? "bg-accent text-accent-foreground" : ""}>
      {children}
    </Button>
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-border/60 p-2 bg-muted/30">
        <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="size-4" /></Btn>
        <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="size-4" /></Btn>
        <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="size-4" /></Btn>
        <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="size-4" /></Btn>
        <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="size-4" /></Btn>
        <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="size-4" /></Btn>
        <Btn on={addLink}><LinkIcon className="size-4" /></Btn>
        <Btn on={() => fileInput.current?.click()}><ImagePlus className="size-4" /></Btn>
        <input ref={fileInput} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
