import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Users, User, Plus, X, FileArchive, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Profile {
  id: string;
  username: string;
  email: string;
}

const REGULAR_LEVELS = ['EZ', 'HD', 'IN', 'AT'];

const SubmitPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [trackType, setTrackType] = useState<'regular' | 'entertainment'>('regular');
  const [levelLabel, setLevelLabel] = useState('IN');
  const [customLevel, setCustomLevel] = useState('');
  const [isCustomLevel, setIsCustomLevel] = useState(false);
  const [songName, setSongName] = useState('');
  const [composer, setComposer] = useState('');
  const [charter, setCharter] = useState('');
  const [mode, setMode] = useState<'solo' | 'collab'>('solo');
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [collaborators, setCollaborators] = useState<Profile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetchData = async () => {
      const [evtRes, subRes] = await Promise.all([
        supabase.from('events').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('submissions').select('id', { count: 'exact' }).or(`submitter_id.eq.${user.id},collaborators.cs.["${user.id}"]`),
      ]);
      if (evtRes.data) setActiveEvent(evtRes.data as Event);
      setSubmissionCount(subRes.count ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [user, navigate]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email')
      .neq('id', user?.id)
      .ilike('username', `%${query}%`)
      .limit(5);
    setSearchResults((data as Profile[]) || []);
    setSearching(false);
  };

  const addCollaborator = (p: Profile) => {
    if (collaborators.find(c => c.id === p.id)) return;
    setCollaborators([...collaborators, p]);
    setCollaboratorSearch('');
    setSearchResults([]);
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'zip' && ext !== 'pez') {
      toast.error('只支持 .zip 或 .pez 格式的谱面文件');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('文件大小不能超过 50MB');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeEvent) return;
    if (submissionCount >= 5) { toast.error('你已达到最大投稿数量（5张）'); return; }
    if (!songName.trim() || !composer.trim() || !charter.trim()) { toast.error('请填写完整的曲目信息'); return; }
    if (!file) { toast.error('请上传谱面文件'); return; }

    const effectiveLevel = trackType === 'regular'
      ? (isCustomLevel ? customLevel : levelLabel)
      : (isCustomLevel ? customLevel : '');

    setSubmitting(true);

    try {
      // Upload file to Supabase Storage
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${songName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('submissions')
        .upload(fileName, file, { contentType: 'application/zip' });

      if (uploadErr) throw new Error(`文件上传失败: ${uploadErr.message}`);

      const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(uploadData.path);

      // Insert submission record
      const { error: insertErr } = await supabase.from('submissions').insert({
        event_id: activeEvent.id,
        submitter_id: user.id,
        track_type: trackType,
        level_label: effectiveLevel,
        song_name: songName.trim(),
        composer: composer.trim(),
        charter: charter.trim(),
        mode,
        collaborators: collaborators.map(c => c.id),
        file_url: publicUrl,
        file_name: file.name,
        status: 'pending',
        review_note: null,
        reviewed_by: null,
        reviewed_at: null,
      });

      if (insertErr) throw new Error(`提交失败: ${insertErr.message}`);

      toast.success('投稿成功！请等待管理员审核。');
      navigate('/my-submissions');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '投稿失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="text-center py-20">
        <Upload size={56} className="mx-auto mb-4 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-500">暂无进行中的赛事</h2>
        <p className="text-sm text-gray-600 mt-2">请等待管理员开启新一届憋憋杯</p>
      </div>
    );
  }

  if (submissionCount >= 5) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={56} className="mx-auto mb-4 text-yellow-600" />
        <h2 className="text-xl font-bold text-yellow-500">已达投稿上限</h2>
        <p className="text-sm text-gray-500 mt-2">每人最多投稿 5 张谱面（含合作作品）</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Upload size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">投稿谱面</h1>
          <p className="text-sm text-gray-500">{activeEvent.title} · 已投 {submissionCount}/5 张</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>本届投稿进度</span>
          <span>{submissionCount}/5 张</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${(submissionCount / 5) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        {/* Track Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">赛道选择 *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'regular', label: '常规赛道', desc: 'EZ / HD / IN / AT 标级' },
              { value: 'entertainment', label: '娱乐赛道', desc: '自由创作，不限形式' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setTrackType(opt.value as 'regular' | 'entertainment'); setIsCustomLevel(false); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  trackType === opt.value
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Level Label */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            标级 {trackType === 'regular' ? '*' : '（可选）'}
          </label>
          {trackType === 'regular' && !isCustomLevel ? (
            <div className="flex gap-2 flex-wrap">
              {REGULAR_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelLabel(lvl)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    levelLabel === lvl
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {lvl}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setIsCustomLevel(true); setCustomLevel(''); }}
                className="px-4 py-2 rounded-lg text-sm border border-dashed border-gray-600 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-all"
              >
                自定义
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customLevel}
                onChange={e => setCustomLevel(e.target.value)}
                placeholder={trackType === 'entertainment' ? '自定义标级（可留空）' : '输入自定义标级'}
                maxLength={20}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm"
              />
              {trackType === 'regular' && (
                <button
                  type="button"
                  onClick={() => { setIsCustomLevel(false); setLevelLabel('IN'); }}
                  className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300 text-sm"
                >
                  切换预设
                </button>
              )}
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">曲名 *</label>
            <input
              type="text"
              value={songName}
              onChange={e => setSongName(e.target.value)}
              placeholder="输入曲名"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">曲师 *</label>
            <input
              type="text"
              value={composer}
              onChange={e => setComposer(e.target.value)}
              placeholder="输入曲师/作曲者"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">谱师 *</label>
            <input
              type="text"
              value={charter}
              onChange={e => setCharter(e.target.value)}
              placeholder="输入谱师名（可与用户名不同）"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm"
              required
            />
          </div>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">投稿模式 *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'solo', label: '单人模式', icon: <User size={16} />, desc: '独立完成' },
              { value: 'collab', label: '多人协作', icon: <Users size={16} />, desc: '联合投稿' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setMode(opt.value as 'solo' | 'collab'); if (opt.value === 'solo') setCollaborators([]); }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2 ${
                  mode === opt.value
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="mt-0.5">{opt.icon}</span>
                <div>
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Collaborators */}
        {mode === 'collab' && (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              联合投稿者 <span className="text-gray-600 font-normal">（合作者也计入个人投稿次数）</span>
            </label>
            <div className="space-y-2">
              {collaborators.map(c => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">
                    {c.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 flex-1">{c.username}</span>
                  <span className="text-xs text-gray-600">{c.email}</span>
                  <button type="button" onClick={() => removeCollaborator(c.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              ))}
              <div className="relative">
                <input
                  type="text"
                  value={collaboratorSearch}
                  onChange={e => { setCollaboratorSearch(e.target.value); searchUsers(e.target.value); }}
                  placeholder="搜索用户名添加合作者..."
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm"
                />
                <Plus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                {(searchResults.length > 0 || searching) && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                    {searching ? (
                      <div className="px-4 py-3 text-sm text-gray-500">搜索中...</div>
                    ) : searchResults.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => addCollaborator(r)}
                        disabled={!!collaborators.find(c => c.id === r.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition-colors disabled:opacity-40 text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">
                          {r.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm text-gray-200">{r.username}</div>
                          <div className="text-xs text-gray-500">{r.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">谱面文件 * <span className="text-gray-600 font-normal">（.zip 或 .pez，最大50MB）</span></label>
          <label className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            file ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
          }`}>
            <input
              type="file"
              accept=".zip,.pez"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {file ? (
              <>
                <FileArchive size={28} className="text-purple-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <span className="text-xs text-gray-600">点击重新选择</span>
              </>
            ) : (
              <>
                <ChevronDown size={28} className="text-gray-600" />
                <div className="text-center">
                  <p className="text-sm text-gray-400">点击选择谱面文件</p>
                  <p className="text-xs text-gray-600 mt-0.5">支持 .zip / .pez 格式</p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Upload size={17} />提交投稿</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitPage;
