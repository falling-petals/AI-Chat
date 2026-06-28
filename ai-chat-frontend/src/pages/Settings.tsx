import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Settings as SettingsIcon, Eye, EyeOff, Key, Bookmark } from 'lucide-react';
import { modelConfigApi } from '../api/chat';
import type { ModelConfig } from '../types';

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
    } catch {
      navigate('/login');
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
          isActive: configs.length === 0,
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadConfigs();
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
    await modelConfigApi.delete(id);
    await loadConfigs();
  };

  const handleActivate = async (cfg: ModelConfig) => {
    await modelConfigApi.activate(cfg.id!);
    await loadConfigs();
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="h-screen bg-[#F5F3FF] dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-[#475569] dark:text-slate-400" />
          </button>
          <SettingsIcon className="w-6 h-6 text-[#6366F1]" />
          <h1 className="text-lg font-semibold text-[#1E1B4B] dark:text-slate-100">模型设置</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Info card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 text-sm text-[#64748B] dark:text-slate-400">
            在这里配置你的 API Key 和模型。选择供应商后填写对应模型的名称和 API Key（OpenAI 用户也可填入兼容的 API 地址，如 <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">https://api.deepseek.com</code>）。
            配置完成后，点击 <Check className="w-3.5 h-3.5 inline text-green-500" /> 设为当前使用的模型。
          </div>

          {/* Config list */}
          {configs.map((cfg) => (
            <div key={cfg.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#6366F1]/10 text-[#6366F1] text-xs font-medium rounded-md">{cfg.provider}</span>
                    <span className="font-medium text-[#1E1B4B] dark:text-slate-100">{cfg.modelName}</span>
                    {cfg.isActive && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-md">当前使用</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-slate-400">
                    <Key className="w-3.5 h-3.5" />
                    <span className="font-mono">
                      {showKey[cfg.id!] ? cfg.apiKey : `${cfg.apiKey.slice(0, 8)}${'•'.repeat(Math.max(12, cfg.apiKey.length - 8))}`}
                    </span>
                    <button onClick={() => setShowKey(prev => ({ ...prev, [cfg.id!]: !prev[cfg.id!] }))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer">
                      {showKey[cfg.id!] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {cfg.baseUrl && (
                    <p className="text-xs text-[#94A3B8] mt-0.5">{cfg.baseUrl}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!cfg.isActive && (
                    <button onClick={() => handleActivate(cfg)} className="p-2 hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="设为当前使用">
                      <Check className="w-4 h-4 text-[#94A3B8] hover:text-green-500" />
                    </button>
                  )}
                  <button onClick={() => handleEdit(cfg)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" title="编辑">
                    <Bookmark className="w-4 h-4 text-[#94A3B8] hover:text-[#6366F1]" />
                  </button>
                  <button onClick={() => handleDelete(cfg.id!)} className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="删除">
                    <Trash2 className="w-4 h-4 text-[#94A3B8] hover:text-red-500 dark:hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add button */}
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-[#64748B] dark:text-slate-400 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors text-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              添加模型配置
            </button>
          )}

          {/* Add/Edit form */}
          {showForm && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-5 space-y-4">
              <h3 className="font-medium text-[#1E1B4B] dark:text-slate-100">{editingId !== null ? '编辑模型配置' : '添加模型配置'}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#475569] dark:text-slate-400">供应商</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
                  >
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#475569] dark:text-slate-400">模型名称</label>
                  <input
                    value={form.modelName}
                    onChange={(e) => setForm(prev => ({ ...prev, modelName: e.target.value }))}
                    placeholder="如 qwen-plus"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#475569] dark:text-slate-400">API Key</label>
                <input
                  value={form.apiKey}
                  onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  type="password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#475569] dark:text-slate-400">自定义 API 地址（可选）</label>
                <input
                  value={form.baseUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="留空使用默认地址"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={cancelForm} className="px-4 py-2 text-sm text-[#64748B] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer">
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.modelName.trim() || !form.apiKey.trim()}
                  className="px-4 py-2 text-sm bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
