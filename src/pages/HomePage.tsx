import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Download, Upload, Calendar, Clock, Trophy, ChevronRight, Music, Star } from 'lucide-react';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [evtRes, annRes] = await Promise.all([
        supabase.from('events').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
      ]);
      if (evtRes.data) setActiveEvent(evtRes.data as Event);
      if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getEventPhase = (event: Event) => {
    if (isFuture(parseISO(event.start_time))) return { label: '报名即将开始', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' };
    if (isPast(parseISO(event.end_time))) return { label: '投稿已截止', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30' };
    return { label: '投稿进行中', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' };
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'yyyy年M月d日 HH:mm', { locale: zhCN });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-gray-900 to-pink-900 border border-purple-700/30 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random(),
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-medium">
              Phigros 自制谱赛事
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              憋憋杯
            </span>
            <span className="text-white ml-3 text-2xl md:text-4xl font-bold opacity-80">BBC</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mb-6">
            欢迎来到憋憋杯官方网站！在这里你可以查看公告、下载谱面、以及投稿参赛。
          </p>
          <div className="flex flex-wrap gap-3">
            {!user && (
              <>
                <Link to="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-900/30">
                  立即注册参赛
                </Link>
                <Link to="/login" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all">
                  登录账号
                </Link>
              </>
            )}
            <Link to="/announcements" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2">
              <Bell size={16} />
              查看公告
            </Link>
            <Link to="/downloads" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2">
              <Download size={16} />
              谱面下载
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Trophy size={20} className="text-yellow-400" />, label: '赛事性质', value: 'Phigros 自制谱' },
          { icon: <Music size={20} className="text-purple-400" />, label: '赛道', value: '常规 & 娱乐' },
          { icon: <Star size={20} className="text-pink-400" />, label: '投稿方式', value: '单人 & 多人' },
          { icon: <Upload size={20} className="text-green-400" />, label: '投稿上限', value: '每人 5 张' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-gray-500">{stat.label}</span></div>
            <span className="text-sm font-semibold text-gray-200">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Event */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-200 flex items-center gap-2">
              <Calendar size={18} className="text-purple-400" />
              当前赛事
            </h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
              </div>
            ) : activeEvent ? (
              <div className="space-y-4">
                {(() => {
                  const phase = getEventPhase(activeEvent);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${phase.bg} ${phase.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {phase.label}
                    </span>
                  );
                })()}
                <h3 className="text-lg font-bold text-white">{activeEvent.title}</h3>
                <p className="text-gray-400 text-sm">{activeEvent.description}</p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock size={13} />
                    <span>投稿期：{formatDate(activeEvent.start_time)} ~ {formatDate(activeEvent.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} />
                    <span>直播时间：{formatDate(activeEvent.live_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} />
                    <span>投票期：{formatDate(activeEvent.vote_start)} ~ {formatDate(activeEvent.vote_end)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={13} />
                    <span>投稿方式：{activeEvent.is_anonymous ? '匿名' : '实名'}</span>
                  </div>
                </div>
                {user && (
                  <Link to="/submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors">
                    <Upload size={15} />
                    前往投稿
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无进行中的赛事</p>
                <p className="text-xs mt-1">敬请期待下一届憋憋杯！</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-200 flex items-center gap-2">
              <Bell size={18} className="text-pink-400" />
              最新公告
            </h2>
            <Link to="/announcements" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              查看全部 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-full" />
                </div>
              ))
            ) : announcements.length > 0 ? (
              announcements.map(ann => (
                <Link key={ann.id} to={`/announcements/${ann.id}`} className="block p-4 hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-start gap-2">
                    {ann.is_pinned && (
                      <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-800/30">置顶</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white line-clamp-1">{ann.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(ann.created_at)}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-gray-700 group-hover:text-gray-500 mt-0.5 ml-auto" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-gray-600">
                <Bell size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无公告</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-300 mb-4">快速开始</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <Upload size={24} className="text-purple-400" />,
              title: '投稿谱面',
              desc: '注册账号后，在投稿页面上传你的 .zip 或 .pez 谱面文件，选择常规或娱乐赛道。',
              link: user ? '/submit' : '/register',
              linkLabel: user ? '立即投稿' : '注册账号',
              color: 'from-purple-900/40 to-purple-800/10 border-purple-700/30',
            },
            {
              icon: <Bell size={24} className="text-pink-400" />,
              title: '查看公告',
              desc: '关注官方公告获取最新赛事信息，包括开赛通知、直播安排、投票时间等。',
              link: '/announcements',
              linkLabel: '查看公告',
              color: 'from-pink-900/40 to-pink-800/10 border-pink-700/30',
            },
            {
              icon: <Download size={24} className="text-green-400" />,
              title: '下载谱面',
              desc: '直播结束后，在谱面下载页面获取本届所有通过审核的参赛谱面打包下载。',
              link: '/downloads',
              linkLabel: '前往下载',
              color: 'from-green-900/40 to-green-800/10 border-green-700/30',
            },
          ].map((card, i) => (
            <div key={i} className={`bg-gradient-to-br ${card.color} border rounded-xl p-5 flex flex-col gap-3`}>
              <div className="w-10 h-10 rounded-xl bg-gray-900/60 flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-200 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-400">{card.desc}</p>
              </div>
              <Link to={card.link} className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors">
                {card.linkLabel} <ChevronRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
