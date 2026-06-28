import { Send, X, Paperclip, Search, Square } from 'lucide-react';
import type { UploadFileItem } from '../hooks/useFileUpload';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancelEdit?: () => void;
  disabled: boolean;
  errorMessage: string;
  editing?: boolean;
  uploadedFiles: UploadFileItem[];
  onUpload: (files: FileList) => Promise<void>;
  onRemoveFile: (id: number) => void;
  searchEnabled: boolean;
  onToggleSearch: () => void;
  streaming: boolean;
  onStop: () => void;
}

export default function ChatInput({ value, onChange, onSend, onCancelEdit, disabled, errorMessage, editing, uploadedFiles, onUpload, onRemoveFile, searchEnabled, onToggleSearch, streaming, onStop }: ChatInputProps) {
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(new File([file], `pasted-image-${Date.now()}.png`, { type: file.type }));
      await onUpload(dt.files);
    }
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + text + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onUpload(files);
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
      <div className="max-w-4xl mx-auto space-y-2">
        {editing && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-brand-500/10 text-xs text-brand-600 dark:text-brand-400">
            <span>Editing message</span>
            <button onClick={onCancelEdit} className="p-0.5 hover:bg-brand-500/20 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((f) => (
              <div key={f.fileInfo.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-500/10 text-xs text-brand-600 dark:text-brand-400">
                <span className="max-w-[120px] truncate">{f.fileInfo.originalName}</span>
                {f.uploading ? (
                  <div className="w-16 h-1.5 bg-brand-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                  </div>
                ) : (
                  <button onClick={() => onRemoveFile(f.fileInfo.id)} className="p-0.5 hover:bg-brand-500/20 rounded cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all">
          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={disabled}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input id="file-upload" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileChange} disabled={disabled} multiple />
          <button
            onClick={onToggleSearch}
            disabled={disabled}
            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              searchEnabled
                ? 'bg-brand-500 text-white'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Web search"
          >
            <Search className="w-5 h-5" />
          </button>
          <textarea
            className="flex-1 px-1 py-1.5 bg-transparent text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none text-sm leading-relaxed"
            placeholder={disabled ? 'AI is thinking...' : 'Type a message...'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            rows={1}
            style={{ maxHeight: '200px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 200) + 'px';
            }}
          />
          {streaming ? (
            <button
              onClick={onStop}
              className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all cursor-pointer shrink-0"
              title="Stop generating"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
