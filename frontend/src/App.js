import React, { useState } from "react";
import "./App.css";

function App() {
  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);

  // Results state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Remove a file from the list
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);

      // Add files to FormData
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Send request to backend
      const response = await fetch("/api/predict-with-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Prediction failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSubject("");
    setBody("");
    setFiles([]);
    setResult(null);
    setError(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🛡️ Phishing Email Detection System</h1>
          <p>AI-powered spam and phishing email classifier</p>
        </header>

        <div className="content">
          <form onSubmit={handleSubmit} className="email-form">
            <div className="form-group">
              <label htmlFor="subject">Email Subject *</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="body">Email Body *</label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter email body content..."
                required
                rows="8"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="files">Attachments (Optional)</label>
              <input
                type="file"
                id="files"
                onChange={handleFileChange}
                multiple
                className="form-file-input"
              />

              {files.length > 0 && (
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-name">📎 {file.name}</span>
                        <span className="file-size">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="remove-file-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "Analyzing..." : "🔍 Analyze Email"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
              >
                Clear Form
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="results">
              <h2>Analysis Results</h2>

              <div
                className={`result-card ${
                  result.prediction === "spam" ? "spam" : "ham"
                }`}
              >
                <div className="result-header">
                  <span className="result-icon">
                    {result.prediction === "spam" ? "⚠️" : "✅"}
                  </span>
                  <span className="result-label">
                    {result.prediction === "spam"
                      ? "SPAM/PHISHING DETECTED"
                      : "LEGITIMATE EMAIL"}
                  </span>
                </div>

                <div className="result-stats">
                  <div className="stat-item">
                    <span className="stat-label">Confidence</span>
                    <span className="stat-value">
                      {(result.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Spam Probability</span>
                    <span className="stat-value">
                      {(result.spam_probability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Legitimate Probability</span>
                    <span className="stat-value">
                      {(result.ham_probability * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="confidence-bar-container">
                  <div className="confidence-bar-labels">
                    <span>Legitimate</span>
                    <span>Spam</span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-bar-fill spam"
                      style={{ width: `${result.spam_probability * 100}%` }}
                    />
                  </div>
                </div>

                {/* Attachments Info */}
                {result.attachments_info &&
                  result.attachments_info.length > 0 && (
                    <div className="attachments-analyzed">
                      <h3>Attachments Analyzed</h3>
                      <ul>
                        {result.attachments_info.map((att, index) => (
                          <li key={index}>
                            <strong>{att.filename}</strong>
                            <span className="attachment-details">
                              {formatFileSize(att.size)} •{" "}
                              {att.content_type || "unknown type"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        <footer className="footer">
          <p>Powered by Machine Learning • FastAPI Backend • React Frontend</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
