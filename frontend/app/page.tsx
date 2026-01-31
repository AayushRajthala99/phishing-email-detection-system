"use client";

import type React from "react";

import { useState } from "react";
import {
  Shield,
  Mail,
  AlertTriangle,
  CheckCircle,
  Upload,
  X,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getApiUrl } from "@/lib/api";

interface AttachmentInfo {
  filename: string;
  content_type: string;
  size: number;
  malicious_score?: number;
  ml_prediction?: string;
  risk_level?: "low" | "medium" | "high" | "critical";
}

interface PredictionResult {
  prediction: string;
  confidence: number;
  spam_probability: number;
  ham_probability: number;
  attachments_info?: AttachmentInfo[];
}

type AnalyzingPhase = "idle" | "parsing" | "scanning" | "analyzing" | "complete";

export default function PhishingDetector() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzingPhase, setAnalyzingPhase] = useState<AnalyzingPhase>("idle");
  const [progress, setProgress] = useState(0);

  // Replace with your FastAPI backend URL
  // const API_URL = process.env.NEXT_PUBLIC_API_URL
  const API_URL = getApiUrl();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };


  const simulateAnalyzingPhases = () => {
  const phases: AnalyzingPhase[] = ["parsing", "scanning", "analyzing"];
  let currentPhaseIndex = 0;
  let currentProgress = 0;

  setAnalyzingPhase(phases[0]);
  setProgress(0);

  const progressInterval = setInterval(() => {
    // Smoother, slower increments
    currentProgress += Math.random() * 3 + 1.5; // Was: Math.random() * 15 + 5
    
    if (currentProgress >= 100) {
      currentProgress = 100;
    }
    setProgress(Math.min(currentProgress, 95)); // Cap at 95% until API responds

    // Switch phases at certain progress points
    if (currentProgress > 30 && currentPhaseIndex === 0) {
      currentPhaseIndex = 1;
      setAnalyzingPhase(phases[1]);
    } else if (currentProgress > 60 && currentPhaseIndex === 1) {
      currentPhaseIndex = 2;
      setAnalyzingPhase(phases[2]);
    }
  }, 150); // Was: 200 - faster updates for smoother animation

  return () => clearInterval(progressInterval);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setResult(null);
  setProgress(0);

  const startTime = Date.now();
  const clearProgress = simulateAnalyzingPhases();

  try {
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("body", body);

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      body: formData,
    });
    console.log(`${API_URL}/predict`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to analyze email");
    }

    const data: PredictionResult = await response.json();

    // Process attachment info if present
if (data.attachments_info) {
  data.attachments_info = data.attachments_info.map((att) => {
    // Use malicious_score from backend (note: different spelling)
    const malScore = att.malicious_score ?? 0;
    
    return {
      ...att,
      // Only add ml_prediction if not provided by backend
      ml_prediction: att.ml_prediction ?? (malScore > 50 ? "malicious" : "safe"),
      // Only add risk_level if not provided by backend
      risk_level: att.risk_level ?? getRiskLevel(malScore),
    };
  });
}

    // Ensure minimum 3 seconds of animation
    const elapsedTime = Date.now() - startTime;
    const minimumTime = 3000; // 3 seconds
    const remainingTime = Math.max(0, minimumTime - elapsedTime);
    
    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }

    clearProgress();
    setProgress(100);
    setAnalyzingPhase("complete");

    await new Promise((resolve) => setTimeout(resolve, 800));

    setResult(data);
  } catch (err) {
    clearProgress();
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setLoading(false);
    setTimeout(() => {
      setAnalyzingPhase("idle");
    }, 300);
  }
};

  const getRiskLevel = (score: number): "low" | "medium" | "high" | "critical" => {
    if (score < 25) return "low";
    if (score < 50) return "medium";
    if (score < 75) return "high";
    return "critical";
  };

const handleReset = () => {
    setSubject("");
    setBody("");
    setFiles([]);
    setResult(null);
    setError(null);
    setAnalyzingPhase("idle");
    setProgress(0);
  };

  const getPhaseText = (phase: AnalyzingPhase) => {
    switch (phase) {
      case "parsing":
        return "Parsing email content...";
      case "scanning":
        return "Scanning for threats...";
      case "analyzing":
        return "Running ML analysis...";
      case "complete":
        return "Analysis complete!";
      default:
        return "";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-500 bg-green-500/10";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10";
      case "high":
        return "text-orange-500 bg-orange-500/10";
      case "critical":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const isSpam = result?.prediction === "spam";
  const confidencePercentage = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Info Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="text-sm text-foreground">
                <p className="font-medium">
                  Analyze emails for potential threats
                </p>
                <p className="text-muted-foreground">
                  Our AI model analyzes email content and attachments to detect
                  spam and phishing attempts
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Email Analysis</CardTitle>
                <CardDescription>
                  Enter email details to analyze for threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea
                      id="body"
                      placeholder="Paste email content here"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                      disabled={loading}
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="files">Attachments (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        disabled={loading}
                        onClick={() =>
                          document.getElementById("files")?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Select Files
                      </Button>
                      <input
                        id="files"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 rounded border border-border bg-background px-3 py-2"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm">
                                {file.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={loading}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Analyze Email
                        </>
                      )}
                    </Button>
                    {(subject || body || files.length > 0) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={loading}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <>
                  {/* Threat Assessment */}
                  <Card
                    className={
                      isSpam
                        ? "border-destructive bg-destructive/5"
                        : "border-green-500 bg-green-500/5"
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Threat Assessment
                        </CardTitle>
                        {isSpam ? (
                          <AlertTriangle className="h-6 w-6 text-destructive" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Classification
                        </span>
                        <Badge
                          variant={isSpam ? "destructive" : "default"}
                          className="text-sm uppercase"
                        >
                          {result.prediction}
                        </Badge>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            Confidence
                          </span>
                          <span
                            className={
                              isSpam ? "text-destructive" : "text-green-500"
                            }
                          >
                            {confidencePercentage}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isSpam ? "bg-destructive" : "bg-green-500"
                            }`}
                            style={{ width: `${confidencePercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded-md border border-border bg-background/50 p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Spam Probability
                          </span>
                          <span className="font-medium text-foreground">
                            {Math.round(result.spam_probability * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Safe Probability
                          </span>
                          <span className="font-medium text-foreground">
                            {Math.round(result.ham_probability * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

{/* Attachments Info with Maliciousness Scores */}
                  {result.attachments_info &&
                    result.attachments_info.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Attachment Security Analysis
                          </CardTitle>
                          <CardDescription>
                            ML-powered threat detection for uploaded files
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {result.attachments_info.map((att, index) => {
                              const riskLevel = att.risk_level || "low";
                              const malScore = att.malicious_score || 0;
                              const isMalicious = att.ml_prediction === "malicious";

                              return (
                                <div
                                  key={index}
                                  className={`rounded-lg border p-4 ${
                                    isMalicious
                                      ? "border-destructive/50 bg-destructive/5"
                                      : "border-border bg-muted/30"
                                  }`}
                                >
                                  {/* File header */}
                                  <div className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText
                                        className={`h-5 w-5 flex-shrink-0 ${
                                          isMalicious
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                          {att.filename}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {att.content_type} •{" "}
                                          {(att.size / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={isMalicious ? "destructive" : "secondary"}
                                      className="text-xs uppercase"
                                    >
                                      {att.ml_prediction || "safe"}
                                    </Badge>
                                  </div>

                                  {/* Maliciousness Score */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        Maliciousness Score
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          malScore >= 75
                                            ? "text-red-500"
                                            : malScore >= 50
                                              ? "text-orange-500"
                                              : malScore >= 25
                                                ? "text-yellow-500"
                                                : "text-green-500"
                                        }`}
                                      >
                                        {Math.round(malScore)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                                      <div
                                        className={`h-full transition-all duration-500 ${
                                          malScore >= 75
                                            ? "bg-red-500"
                                            : malScore >= 50
                                              ? "bg-orange-500"
                                              : malScore >= 25
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                        }`}
                                        style={{ width: `${malScore}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Risk Level Badge */}
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Risk Level
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${getRiskColor(
                                        riskLevel
                                      )}`}
                                    >
                                      {riskLevel}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  {/* Recommendation */}
                  <Alert>
                    <AlertDescription>
                      {isSpam ? (
                        <span className="text-foreground">
                          <strong>⚠️ Warning:</strong> This email shows
                          characteristics of spam or phishing. Exercise caution
                          with links, attachments, and requests for sensitive
                          information.
                        </span>
                      ) : (
                        <span className="text-foreground">
                          <strong>✓ Safe:</strong> This email appears to be
                          legitimate. However, always verify sender identity
                          before sharing sensitive information.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </>
              )}

{!result && !error && !loading && (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[300px] items-center justify-center p-8">
                    <div className="text-center">
                      <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Enter email details and click Analyze to begin
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analyzing Animation */}
              {loading && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8">
                    <div className="relative mb-6">
                      {/* Pulsing rings */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-20 w-20 animate-ping rounded-full bg-primary/20" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 animate-pulse rounded-full bg-primary/30" />
                      </div>
                      {/* Center icon */}
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-8 w-8 animate-pulse text-primary" />
                      </div>
                    </div>

                    {/* Phase text */}
                    <p className="mb-4 text-sm font-medium text-primary">
                      {getPhaseText(analyzingPhase)}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Scanning indicators */}
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            analyzingPhase === "parsing" ||
                            analyzingPhase === "scanning" ||
                            analyzingPhase === "analyzing" ||
                            analyzingPhase === "complete"
                              ? "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">Parse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            analyzingPhase === "scanning" ||
                            analyzingPhase === "analyzing" ||
                            analyzingPhase === "complete"
                              ? "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">Scan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            analyzingPhase === "analyzing" ||
                            analyzingPhase === "complete"
                              ? "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">Analyze</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            analyzingPhase === "complete" ? "bg-green-500" : "bg-muted"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">Done</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Phishing Detection System • Powered by AI • Always verify suspicious
            emails
          </p>
        </div>
      </footer>
    </div>
  );
}
