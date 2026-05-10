import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Bell, Download, FileArchive, CheckCircle, XCircle,
  Plus, Calendar, Eye, EyeOff, ChevronDown, ChevronUp, Clock, Upload, Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';

type Tab = 'submissions' | 'announcements' | 'downloads' | 'events';

interface Submission {
  id: string;
  event_id: string;
  submitter_id: string;
  track_type: 'regular' | 'entertainment';
  level_label: string;
  song_name: string;
  composer: string;
  charter: string;
  mode: 'solo' | 'collab';
  collaborators: string[];
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  created_at: string;
  submitter?: { username: string; email: string };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  released_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  live_time: string;
  vote_start: string;
  vote_end: string;
  is_anonymous: boolean;
  is_active: boolean;
  created_at: string;
}

const formatDate = (d: string) => {
  try { return format(parseISO(d), 'yyyy年M月d日 HH:mm', { locale: zhCN }); }
  catch { return d; }
};

const statusConfig = {
  pending: { label: '待审核', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  approved: { label: '已通过', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  rejected: { label: '已打回', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
};

const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('submissions');

  useEffect(() => {
    if (!user || !isAdmin) navigate('/');
  }, [user, isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Shield size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">管理后台</h1>
          <p className="text-sm text-gray-500">憋憋杯赛事管理中心</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {[
          { key: 'submissions', label: '投稿审核', icon: <FileArchive size={15} /> },
          { key: 'announcements', label: '发布公告', icon: <Bell size={15} /> },
          { key: 'downloads', label: '谱面发布', icon: <Download size={15} /> },
          { key: 'events', label: '赛事管理', icon: <Calendar size={15} /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'submissions' && <SubmissionsTab />}
      {tab === 'announcements' && <AnnouncementsTab />}
      {tab === 'downloads' && <DownloadsTab />}
      {tab === 'events' && <EventsTab />}
    </div>
  );
};

// ─── Submissions Tab ───────────────────────────────────────────────────────────
const SubmissionsTab: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('*, submitter:profiles!submitter_id(username, email)')
      .order('created_at', { ascending: false });
    if (data) setSubmissions(data as unknown as Submission[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setReviewing(id);
    const { error } = await supabase
      .from('submissions')
      .update({ status, review_note: reviewNote, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('操作失败: ' + error.message);
    } else {
      toast.success(status === 'approved' ? '已通过' : '已打回');
      setReviewNote('');
      setExpanded(null);
      fetchSubmissions();
    }
    setReviewing(null);
  };

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            {f === 'all' ? `全部 (${submissions.length})` : `${statusConfig[f as 'pending' | 'approved' | 'rejected'].label} (${submissions.filter(s => s.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <FileArchive size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无投稿记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const st = statusConfig[sub.status];
            const isExp = expanded === sub.id;
            return (
              <div key={sub.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isExp ? null : sub.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/40 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md ${sub.track_type === 'regular' ? 'bg-blue-500/10 text-blue-300' : 'bg-orange-500/10 text-orange-300'}`}>
                        {sub.track_type === 'regular' ? '常规' : '娱乐'}
                        {sub.level_label && ` · ${sub.level_label}`}
                      </span>
                    </div>
                    <div className="font-bold text-white">{sub.song_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {sub.composer} · 谱师: {sub.charter} ·
                      投稿人: {sub.submitter?.username || '未知'} ({sub.submitter?.email || ''})
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-600 hidden sm:block">{formatDate(sub.created_at)}</span>
                    {isExp ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </button>

                {isExp && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">模式：</span><span className="text-gray-300">{sub.mode === 'solo' ? '单人' : '多人协作'}</span></div>
                      <div><span className="text-gray-500">投稿时间：</span><span className="text-gray-300">{formatDate(sub.created_at)}</span></div>
                      <div><span className="text-gray-500">投稿人邮箱：</span><span className="text-gray-300">{sub.submitter?.email || '-'}</span></div>
                      <div>
                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm">
                          <Upload size={13} /> 下载谱面文件 ({sub.file_name})
                        </a>
                      </div>
                    </div>

                    {sub.status === 'pending' && (
                      <div className="space-y-3 pt-2 border-t border-gray-800">
                        <textarea
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="审核备注（可选，打回时建议说明原因）"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(sub.id, 'approved')}
                            disabled={reviewing === sub.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={15} /> 通过
                          </button>
                          <button
                            onClick={() => handleReview(sub.id, 'rejected')}
                            disabled={reviewing === sub.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle size={15} /> 打回
                          </button>
                        </div>
                      </div>
                    )}

                    {sub.review_note && (
                      <div className="text-sm text-gray-400 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
                        <span className="text-gray-500">审核备注：</span>{sub.review_note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Announcements Tab ─────────────────────────────────────────────────────────
const AnnouncementsTab: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast.error('请填写标题和内容'); return; }
    setSaving(true);
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      content: content.trim(),
      is_pinned: isPinned,
      created_by: user?.id,
    });
    if (error) { toast.error('发布失败: ' + error.message); }
    else {
      toast.success('公告已发布！');
      setTitle(''); setContent(''); setIsPinned(false);
      fetchAnnouncements();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此公告？')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) toast.error('删除失败');
    else { toast.success('已删除'); fetchAnnouncements(); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Create Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-pink-400" /> 发布公告
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="公告标题"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">内容 *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="公告详细内容..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm resize-none"
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500"
            />
            <span className="text-sm text-gray-400">置顶此公告</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-lg bg-pink-700 hover:bg-pink-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? '发布中...' : '发布公告'}
          </button>
        </form>
      </div>

      {/* List */}
      <div>
        <h2 className="font-bold text-gray-200 mb-4">已发布公告</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 text-gray-600 bg-gray-900 border border-gray-800 rounded-xl">
            <Bell size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无公告</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_pinned && <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800/30">置顶</span>}
                    <span className="font-medium text-gray-200 line-clamp-1">{ann.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
                  <span className="text-xs text-gray-700 mt-1 block">{formatDate(ann.created_at)}</span>
                </div>
                <button onClick={() => handleDelete(ann.id)} className="shrink-0 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Downloads Tab ─────────────────────────────────────────────────────────────
const DownloadsTab: React.FC = () => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDownloads = useCallback(async () => {
    const { data } = await supabase.from('downloads').select('*').order('released_at', { ascending: false });
    if (data) setDownloads(data as DownloadItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDownloads(); }, [fetchDownloads]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim() || !fileName.trim()) { toast.error('请填写标题和文件信息'); return; }
    setSaving(true);
    const { error } = await supabase.from('downloads').insert({
      title: title.trim(),
      description: description.trim(),
      file_url: fileUrl.trim(),
      file_name: fileName.trim(),
      released_at: new Date().toISOString(),
      created_by: user?.id,
    });
    if (error) toast.error('发布失败: ' + error.message);
    else {
      toast.success('谱面包已发布！');
      setTitle(''); setDescription(''); setFileUrl(''); setFileName('');
      fetchDownloads();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return;
    const { error } = await supabase.from('downloads').delete().eq('id', id);
    if (error) toast.error('删除失败');
    else { toast.success('已删除'); fetchDownloads(); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-green-400" /> 发布谱面下载
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">标题 *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="如：第一届憋憋杯谱面合集"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="描述内容..." rows={3}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">文件下载链接 * <span className="text-gray-700">（如网盘链接）</span></label>
            <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">文件名 *</label>
            <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="如：BBC_S1_Charts.zip"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm" required />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? '发布中...' : '发布下载'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-bold text-gray-200 mb-4">已发布下载</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl" />)}
          </div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-10 text-gray-600 bg-gray-900 border border-gray-800 rounded-xl">
            <Download size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无发布</p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map(dl => (
              <div key={dl.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200 line-clamp-1 mb-1">{dl.title}</div>
                  {dl.description && <p className="text-xs text-gray-500 line-clamp-2 mb-1">{dl.description}</p>}
                  <a href={dl.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                    <Download size={11} />{dl.file_name}
                  </a>
                </div>
                <button onClick={() => handleDelete(dl.id)} className="shrink-0 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Events Tab ─────────────────────────────────────────────────────────────────
const EventsTab: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [voteStart, setVoteStart] = useState('');
  const [voteEnd, setVoteEnd] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) setEvents(data as Event[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime || !liveTime || !voteStart || !voteEnd) {
      toast.error('请填写完整的赛事信息'); return;
    }
    setSaving(true);
    // Deactivate all existing events first
    await supabase.from('events').update({ is_active: false }).neq('id', '');
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim(),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      live_time: new Date(liveTime).toISOString(),
      vote_start: new Date(voteStart).toISOString(),
      vote_end: new Date(voteEnd).toISOString(),
      is_anonymous: isAnonymous,
      is_active: true,
      created_by: user?.id,
    });
    if (error) toast.error('创建失败: ' + error.message);
    else {
      toast.success('新赛事已开启！');
      setShowForm(false);
      setTitle(''); setDescription(''); setStartTime(''); setEndTime('');
      setLiveTime(''); setVoteStart(''); setVoteEnd(''); setIsAnonymous(false);
      fetchEvents();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (!current) {
      // Deactivate others first
      await supabase.from('events').update({ is_active: false }).neq('id', '');
    }
    const { error } = await supabase.from('events').update({ is_active: !current }).eq('id', id);
    if (error) toast.error('操作失败');
    else { toast.success(current ? '已停用' : '已激活'); fetchEvents(); }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-200">赛事列表</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          开启新赛事
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-purple-700/40 rounded-xl p-5">
          <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Calendar size={17} className="text-purple-400" /> 创建新一届赛事
          </h3>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">赛事名称 *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="如：第二届憋憋杯" className={inputCls} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">赛事简介</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="赛事介绍..." rows={2} className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">投稿开始时间 *</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">投稿截止时间 *</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">直播时间 *</label>
              <input type="datetime-local" value={liveTime} onChange={e => setLiveTime(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">投票开始时间 *</label>
              <input type="datetime-local" value={voteStart} onChange={e => setVoteStart(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">投票截止时间 *</label>
              <input type="datetime-local" value={voteEnd} onChange={e => setVoteEnd(e.target.value)} className={inputCls} required />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                <div>
                  <div className="text-sm text-gray-300 flex items-center gap-1.5">
                    {isAnonymous ? <EyeOff size={14} className="text-purple-400" /> : <Eye size={14} className="text-gray-400" />}
                    {isAnonymous ? '匿名投稿模式' : '实名投稿模式'}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{isAnonymous ? '观众看不到投稿者信息' : '公开显示投稿者用户名'}</div>
                </div>
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">取消</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? '创建中...' : '创建赛事'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-600 bg-gray-900 border border-gray-800 rounded-xl">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无赛事记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(evt => (
            <div key={evt.id} className={`bg-gray-900 border rounded-xl p-5 ${evt.is_active ? 'border-purple-700/50' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {evt.is_active && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        进行中
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                      {evt.is_anonymous ? <><EyeOff size={11} className="inline mr-1" />匿名</> : <><Eye size={11} className="inline mr-1" />实名</>}
                    </span>
                  </div>
                  <h3 className="font-bold text-white">{evt.title}</h3>
                  {evt.description && <p className="text-sm text-gray-500 mt-1">{evt.description}</p>}
                </div>
                <button
                  onClick={() => toggleActive(evt.id, evt.is_active)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    evt.is_active
                      ? 'bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400'
                      : 'bg-gray-800 text-gray-500 hover:bg-purple-900/30 hover:text-purple-400'
                  }`}
                >
                  {evt.is_active ? '停用' : '激活'}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><Clock size={12} />投稿：{formatDate(evt.start_time)} ~ {formatDate(evt.end_time)}</div>
                <div className="flex items-center gap-1.5"><Clock size={12} />直播：{formatDate(evt.live_time)}</div>
                <div className="flex items-center gap-1.5"><Clock size={12} />投票：{formatDate(evt.vote_start)} ~ {formatDate(evt.vote_end)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
