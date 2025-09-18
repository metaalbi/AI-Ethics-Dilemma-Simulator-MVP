"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { useState } from "react";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[100px] px-4",
      },
    },
    immediatelyRender: false,
  });

  if (!isMounted) {
    return <div className="h-64 glass-card animate-pulse" />;
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="glass-input p-0 overflow-hidden">
      <div className="border-b border-gray-200 pb-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            type="button"
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive("bold") ? "bg-gray-200" : ""
            }`}
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            type="button"
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive("italic") ? "bg-gray-200" : ""
            }`}
            title="Italic"
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive("paragraph") ? "bg-gray-200" : ""
            }`}
            title="Paragraph"
          >
            ¶
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive("bulletList") ? "bg-gray-200" : ""
            }`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive("orderedList") ? "bg-gray-200" : ""
            }`}
            title="Numbered List"
          >
            1.
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""
            }`}
            title="Align Left"
          >
            ←
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
            }`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
            }`}
            title="Align Right"
          >
            →
          </button>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-100"
            title="Undo"
          >
            ↩
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-100"
            title="Redo"
          >
            ↪
          </button>
        </div>
      </div>
      <div className="p-4">
        <EditorContent editor={editor} className="outline-none" />
      </div>
    </div>
  );
}