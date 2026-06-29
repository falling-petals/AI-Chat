import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Settings as SettingsIcon, Eye, EyeOff, Key, Bookmark, Bot, Info } from 'lucide-react';
import { modelConfigApi } from '../api/chat';
import type { ModelConfig } from '../types';
import { toast } from 'sonner';

const PROVIDERS = ['dashscope', 'openai'];

interface FormData {
  provider: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
}

const emptyForm: FormData = { provider: 'dashscope', modelName: '', apiKey: '', baseUrl: '' };

export default function Settings() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadConfigs = async () => {
    try {
      const list = await modelConfigApi.list();
      setConfigs(list);
    } catch (err: any) {
      toast.error(err.message);
      if (err.message?.includes('401')) navigate('/login');
    }
  };

  useEffect(() => { loadConfigs(); }, []);

  const handleSubmit = async () => {
    if (!form.modelName.trim() || !form.apiKey.trim()) return;
    setLoading(true);
    try {
      if (editingId !== null) {
        await modelConfigApi.update(editingId, {
          provider: form.provider,
          modelName: form.modelName,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl || null,
        });
      } else {
        await modelConfigApi.save({
          provider: form.provider,
          modelName: form.modelName,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl || null,
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      toast.success(editingId !== null ? '修改成功' : '添加成功');
      try { await loadConfigs(); } catch { /* refresh failure not critical */ }
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cfg: ModelConfig) => {
    setForm({
      provider: cfg.provider,
      modelName: cfg.modelName,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl || '',
    });
    setEditingId(cfg.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await modelConfigApi.delete(id);
      toast.success('删除成功');
      await loadConfigs();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="h-screen bg-white dark:bg-[#151515] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#151515] border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
          <SettingsIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">模型设置</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Info card */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              在这里配置你的 API Key 和模型。选择供应商后填写对应模型的名称和 API Key。
              OpenAI 用户也可填入兼容的 API 地址，如 <code className="text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">https://api.deepseek.com</code>。
              配置完成后可在聊天输入框左侧切换模型。
            </p>
          </div>

          {/* Config list */}
          {configs.map((cfg) => (
            <div key={cfg.id} className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-md">{cfg.provider}</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">{cfg.modelName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Key className="w-3.5 h-3.5" />
                    <span className="font-mono truncate overflow-hidden max-w-[240px]" title={cfg.apiKey}>
                      {showKey[cfg.id!] ? cfg.apiKey : `${cfg.apiKey.slice(0, 8)}${'•'.repeat(Math.max(12, cfg.apiKey.length - 8))}`}
                    </span>
                    <button onClick={() => setShowKey(prev => ({ ...prev, [cfg.id!]: !prev[cfg.id!] }))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors cursor-pointer">
                      {showKey[cfg.id!] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {cfg.baseUrl && (
                    <p className="text-xs text-zinc-400 mt-0.5">{cfg.baseUrl}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(cfg)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer" title="编辑">
                    <Bookmark className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                  </button>
                  <button onClick={() => handleDelete(cfg.id!)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer" title="删除">
                    <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add button */}
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              添加模型配置
            </button>
          )}

          {/* Add/Edit form */}
          {showForm && (
            <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
              <h3 className="font-medium text-zinc-800 dark:text-zinc-100">{editingId !== null ? '编辑模型配置' : '添加模型配置'}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">供应商</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-0 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all"
                  >
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">模型名称</label>
                  <input
                    value={form.modelName}
                    onChange={(e) => setForm(prev => ({ ...prev, modelName: e.target.value }))}
                    placeholder="如 qwen-plus"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-0 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">API Key</label>
                <input
                  value={form.apiKey}
                  onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-0 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">自定义 API 地址（可选）</label>
                <input
                  value={form.baseUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="留空使用默认地址"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-0 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={cancelForm} className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer">
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.modelName.trim() || !form.apiKey.trim()}
                  className="px-4 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? '保存中...' : editingId !== null ? '保存修改' : '添加'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
