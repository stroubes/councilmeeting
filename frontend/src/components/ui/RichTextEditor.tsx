import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content?: Record<string, unknown>;
  onChange?: (content: Record<string, unknown>) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
}: RichTextEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content ?? '',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) {
    return <div className="rich-text-editor-loading">Loading editor...</div>;
  }

  return (
    <div className={`rich-text-editor ${!editable ? 'readonly' : ''}`}>
      {editable && (
        <div className="rich-text-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}
          >
            "
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            Redo
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      <style>{`
        .rich-text-editor {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
        }

        .rich-text-editor.readonly {
          background: var(--surface-muted);
        }

        .rich-text-toolbar {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-2);
          border-bottom: 1px solid var(--border);
          background: var(--surface-muted);
        }

        .rich-text-toolbar button {
          padding: var(--space-1) var(--space-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          cursor: pointer;
          font-weight: 600;
        }

        .rich-text-toolbar button:hover {
          background: var(--accent-soft);
        }

        .rich-text-toolbar button.active {
          background: var(--accent);
          color: var(--text-inverse);
        }

        .rich-text-toolbar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ProseMirror {
          padding: var(--space-3);
          min-height: 200px;
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--text-soft);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror p {
          margin: 0 0 var(--space-2);
        }

        .ProseMirror ul, .ProseMirror ol {
          padding-left: var(--space-6);
          margin: 0 0 var(--space-2);
        }

        .ProseMirror blockquote {
          border-left: 3px solid var(--accent);
          padding-left: var(--space-3);
          margin: 0 0 var(--space-2);
          color: var(--text-soft);
        }

        .rich-text-editor-loading {
          padding: var(--space-4);
          text-align: center;
          color: var(--text-soft);
        }
      `}</style>
    </div>
  );
}
