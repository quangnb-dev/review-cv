"use client";

import { useState, useCallback } from "react";
import { FileUpload } from "@/components/file-upload";
import { LoadingOverlay } from "@/components/loading-overlay";
import ResultsView from "@/components/results-view";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AnalysisResult } from "@/types";
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/constants";

export default function Home() {
  // Input state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "text" | null>(null);

  // Analysis state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Short CV warning dialog
  const [showShortWarning, setShowShortWarning] = useState(false);

  // Rewrite state
  const [rewritingIndices, setRewritingIndices] = useState<Set<number>>(new Set());
  const [rewrites, setRewrites] = useState<Record<number, string>>({});
  const [rewriteErrors, setRewriteErrors] = useState<Record<number, boolean>>({});

  // --- Input handlers ---

  const handleFileSelect = useCallback((f: File) => {
    if (!ALLOWED_MIME_TYPES.includes(f.type as typeof ALLOWED_MIME_TYPES[number])) {
      setFileError("Unsupported format. Please upload a PDF or DOCX file, or paste your CV text directly.");
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size exceeds 5MB limit. Please upload a smaller file or paste your CV text directly.");
      return;
    }
    setFileError(null);
    setFile(f);
    setCvText("");
    setInputMode("file");
  }, []);

  const handleFileClear = useCallback(() => {
    setFile(null);
    setFileError(null);
    setInputMode(cvText ? "text" : null);
  }, [cvText]);

  const handleCvTextChange = useCallback((value: string) => {
    setCvText(value);
    if (value.trim()) {
      setFile(null);
      setFileError(null);
      setInputMode("text");
    } else {
      setInputMode(file ? "file" : null);
    }
  }, [file]);

  const hasCv = inputMode === "file" ? !!file : cvText.trim().length > 0;
  const hasJd = jdText.trim().length > 0;
  const canAnalyze = hasCv && hasJd && !isLoading;

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  // --- Analysis ---

  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setAnalysisError(null);

    const formData = new FormData();
    formData.append("jdText", jdText);

    if (inputMode === "file" && file) {
      formData.append("file", file);
    } else {
      formData.append("cvText", cvText);
    }

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(data.error || "Analysis failed");
      }
      const data: AnalysisResult = await res.json();
      setResult(data);
      setRewrites({});
      setRewriteErrors({});
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [jdText, inputMode, file, cvText]);

  const handleAnalyze = useCallback(() => {
    // Short CV warning only applies to text input — for file uploads,
    // word count is unknown until server-side parsing, so we skip the check.
    if (inputMode === "text" && getWordCount(cvText) < 50) {
      setShowShortWarning(true);
      return;
    }
    runAnalysis();
  }, [inputMode, cvText, runAnalysis]);

  // --- Rewrite ---

  const handleRewrite = useCallback(async (index: number) => {
    if (!result) return;
    const suggestion = result.suggestions[index];
    setRewritingIndices((prev) => new Set(prev).add(index));
    setRewriteErrors((prev) => ({ ...prev, [index]: false }));

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: suggestion.originalText || suggestion.section,
          jdText,
          suggestionContext: suggestion.improvement,
        }),
      });
      if (!res.ok) throw new Error("Rewrite failed");
      const data = await res.json();
      setRewrites((prev) => ({ ...prev, [index]: data.rewrittenText }));
    } catch {
      setRewriteErrors((prev) => ({ ...prev, [index]: true }));
    } finally {
      setRewritingIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, [result, jdText]);

  const handleBack = useCallback(() => {
    setResult(null);
    setAnalysisError(null);
  }, []);

  // --- Render ---

  if (result) {
    return (
      <ResultsView
        result={result}
        onBack={handleBack}
        onRewrite={handleRewrite}
        rewritingIndices={rewritingIndices}
        rewrites={rewrites}
        rewriteErrors={rewriteErrors}
      />
    );
  }

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />

      <Dialog open={showShortWarning} onOpenChange={setShowShortWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CV seems very short</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your CV has fewer than 50 words. Results may not be accurate.
            Continue anyway?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowShortWarning(false)}>
              Go back
            </Button>
            <Button
              onClick={() => {
                setShowShortWarning(false);
                runAnalysis();
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">CV Review Tool</h1>
            <p className="text-sm text-muted-foreground">
              Upload your CV and paste the job description to get an AI-powered review.
            </p>
          </div>

          {/* CV Input Section */}
          <div className="space-y-3">
            <label htmlFor="cv-text" className="text-sm font-medium">Your CV</label>
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              selectedFile={file}
              error={fileError}
            />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or paste text
              <div className="h-px flex-1 bg-border" />
            </div>
            <Textarea
              id="cv-text"
              placeholder="Paste your CV content here..."
              value={cvText}
              onChange={(e) => handleCvTextChange(e.target.value)}
              rows={6}
              className="resize-y"
            />
          </div>

          {/* JD Input Section */}
          <div className="space-y-3">
            <label htmlFor="jd-text" className="text-sm font-medium">Job Description</label>
            <Textarea
              id="jd-text"
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={6}
              className="resize-y"
            />
          </div>

          {/* Validation hints */}
          {!hasCv && hasJd && (
            <p role="alert" className="text-xs text-muted-foreground">Please upload or paste your CV</p>
          )}
          {hasCv && !hasJd && (
            <p role="alert" className="text-xs text-muted-foreground">Please enter a Job Description</p>
          )}

          {/* Analysis error */}
          {analysisError && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{analysisError}</span>
                <Button variant="outline" size="sm" onClick={handleAnalyze}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Analyze button */}
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full"
            size="lg"
          >
            Analyze CV
          </Button>
        </div>
      </main>
    </>
  );
}


