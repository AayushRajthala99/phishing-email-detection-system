import React from "react";
import "./ErrorDisplay.css";

const ErrorDisplay = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">Something went wrong</h3>
        <p className="error-message">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            🔄 Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
