import axios from "axios";

const API_BASE_URL = "/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Service
export const emailDetectionAPI = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await apiClient.get("/health");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Predict with JSON (no files)
  predictEmail: async (emailData) => {
    try {
      const response = await apiClient.post("/predict", emailData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Predict with files
  predictEmailWithFiles: async (subject, body, files = []) => {
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);

      // Append files
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await axios.post(
        `${API_BASE_URL}/predict-with-files`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // 60 seconds for file uploads
        }
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default emailDetectionAPI;
