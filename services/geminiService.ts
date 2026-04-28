import { GoogleGenAI, Type } from "@google/genai";
import { DetailImageSegment, ImageNodes, ProductInfo, ThumbnailParams, Language } from "../types";

// Initialize Gemini Client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry helper for 503 errors
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a 503 error or "high demand" message
      const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");
      if (is503 && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini API busy (503). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

// Helper to remove base64 header if present for API usage
const cleanBase64 = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, "");

// Helper to get system instructions based on language
const getSystemInstruction = (language: Language): string => {
  switch (language) {
    case 'en':
      return `
        You are an expert e-commerce strategist specializing in Amazon detail pages (A+ Content).
        Based on the user's input, create a logical section plan for a high-converting product detail page.
        
        [Mandatory Rules]
        1. Output MUST be a valid JSON array only. No Markdown or extra text.
        2. keyMessage MUST be in ENGLISH.
        3. Tone: Professional, benefit-driven, concise, and persuasive (Amazon style).
        4. Avoid exaggeration (e.g., "Best in the world", "Perfect"). Use factual, feature-benefit based language.
        5. If promotion info is present, include it in the last section.
        6. If styleMoodImage is missing, default to "Clean, white background, high-end lifestyle photography".
        7. s1 is the Hero Section. Use ONLY the referenceProductImage.
        8. For s2~sN, use extraProductImages if available, otherwise reuse referenceProductImage with different cropping or angles.
        
        [Structure Rules]
        - 5 slides: Hook -> Solution -> Features -> Social Proof -> Call to Action
        - 7 slides: 5 slides + Tech Specs + Comparison Chart
        - 9 slides: 7 slides + Brand Story + FAQ
      `;
    case 'ja':
      return `
        あなたは楽天市場やAmazon Japanの専門商品ページ戦略家です。
        ユーザーの入力情報に基づいて、売れる論理構成のLP（ランディングページ）企画案をJSON配列で出力してください。
        
        [必須ルール]
        1. 出力は有効なJSON配列のみにしてください。マークダウンや説明は不要です。
        2. keyMessageは必ず「日本語」で記述してください。
        3. トーン：信頼感、丁寧さ、詳細な説明（日本市場向け）。
        4. 誇張表現（「世界一」「絶対」など）は避け、具体的根拠を示してください。
        5. プロモーション情報がある場合は、最後のセクションに含めてください。
        6. styleMoodImageがない場合は、「清潔感のある、信頼できる日本ブランド風のデザイン」を指定してください。
        7. s1（メイン画像）は必ずreferenceProductImageのみを使用してください。
        8. s2以降は、extraProductImagesがあればそれを活用し、なければreferenceProductImageを加工して使用するよう指示してください。
        
        [構成ルール]
        - 5枚: 共感（悩み） -> 解決策 -> 商品特徴 -> 実績/信頼 -> オファー
        - 7枚: 5枚 + 詳細スペック + Q&A
        - 9枚: 7枚 + ブランドストーリー + 比較表
      `;
    case 'zh':
      return `
        您是淘宝(Taobao)/天猫(Tmall)详情页策划专家。
        请根据用户输入的信息，输出一份具有高转化率的详情页策划方案（JSON数组格式）。
        
        [强制规则]
        1. 输出必须仅为JSON数组。禁止Markdown或其他解释。
        2. keyMessage必须使用「简体中文」。
        3. 语调：专业、热情、突出卖点、视觉冲击力强（电商风格）。
        4. 严禁使用违反广告法的极限词（如“第一”、“顶级”等）。
        5. 如果有促销信息，请包含在最后一个板块。
        6. 如果没有styleMoodImage，visualPrompt请设定为“高端、简约、大气的天猫旗舰店风格”。
        7. s1（首屏）必须仅使用referenceProductImage。
        8. s2~sN：如果有extraProductImages请使用，否则复用referenceProductImage。
        
        [结构规则]
        - 5屏：痛点唤醒 -> 核心卖点 -> 产品展示 -> 信任背书 -> 购买理由
        - 7屏：5屏 + 细节展示 + 规格参数
        - 9屏：7屏 + 品牌故事 + 竞品对比
      `;
    case 'ko':
    default:
      return `
        당신은 한국 스마트스토어/쿠팡 상세페이지 전문 전략가입니다.
        사용자의 입력 정보를 바탕으로 "팔리는 논리"가 적용된 상세페이지 섹션 기획안을 JSON 배열로 출력하십시오.
        
        [강제 규칙]
        1. 출력은 오직 JSON 배열만 반환하십시오. 마크다운이나 추가 설명 금지.
        2. keyMessage는 자연스러운 한국어를 기본으로 하되, 상품명/용량/구성 표기에는 관례적인 영문/로마자 사용을 허용합니다.
        3. 과장, 검증 불가능한 표현(1위, 유일, 완벽, 무조건 등), 경쟁사 실명 언급, 단정 비교를 금지합니다.
        4. 프로모션 정보가 없으면 프로모션 관련 문구를 절대 생성하지 마십시오.
        5. 프로모션 정보가 있다면 최소 1개 섹션(주로 마지막)에 포함하십시오.
        6. styleMoodImage가 없으면 "고급 브랜드 광고 포스터 톤"으로 일관성을 유지하도록 visualPrompt를 작성하십시오.
        7. s1 섹션은 반드시 referenceProductImage만 사용하며, 상품명이 잘 보이도록 배치해야 합니다.
        8. s2~sN 섹션에서 extraProductImages가 있다면 "참고하여 연출 보완"하도록 visualPrompt에 명시하고, 없다면 referenceProductImage를 비율 유지하여 재사용하도록 명시하십시오.
        
        [구조 규칙]
        - pageLength가 'auto'인 경우 상품 정보량에 따라 5, 7, 9 중 하나를 선택하여 생성하십시오.
        - 5장: Hook -> Solution -> Clarity -> Service -> Risk Reversal
        - 7장: 5장 + Social Proof + Detail Deep Dive
        - 9장: 7장 + Brand Story + Competitor Comparison
        - 10장 이상: 9장 이후 How to Use, Specs, FAQ 등 확장 섹션 추가.
      `;
  }
};

export const generateDetailPlan = async (
  productInfo: ProductInfo,
  imageNodes: ImageNodes,
  language: Language = 'ko'
): Promise<DetailImageSegment[]> => {
  const ai = getClient();
  
  const hasStyleImage = !!imageNodes.styleMoodImage;
  const hasExtraImages = (imageNodes.extraProductImages?.length || 0) > 0;
  
  // Resolve category name
  const finalCategory = productInfo.category === 'other' 
    ? (productInfo.customCategory || '기타') 
    : productInfo.category;

  const systemInstruction = getSystemInstruction(language);

  const prompt = `
    [Product Info]
    Product Name: ${productInfo.productName}
    Category: ${finalCategory}
    Price: ${productInfo.price}
    Promotion: ${productInfo.promotion || "None"}
    
    [USP]
    ${productInfo.usps.join(", ")}
    
    [Target]
    Gender: ${productInfo.targetGender.join(", ")}
    Age: ${productInfo.targetAge.join(", ")}
    
    [Context Text]
    ${productInfo.csvText}
    
    [Settings]
    Requested Length: ${productInfo.pageLength}
    Images Available: StyleImage(${hasStyleImage}), ExtraImages(${hasExtraImages ? imageNodes.extraProductImages?.length : 0})
    Target Language for Output: ${language === 'ko' ? 'Korean' : language === 'en' ? 'English' : language === 'ja' ? 'Japanese' : 'Simplified Chinese'}
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview', // Updated to latest stable pro model
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "s1, s2, s3..." },
              title: { type: Type.STRING },
              logicalSections: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyMessage: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            },
            required: ["id", "title", "logicalSections", "keyMessage", "visualPrompt"]
          }
        }
      }
    }));

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Planning Error:", error);
    throw error;
  }
};

export const generateSectionImage = async (
  segment: DetailImageSegment,
  imageNodes: ImageNodes,
  productInfo: ProductInfo,
  language: Language = 'ko'
): Promise<string> => {
  const ai = getClient();
  
  const isS1 = segment.id === 's1';
  
  // Construct language specific instruction for text rendering
  let languagePrompt = "";
  if (language === 'ko') languagePrompt = "The text MUST be legible Korean.";
  else if (language === 'en') languagePrompt = "The text MUST be legible English.";
  else if (language === 'ja') languagePrompt = "The text MUST be legible Japanese (Kanji/Kana).";
  else if (language === 'zh') languagePrompt = "The text MUST be legible Simplified Chinese.";

  // Construct parts for the request
  const parts: any[] = [];
  
  // 1. Prompt Text
  const textPrompt = `
    [Image Generation Task]
    Create a high-quality e-commerce product detail page image (Ratio ${productInfo.imageAspectRatio || '9:16'}).
    
    [Visual Direction]
    ${segment.visualPrompt}
    
    [Typography & Layout Rule - VERY IMPORTANT]
    - You MUST Include the following text in the image: "${segment.keyMessage}"
    - ${languagePrompt}
    - Typography Style: Professional, Editorial, High-end.
    - Layout: Use a "Title + Subtitle" composition.
      - Main Headline: Large, Bold, Clear.
      - Subtext: Smaller, Clean, Readable.
    - Alignment: Center aligned or Clean Left aligned.
    - Contrast: Ensure text is perfectly readable against the background. Use shadows or overlays if necessary.
    - Do NOT produce garbled text.
    
    [Strict Composition Rules]
    1. DO NOT change the product logo, packaging, or design text on the product itself.
    2. Maintain the exact appearance of the reference product.
    3. ${isS1 ? "Use ONLY the reference product image. Place it centrally or artistically. Do NOT use extra images." : "You may use extra images for context if provided, otherwise reuse reference product."}
    4. ${!imageNodes.styleMoodImage ? "Style: High-end brand advertisement poster tone. Clean, soft lighting. Professional Studio Photography." : "Follow the mood of the provided style image."}
  `;
  
  parts.push({ text: textPrompt });

  // 2. Reference Image (Always included as base)
  parts.push({
    inlineData: {
      mimeType: "image/png", // Assuming PNG/JPEG from frontend, simplified for example
      data: cleanBase64(imageNodes.referenceProductImage)
    }
  });

  // 3. Style Image (Optional) - Passed as context
  if (imageNodes.styleMoodImage) {
     parts.push({
      inlineData: {
        mimeType: "image/png",
        data: cleanBase64(imageNodes.styleMoodImage)
      }
    });
    parts.push({ text: "Use the above image ONLY as a Style/Mood reference." });
  }

  // 4. Extra Images (Optional) - Only for s2...sN
  if (!isS1 && imageNodes.extraProductImages && imageNodes.extraProductImages.length > 0) {
    imageNodes.extraProductImages.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64(img)
        }
      });
    });
    parts.push({ text: "Use the above extra images for context/details/lifestyle scenes. Do NOT replace the main product identity." });
  }

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview', // Updated to latest high-quality image model
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: productInfo.imageAspectRatio || '9:16',
          imageSize: "2K"
        }
      }
    }));

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error(`Generation Error (${segment.id}):`, error);
    throw error;
  }
};

export const generateThumbnail = async (params: ThumbnailParams, language: Language = 'ko'): Promise<string> => {
  const ai = getClient();
  const base64Data = cleanBase64(params.referenceImage);
  
  const modelInstruction = 
    params.modelType === 'none' ? "No human models. Focus on product only." :
    params.modelType === 'hand' ? "Include a hand holding or interacting with the product." :
    "Include a professional model posing with the product.";

  // Language specific instruction
  let languagePrompt = "";
  if (language === 'ko') languagePrompt = "Korean";
  else if (language === 'en') languagePrompt = "English";
  else if (language === 'ja') languagePrompt = "Japanese (Kanji/Kana)";
  else if (language === 'zh') languagePrompt = "Simplified Chinese";

  // Updated Prompt to enforce text rendering in target language
  const prompt = `
    Create a 1:1 ratio E-commerce Thumbnail Image (Banner Ad style).
    
    [Product Information]
    Product: ${params.productName}
    
    [Text Overlay Requirements - CRITICAL]
    You MUST render the following text on the image clearly and legibly in ${languagePrompt}:
    1. Main Headline (USP): "${params.usp}" (Large, Bold, High Contrast). Translate this to ${languagePrompt} if it is not already.
    2. Sub Headline (Product Name): "${params.productName}" (Smaller, Clear). Keep product name as provided or transliterate if appropriate for the market.
    
    [Design & Layout]
    - Style: ${params.style}
    - Model Direction: ${modelInstruction}
    - Text Position: ${params.textPosition} (Place the text here)
    - Ensure the text does not cover the main product details.
    - Use professional typography suitable for the ${languagePrompt} market.
    - Maintain the exact appearance of the reference product image provided.
    
    High quality, commercial photography lighting, 4K resolution.
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview', // Updated to latest high-quality image model
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: base64Data } }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "2K"
        }
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Thumbnail Generation Error:", error);
    throw error;
  }
}