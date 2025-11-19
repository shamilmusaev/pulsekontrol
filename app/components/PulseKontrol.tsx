'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Moon, 
  Sun, 
  ExternalLink, 
  Zap,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { FaHackerNews, FaGithub, FaReddit } from 'react-icons/fa';

// --- Стили для анимации мерцания (Broken Bulb) ---
const flickerStyle = `
  @keyframes flicker {
    0% { opacity: 1; }
    10% { opacity: 0.4; }
    20% { opacity: 1; }
    30% { opacity: 0.2; }
    40% { opacity: 1; }
    50% { opacity: 0.8; }
    60% { opacity: 0.1; }
    70% { opacity: 1; }
    80% { opacity: 0.5; }
    90% { opacity: 1; }
    100% { opacity: 1; }
  }
  .animate-flicker {
    animation: flicker 0.6s linear;
  }
`;

// --- Компоненты UI ---

const DashboardPanel = ({ title, subtitle, children, className = "" }: { title: string, subtitle: React.ReactNode, children: React.ReactNode, className?: string }) => (
  <div className={`
    flex flex-col h-full
    rounded-3xl border shadow-2xl overflow-hidden transition-all duration-500
    dark:border-white/5 dark:bg-[#0F1016]/60 dark:backdrop-blur-md
    bg-white/70 border-slate-200 backdrop-blur-xl shadow-lg
    ${className}
  `}>
    <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/5 border-slate-200/70">
      <h2 className="text-sm font-bold tracking-widest dark:text-slate-100 text-slate-800 uppercase">{title}</h2>
      <div className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">{subtitle}</div>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
      {children}
    </div>
  </div>
);

const ListItem = ({ rank, title, subtitle, metadata, url, isActive, type = "neutral" }: { rank: number, title: string, subtitle: string, metadata: React.ReactNode, url: string, isActive: boolean, type?: string }) => {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all duration-300
        relative overflow-hidden border
        dark:hover:bg-white/[0.03] hover:bg-slate-100/70
        ${isActive 
          ? type === 'github'
            ? 'dark:bg-white/[0.06] bg-white/80 border-white/20 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]'
            : type === 'reddit'
              ? 'dark:bg-orange-500/[0.08] bg-orange-50/80 border-orange-500/30 shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)]'
              : 'dark:bg-blue-500/[0.08] bg-blue-50/80 border-blue-500/30 shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]' 
          : 'border-transparent'}
      `}
    >
      {/* Активный градиентный фон для выделенного элемента */}
      {isActive && (
        <div className={`absolute inset-0 bg-gradient-to-r ${
          type === 'github' ? 'from-white/10' : 
          type === 'reddit' ? 'from-orange-500/10' : 
          'from-blue-500/10'
        } to-transparent opacity-50 pointer-events-none`} />
      )}

      {/* Rank Circle */}
      <div className={`
        flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mt-0.5 z-10 transition-colors
        ${isActive 
          ? type === 'github'
            ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
            : type === 'reddit'
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]'
              : 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
          : 'dark:bg-[#1A1B26] bg-slate-200/70 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}
      `}>
        {rank}
      </div>

      <div className="flex-1 min-w-0 z-10">
        {/* Title */}
        <h3 className={`
          text-[15px] font-medium leading-snug mb-1 truncate transition-colors
          ${isActive 
            ? type === 'github'
              ? 'text-slate-900 dark:text-white'
              : type === 'reddit'
                ? 'text-orange-700 dark:text-orange-50'
                : 'text-blue-700 dark:text-blue-50' 
            : 'text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white'}
        `}>
          {title}
        </h3>
        
        {/* Subtitle (Domain or Repo details) */}
        <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 truncate group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
          {subtitle}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
          {metadata}
        </div>
      </div>
    </a>
  );
};

// --- Логика ---

const formatTimeAgo = (dateInput: number | string | Date) => {
  const now = new Date();
  const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace('www.', '').toUpperCase();
  } catch {
    return 'NEWS.YCOMBINATOR.COM';
  }
};

const AVAILABLE_SUBREDDITS = [
  'ClaudeCode',
  'reactjs',
  'nextjs',
  'webdev',
  'javascript',
  'typescript',
  'programming',
  'ArtificialInteligence',
  'MachineLearning'
];

export default function PulseKontrol() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date()); // For UI updates
  const [hnStories, setHnStories] = useState<any[]>([]);
  const [ghRepos, setGhRepos] = useState<any[]>([]);
  const [redditPosts, setRedditPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 'all' | 'hn' | 'gh' | 'reddit'
  const [activeTab, setActiveTab] = useState('all'); 
  
  // Reddit Subreddit Selection
  const [selectedSubreddit, setSelectedSubreddit] = useState('ClaudeCode');
  const [isSubredditMenuOpen, setIsSubredditMenuOpen] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(true);
  const [isFlickering, setIsFlickering] = useState(false);

  // Управление темой (исправлено)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Update current time every minute for "time ago" display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setIsFlickering(true); // Запускаем анимацию
    setIsDark(prev => !prev);
    // Убираем класс анимации через время, чтобы можно было кликнуть снова
    setTimeout(() => setIsFlickering(false), 600);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // HN
      const hnTopIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const hnTopIds = await hnTopIdsRes.json();
      const top20Ids = hnTopIds.slice(0, 15);
      const hnData = await Promise.all(top20Ids.map((id: number) => 
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
      ));

      // GitHub
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const dateString = oneWeekAgo.toISOString().split('T')[0];
      const ghRes = await fetch(
        `https://api.github.com/search/repositories?q=created:>${dateString}&sort=stars&order=desc&per_page=15`
      );
      const ghData = await ghRes.json();

      // Reddit - direct client-side fetch to avoid 403 on Vercel
      const redditRes = await fetch(`https://www.reddit.com/r/${selectedSubreddit}/hot.json?limit=15`);
      const redditData = await redditRes.json();
      const redditPosts = redditData.data?.children
        ?.map((child: any) => child.data)
        .filter((post: any) => !post.stickied) // Filter out stickied posts
        || [];

      setHnStories(hnData);
      setGhRepos(ghData.items || []);
      setRedditPosts(redditPosts);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSubreddit]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3600000); // 1 hour = 3600000 ms
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className={`min-h-screen min-h-[100dvh] w-full font-sans selection:bg-blue-500/30 relative transition-colors duration-500 ${isDark ? 'text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      
      <style>{flickerStyle}</style>

      {/* --- ФОН --- */}
      {/* Темный фон (космический) */}
      <div className={`fixed inset-0 z-[-1] pointer-events-none bg-[#08090F] transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] rounded-full bg-[#1d4ed8] opacity-[0.15] blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-[#7e22ce] opacity-[0.1] blur-[100px] mix-blend-screen" />
        <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vh] rounded-full bg-[#3b82f6] opacity-[0.05] blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>
      
      {/* Светлый фон (глассморфизм) */}
      <div className={`fixed inset-0 z-[-2] pointer-events-none transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
         {/* Мягкий фон для глассморфизма */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-slate-100/80 to-purple-50/80" />
         {/* Размытые "пятна" для эффекта глубины */}
         <div className="absolute top-[10%] left-[5%] w-[50vw] h-[50vh] rounded-full bg-blue-300 opacity-[0.15] blur-[150px] mix-blend-screen" />
         <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vh] rounded-full bg-purple-300 opacity-[0.1] blur-[120px] mix-blend-screen" />
      </div>

      {/* 5.1 Хедер */}
      <header className="pt-4 md:pt-8 pb-4 md:pb-6 px-4 md:px-10 max-w-[1800px] mx-auto safe-area-top">
        <div className="flex flex-col gap-4">
          
          {/* Навигация слева (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] uppercase overflow-x-auto scrollbar-hide">
            
            {/* Кнопка ALL (Dashboard) */}
             <button 
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 transition-colors hover:text-blue-400 whitespace-nowrap
                ${activeTab === 'all' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-slate-500 dark:text-slate-500'}`}
            >
              <LayoutDashboard className="w-3 h-3" />
              All Feeds
            </button>

            <div className="w-px h-4 dark:bg-slate-500/20 bg-slate-400/20 flex-shrink-0"></div>

            {/* Кнопка Hacker News */}
            <button 
              onClick={() => setActiveTab('hn')}
              className={`flex items-center gap-3 transition-colors hover:text-blue-400 whitespace-nowrap
                ${activeTab === 'hn' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-slate-500 dark:text-slate-500'}`}
            >
              {/* Индикатор активной вкладки (точка) */}
              {activeTab === 'hn' && (
                 <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              )}
              <FaHackerNews className="w-3 h-3" />
              Hacker News
            </button>

            {/* Кнопка GitHub */}
            <button 
              onClick={() => setActiveTab('gh')}
              className={`flex items-center gap-3 transition-colors hover:text-blue-400 whitespace-nowrap
                ${activeTab === 'gh' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-slate-500 dark:text-slate-500'}`}
            >
              {activeTab === 'gh' && (
                 <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              )}
              <FaGithub className="w-3 h-3" />
              Github Live
            </button>

            {/* Кнопка Reddit */}
            <button 
              onClick={() => setActiveTab('reddit')}
              className={`flex items-center gap-3 transition-colors hover:text-blue-400 whitespace-nowrap
                ${activeTab === 'reddit' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-slate-500 dark:text-slate-500'}`}
            >
              {activeTab === 'reddit' && (
                 <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              )}
              <FaReddit className="w-3 h-3" />
              Reddit
            </button>
          </div>

          {/* Мобильная навигация и контролы */}
          <div className="flex md:hidden items-center justify-between gap-3">
            {/* Мобильная навигация */}
            <div className="flex items-center gap-4 text-[10px] font-bold tracking-[0.15em] uppercase overflow-x-auto scrollbar-hide flex-1">
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap
                  ${activeTab === 'all' 
                    ? 'text-blue-500 dark:text-blue-500' 
                    : 'text-slate-500 dark:text-slate-500'}`}
              >
                <LayoutDashboard className="w-3 h-3" />
                <span className="hidden sm:inline">All</span>
              </button>
              <button 
                onClick={() => setActiveTab('hn')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap
                  ${activeTab === 'hn' 
                    ? 'text-blue-500 dark:text-blue-500' 
                    : 'text-slate-500 dark:text-slate-500'}`}
              >
                <FaHackerNews className="w-3 h-3" />
                <span className="hidden sm:inline">HN</span>
              </button>
              <button 
                onClick={() => setActiveTab('gh')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap
                  ${activeTab === 'gh' 
                    ? 'text-blue-500 dark:text-blue-500' 
                    : 'text-slate-500 dark:text-slate-500'}`}
              >
                <FaGithub className="w-3 h-3" />
                <span className="hidden sm:inline">GH</span>
              </button>
              <button 
                onClick={() => setActiveTab('reddit')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap
                  ${activeTab === 'reddit' 
                    ? 'text-blue-500 dark:text-blue-500' 
                    : 'text-slate-500 dark:text-slate-500'}`}
              >
                <FaReddit className="w-3 h-3" />
                <span className="hidden sm:inline">RD</span>
              </button>
            </div>

            {/* Мобильные контролы - компактные */}
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchData}
                className="p-2 rounded-full dark:bg-[#1A1B26]/80 dark:border-white/5 border-slate-200 bg-white/70 hover:bg-blue-500 hover:text-white transition-all shadow-lg backdrop-blur-sm border"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={toggleTheme}
                className={`
                  p-2 rounded-full 
                  dark:bg-[#1A1B26]/80 dark:border-white/5 bg-white/70 border border-slate-200 
                  backdrop-blur-sm shadow-md transition-all
                  ${isFlickering ? 'animate-flicker' : ''}
                `}
              >
                <div className={`
                  w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-300
                  ${isDark ? 'bg-yellow-500' : 'bg-blue-600'}
                `}></div>
              </button>
            </div>
          </div>

          {/* Статус справа (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-[10px] font-bold tracking-wider uppercase dark:text-slate-500 text-slate-400 justify-end">
            <div className="flex flex-col items-end">
              <span className="mb-0.5 opacity-70">Last refresh</span>
              <span className="dark:text-slate-300 text-slate-700 flex items-center gap-2">
                 {(() => {
                   const diff = Math.floor((currentTime.getTime() - lastRefresh.getTime()) / 1000);
                   if (diff < 60) return 'just now';
                   if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
                   if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
                   return `${Math.floor(diff / 86400)} days ago`;
                 })()}
              </span>
            </div>
            
            <button 
              onClick={fetchData}
              className="p-2 rounded-full dark:bg-[#1A1B26]/80 dark:border-white/5 border-slate-200 bg-white/70 hover:bg-blue-500 hover:text-white transition-all group shadow-lg backdrop-blur-sm border"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Кнопка переключения темы (исправленная) */}
            <button 
              onClick={toggleTheme}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full 
                dark:bg-[#1A1B26]/80 dark:border-white/5 bg-white/70 border border-slate-200 
                backdrop-blur-sm shadow-md transition-all hover:scale-105
                ${isFlickering ? 'animate-flicker' : ''}
              `}
            >
              {/* Индикатор "лампочка" */}
              <div className={`
                w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-300
                ${isDark ? 'bg-yellow-500 text-yellow-500' : 'bg-blue-600 text-blue-600'}
              `}></div>
              
              <span className="transition-colors duration-300 dark:text-slate-400 text-slate-600">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="px-4 md:px-10 pb-4 md:pb-10 max-w-[1800px] mx-auto min-h-[calc(100vh-200px)] md:h-[calc(100vh-140px)] md:min-h-[600px] safe-area-bottom" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className={`grid grid-cols-1 gap-6 h-full transition-all duration-500
          ${activeTab === 'all' ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-1'}
        `}>
          
          {/* Hacker News Panel */}
          <div className={`
            h-full transition-all duration-500 ease-in-out
            ${activeTab === 'all' || activeTab === 'hn' ? 'block' : 'hidden'}
          `}>
            <DashboardPanel title="Hacker News" subtitle="Realtime">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl dark:bg-[#1A1B26]/50 bg-slate-100/70 animate-pulse mb-2" />
                ))
              ) : (
                hnStories.map((story, index) => (
                  <ListItem 
                    key={story?.id || index}
                    rank={index + 1}
                    title={story?.title}
                    subtitle={getDomain(story?.url)}
                    isActive={index === 0} // Подсвечиваем первый элемент всегда
                    type="hn"
                    url={story?.url || `https://news.ycombinator.com/item?id=${story?.id}`}
                    metadata={
                      <>
                        <span className="dark:text-blue-500 text-blue-700">{story?.score} points</span>
                        <span className="dark:text-slate-400 text-slate-500">•</span>
                        <span>{story?.descendants} comments</span>
                        <span className="dark:text-slate-400 text-slate-500">•</span>
                        <span>{formatTimeAgo(story?.time)}</span>
                        <span className="dark:text-slate-400 text-slate-500 ml-1">by {story?.by}</span>
                      </>
                    }
                  />
                ))
              )}
            </DashboardPanel>
          </div>

          {/* GitHub Panel */}
          <div className={`
            h-full transition-all duration-500 ease-in-out
            ${activeTab === 'all' || activeTab === 'gh' ? 'block' : 'hidden'}
          `}>
            <DashboardPanel title="Github" subtitle="Trending">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl dark:bg-[#1A1B26]/50 bg-slate-100/70 animate-pulse mb-2" />
                ))
              ) : (
                ghRepos.map((repo, index) => (
                  <ListItem 
                    key={repo.id}
                    rank={index + 1}
                    title={repo.full_name}
                    subtitle={repo.language || "Code"}
                    url={repo.html_url}
                    isActive={index === 0} 
                    type="github"
                    metadata={
                      <>
                        <span className="dark:text-white/80 text-slate-700">{repo.description || "No description provided"}</span>
                        <div className="w-full flex items-center gap-3 mt-2 text-[11px] dark:text-slate-500 text-slate-600">
                          <span className="flex items-center gap-1 dark:text-slate-400 text-slate-500">★ {repo.stargazers_count}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(repo.created_at)}</span>
                        </div>
                      </>
                    }
                  />
                ))
              )}
            </DashboardPanel>
          </div>

          {/* Reddit Panel */}
          <div className={`
            h-full transition-all duration-500 ease-in-out
            ${activeTab === 'all' || activeTab === 'reddit' ? 'block' : 'hidden'}
          `}>
            <DashboardPanel 
              title="Reddit" 
              subtitle={
                <div className="relative">
                  <button 
                    onClick={() => setIsSubredditMenuOpen(!isSubredditMenuOpen)}
                    className="flex items-center gap-1 hover:text-orange-500 transition-colors cursor-pointer"
                  >
                    r/{selectedSubreddit}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {isSubredditMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSubredditMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-xl border dark:bg-[#1A1B26] bg-white dark:border-white/10 border-slate-200 z-50 max-h-64 overflow-y-auto custom-scrollbar">
                        {AVAILABLE_SUBREDDITS.map(sub => (
                          <button
                            key={sub}
                            onClick={() => {
                              setSelectedSubreddit(sub);
                              setIsSubredditMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-white/5 transition-colors
                              ${selectedSubreddit === sub ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}
                            `}
                          >
                            r/{sub}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              }
            >
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl dark:bg-[#1A1B26]/50 bg-slate-100/70 animate-pulse mb-2" />
                ))
              ) : (
                redditPosts.map((post, index) => (
                  <ListItem 
                    key={post.id}
                    rank={index + 1}
                    title={post.title}
                    subtitle={`u/${post.author}`}
                    url={`https://www.reddit.com${post.permalink}`}
                    isActive={index === 0} 
                    type="reddit"
                    metadata={
                      <>
                        <span className="dark:text-orange-500 text-orange-700">↑ {post.score}</span>
                        <span className="dark:text-slate-400 text-slate-500">•</span>
                        <span>{post.num_comments} comments</span>
                        <span className="dark:text-slate-400 text-slate-500">•</span>
                        <span>{formatTimeAgo(post.created_utc)}</span>
                      </>
                    }
                  />
                ))
              )}
            </DashboardPanel>
          </div>

        </div>
      </main>
    </div>
  );
}
