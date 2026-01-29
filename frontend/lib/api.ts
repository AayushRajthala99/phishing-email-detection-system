export const getApiUrl = () => {
  // On the server (Next.js backend), use the environment variable directly
  if (typeof window === "undefined") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost";
    const apiPort = process.env.NEXT_PUBLIC_API_PORT || "5000";
    
    // Don't add port if URL already contains it
    if (apiUrl.includes(':')) {
      return apiUrl;
    }
    
    return `${apiUrl}:${apiPort}`;
  }

  // On the client (browser), construct from window.location
  const port = process.env.NEXT_PUBLIC_API_PORT || "5000";
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
};