"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useState } from "react";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  return (
    <div className="border-b border-gray-200 pb-3 mb-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded ${
            editor.isActive("heading", { level: 1 })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
        >
          h1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded ${
            editor.isActive("heading", { level: 2 })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
        >
          h2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${
            editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          bullet list
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${
            editor.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          ordered list
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded ${
            editor.isActive({ textAlign: "left" })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
        >
          left
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded ${
            editor.isActive({ textAlign: "center" })
              ? "bg-gray-200"
              : "hover:bg-gray-100"
          }`}
        >
          center
        </button>
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-2 rounded ${
            editor.isActive("link") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          link
        </button>
      </div>
      {showLinkInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            placeholder="Enter URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="glass-input flex-grow"
          />
          <button
            onClick={addLink}
            className="bg-iaca-blue text-white px-3 py-1 rounded"
          >
            Add Link
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="px-3 py-1 rounded bg-gray-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

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
      Image,
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
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[100px] px-4',
      },
    },
    immediatelyRender: false,
  });

  if (!isMounted) {
    return <div className="h-64 glass-card animate-pulse" />;
  }

  return (
    <div className="glass-input p-0 overflow-hidden">
      <MenuBar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}