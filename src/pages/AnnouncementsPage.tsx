import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bell, ArrowLeft, Pin, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

const formatDate = (d: string) => {
  try { return format(parseISO(d), 'yyyy年M月d日 HH:mm', { locale: zhCN }); }
  catch { return d; }
};

export const AnnouncementsListPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAnnouncements(data as Announcement[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Bell size={20} className="text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">公告栏</h1>
          <p className="text-sm text-gray-500">赛事最新动态与通知</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-full mb-1" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : announcements.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {announcements.map(ann => (
              <Link
                key={ann.id}
                to={`/announcements/${ann.id}`}
                className="block p-5 hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-1">
                    {ann.is_pinned
                      ? <Pin size={16} className="text-red-400" />
                      : <Bell size={16} className="text-gray-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ann.is_pinned && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-800/30">置顶</span>
                      )}
                      <h3 className="font-semibold text-gray-200 group-hover:text-white line-clamp-1">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                      <Clock size={12} />
                      {formatDate(ann.created_at)}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-gray-700 group-hover:text-gray-500 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无公告</p>
            <p className="text-sm mt-1">管理员发布公告后将在此显示</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setAnnouncement(data as Announcement);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-3xl">
        <div className="h-8 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/3" />
        <div className="h-40 bg-gray-800 rounded" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">公告不存在</p>
        <button onClick={() => navigate('/announcements')} className="mt-4 text-purple-400 hover:text-purple-300 text-sm">返回公告列表</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <button
        onClick={() => navigate('/announcements')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={16} />
        返回公告列表
      </button>

      <article className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          {announcement.is_pinned && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-800/30">置顶</span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <Clock size={12} />
            {formatDate(announcement.created_at)}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-6">{announcement.title}</h1>
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{announcement.content}</div>
        </div>
      </article>
    </div>
  );
};
