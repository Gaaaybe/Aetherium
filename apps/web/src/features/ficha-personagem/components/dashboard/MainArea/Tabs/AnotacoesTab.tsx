import { Card, CardHeader, CardTitle, CardContent, Button, toast } from '@/shared/ui';
import { 
  StickyNote, 
  Save, 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Strikethrough as StrikeIcon, 
  Code as CodeIcon,
  Heading1 as H1Icon,
  Heading2 as H2Icon,
  Heading3 as H3Icon,
  List as BulletListIcon,
  ListOrdered as OrderedListIcon,
  Quote as QuoteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Terminal as CodeBlockIcon,
  CloudCheck,
  CloudLightning,
  Loader2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';

interface AnotacoesTabProps {
  character: CharacterResponse;
  onSync: (data: SyncCharacterData) => Promise<void>;
}

export function AnotacoesTab({ character, onSync }: AnotacoesTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: character.narrative.generalNotes || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6 text-gray-700 dark:text-gray-300 custom-scrollbar overflow-y-auto leading-relaxed',
      },
    },
    onUpdate: () => {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
    },
  });

  const lastCharacterIdRef = useRef(character.id);

  // Re-initialize content only if the character ID changes
  useEffect(() => {
    if (editor && lastCharacterIdRef.current !== character.id) {
      lastCharacterIdRef.current = character.id;
      editor.commands.setContent(character.narrative.generalNotes || '');
    }
  }, [character.id, editor]);

  // Debounced auto-save (2 seconds)
  useEffect(() => {
    if (!editor || !hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const htmlContent = editor.getHTML();
      try {
        await onSync({
          narrative: {
            ...character.narrative,
            generalNotes: htmlContent,
          },
        });
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('unsaved');
        toast.error('Erro ao realizar salvamento automático.');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, editor, character.narrative, onSync]);

  // Manual save trigger
  const handleManualSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    setSaveStatus('saving');
    const htmlContent = editor.getHTML();
    try {
      await onSync({
        narrative: {
          ...character.narrative,
          generalNotes: htmlContent,
        },
      });
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      toast.success('Anotações salvas com sucesso!');
    } catch (err) {
      setSaveStatus('unsaved');
      toast.error('Erro ao salvar as anotações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="border-none shadow-md bg-white dark:bg-gray-900 h-[600px] flex flex-col overflow-hidden">
        {/* Style block for editor list alignment and headings */}
        <style dangerouslySetInnerHTML={{ __html: `
          .ProseMirror ul {
            list-style-type: disc !important;
            padding-left: 1.5rem !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .ProseMirror ol {
            list-style-type: decimal !important;
            padding-left: 1.5rem !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .ProseMirror li {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          .ProseMirror h1 {
            font-size: 1.875rem !important;
            font-weight: 700 !important;
            margin-top: 1.5rem !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.25 !important;
          }
          .ProseMirror h2 {
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            margin-top: 1.25rem !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.25 !important;
          }
          .ProseMirror h3 {
            font-size: 1.25rem !important;
            font-weight: 600 !important;
            margin-top: 1rem !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.25 !important;
          }
          .ProseMirror blockquote {
            border-left: 4px solid #fbbf24 !important;
            padding-left: 1rem !important;
            font-style: italic !important;
            color: #6b7280 !important;
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .ProseMirror pre {
            background-color: #1f2937 !important;
            color: #f3f4f6 !important;
            padding: 1rem !important;
            border-radius: 0.375rem !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .ProseMirror p {
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
        `}} />

        <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 px-6 py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
            <StickyNote className="w-4 h-4 text-yellow-500" />
            Anotações Gerais
          </CardTitle>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <CloudCheck className="w-4 h-4" /> Salvo
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="flex items-center gap-1 text-gray-500 font-medium">
                  <CloudLightning className="w-4 h-4" /> Alterações pendentes
                </span>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 font-bold shadow-sm"
              onClick={handleManualSave}
              loading={isSaving}
            >
              <Save className="w-4 h-4" /> Salvar Agora
            </Button>
          </div>
        </CardHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/80">
          {/* Text Formats */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Negrito (Ctrl+B)"
          >
            <BoldIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Itálico (Ctrl+I)"
          >
            <ItalicIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Tachado"
          >
            <StrikeIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('code') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Código em linha"
          >
            <CodeIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-black text-xs ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Título 1"
          >
            <H1Icon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-black text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Título 2"
          >
            <H2Icon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-black text-xs ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Título 3"
          >
            <H3Icon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Lista de Marcadores"
          >
            <BulletListIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Lista Numerada"
          >
            <OrderedListIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Citação"
          >
            <QuoteIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}
            title="Bloco de Código"
          >
            <CodeBlockIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-1 sm:flex-none" />

          {/* History */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:pointer-events-none"
            title="Desfazer (Ctrl+Z)"
          >
            <UndoIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:pointer-events-none"
            title="Refazer (Ctrl+Shift+Z)"
          >
            <RedoIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Area */}
        <CardContent className="flex-1 p-0 overflow-hidden bg-white dark:bg-gray-900/30">
          <EditorContent editor={editor} className="h-full overflow-y-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
