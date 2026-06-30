import { useState, useRef, useEffect } from 'react';
import { FileText, Paperclip, Search, Square, ArrowUp, ChevronDown } from 'lucide-react';
import type { UploadFileItem } from '../hooks/useFileUpload';
import type { ModelInfo } from '../types';

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
  availableModels: ModelInfo[];
  selectedModel: { provider: string; name: string } | null;
  onSelectModel: (model: { provider: string; name: string }) => void;
}

export default function ChatInput({ value, onChange, onSend, onCancelEdit, disabled, errorMessage, editing, uploadedFiles, onUpload, onRemoveFile, searchEnabled, onToggleSearch, streaming, onStop, availableModels, selectedModel, onSelectModel }: ChatInputProps) {
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
    <div className="px-4 pb-3 pt-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-[28px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.12)] transition-shadow duration-200">
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 p-2 border-b border-zinc-200 dark:border-zinc-700">
              {uploadedFiles.map((f) => (
                <div key={f.fileInfo.tempId || f.fileInfo.id} className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1">
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
            placeholder="输入消息..."
            className="w-full bg-transparent px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none resize-none"
            rows={1}
            style={{ maxHeight: '200px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 200) + 'px';
            }}
          />

          {errorMessage && (
            <div className="px-3 pb-1">
              <p className="text-xs text-red-500 break-words">{errorMessage}</p>
            </div>
          )}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={disabled}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                title="上传文档"
              >
                <Paperclip className="w-4 h-4" />
                <span className="text-xs">上传文档</span>
              </button>
              <input id="file-upload" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileChange} disabled={disabled} multiple />
              <button
                onClick={onToggleSearch}
                disabled={disabled}
                className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${searchEnabled ? 'text-sky-500 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'} disabled:opacity-30`}
                title="联网搜索"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs">联网搜索</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              {availableModels.length > 0 && selectedModel && (
                <div className="relative" ref={modelRef}>
                  <button
                    onClick={() => setModelPickerOpen(!modelPickerOpen)}
                    disabled={streaming}
                    className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                  >
                    <span className="max-w-20 truncate">{selectedModel.name}</span>
                    {(() => {
                      const cur = availableModels.find(m => m.provider === selectedModel.provider && m.modelName === selectedModel.name);
                      return cur?.isDefault ? <span className="text-[10px] text-zinc-400 ml-0.5">默认</span> : null;
                    })()}
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>
                  {modelPickerOpen && (
                    <div className="absolute bottom-full right-0 mb-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50 max-h-60 overflow-y-auto">
                      {availableModels.map((m, i) => (
                        <button
                          key={m.configId ?? `default-${i}`}
                          onClick={() => {
                            onSelectModel({ provider: m.provider, name: m.modelName });
                            setModelPickerOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                            selectedModel.provider === m.provider && selectedModel.name === m.modelName
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <span className="font-medium">{m.modelName}</span>
                          {m.isDefault && <span className="ml-1.5 text-[10px] text-zinc-400">(默认)</span>}
                          <span className="ml-1.5 text-[10px] text-zinc-400 opacity-60">{m.provider}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={streaming ? onStop : onSend}
                disabled={!value.trim() && !streaming}
                className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                title={streaming ? 'Stop generating' : 'Send'}
              >
                {streaming ? <Square className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-zinc-400 mt-2 select-none">内容由AI生成，可能不准确，请注意核实</p>
      </div>
    </div>
  );
}
