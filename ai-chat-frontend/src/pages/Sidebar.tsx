import { Plus, Trash2, Pin, PinOff, Archive, ArchiveRestore, Settings, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onToggleSidebar} />
      )}
      <aside className={`
        fixed md:relative z-40 h-full
        w-60 flex-shrink-0
        bg-[#f8f8f9] dark:bg-[#0f0f0f]
        border-r border-zinc-200 dark:border-zinc-800
        flex flex-col
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">AI Chat</span>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <button onClick={onSettings} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer" title="Settings">
              <Settings className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
            <button onClick={onLogout} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer" title="Logout">
              <LogOut className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="mx-3 mb-2 flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新对话
        </button>

        <div className="mx-3 mb-2">
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {group.label}
              </div>
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-md cursor-pointer transition-colors ${
                    currentConvId === conv.id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="text-sm truncate flex-1">{conv.title || '新对话'}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
                      title={conv.pinned ? '取消置顶' : '置顶'}
                    >
                      {conv.pinned
                        ? <PinOff className="w-3.5 h-3.5 text-zinc-400" />
                        : <Pin className="w-3.5 h-3.5 text-zinc-400" />
                      }
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
                      title="归档"
                    >
                      <Archive className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
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
              <div className="pt-3 mt-3 mx-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                >
                  {showArchived ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>已归档（{archived.length}）</span>
                </button>
              </div>
              {showArchived && archived.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-md cursor-pointer transition-colors ${
                    currentConvId === conv.id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-sm truncate flex-1">{conv.title || '新对话'}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
                      title="恢复"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
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
      </aside>
    </>
  );
}
