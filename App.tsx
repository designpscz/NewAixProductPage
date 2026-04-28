import React, { useState, useEffect } from 'react';
import DetailPageBuilder from './components/DetailPageBuilder';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import Footer from './components/Footer';
import { AppTab, Language } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DETAIL_PAGE);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // Fallback for dev environments without the wrapper
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(false);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkApiKey();

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleConnectApiKey = async () => {
    try {
      if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        // Assume success after selection as per guidelines to avoid race conditions
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error selecting API key:", e);
      alert("API Key selection failed. Please try again.");
    }
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
            A
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            AIX Builder 시작하기
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            고품질 이미지 생성을 위해<br/>
            Google Cloud 프로젝트의 API 키가 필요합니다.
          </p>
          
          <button
            onClick={handleConnectApiKey}
            className="w-full py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-brand-500/30 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API 키 연결하기
          </button>
          
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            * Billing이 활성화된 Google Cloud 프로젝트가 필요합니다.<br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-500">
              Billing 문서 확인하기
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header - Brand Color Background */}
      <header className="bg-brand-600 dark:bg-slate-800 border-b border-brand-700 dark:border-slate-700 sticky top-0 z-50 shadow-md transition-colors duration-200">
        <div className="container mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-brand-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">A</div>
            <h1 className="text-xl font-bold text-white tracking-tight">AIX Builder <span className="text-xs text-brand-200 font-bold align-top">v2.3</span></h1>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden md:flex gap-1 bg-brand-700/50 dark:bg-slate-700 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab(AppTab.DETAIL_PAGE)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === AppTab.DETAIL_PAGE 
                    ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-white shadow-sm' 
                    : 'text-brand-100 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-brand-600/50 dark:hover:bg-slate-600/50'
                }`}
              >
                상세페이지
              </button>
              <button
                onClick={() => setActiveTab(AppTab.THUMBNAIL)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === AppTab.THUMBNAIL 
                    ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-white shadow-sm' 
                    : 'text-brand-100 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-brand-600/50 dark:hover:bg-slate-600/50'
                }`}
              >
                썸네일
              </button>
            </nav>

            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="appearance-none bg-brand-700 dark:bg-slate-700 text-white text-sm font-bold py-1.5 pl-3 pr-8 rounded-md border border-brand-500 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer hover:bg-brand-600 dark:hover:bg-slate-600 transition-colors"
                >
                  <option value="ko">🇰🇷 KR</option>
                  <option value="en">🇺🇸 EN</option>
                  <option value="ja">🇯🇵 JP</option>
                  <option value="zh">🇨🇳 CN</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-brand-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-brand-100 dark:text-gray-400 hover:bg-brand-500 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? (
                  // Sun Icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  // Moon Icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 lg:px-12 py-8">
        {activeTab === AppTab.DETAIL_PAGE ? (
          <div className="animate-fade-in">
             <div className="text-center mb-10">
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">상세페이지 AI 기획 & 생성</h2>
               <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">상품 정보와 사진만 넣으면, '팔리는 논리'가 적용된 상세페이지를 3분 만에 완성합니다.</p>
             </div>
             <DetailPageBuilder language={language} />
          </div>
        ) : (
          <div className="animate-fade-in">
             <div className="text-center mb-10">
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">원클릭 AI 썸네일</h2>
               <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">클릭을 부르는 매력적인 1:1 썸네일을 즉시 생성하세요.</p>
             </div>
            <ThumbnailGenerator language={language} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;