import React, { useState } from "react";
import EmailForm from "./components/EmailForm";
import ResultDisplay from "./components/ResultDisplay";
import ErrorDisplay from "./components/ErrorDisplay";
import { emailDetectionAPI } from "./services/api";
import "./App.css";

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (emailData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await emailDetectionAPI.predictEmailWithFiles(emailData);
      setResult(response);
    } catch (err) {
      setError(err.message || "Failed to analyze email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1 className="title">🛡️ Email Phishing Detection System</h1>
            <p className="subtitle">
              Analyze emails and attachments for spam and phishing threats using
              advanced machine learning
            </p>
          </div>
        </header>

        <main className="main">
          <EmailForm onSubmit={handleSubmit} loading={loading} />

          {error && <ErrorDisplay error={error} onRetry={handleRetry} />}

          {result && <ResultDisplay result={result} />}

          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Analyzing email...</p>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>Powered by FastAPI & Machine Learning | Built with React</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
