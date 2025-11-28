import React from "react";
import "./ResultDisplay.css";

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  const isSpam = result.prediction === "spam";

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="results">
      <h2 className="results-title">Analysis Results</h2>

      <div className={`result-card ${isSpam ? "spam" : "ham"}`}>
        <div className="result-header">
          <span className="result-icon">{isSpam ? "⚠️" : "✅"}</span>
          <div className="result-info">
            <h3 className="result-label">
              {isSpam ? "SPAM/PHISHING DETECTED" : "LEGITIMATE EMAIL"}
            </h3>
            <p className="result-description">
              {isSpam
                ? "This email appears to be spam or phishing. Exercise caution."
                : "This email appears to be legitimate and safe."}
            </p>
          </div>
        </div>

        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">Confidence</span>
            <span className="stat-value">
              {(result.confidence * 100).toFixed(2)}%
            </span>
            <div className="stat-bar">
              <div
                className="stat-fill confidence"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-label">Spam Probability</span>
            <span className="stat-value spam-text">
              {(result.spam_probability * 100).toFixed(2)}%
            </span>
            <div className="stat-bar">
              <div
                className="stat-fill spam"
                style={{ width: `${result.spam_probability * 100}%` }}
              />
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-label">Legitimate Probability</span>
            <span className="stat-value ham-text">
              {(result.ham_probability * 100).toFixed(2)}%
            </span>
            <div className="stat-bar">
              <div
                className="stat-fill ham"
                style={{ width: `${result.ham_probability * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="confidence-visual">
          <div className="confidence-labels">
            <span className="label-ham">Legitimate</span>
            <span className="label-spam">Spam</span>
          </div>
          <div className="confidence-bar">
            <div
              className={`confidence-fill ${isSpam ? "spam" : "ham"}`}
              style={{ width: `${result.spam_probability * 100}%` }}
            />
          </div>
          <div className="confidence-scale">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {result.attachments_info && result.attachments_info.length > 0 && (
          <div className="attachments-section">
            <h4 className="attachments-title">
              📎 Attachments Analyzed ({result.attachments_info.length})
            </h4>
            <ul className="attachments-list">
              {result.attachments_info.map((att, index) => (
                <li key={index} className="attachment-item">
                  <div className="attachment-info">
                    <span className="attachment-name">{att.filename}</span>
                    <span className="attachment-meta">
                      {formatFileSize(att.size)} •{" "}
                      {att.content_type || "unknown type"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
