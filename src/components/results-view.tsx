"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AnalysisResult } from "@/types";

interface ResultsViewProps {
  result: AnalysisResult;
  onBack: () => void;
  onRewrite: (index: number) => void;
  rewritingIndices: Set<number>;
  rewrites: Record<number, string>;
  rewriteErrors: Record<number, boolean>;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  return "stroke-red-500";
}

function getImpactBadge(impact: "high" | "medium" | "low") {
  const styles = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[impact]}`}>
      {impact}
    </span>
  );
}

function ATSStatusIcon({ status }: { status: "pass" | "warning" | "fail" }) {
  if (status === "pass") return <><span aria-hidden="true">✅</span><span className="sr-only">Pass</span></>;
  if (status === "warning") return <><span aria-hidden="true">⚠️</span><span className="sr-only">Warning</span></>;
  return <><span aria-hidden="true">❌</span><span className="sr-only">Fail</span></>;
}

function CircularScore({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div role="img" aria-label={`Overall score: ${score} out of 100`} className="relative inline-flex items-center justify-center w-36 h-36">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          className="text-muted"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`motion-reduce:!transition-none ${getScoreRingColor(score)}`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className={`text-4xl font-bold z-10 ${getScoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

export default function ResultsView({
  result,
  onBack,
  onRewrite,
  rewritingIndices,
  rewrites,
  rewriteErrors,
}: ResultsViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const rewriteRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 2000);
    } catch {
      const el = rewriteRefs.current[index];
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  const sortedSuggestions = [...result.suggestions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="sr-only">CV Review Results</h1>

      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2 text-muted-foreground">
        <ArrowLeft aria-hidden="true" className="w-4 h-4" />
        Back
      </Button>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Overall Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-6">
          <CircularScore score={result.overallScore} />
          <p className="text-sm text-muted-foreground">out of 100</p>
        </CardContent>
      </Card>

      {/* Sub-score cards */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-card-foreground">Score Breakdown</h2>
        {result.subScores.map((sub) => (
          <Card key={sub.name}>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">{sub.name}</span>
                <span className={`text-sm font-bold ${getScoreColor(sub.score)}`}>
                  {sub.score}%
                </span>
              </div>
              <Progress value={sub.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{sub.explanation}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ATS Scan Report */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-card-foreground">ATS Scan Report</h2>
        <Card>
          <CardContent className="pt-4 pb-2 divide-y divide-border">
            {result.atsFindings.every(f => f.status === "pass") && (
              <p className="py-3 text-sm font-medium text-green-700">Your CV is well-formatted for ATS systems.</p>
            )}
            {result.atsFindings.map((finding, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <ATSStatusIcon status={finding.status} />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{finding.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{finding.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-card-foreground">Suggestions</h2>
        {result.overallScore >= 90 && sortedSuggestions.length === 0 ? (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-green-700">
                Your CV is an excellent match for this role. No major improvements needed.
              </p>
            </CardContent>
          </Card>
        ) : (
        <>
        {result.overallScore >= 90 && sortedSuggestions.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-green-700">
                Great score! Here are some optional improvements:
              </p>
            </CardContent>
          </Card>
        )}
        {sortedSuggestions.map((suggestion, i) => {
          const originalIndex = result.suggestions.indexOf(suggestion);
          const isRewriting = rewritingIndices.has(originalIndex);
          const rewrittenText = rewrites[originalIndex];
          const hasError = rewriteErrors[originalIndex];

          return (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getImpactBadge(suggestion.impact)}
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {suggestion.section}
                  </span>
                </div>
                <p className="text-sm text-foreground">{suggestion.improvement}</p>

                {/* Rewrite controls */}
                <div className="space-y-2">
                  {!rewrittenText && !hasError && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRewrite(originalIndex)}
                      disabled={isRewriting}
                      className="gap-2 text-xs"
                    >
                      {isRewriting && <Loader2 aria-hidden="true" className="w-3 h-3 animate-spin" />}
                      {isRewriting ? "Rewriting..." : "Rewrite this"}
                    </Button>
                  )}

                  {hasError && !rewrittenText && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-destructive">Rewrite failed. Try again.</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRewrite(originalIndex)}
                        className="text-xs text-destructive underline px-2 py-1"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {rewrittenText && (
                    <div className="bg-muted rounded-md p-3 space-y-2">
                      <p
                        ref={(el) => { rewriteRefs.current[originalIndex] = el; }}
                        className="text-sm text-foreground whitespace-pre-wrap"
                      >
                        {rewrittenText}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(rewrittenText, originalIndex)}
                        className="gap-1.5 text-xs text-muted-foreground h-auto px-2 py-1"
                      >
                        {copiedIndex === originalIndex ? (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        </>
        )}
      </div>
    </div>
  );
}
