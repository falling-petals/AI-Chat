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
    <div className="p-4 border-t border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto space-y-2">
        {editing && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#6366F1]/10 text-xs text-[#6366F1]">
            <span>Editing message</span>
            <button onClick={onCancelEdit} className="p-0.5 hover:bg-[#6366F1]/20 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((f) => (
              <div key={f.fileInfo.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#6366F1]/10 text-xs text-[#6366F1]">
                <span className="max-w-[120px] truncate">{f.fileInfo.originalName}</span>
                {f.uploading ? (
                  <div className="w-16 h-1.5 bg-[#6366F1]/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6366F1] rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                  </div>
                ) : (
                  <button onClick={() => onRemoveFile(f.fileInfo.id)} className="p-0.5 hover:bg-[#6366F1]/20 rounded cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {errorMessage && (
          <div className="px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}
        <div className="flex items-start gap-2">
          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={disabled}
            className="p-3 text-[#6366F1]/60 hover:text-[#6366F1] hover:bg-[#6366F1]/5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input id="file-upload" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileChange} disabled={disabled} multiple />
          <button
            onClick={onToggleSearch}
            disabled={disabled}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              searchEnabled
                ? 'bg-[#6366F1] text-white shadow-sm'
                : 'text-[#6366F1]/60 hover:text-[#6366F1] hover:bg-[#6366F1]/5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Web search"
          >
            <Search className="w-5 h-5" />
          </button>
          <textarea
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all resize-none"
            placeholder={disabled ? 'AI is thinking...' : 'Type a message...'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            rows={Math.min(value.split('\n').length, 8)}
          />
          {streaming ? (
            <button
              onClick={onStop}
              className="p-3 bg-red-500 dark:bg-red-600 text-white rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-all cursor-pointer"
              title="Stop generating"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className="p-3 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
