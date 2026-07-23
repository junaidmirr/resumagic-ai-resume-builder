export type PlanTier = "free" | "student" | "starter" | "pro" | "career_pro" | "lifetime";

export interface PlanConfig {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  monthlyPriceOriginal?: number;
  creditsMonthly: number;
  popular?: boolean;
  badge?: string;
  description: string;
  features: string[];
  restricted?: string[];
  type: "free" | "subscription" | "lifetime";
}

export interface CreditPackConfig {
  id: string;
  price: number;
  credits: number;
  perCredit: string;
  popular?: boolean;
}

export interface FeaturePermission {
  canUseAIArchitect: boolean;
  canUseUnlimitedAIChat: boolean;
  canUseKeywordGap: boolean;
  canCreateCareerDocs: boolean; // Cover Letter, SOP, LOR, etc.
  canCreateMultipleResumes: boolean; // Free: 1 resume only
  canUsePremiumTemplates: boolean;
  canUseUnlimitedATS: boolean;
  atsScanLimit: number; // Free: 3, Starter: 20, Pro+: Unlimited
  monthlyCredits: number;
}

export const PLAN_PERMISSIONS: Record<PlanTier, FeaturePermission> = {
  free: {
    canUseAIArchitect: false,
    canUseUnlimitedAIChat: false,
    canUseKeywordGap: false,
    canCreateCareerDocs: false,
    canCreateMultipleResumes: false,
    canUsePremiumTemplates: false,
    canUseUnlimitedATS: false,
    atsScanLimit: 3,
    monthlyCredits: 5,
  },
  student: {
    canUseAIArchitect: false,
    canUseUnlimitedAIChat: false,
    canUseKeywordGap: false,
    canCreateCareerDocs: false,
    canCreateMultipleResumes: true,
    canUsePremiumTemplates: true,
    canUseUnlimitedATS: false,
    atsScanLimit: 20,
    monthlyCredits: 150,
  },
  starter: {
    canUseAIArchitect: false,
    canUseUnlimitedAIChat: false,
    canUseKeywordGap: false,
    canCreateCareerDocs: false,
    canCreateMultipleResumes: true,
    canUsePremiumTemplates: true,
    canUseUnlimitedATS: false,
    atsScanLimit: 20,
    monthlyCredits: 150,
  },
  pro: {
    canUseAIArchitect: true,
    canUseUnlimitedAIChat: true,
    canUseKeywordGap: true,
    canCreateCareerDocs: true,
    canCreateMultipleResumes: true,
    canUsePremiumTemplates: true,
    canUseUnlimitedATS: true,
    atsScanLimit: 99999,
    monthlyCredits: 1000,
  },
  career_pro: {
    canUseAIArchitect: true,
    canUseUnlimitedAIChat: true,
    canUseKeywordGap: true,
    canCreateCareerDocs: true,
    canCreateMultipleResumes: true,
    canUsePremiumTemplates: true,
    canUseUnlimitedATS: true,
    atsScanLimit: 99999,
    monthlyCredits: 3000,
  },
  lifetime: {
    canUseAIArchitect: true,
    canUseUnlimitedAIChat: true,
    canUseKeywordGap: true,
    canCreateCareerDocs: true,
    canCreateMultipleResumes: true,
    canUsePremiumTemplates: true,
    canUseUnlimitedATS: true,
    atsScanLimit: 99999,
    monthlyCredits: 3000,
  },
};
