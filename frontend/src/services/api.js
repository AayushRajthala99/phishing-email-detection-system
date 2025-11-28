import axios from "axios";

// -----------------------------
// Configuration
// -----------------------------
const API_BASE_URL = "/api";

// Define keys to match FastAPI 'Form(...)' and 'File(...)' parameter names exactly
const FORM_KEYS = {
  SUBJECT: "subject",
  BODY: "body",
  FILES: "files",
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// -----------------------------
// Validation Helper
// -----------------------------
const validatePredictionInput = (subject, body) => {
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    throw new Error(
      "Validation Error: Subject is required and must be a string."
    );
  }
  if (!body || typeof body !== "string" || !body.trim()) {
    throw new Error("Validation Error: Body content is required.");
  }
};

// -----------------------------
// API Service
// -----------------------------
export const emailDetectionAPI = {
  checkHealth: async () => {
    try {
      const response = await apiClient.get("/health");
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: error.message };
    }
  },

  /**
   * Sends data to FastAPI.
   * Backend Expects:
   * - subject: Form(str)
   * - body: Form(str)
   * - files: List[UploadFile]
   */
  predictEmail: async (subject, body, files = []) => {
    // 1. Validate before sending (Fail fast)
    validatePredictionInput(subject, body);

    try {
      // 2. Construct FormData
      const formData = new FormData();
      formData.append(FORM_KEYS.SUBJECT, subject.trim());
      formData.append(FORM_KEYS.BODY, body.trim());

      // 3. Handle Files
      if (files && files.length > 0) {
        files.forEach((file) => {
          // Safety check: ensure it is actually a File object
          if (file instanceof File) {
            formData.append(FORM_KEYS.FILES, file);
          }
        });
      }

      // 4. Send Request
      // NOTE: We do NOT set 'Content-Type'. Axios + Browser detects FormData
      // and sets 'multipart/form-data' with the correct boundary automatically.
      const response = await apiClient.post("/predict", formData, {
        timeout: 60000, // Higher timeout for file uploads
      });

      return response.data;
    } catch (error) {
      // Return a consistent error format
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Backend Error:", error.response.data);
        throw error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        throw {
          detail: "Server is not responding. Please check your connection.",
        };
      } else {
        // Something happened in setting up the request (validation errors, etc.)
        throw { detail: error.message };
      }
    }
  },
};

export default emailDetectionAPI;
