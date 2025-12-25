
export enum Step {
  INTRO = 'INTRO',
  UPLOAD = 'UPLOAD',
  ANALYSIS_REVIEW = 'ANALYSIS_REVIEW',
  CAMPAIGN_CONFIG = 'CAMPAIGN_CONFIG',
  GENERATION = 'GENERATION',
  FINAL_PREVIEW = 'FINAL_PREVIEW'
}

export interface ToneOptions {
  tone: 'professional' | 'friendly' | 'humorous' | 'enthusiastic' | 'elegant';
  visualStyle: 'minimalist' | 'vibrant' | 'luxury' | 'retro' | 'natural' | 'custom';
  customVisualStyle?: string;
  copyLength: 'concise' | 'balanced' | 'detailed' | 'bullet' | 'custom';
  customCopyLength?: string;
}

export interface BrandProfile {
  persona: string;
  toneOfVoice: string;
  visualStyle: string;
  targetAudience: string;
  brandKeywords: string[];
}

export interface MaterialSelection {
  wecomWelcome: boolean;      // 1. 1v1欢迎语
  wecomNotification: boolean; // 2. 1v1活动宣传文案
  groupWelcome: boolean;      // 3. 社群欢迎语
  groupNotification: boolean; // 4. 社群活动宣传文案
  momentsCopy: boolean;       // 5. 朋友圈宣传文案 (Implicitly generates momentsPoster)
  tableTent: boolean;         // 6. 门店拉新桌码海报
  landingPage: boolean;       // 7. 小程序领券落地页海报
}

export interface CampaignConfig {
  activityType: 'acquisition' | 'marketing';
  activityName: string;
  campaignTheme?: string; // New optional field
  incentive: string;
  incentiveImage?: string;
  wecomQrCode?: string;
  startTime: string;
  endTime: string;
  rules: string;
  promotionDetails: string;
  materials: MaterialSelection;
  materialDimensions: {
    tableTent: string;
    momentsPoster: string;
    landingPage: string;
  };
}

export interface AIStrategyItem {
  features: string;
  tactics: string[];
}

export interface AIStrategies {
  tableTent?: AIStrategyItem;
  publicPoster?: AIStrategyItem;
  moments?: AIStrategyItem;
  landingPage?: AIStrategyItem;
}

export interface GeneratedContent {
  strategies: AIStrategies;
  copy: {
    wecomWelcome?: string;
    wecomNotification?: string;
    groupWelcome?: string;
    groupNotification?: string;
    momentsCopy?: string;
  };
  posters: {
    tableTent?: string; // base64
    publicPlatform?: string; // base64
    momentsPoster?: string; // base64
    landingPage?: string; // base64
  };
}