import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  errorMessage: string;
}

export default function ChatInput({ value, onChange, onSend, onKeyDown, disabled, errorMessage }: ChatInputProps) {
  return (
    <div className="p-4 border-t border-white/20 bg-white/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto space-y-2">
        {errorMessage && (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
            placeholder={disabled ? 'AI is thinking...' : 'Type a message...'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
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
