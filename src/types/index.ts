export interface SubScore {
  name: string;
  score: number;
  explanation: string;
}

export interface ATSFinding {
  category: string;
  status: "pass" | "warning" | "fail";
  description: string;
}

export interface Suggestion {
  section: string;
  improvement: string;
  impact: "high" | "medium" | "low";
  originalText?: string;
}

export interface AnalysisResult {
  overallScore: number;
  subScores: SubScore[];
  atsFindings: ATSFinding[];
  suggestions: Suggestion[];
}

export interface RewriteResult {
  rewrittenText: string;
}
