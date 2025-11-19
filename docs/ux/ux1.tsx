import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Moon, 
  Sun, 
  ExternalLink, 
  Zap,
  LayoutDashboard
} from 'lucide-react';

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

const DashboardPanel = ({ title, subtitle, children, className = "" }) => (
  <div className={`
    flex flex-col h-full
    rounded-3xl border shadow-2xl overflow-hidden transition-all duration-500
    dark:border-white/5 dark:bg-[#0F1016]/60 dark:backdrop-blur-md
    bg-white/70 border-slate-200 backdrop-blur-xl shadow-lg
    ${className}
  `}>
    <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/5 border-slate-200/70">
      <h2 className="text-sm font-bold tracking-widest dark:text-slate-100 text-slate-800 uppercase">{title}</h2>
      <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">{subtitle}</span>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
      {children}
    </div>
  </div>
);

const ListItem = ({ rank, title, subtitle, metadata, url, isActive, type = "neutral" }) => {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        group flex items-start gap-4 p-4 rounded-xl transition-all duration-300
        relative overflow-hidden border
        dark:hover:bg-white/[0.03] hover:bg-slate-100/70
        ${isActive 
          ? 'dark:bg-blue-500/[0.08] bg-blue-50/80 border-blue-500/30 shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]' 
          : 'border-transparent'}
      `}
    >
      {/* Активный градиентный фон для выделенного элемента */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 pointer-events-none" />
      )}

      {/* Rank Circle */}
      <div className={`
        flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mt-0.5 z-10 transition-colors
        ${isActive 
          ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
          : 'dark:bg-[#1A1B26] bg-slate-200/70 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}
      `}>
        {rank}
      </div>

      <div className="flex-1 min-w-0 z-10">
        {/* Title */}
        <h3 className={`
          text-[15px] font-medium leading-snug mb-1 truncate transition-colors
          ${isActive 
            ? 'text-blue-700 dark:text-blue-50' 
            : 'text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white'}
        `}>
          {title}
        </h3>
        
        {/* Subtitle (Domain or Repo details) */}
        <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 truncate group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
          {subtitle}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          {metadata}
        </div>
      </div>
    </a>
  );
};

// --- Логика ---

const formatTimeAgo = (dateInput) => {
  const now = new Date();
  const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
  const diff = (now - date) / 1000;

  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '').toUpperCase();
  } catch {
    return 'NEWS.YCOMBINATOR.COM';
  }
};

export default function PulseKontrol() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hnStories, setHnStories] = useState([]);
  const [ghRepos, setGhRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 'all' | 'hn' | 'gh'
  const [activeTab, setActiveTab] = useState('all'); 
  
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
      const hnData = await Promise.all(top20Ids.map(id => 
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

      setHnStories(hnData);
      setGhRepos(ghData.items || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className={`min-h-screen w-full font-sans selection:bg-blue-500/30 relative transition-colors duration-500 ${isDark ? 'text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      
      <style>{flickerStyle}</style>

      {/* --- ФОН --- */}
      {/* Темный фон (космический) */}
      <div className={`fixed inset-0 z-[-1] pointer-events-none bg-[#08090F] transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] rounded-full bg-[#1d4ed8] opacity-[0.15] blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-[#7e22ce] opacity-[0.1] blur-[100px] mix-blend-screen" />
        <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vh] rounded-full bg-[#3b82f6] opacity-[0.05] blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>
      
      {/* Светлый фон (глассморфизм) */}
      <div className={`fixed inset-0 z-[-2] pointer-events-none transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
         {/* Мягкий фон для глассморфизма */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-slate-100/80 to-purple-50/80" />
         {/* Размытые "пятна" для эффекта глубины */}
         <div className="absolute top-[10%] left-[5%] w-[50vw] h-[50vh] rounded-full bg-blue-300 opacity-[0.15] blur-[150px] mix-blend-screen" />
         <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vh] rounded-full bg-purple-300 opacity-[0.1] blur-[120px] mix-blend-screen" />
      </div>

      {/* 5.1 Хедер */}
      <header className="pt-8 pb-6 px-6 md:px-10 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Навигация слева (Теперь это полноценные кнопки/табы) */}
          <div className="flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] uppercase">
            
            {/* Кнопка ALL (Dashboard) */}
             <button 
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 transition-colors hover:text-blue-400 
                ${activeTab === 'all' 
                  ? 'text-blue-500 dark:text-blue-500' 
                  : 'text-slate-500 dark:text-slate-500'}`}
            >
              <LayoutDashboard className="w-3 h-3" />
              All Feeds
            </button>

            <div className="w-px h-4 dark:bg-slate-500/20 bg-slate-400/20"></div>

            {/* Кнопка Hacker News */}
            <button 
              onClick={() => setActiveTab('hn')}
              className={`flex items-center gap-3 transition-colors hover:text-blue-400 
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
              Hacker News
            </button>

            {/* Midjourney (неактивна) */}
            <div className="dark:text-slate-600 text-slate-400 cursor-not-allowed line-through decoration-slate-700 decoration-2 opacity-50">Midjourney</div>

            {/* Кнопка GitHub */}
            <button 
              onClick={() => setActiveTab('gh')}
              className={`flex items-center gap-3 transition-colors hover:text-blue-400 
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
              Github Live
            </button>
          </div>

          {/* Статус справа */}
          <div className="flex items-center gap-6 text-[10px] font-bold tracking-wider uppercase dark:text-slate-500 text-slate-400">
            <div className="flex flex-col items-end">
              <span className="mb-0.5 opacity-70">Last refresh</span>
              <span className="dark:text-slate-300 text-slate-700 flex items-center gap-2">
                 {formatTimeAgo(lastRefresh).replace('minutes', 'min').replace('hours', 'h')}
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

      {/* Мобильные табы (дублируют функционал для маленьких экранов) */}
      <div className="md:hidden flex px-4 mb-4 overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'All' },
          { id: 'hn', label: 'Hacker News' },
          { id: 'gh', label: 'GitHub' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider mr-2 rounded-full transition-colors border ${
              activeTab === tab.id 
              ? 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-900/20' 
              : 'dark:bg-[#1A1B26] bg-white/70 dark:text-slate-500 text-slate-600 dark:border-white/5 border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Основной контент */}
      <main className="px-4 md:px-10 pb-10 max-w-[1600px] mx-auto h-[calc(100vh-140px)] min-h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          
          {/* Hacker News Panel 
              Логика отображения: 
              - Если выбрано 'all', показываем (block).
              - Если выбрано 'hn', показываем и растягиваем (col-span-2).
              - Если выбрано 'gh', скрываем (hidden).
          */}
          <div className={`
            h-full transition-all duration-500 ease-in-out
            ${activeTab === 'gh' ? 'hidden' : 'block'}
            ${activeTab === 'hn' ? 'md:col-span-2' : ''}
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
                    isActive={index === 0 && activeTab === 'all'} // Подсвечиваем первый элемент только в режиме All
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

          {/* GitHub Panel 
              Логика отображения:
              - Если выбрано 'all', показываем (block).
              - Если выбрано 'gh', показываем и растягиваем (col-span-2).
              - Если выбрано 'hn', скрываем (hidden).
          */}
          <div className={`
            h-full transition-all duration-500 ease-in-out
            ${activeTab === 'hn' ? 'hidden' : 'block'}
            ${activeTab === 'gh' ? 'md:col-span-2' : ''}
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
                    isActive={false} 
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

        </div>
      </main>
    </div>
  );
}