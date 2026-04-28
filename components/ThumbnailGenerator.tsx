import React, { useState } from 'react';
import * as GeminiService from '../services/geminiService';
import { ThumbnailParams, Language } from '../types';

const ThumbnailGenerator: React.FC<{ language: Language }> = ({ language }) => {
  // Mode: 'input' or 'result'
  const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
  
  // Form State
  const [productName, setProductName] = useState('제주감귤');
  const [usp, setUsp] = useState('');
  const [style, setStyle] = useState('Clean (깔끔한 누끼/단색)');
  const [modelType, setModelType] = useState<'none' | 'hand' | 'person'>('none');
  const [textPosition, setTextPosition] = useState('하단');
  const [image, setImage] = useState<string | null>(null);

  // Result State (Array of 3 items)
  const [results, setResults] = useState<Array<{
    isLoading: boolean;
    imageUrl?: string;
    error?: string;
  }>>([
    { isLoading: false },
    { isLoading: false },
    { isLoading: false }
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (end) => setImage(end.target?.result as string);
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const getParams = (): ThumbnailParams | null => {
    if (!productName || !image) return null;
    return {
      productName,
      usp: usp || "특가",
      style,
      modelType,
      textPosition,
      referenceImage: image
    };
  };

  const handleGenerate = async () => {
    const params = getParams();
    if (!params) {
      alert("상품명과 이미지는 필수입니다.");
      return;
    }

    // Switch view
    setViewMode('result');
    // Reset results to loading
    setResults([
      { isLoading: true },
      { isLoading: true },
      { isLoading: true }
    ]);

    // Parallel Requests for 3 variations
    const promises = [0, 1, 2].map((index) => generateSingleThumbnail(index, params));
    await Promise.all(promises);
  };

  const handleRegenerateSingle = async (index: number) => {
    const params = getParams();
    if (!params) return;

    // Set specific index to loading
    setResults(prev => prev.map((item, i) => i === index ? { ...item, isLoading: true, error: undefined } : item));
    
    await generateSingleThumbnail(index, params);
  };

  const generateSingleThumbnail = async (index: number, params: ThumbnailParams) => {
    try {
      const url = await GeminiService.generateThumbnail(params, language);
      setResults(prev => prev.map((item, i) => i === index ? { ...item, isLoading: false, imageUrl: url } : item));
    } catch (err) {
      setResults(prev => prev.map((item, i) => i === index ? { ...item, isLoading: false, error: "생성 실패" } : item));
    }
  };

  const handleReset = () => {
    setViewMode('input');
    // Optional: Keep form data, just reset results?
    // For now, we keep form data for convenience.
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `thumbnail_${productName}_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Input View ---
  if (viewMode === 'input') {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-7 bg-brand-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">썸네일 제작 설정</h2>
        </div>

        <div className="space-y-6">
          {/* 1. Product Name */}
          <div>
             <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">상품명 *</label>
             <input 
               type="text"
               value={productName}
               onChange={(e) => setProductName(e.target.value)}
               className="w-full p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
               placeholder="예: 제주감귤"
             />
          </div>

          {/* 2. USP */}
          <div>
             <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">핵심 문구 (USP)</label>
             <input 
               type="text"
               value={usp}
               onChange={(e) => setUsp(e.target.value)}
               className="w-full p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
               placeholder="예: 기간 한정 50% 특가"
             />
          </div>

          {/* 3. Style & Model (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Banner Style */}
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">배너 스타일</label>
                <div className="relative">
                  <select 
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full p-4 pr-10 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                  >
                    <option value="Clean (깔끔한 누끼/단색)">Clean (깔끔한 누끼/단색)</option>
                    <option value="Lifestyle (자연스러운 연출)">Lifestyle (자연스러운 연출)</option>
                    <option value="Creative (화려한 이펙트)">Creative (화려한 이펙트)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
             </div>

             {/* Model Layout */}
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">모델 연출</label>
                <div className="flex border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden p-1 bg-white dark:bg-slate-900 h-[58px]">
                   <button 
                     onClick={() => setModelType('none')}
                     className={`flex-1 rounded-md text-sm font-bold transition-all ${modelType === 'none' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                   >
                     없음
                   </button>
                   <button 
                     onClick={() => setModelType('hand')}
                     className={`flex-1 rounded-md text-sm font-bold transition-all ${modelType === 'hand' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                   >
                     손
                   </button>
                   <button 
                     onClick={() => setModelType('person')}
                     className={`flex-1 rounded-md text-sm font-bold transition-all ${modelType === 'person' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                   >
                     인물
                   </button>
                </div>
             </div>
          </div>

          {/* 4. Text Position */}
          <div>
             <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">문구 위치</label>
             <div className="relative">
               <select 
                 value={textPosition}
                 onChange={(e) => setTextPosition(e.target.value)}
                 className="w-full p-4 pr-10 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
               >
                  <option value="상단">상단</option>
                  <option value="중앙">중앙</option>
                  <option value="하단">하단</option>
                  <option value="랜덤(AI)">랜덤(AI)</option>
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
             </div>
          </div>

          {/* 5. Image Upload */}
          <div className={`relative border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all ${image ? 'border-brand-300 bg-white dark:bg-slate-800' : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
             {!image ? (
                <>
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                  <div className="text-center pointer-events-none">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                       📷
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-bold">이미지 업로드</p>
                  </div>
                </>
             ) : (
                <div className="relative w-full h-full p-4 flex items-center justify-center group">
                   <img src={image} className="max-h-full max-w-full object-contain rounded-lg shadow-sm" alt="preview" />
                   {/* Hover Overlay */}
                   <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm rounded-xl m-1">
                      <div className="relative">
                         <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">이미지 교체</button>
                         <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                      </div>
                   </div>
                </div>
             )}
          </div>

          {/* Submit Button */}
          <button 
             onClick={handleGenerate}
             className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-xl shadow-brand-200 dark:shadow-none transition-all"
          >
             썸네일 3종 생성
          </button>
        </div>
      </div>
    );
  }

  // --- Render Result View ---
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
       {/* Top Header */}
       <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI 썸네일 생성기</h2>
               <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                 Gemini 3.0 Active
               </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">클릭 한 번으로 눈에 띄는 상품 썸네일을 제작합니다.</p>
          </div>
       </div>

       {/* Result Container */}
       <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
             <div>
                <h3 className="text-xl font-bold text-brand-700 dark:text-brand-400 flex items-center gap-2">
                   생성 결과 3종
                </h3>
                <p className="text-gray-400 text-sm mt-1">AI가 추천하는 3가지 베리에이션입니다.</p>
             </div>
             <div className="flex gap-3">
                {results.some(r => r.isLoading) && (
                   <button disabled className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-400">
                      생성 중...
                   </button>
                )}
                <button 
                  onClick={handleReset}
                  className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 dark:shadow-none transition-all"
                >
                  메인으로
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {results.map((res, idx) => (
                <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 group">
                   {res.isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <div className="w-10 h-10 border-[3px] border-gray-200 dark:border-slate-700 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                         <span className="text-gray-400 font-medium text-sm animate-pulse">생성 중...</span>
                      </div>
                   ) : res.error ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center">
                         <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                         <p className="text-sm font-bold">생성 실패</p>
                         <button 
                           onClick={() => handleRegenerateSingle(idx)}
                           className="mt-2 text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                         >
                           다시 시도
                         </button>
                      </div>
                   ) : (
                      <>
                        <img src={res.imageUrl} alt={`Thumbnail ${idx+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        
                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                           {/* Regenerate Button */}
                           <button 
                             onClick={() => handleRegenerateSingle(idx)}
                             className="bg-white/90 text-gray-900 px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-white flex items-center gap-2 transform hover:scale-105 transition-all text-sm w-32 justify-center"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                             재생성
                           </button>

                           {/* Download Button */}
                           <button 
                             onClick={() => handleDownload(res.imageUrl!, idx)}
                             className="bg-brand-600 text-white px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-brand-700 flex items-center gap-2 transform hover:scale-105 transition-all text-sm w-32 justify-center"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                             다운로드
                           </button>
                        </div>
                      </>
                   )}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default ThumbnailGenerator;