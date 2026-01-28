export interface AttachmentInfo {
  filename: string
  content_type: string
  size: number
  sha256: string
  malicious_score: number
}

export interface Report {
  _id: string
  subject: string
  body: string
  prediction: "spam" | "ham"
  confidence: number
  spam_probability: number
  ham_probability: number
  timestamp: string
  attachments_info?: AttachmentInfo[]
}

export interface ReportsResponse {
  total: number
  reports: Report[]
}
