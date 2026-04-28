import React, { useState } from 'react';
import { DetailImageSegment, ImageNodes, ProductInfo, Language } from '../types';
import * as GeminiService from '../services/geminiService';
import DetailResultViewer from './DetailResultViewer';

const STEPS = ['정보 입력', '전략 기획', '이미지 생성'];

// --- Sub Components (Moved Outside) ---
const SectionHeader = ({ num, title }: { num: number, title: string }) => (
  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
    <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300 flex items-center justify-center text-sm font-bold mr-3">{num}</span>
    {title}
  </h3>
);

const InputField = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
    {...props}
  />
);

const SelectButton: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
      active 
        ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-[1.02]' 
        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-brand-300 hover:text-brand-600'
    }`}
  >
    {label}
  </button>
);

// Standard Image Uploader (for Reference & Mood)
const ImageCard = ({ label, image, onChange, onRemove, icon }: { label: string, image?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onRemove: () => void, icon: React.ReactNode }) => (
   <div className={`relative border-2 border-dashed rounded-2xl transition-all h-64 flex flex-col items-center justify-center group overflow-hidden ${image ? 'border-brand-500 bg-brand-50/10' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
      {!image ? (
        <>
          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={onChange} />
          <div className="flex flex-col items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <div className="mb-4 text-slate-300 dark:text-slate-600">
              {icon}
            </div>
            <p className="font-bold text-gray-500 dark:text-gray-400 text-sm">{label}</p>
          </div>
        </>
      ) : (
        <div className="w-full h-full relative">
           <img src={image} alt="uploaded" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="relative">
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={onChange} />
                <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-lg">교체</button>
              </div>
              <button onClick={onRemove} className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 shadow-lg z-20">삭제</button>
           </div>
        </div>
      )}
   </div>
);

// Extra Images Card (Specific Layout with Grid Inside)
const ExtraImageCard = ({ images, onChange, onRemove }: { images?: string[], onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onRemove: (index: number) => void }) => (
  <div className={`relative border-2 border-dashed rounded-2xl h-64 flex flex-col transition-all group overflow-hidden ${images && images.length > 0 ? 'border-brand-500 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    
    {(!images || images.length === 0) ? (
      // Empty State
      <>
        <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={onChange} />
        <div className="flex flex-col items-center justify-center h-full pointer-events-none">
           <p className="font-bold text-gray-500 dark:text-gray-400 text-sm mb-8">추가 이미지 (연출용)</p>
           <div className="px-6 py-2.5 bg-brand-50 dark:bg-slate-700 text-brand-600 dark:text-brand-300 rounded-lg text-sm font-bold group-hover:bg-brand-100 dark:group-hover:bg-slate-600 transition-colors">
             추가하기
           </div>
        </div>
      </>
    ) : (
      // Has Images State - Show grid inside
      <div className="w-full h-full p-3 flex flex-col">
         <div className="flex justify-between items-center mb-2 shrink-0">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-1">등록된 이미지 ({images.length})</span>
             <div className="relative">
               <span className="text-xs font-bold text-brand-600 cursor-pointer hover:underline">+ 추가</span>
               <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onChange} />
             </div>
         </div>
         
         <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-3 gap-2 content-start">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group/item border border-gray-100 dark:border-slate-600">
                <img src={img} className="w-full h-full object-cover" alt="extra" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => onRemove(idx)}
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            ))}
             {/* Add Button Cell */}
             <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onChange} />
                <span className="text-2xl text-gray-300 dark:text-slate-500">+</span>
             </div>
         </div>
      </div>
    )}
  </div>
);

const DetailPageBuilder: React.FC<{ language: Language }> = ({ language }) => {
  // --- State ---
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Inputs
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    productName: '',
    category: '',
    customCategory: '',
    price: '',
    promotion: '',
    usps: [''],
    targetGender: ['전체'],
    targetAge: ['30대'],
    csvText: '',
    pageLength: 'auto',
    imageWidth: 1440
  });
  
  const [imageNodes, setImageNodes] = useState<ImageNodes>({
    referenceProductImage: '',
    styleMoodImage: undefined,
    extraProductImages: []
  });

  // Planning Result
  const [segments, setSegments] = useState<DetailImageSegment[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // --- Helpers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof ImageNodes) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    if (field === 'extraProductImages') {
      const promises = Array.from(files).map(fileToBase64);
      const results = await Promise.all(promises);
      setImageNodes(prev => ({ ...prev, extraProductImages: [...(prev.extraProductImages || []), ...results] }));
    } else {
      const result = await fileToBase64(files[0]);
      setImageNodes(prev => ({ ...prev, [field]: result }));
    }
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (field: keyof ImageNodes, index?: number) => {
    if (field === 'extraProductImages' && typeof index === 'number') {
      setImageNodes(prev => ({
        ...prev,
        extraProductImages: prev.extraProductImages?.filter((_, i) => i !== index)
      }));
    } else {
      setImageNodes(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRemoveUsp = (index: number) => {
    setProductInfo(prev => ({
      ...prev,
      usps: prev.usps.filter((_, i) => i !== index)
    }));
  };

  const updateSegment = (id: string, field: keyof DetailImageSegment, value: any) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- Actions ---
  const handlePlan = async () => {
    if (!productInfo.productName || !imageNodes.referenceProductImage) {
      alert("상품명과 대표 이미지는 필수입니다.");
      return;
    }

    setIsLoading(true);
    setGenerationError(null);
    try {
      const plan = await GeminiService.generateDetailPlan(productInfo, imageNodes, language);
      setSegments(plan);
      setCurrentStep(1);
    } catch (err: any) {
      setGenerationError(err.message || "기획 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    setCurrentStep(2);
    const queue = [...segments];
    setSegments(prev => prev.map(s => ({ ...s, isGenerating: true, error: undefined })));

    await Promise.all(queue.map(async (seg) => {
      try {
        const imageUrl = await GeminiService.generateSectionImage(seg, imageNodes, productInfo, language);
        updateSegment(seg.id, 'imageUrl', imageUrl);
        updateSegment(seg.id, 'isGenerating', false);
      } catch (err: any) {
        updateSegment(seg.id, 'error', err.message);
        updateSegment(seg.id, 'isGenerating', false);
      }
    }));
  };

  const handleRegenerateSection = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    updateSegment(segmentId, 'isGenerating', true);
    updateSegment(segmentId, 'error', undefined);

    try {
      const imageUrl = await GeminiService.generateSectionImage(segment, imageNodes, productInfo, language);
      updateSegment(segmentId, 'imageUrl', imageUrl);
    } catch (err: any) {
      updateSegment(segmentId, 'error', err.message);
    } finally {
      updateSegment(segmentId, 'isGenerating', false);
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${productInfo.productName} Detail Page</title>
<style>
  body { margin: 0; padding: 0; background: #f0f0f0; display: flex; flex-direction: column; align-items: center; }
  .img-container { width: ${productInfo.imageWidth || 1024}px; display: flex; flex-direction: column; }
  img { display: block; width: 100%; height: auto; }
</style>
</head>
<body>
  <div class="img-container">
    ${segments.map(s => s.imageUrl ? `<img src="${s.imageUrl}" alt="${s.title}" />` : '').join('\n')}
  </div>
</body>
</html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${productInfo.productName}_detail_page.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Render ---

  return (
    <div className="w-full pb-20">
      {/* Progress Stepper (Only show in step 1+) */}
      {currentStep > 0 && (
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-4">
            {STEPS.map((label, idx) => (
              <div key={idx} className={`flex items-center ${idx <= currentStep ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 font-bold ${idx <= currentStep ? 'border-brand-600 bg-brand-50 dark:bg-brand-900' : 'border-gray-300 dark:border-slate-700'}`}>
                  {idx + 1}
                </div>
                <span className="font-medium text-sm">{label}</span>
                {idx < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 dark:bg-slate-700 ml-4" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Input */}
      {currentStep === 0 && (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 space-y-12 relative overflow-hidden">
          
          {/* Section 1: Basic Info */}
          <div>
            <SectionHeader num={1} title="기본 정보" />
            <div className="space-y-4">
              <InputField 
                placeholder="상품명 (예: 바이오 코어 생유산균) *"
                value={productInfo.productName}
                onChange={e => setProductInfo({...productInfo, productName: e.target.value})}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <select 
                    className="w-full p-4 pr-10 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                    value={productInfo.category}
                    onChange={e => setProductInfo({...productInfo, category: e.target.value})}
                  >
                    <option value="">카테고리 선택</option>
                    <option value="fashion">패션/의류</option>
                    <option value="beauty">뷰티/화장품</option>
                    <option value="food">식품</option>
                    <option value="home">홈/인테리어</option>
                    <option value="digital">디지털/가전</option>
                    <option value="pet">반려동물</option>
                    <option value="other">기타 (직접 입력)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <InputField 
                  placeholder="가격 (예: 32,900원)"
                  value={productInfo.price}
                  onChange={e => setProductInfo({...productInfo, price: e.target.value})}
                />
              </div>
              
              {/* Conditional Other Input */}
              {productInfo.category === 'other' && (
                 <InputField 
                  placeholder="카테고리를 직접 입력하세요 (예: 유아동, 스포츠 등)"
                  value={productInfo.customCategory}
                  onChange={e => setProductInfo({...productInfo, customCategory: e.target.value})}
                />
              )}

              <InputField 
                placeholder="프로모션 (예: 런칭 기념 1+1)"
                value={productInfo.promotion}
                onChange={e => setProductInfo({...productInfo, promotion: e.target.value})}
              />
            </div>
          </div>

          {/* Section 2: Target */}
          <div>
            <SectionHeader num={2} title="타겟 설정" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-semibold">성별</p>
                <div className="flex flex-wrap gap-2">
                  {['남성', '여성', '전체'].map(g => (
                    <SelectButton 
                      key={g} 
                      label={g} 
                      active={productInfo.targetGender.includes(g)}
                      onClick={() => {
                        if (g === '전체') {
                          setProductInfo({...productInfo, targetGender: ['전체']});
                        } else {
                          let newG = productInfo.targetGender.filter(x => x !== '전체');
                          if (newG.includes(g)) newG = newG.filter(x => x !== g);
                          else newG.push(g);
                          if (newG.length === 0) newG = ['전체']; // Fallback
                          setProductInfo({...productInfo, targetGender: newG});
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-semibold">연령대</p>
                <div className="flex flex-wrap gap-2">
                  {['10대', '20대', '30대', '40대', '50대', '60대+'].map(age => (
                    <SelectButton 
                      key={age} 
                      label={age} 
                      active={productInfo.targetAge.includes(age)}
                      onClick={() => {
                        let newA = productInfo.targetAge.includes(age) 
                          ? productInfo.targetAge.filter(x => x !== age)
                          : [...productInfo.targetAge, age];
                        setProductInfo({...productInfo, targetAge: newA});
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: USP */}
          <div>
            <SectionHeader num={3} title="핵심 특징 (USP)" />
             <div className="space-y-3">
               {productInfo.usps.map((usp, i) => (
                 <div key={i} className="flex gap-2 items-center">
                   <div className="flex-grow">
                     <InputField
                       placeholder={`특징 ${i+1}`}
                       value={usp}
                       onChange={(e) => {
                         const newUsps = [...productInfo.usps];
                         newUsps[i] = e.target.value;
                         setProductInfo({...productInfo, usps: newUsps});
                       }}
                     />
                   </div>
                   {/* Delete button only shown if more than 1 USP */}
                   {productInfo.usps.length > 1 && (
                     <button 
                        onClick={() => handleRemoveUsp(i)}
                        className="p-4 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                        title="삭제"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                   )}
                 </div>
               ))}
               <button 
                  onClick={() => setProductInfo(p => ({...p, usps: [...p.usps, '']}))}
                  className="text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1 ml-1"
                >
                  + 특징 추가
               </button>
             </div>
          </div>

          {/* Section 4: Image Guide */}
          <div>
            <SectionHeader num={4} title="이미지 가이드" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <ImageCard 
                 label="대표 이미지 (필수)" 
                 image={imageNodes.referenceProductImage}
                 onChange={(e) => handleFileChange(e, 'referenceProductImage')}
                 onRemove={() => handleRemoveImage('referenceProductImage')}
                 icon={
                  <svg className="w-12 h-12 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5"/>
                    <path d="M21 15L16 10L5 21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                 }
               />
               <ImageCard 
                 label="무드 가이드 (선택)" 
                 image={imageNodes.styleMoodImage}
                 onChange={(e) => handleFileChange(e, 'styleMoodImage')}
                 onRemove={() => handleRemoveImage('styleMoodImage')}
                 icon={
                  <svg className="w-12 h-12 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 20.5C4 20.5 5 21.5 8 21.5C11 21.5 12 20.5 12 20.5L12 3.5H4V20.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 20.5C12 20.5 13 21.5 16 21.5C19 21.5 20 20.5 20 20.5V3.5H12V20.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                 }
               />
               
               {/* Extra Images - Uploaded images displayed inside */}
               <ExtraImageCard 
                 images={imageNodes.extraProductImages}
                 onChange={(e) => handleFileChange(e, 'extraProductImages')}
                 onRemove={(index) => handleRemoveImage('extraProductImages', index)}
               />
            </div>
          </div>

          {/* Section 5: Page Config */}
          <div>
            <SectionHeader num={5} title="페이지 설정" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">페이지 길이</label>
                <select 
                  className="w-full p-4 pr-10 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                  value={productInfo.pageLength}
                  onChange={e => setProductInfo({...productInfo, pageLength: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value)})}
                >
                  <option value="auto">Auto (AI추천)</option>
                  <option value="5">5장 (핵심 압축형)</option>
                  <option value="7">7장 (신뢰도 강화형)</option>
                  <option value="9">9장 (브랜드 완성형)</option>
                  <option value="12">12장 (프리미엄 전문가형)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 mt-6">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">생성 이미지 비율</label>
                <select 
                  className="w-full p-4 pr-10 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                  value={productInfo.imageAspectRatio || '9:16'}
                  onChange={e => setProductInfo({...productInfo, imageAspectRatio: e.target.value})}
                >
                  <option value="9:16">9:16 (일반 세로형)</option>
                  <option value="16:9">16:9 (가로형)</option>
                  <option value="1:1">1:1 (정방형)</option>
                  <option value="3:4">3:4 (짧은 세로형)</option>
                  <option value="4:3">4:3 (짧은 가로형)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 mt-6">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">HTML 가로 사이즈 (px)</label>
                <InputField 
                  type="number"
                  placeholder="예: 1440"
                  value={productInfo.imageWidth || 1440}
                  onChange={e => setProductInfo({...productInfo, imageWidth: parseInt(e.target.value) || 1440})}
                />
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <button
              onClick={handlePlan}
              disabled={isLoading}
              className="w-full bg-brand-600 text-white py-5 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-xl shadow-brand-200 dark:shadow-none transition-all transform hover:-translate-y-1 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
            >
              상세페이지 전략 기획 시작하기
            </button>
            
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl flex items-center justify-center gap-3 border border-gray-200 dark:border-slate-700">
                 <div className="w-6 h-6 border-[3px] border-gray-200 dark:border-slate-600 border-t-brand-600 rounded-full animate-spin"></div>
                 <span className="text-gray-500 dark:text-gray-300 font-bold animate-pulse">AI 전략 기획중...</span>
              </div>
            )}
          </div>
          
          {generationError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {generationError}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Planning View (Edit) */}
      {currentStep === 1 && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
             <h2 className="text-2xl font-bold mb-2 dark:text-white">AI 전략 기획안</h2>
             <p className="text-gray-600 dark:text-gray-400 mb-6">생성 전에 문구와 연출 가이드를 수정할 수 있습니다.</p>
             
             <div className="space-y-6">
                {segments.map((seg, idx) => (
                  <div key={seg.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-5 hover:border-brand-300 transition bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                       <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-mono font-bold">{seg.id.toUpperCase()}</span>
                       <div className="flex gap-2">
                          {seg.logicalSections.map(tag => (
                            <span key={tag} className="text-[10px] bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-full border border-brand-100 dark:border-brand-800 font-medium">
                              {tag}
                            </span>
                          ))}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Key Message (카피)</label>
                          <textarea 
                            className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 text-sm font-medium focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-brand-500 outline-none dark:text-white"
                            rows={3}
                            value={seg.keyMessage}
                            onChange={(e) => updateSegment(seg.id, 'keyMessage', e.target.value)}
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Visual Prompt (AI 지시문)</label>
                          <textarea 
                            className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 text-xs font-mono text-gray-600 dark:text-gray-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                            rows={3}
                            value={seg.visualPrompt}
                            onChange={(e) => updateSegment(seg.id, 'visualPrompt', e.target.value)}
                          />
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="flex gap-4">
             <button 
               onClick={() => setCurrentStep(0)}
               className="flex-1 py-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-slate-600 transition"
             >
               이전으로
             </button>
             <button
                onClick={handleGenerateAll}
                className="flex-[2] py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg transition transform hover:-translate-y-0.5"
             >
               이미지 일괄 생성하기 ({segments.length}장)
             </button>
          </div>
        </div>
      )}

      {/* Step 3: Result View */}
      {currentStep === 2 && (
        <div>
          <DetailResultViewer 
            segments={segments} 
            onRegenerateSection={handleRegenerateSection}
            onDownloadAll={handleDownloadHtml}
          />
          <div className="max-w-2xl mx-auto mt-6">
             <button 
               onClick={() => setCurrentStep(1)}
               className="w-full py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
             >
               기획안 다시 수정하기
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPageBuilder;