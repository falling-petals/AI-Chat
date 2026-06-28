import { MessageSquare, Plus, Trash2, Pin, PinOff, Archive, ArchiveRestore, Search, Settings, LogOut, ChevronDown, ChevronRight, Bot } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useState, useMemo } from 'react';
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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - target.getTime()) / 86400000;

  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupConversations(convs: Conversation[]) {
  const groups: { label: string; items: Conversation[] }[] = [];
  let currentLabel = '';
  let currentGroup: Conversation[] = [];

  for (const c of convs) {
    const label = formatDateLabel(c.updatedAt);
    if (label !== currentLabel) {
      if (currentGroup.length) groups.push({ label: currentLabel, items: currentGroup });
      currentLabel = label;
      currentGroup = [c];
    } else {
      currentGroup.push(c);
    }
  }
  if (currentGroup.length) groups.push({ label: currentLabel, items: currentGroup });
  return groups;
}

export default function Sidebar({ conversations, currentConvId, onSelect, onDelete, onTogglePin, onToggleArchive, onNewChat, onSettings, onLogout, sidebarOpen, onToggleSidebar }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const matchesSearch = (c: Conversation) =>
    !debouncedSearch || (c.title || '').toLowerCase().includes(debouncedSearch.toLowerCase());

  const active = useMemo(() => conversations.filter((c) => !c.archived && matchesSearch(c)), [conversations, matchesSearch]);
  const archived = useMemo(() => conversations.filter((c) => c.archived && matchesSearch(c)), [conversations, matchesSearch]);
  const groups = useMemo(() => groupConversations(active), [active]);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggleSidebar} />
      )}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        bg-zinc-50 dark:bg-zinc-900 flex flex-col border-r border-zinc-200 dark:border-zinc-800
      `}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">AI Chat</span>
            </div>
            <div className="flex items-center gap-0.5">
              <ThemeToggle />
              <button onClick={onSettings} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title="Settings">
                <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
              <button onClick={onLogout} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title="Logout">
                <LogOut className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>
          </div>
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    currentConvId === conv.id
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {conv.pinned
                    ? <Pin className="w-4 h-4 shrink-0" fill="currentColor" />
                    : <MessageSquare className="w-4 h-4 shrink-0" />
                  }
                  <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
                      title={conv.pinned ? '取消置顶' : '置顶'}
                    >
                      {conv.pinned
                        ? <PinOff className="w-3.5 h-3.5 text-zinc-400" />
                        : <Pin className="w-3.5 h-3.5 text-zinc-400" />
                      }
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
                      title="归档"
                    >
                      <Archive className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {!searchQuery && active.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No conversations yet
            </div>
          )}

          {archived.length > 0 && (
            <>
              <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
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
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all opacity-60 hover:opacity-100 ${
                    currentConvId === conv.id
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Archive className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
                      title="恢复"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
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
    </>
  );
}
