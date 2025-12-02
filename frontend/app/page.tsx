"use client"

import type React from "react"

import { useState } from "react"
import { Shield, Mail, AlertTriangle, CheckCircle, Upload, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface PredictionResult {
  prediction: string
  confidence: number
  spam_probability: number
  ham_probability: number
  attachments_info?: Array<{
    filename: string
    content_type: string
    size: number
  }>
}

export default function PhishingDetector() {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Replace with your FastAPI backend URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("subject", subject)
      formData.append("body", body)

      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to analyze email")
      }

      const data: PredictionResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubject("")
    setBody("")
    setFiles([])
    setResult(null)
    setError(null)
  }

  const isSpam = result?.prediction === "spam"
  const confidencePercentage = result ? Math.round(result.confidence * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Phishing Detection System</h1>
              <p className="text-sm text-muted-foreground">AI-powered email security analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Info Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="text-sm text-foreground">
                <p className="font-medium">Analyze emails for potential threats</p>
                <p className="text-muted-foreground">
                  Our AI model analyzes email content and attachments to detect spam and phishing attempts
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Email Analysis</CardTitle>
                <CardDescription>Enter email details to analyze for threats</CardDescription>
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
                        onClick={() => document.getElementById("files")?.click()}
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
                              <span className="truncate text-sm">{file.name}</span>
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
                      <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
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
                  <Card className={isSpam ? "border-destructive bg-destructive/5" : "border-green-500 bg-green-500/5"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Threat Assessment</CardTitle>
                        {isSpam ? (
                          <AlertTriangle className="h-6 w-6 text-destructive" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Classification</span>
                        <Badge variant={isSpam ? "destructive" : "default"} className="text-sm uppercase">
                          {result.prediction}
                        </Badge>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">Confidence</span>
                          <span className={isSpam ? "text-destructive" : "text-green-500"}>
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
                          <span className="text-muted-foreground">Spam Probability</span>
                          <span className="font-medium text-foreground">
                            {Math.round(result.spam_probability * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Safe Probability</span>
                          <span className="font-medium text-foreground">
                            {Math.round(result.ham_probability * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attachments Info */}
                  {result.attachments_info && result.attachments_info.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Analyzed Attachments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {result.attachments_info.map((att, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{att.filename}</p>
                                  <p className="text-xs text-muted-foreground">{att.content_type}</p>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendation */}
                  <Alert>
                    <AlertDescription>
                      {isSpam ? (
                        <span className="text-foreground">
                          <strong>⚠️ Warning:</strong> This email shows characteristics of spam or phishing. Exercise
                          caution with links, attachments, and requests for sensitive information.
                        </span>
                      ) : (
                        <span className="text-foreground">
                          <strong>✓ Safe:</strong> This email appears to be legitimate. However, always verify sender
                          identity before sharing sensitive information.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {!result && !error && (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[300px] items-center justify-center p-8">
                    <div className="text-center">
                      <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Enter email details and click Analyze to begin</p>
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
            Phishing Detection System • Powered by AI • Always verify suspicious emails
          </p>
        </div>
      </footer>
    </div>
  )
}
