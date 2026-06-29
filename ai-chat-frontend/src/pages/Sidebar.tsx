import { Plus, Trash2, Pin, PinOff, Archive, ArchiveRestore, Settings, LogOut, ChevronDown, ChevronRight, User, PanelLeftClose } from 'lucide-react';
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export default function Sidebar({ conversations, currentConvId, onSelect, onDelete, onTogglePin, onToggleArchive, onNewChat, onSettings, onLogout, sidebarOpen, onToggleSidebar, collapsed, onToggleCollapse }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinned, setShowPinned] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const username = localStorage.getItem('username') || 'User';

  const matchesSearch = (c: Conversation) =>
    !debouncedSearch || (c.title || '').toLowerCase().includes(debouncedSearch.toLowerCase());

  const active = useMemo(() => conversations.filter((c) => !c.archived && matchesSearch(c)), [conversations, matchesSearch]);
  const archived = useMemo(() => conversations.filter((c) => c.archived && matchesSearch(c)), [conversations, matchesSearch]);
  const pinnedConvs = useMemo(() => active.filter((c) => c.pinned), [active]);
  const unpinnedConvs = useMemo(() => active.filter((c) => !c.pinned), [active]);
  const groups = useMemo(() => groupConversations(unpinnedConvs), [unpinnedConvs]);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onToggleSidebar} />
      )}
      <aside className={`
        fixed md:relative z-40 h-full
        bg-[#f8f8f9] dark:bg-[#0f0f0f]
        border-r border-zinc-200 dark:border-zinc-800
        flex flex-col
        transition-all duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${collapsed && !sidebarOpen ? 'w-0 md:w-0 overflow-hidden border-r-0' : 'w-60'}
      `}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">AI Chat</span>
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer" title="收起侧边栏">
              <PanelLeftClose className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          )}
        </div>

        <button
          onClick={onNewChat}
          className="mx-3 mb-2 shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新对话
        </button>

        <div className="mx-3 mb-2 shrink-0">
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 outline-none border border-zinc-200 dark:border-zinc-700 rounded-md"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
          {pinnedConvs.length > 0 && (
            <div className="mx-2 mb-0.5">
              <button
                onClick={() => setShowPinned(!showPinned)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                {showPinned ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Pin className="w-3.5 h-3.5" />
                <span className="font-medium">置顶</span>
                <span className="text-xs text-zinc-400">（{pinnedConvs.length}）</span>
              </button>
            </div>
          )}
          {showPinned && pinnedConvs.map((conv) => (
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
                  title="取消置顶"
                >
                  <PinOff className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleArchive(conv.id); }}
                  className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
                  title="归档"
                >
                  <Archive className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('确认删除此对话？')) onDelete(conv.id); }}
                  className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md cursor-pointer"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          <div className="mx-2">
            <button
              onClick={() => setShowActive(!showActive)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              {showActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="font-medium">对话列表</span>
              <span className="text-xs text-zinc-400">（{unpinnedConvs.length}）</span>
            </button>
          </div>
          {showActive && groups.map((group) => (
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
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('确认删除此对话？')) onDelete(conv.id); }}
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

          {!searchQuery && unpinnedConvs.length === 0 && pinnedConvs.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No conversations yet
            </div>
          )}

          {archived.length > 0 && (
            <>
              <div className="pt-2 mt-1 mx-2 border-t border-zinc-200 dark:border-zinc-800">
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
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('确认删除此对话？')) onDelete(conv.id); }}
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

        <div className="border-t border-zinc-200 dark:border-zinc-800 px-2 py-2 shrink-0 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{username}</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => { onSettings(); setShowUserMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  模型提供商
                </button>
                <div className="flex items-center justify-between px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>切换主题</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={() => { onLogout(); setShowUserMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
