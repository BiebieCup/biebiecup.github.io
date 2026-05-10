import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileArchive, Clock, CheckCircle, XCircle, HelpCircle, Upload, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Submission {
  id: string;
  event_id: string;
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
}

const statusConfig = {
  pending: { label: '审核中', icon: <HelpCircle size={15} />, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  approved: { label: '已通过', icon: <CheckCircle size={15} />, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  rejected: { label: '已打回', icon: <XCircle size={15} />, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
};

const formatDate = (d: string) => {
  try { return format(parseISO(d), 'yyyy年M月d日 HH:mm', { locale: zhCN }); }
  catch { return d; }
};

const MySubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase
      .from('submissions')
      .select('*')
      .eq('submitter_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSubmissions(data as Submission[]);
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <FileArchive size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">我的投稿</h1>
            <p className="text-sm text-gray-500">共 {submissions.length}/5 张</p>
          </div>
        </div>
        {submissions.length < 5 && (
          <Link
            to="/submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
          >
            <Upload size={15} />
            继续投稿
          </Link>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-20">
          <FileArchive size={56} className="mx-auto mb-4 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-500">还没有投稿记录</h2>
          <p className="text-sm text-gray-600 mt-1 mb-6">快去投稿吧！每人最多 5 张</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold"
          >
            <Upload size={16} />
            立即投稿
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => {
            const st = statusConfig[sub.status];
            return (
              <div key={sub.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                      <FileArchive size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">{sub.song_name}</h3>
                      <p className="text-sm text-gray-400">{sub.composer} · 谱师：{sub.charter}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}>
                    {st.icon}
                    {st.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-md border ${sub.track_type === 'regular' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-orange-500/10 border-orange-500/30 text-orange-300'}`}>
                    {sub.track_type === 'regular' ? '常规赛道' : '娱乐赛道'}
                  </span>
                  {sub.level_label && (
                    <span className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
                      {sub.level_label}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-400">
                    {sub.mode === 'solo' ? '单人' : `多人协作 (${sub.collaborators.length + 1}人)`}
                  </span>
                </div>

                {sub.status === 'rejected' && sub.review_note && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-300">
                    <XCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                    <div>
                      <span className="font-medium">打回原因：</span>
                      {sub.review_note}
                    </div>
                  </div>
                )}

                {sub.status === 'approved' && sub.review_note && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-green-900/20 border border-green-800/40 text-sm text-green-300">
                    <CheckCircle size={15} className="shrink-0 mt-0.5 text-green-400" />
                    <div>
                      <span className="font-medium">审核备注：</span>
                      {sub.review_note}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    投稿于 {formatDate(sub.created_at)}
                  </div>
                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {sub.file_name}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;
