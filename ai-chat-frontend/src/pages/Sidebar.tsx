import { MessageSquare, Plus, Trash2, Pin, PinOff, Archive, ArchiveRestore, Search, Settings, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConvId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleArchive: (id: number) => void;
  onNewChat: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar({ conversations, currentConvId, onSelect, onDelete, onTogglePin, onToggleArchive, onNewChat, onSettings, onLogout }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const matchesSearch = (c: Conversation) =>
    !searchQuery || (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());

  const active = conversations.filter((c) => !c.archived && matchesSearch(c));
  const archived = conversations.filter((c) => c.archived && matchesSearch(c));

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
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1E1B4B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {active.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              currentConvId === conv.id
                ? 'bg-[#6366F1]/10 text-[#6366F1]'
                : 'hover:bg-gray-100 text-[#475569]'
            }`}
          >
            {conv.pinned
              ? <Pin className="w-4 h-4 shrink-0 text-[#6366F1]" fill="#6366F1" />
              : <MessageSquare className="w-4 h-4 shrink-0" />
            }
            <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }}
                className="p-1 hover:bg-white rounded-lg cursor-pointer"
                title={conv.pinned ? '取消置顶' : '置顶'}
              >
                {conv.pinned
                  ? <PinOff className="w-3.5 h-3.5 text-[#64748B]" />
                  : <Pin className="w-3.5 h-3.5 text-[#64748B]" />
                }
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                className="p-1 hover:bg-white rounded-lg cursor-pointer"
                title="归档"
              >
                <Archive className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="p-1 hover:bg-white rounded-lg cursor-pointer"
                title="删除"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}

        {archived.length > 0 && (
          <>
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#64748B] hover:text-[#1E1B4B] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                {showArchived ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Archive className="w-4 h-4" />
                <span>已归档（{archived.length}）</span>
              </button>
            </div>
            {showArchived && archived.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors opacity-70 hover:opacity-100 ${
                  currentConvId === conv.id
                    ? 'bg-[#6366F1]/10 text-[#6366F1]'
                    : 'hover:bg-gray-100 text-[#94A3B8]'
                }`}
              >
                <Archive className="w-4 h-4 shrink-0" />
                <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                    className="p-1 hover:bg-white rounded-lg cursor-pointer"
                    title="恢复"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="p-1 hover:bg-white rounded-lg cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
