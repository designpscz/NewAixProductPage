import React from 'react';
import { DetailImageSegment } from '../types';

interface DetailResultViewerProps {
  segments: DetailImageSegment[];
  onRegenerateSection: (segmentId: string) => void;
  onDownloadAll: () => void;
}

const DetailResultViewer: React.FC<DetailResultViewerProps> = ({ segments, onRegenerateSection, onDownloadAll }) => {

  const handleDownloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAllImages = () => {
    const validSegments = segments.filter(s => s.imageUrl);
    if (validSegments.length === 0) {
      alert("생성된 이미지가 없습니다.");
      return;
    }

    // Trigger download for each image individually with a small delay to prevent browser blocking
    let count = 0;
    validSegments.forEach((seg, index) => {
      if (seg.imageUrl) {
        setTimeout(() => {
          handleDownloadImage(seg.imageUrl!, `detail_section_${seg.id}.png`);
        }, index * 300); // 300ms delay between downloads
        count++;
      }
    });
    
    if (count > 0) {
        // Optional: toast or log
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-20 border border-gray-200 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">상세페이지 결과물</h3>
        <div className="flex gap-3">
          <button
            onClick={onDownloadAll}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-brand-200 text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-brand-300 dark:hover:bg-slate-600"
          >
            HTML 저장
          </button>
          <button
            onClick={handleSaveAllImages}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors flex items-center gap-2"
          >
            이미지 저장 (전체)
          </button>
        </div>
      </div>

      {/* Result Segments */}
      <div className="space-y-0 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
        {segments.map((segment) => (
          <div key={segment.id} className="relative group border-b border-gray-100 dark:border-slate-700 last:border-0">
            
            {/* Actions Overlay - Centered */}
            <div 
              className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 ${
                segment.isGenerating 
                  ? 'opacity-100 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]' 
                  : 'opacity-0 group-hover:opacity-100 bg-black/10'
              }`}
            >
              {segment.isGenerating ? (
                // Generating State - Simple Ring Spinner & Text
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                   <div className="w-8 h-8 border-[3px] border-gray-200 dark:border-slate-600 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                   <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">생성 중...</span>
                </div>
              ) : (
                // Hover State - Buttons (Only show if image exists)
                !segment.error && segment.imageUrl && (
                  <div className="flex gap-2 transform scale-95 group-hover:scale-100 transition-transform duration-200">
                      {/* Regenerate Button */}
                      <button
                        onClick={() => onRegenerateSection(segment.id)}
                        className="bg-white text-gray-900 px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-gray-50 flex items-center gap-2 border border-gray-200 hover:scale-105 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                        <span>재생성</span>
                      </button>

                      {/* Individual Download Button */}
                      <button
                        onClick={() => handleDownloadImage(segment.imageUrl!, `section_${segment.id}.png`)}
                        className="bg-white text-gray-900 p-2.5 rounded-full font-bold shadow-xl hover:bg-gray-50 flex items-center justify-center border border-gray-200 hover:scale-105 transition-all"
                        title="이 이미지만 다운로드"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                  </div>
                )
              )}
            </div>

            {/* Error Overlay */}
            {segment.error && !segment.isGenerating && (
               <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 z-20">
                 <div className="text-center p-4">
                   <p className="text-red-600 font-bold mb-2">생성 실패</p>
                   <p className="text-xs text-red-500 mb-3 max-w-xs mx-auto break-words">{segment.error}</p>
                   <button 
                    onClick={() => onRegenerateSection(segment.id)}
                    className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700"
                   >
                     다시 시도
                   </button>
                 </div>
               </div>
            )}

            {/* Image Content */}
            <div className="w-full relative min-h-[300px] bg-gray-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
              {segment.imageUrl ? (
                <img 
                  src={segment.imageUrl} 
                  alt={segment.title} 
                  className={`w-full h-auto block transition-all duration-700 ${
                    segment.isGenerating ? 'blur-sm scale-105 opacity-80' : 'opacity-100 scale-100'
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                  {segment.isGenerating ? (
                     // Placeholder when generating for the first time
                     <div className="flex flex-col items-center gap-4 animate-pulse">
                        {/* Empty state placeholder also uses simple spinner style indirectly if needed, but here simple div is fine */}
                        <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-400">공간 확보 중...</span>
                     </div>
                  ) : (
                    <span className="text-sm">대기 중...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailResultViewer;