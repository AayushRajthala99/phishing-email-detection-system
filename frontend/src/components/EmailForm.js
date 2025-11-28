import React, { useState } from "react";
import "./EmailForm.css";

const EmailForm = ({ onSubmit, loading }) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ subject, body, files });
  };

  const handleReset = () => {
    setSubject("");
    setBody("");
    setFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="email-form">
      <div className="form-group">
        <label htmlFor="subject">
          Email Subject <span className="required">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject..."
          required
          disabled={loading}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="body">
          Email Body <span className="required">*</span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter email body content..."
          required
          disabled={loading}
          rows="8"
          className="form-textarea"
        />
      </div>

      <div className="form-group">
        <label htmlFor="files">
          Attachments <span className="optional">(Optional)</span>
        </label>
        <input
          type="file"
          id="files"
          onChange={handleFileChange}
          multiple
          disabled={loading}
          className="form-file-input"
        />

        {files.length > 0 && (
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={loading}
                  className="remove-file-btn"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              <span className="btn-icon">🔍</span>
              Analyze Email
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="btn btn-secondary"
        >
          Clear Form
        </button>
      </div>
    </form>
  );
};

export default EmailForm;
