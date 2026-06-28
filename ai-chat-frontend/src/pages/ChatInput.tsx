import { FileText, Paperclip, Search, Square, ArrowUp } from 'lucide-react';
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
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 p-2 border-b border-zinc-200 dark:border-zinc-700">
              {uploadedFiles.map((f) => (
                <div key={f.fileInfo.id} className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1">
                  <FileText className="w-3 h-3" />
                  <span>{f.fileInfo.originalName}</span>
                  <button onClick={() => onRemoveFile(f.fileInfo.id)} className="hover:text-zinc-700 dark:hover:text-zinc-300">×</button>
                </div>
              ))}
            </div>
          )}

          {editing && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-xs text-zinc-500">编辑消息</span>
              <button onClick={onCancelEdit} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">取消</button>
            </div>
          )}

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={disabled ? 'AI is thinking...' : '输入消息...'}
            disabled={disabled}
            className="w-full bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none resize-none"
            rows={1}
            style={{ maxHeight: '200px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 200) + 'px';
            }}
          />

          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={disabled}
                className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input id="file-upload" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileChange} disabled={disabled} multiple />
              <button
                onClick={onToggleSearch}
                disabled={disabled}
                className={`p-1.5 rounded transition-colors ${searchEnabled ? 'text-sky-500 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'} disabled:opacity-30`}
                title="Web search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={streaming ? onStop : onSend}
              disabled={!value.trim() && !streaming && !editing}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
              title={streaming ? 'Stop generating' : 'Send'}
            >
              {streaming ? <Square className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
