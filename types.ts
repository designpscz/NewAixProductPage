export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface ImageNodes {
  referenceProductImage: string; // Base64
  styleMoodImage?: string; // Base64
  extraProductImages?: string[]; // Base64 array
}

export interface DetailImageSegment {
  id: string;
  title: string;
  logicalSections: string[];
  keyMessage: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
  seed?: number;
}

export type PageLength = number | "auto";

export interface ProductInfo {
  productName: string;
  category: string;
  customCategory?: string; // Added for 'other' input
  price: string;
  promotion: string;
  usps: string[];
  targetGender: string[];
  targetAge: string[];
  csvText: string;
  pageLength: PageLength;
  imageWidth?: number;
  imageAspectRatio?: string;
}

export interface ThumbnailParams {
  productName: string;
  usp: string;
  style: string;
  modelType: 'none' | 'hand' | 'person';
  textPosition: string;
  referenceImage: string; // Base64
}

export enum AppTab {
  THUMBNAIL = 'thumbnail',
  DETAIL_PAGE = 'detail_page'
}

export interface GenerationState {
  isPlanning: boolean;
  isGenerating: boolean;
  segments: DetailImageSegment[];
  error?: string;
}