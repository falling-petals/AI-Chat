import { MessageSquare, Plus, Trash2, Settings, LogOut } from 'lucide-react';
import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConvId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onNewChat: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar({ conversations, currentConvId, onSelect, onDelete, onNewChat, onSettings, onLogout }: SidebarProps) {
  return (
    <div className="w-72 bg-white/70 backdrop-blur-xl border-r border-white/20 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#6366F1]" />
            <span className="font-semibold text-[#1E1B4B]">AI Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onSettings} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Settings">
              <Settings className="w-4 h-4 text-[#64748B]" />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Logout">
              <LogOut className="w-4 h-4 text-[#64748B]" />
            </button>
          </div>
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] transition-colors text-sm font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              currentConvId === conv.id
                ? 'bg-[#6366F1]/10 text-[#6366F1]'
                : 'hover:bg-gray-100 text-[#475569]'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-lg transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
