import { Send, X } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancelEdit?: () => void;
  disabled: boolean;
  errorMessage: string;
  editing?: boolean;
}

export default function ChatInput({ value, onChange, onSend, onCancelEdit, disabled, errorMessage, editing }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/20 bg-white/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto space-y-2">
        {editing && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#6366F1]/10 text-xs text-[#6366F1]">
            <span>Editing message</span>
            <button onClick={onCancelEdit} className="p-0.5 hover:bg-[#6366F1]/20 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <div className="flex items-start gap-2">
          <textarea
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all resize-none"
            placeholder={disabled ? 'AI is thinking...' : 'Type a message...'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={Math.min(value.split('\n').length, 8)}
          />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="p-3 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
