import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileArchive, Clock, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DownloadItem {
  id: string;
  event_id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  released_at: string;
}

const formatDate = (d: string) => {
  try { return format(parseISO(d), 'yyyy年M月d日 HH:mm', { locale: zhCN }); }
  catch { return d; }
};

const DownloadsPage: React.FC = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('downloads')
      .select('*')
      .order('released_at', { ascending: false })
      .then(({ data }) => {
        if (data) setDownloads(data as DownloadItem[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Download size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">谱面下载</h1>
          <p className="text-sm text-gray-500">直播后放出的参赛谱面合集</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400 flex items-start gap-3">
        <Download size={16} className="shrink-0 text-green-400 mt-0.5" />
        <p>谱面合集将在每届赛事直播结束后由管理员上传。所有通过审核的参赛作品将以 .zip 或 .pez 格式提供下载。</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-full mb-2" />
              <div className="h-8 bg-gray-800 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : downloads.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {downloads.map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 hover:border-green-700/50 rounded-xl p-5 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mt-0.5">
                  <FileArchive size={20} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-200 group-hover:text-white mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                    <Clock size={12} />
                    发布于 {formatDate(item.released_at)}
                  </div>
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                  >
                    <Download size={15} />
                    下载 {item.file_name}
                    <ExternalLink size={13} className="opacity-70" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-20">
          <FileArchive size={56} className="mx-auto mb-4 text-gray-700" />
          <p className="text-lg font-semibold text-gray-500">暂无可下载的谱面</p>
          <p className="text-sm text-gray-600 mt-2">直播结束后，管理员将在此发布参赛谱面合集</p>
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
