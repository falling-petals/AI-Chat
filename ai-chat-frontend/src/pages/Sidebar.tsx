import { MessageSquare, Plus, Trash2, Pin, PinOff, Archive, ArchiveRestore, Search, Settings, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
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
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Sidebar({ conversations, currentConvId, onSelect, onDelete, onTogglePin, onToggleArchive, onNewChat, onSettings, onLogout, sidebarOpen, onToggleSidebar }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const matchesSearch = (c: Conversation) =>
    !debouncedSearch || (c.title || '').toLowerCase().includes(debouncedSearch.toLowerCase());

  const active = conversations.filter((c) => !c.archived && matchesSearch(c));
  const archived = conversations.filter((c) => c.archived && matchesSearch(c));

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onToggleSidebar} />
      )}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 flex flex-col
      `}>
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#6366F1]" />
            <span className="font-semibold text-[#1E1B4B] dark:text-slate-100">AI Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={onSettings} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" title="Settings">
              <Settings className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" title="Logout">
              <LogOut className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
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
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-[#1E1B4B] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all"
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
                : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-[#475569] dark:text-slate-400'
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
                  ? <PinOff className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
                  : <Pin className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
                }
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                className="p-1 hover:bg-white rounded-lg cursor-pointer"
                title="归档"
              >
                <Archive className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="p-1 hover:bg-white rounded-lg cursor-pointer"
                title="删除"
              >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 dark:text-red-400" />
              </button>
            </div>
          </div>
        ))}

        {archived.length > 0 && (
          <>
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#64748B] dark:text-slate-400 hover:text-[#1E1B4B] dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
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
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-[#94A3B8]'
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
                    <ArchiveRestore className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="p-1 hover:bg-white rounded-lg cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    </>
  );
}
