export interface Idea {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  techStack: string[];
  features: string[];
  resources: string[];
  estimatedComplexity: "Easy" | "Medium" | "Hard";
  estimatedDuration: string;
  status: "public" | "private";
  votes: number;
  price: number;
  anchorPrice?: number;
  limitedStock?: number;
  views: number;
  createdAt: string;
  acquiredBy?: string;
  isTrending?: boolean;
  roadmap?: string;
  opportunity?: string;
  implementationRoadmap?: string;
  marketAngles?: string[];
  marketAngleAnalysis?: MarketAngleAnalysis;
}

export interface MarketAngleAnalysis {
  marketSizing: string;
  competitiveLandscape: string;
  targetAudience: string;
  feasibility: string;
  strategy: string;
  summaryTable: {
    product: string;
    audience: string;
    competition: string;
    demand: string;
    resources: string;
    strategy: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  purchasedIdeas: string[];
  votedIdeas: Record<string, number>;
  favorites: string[];
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
