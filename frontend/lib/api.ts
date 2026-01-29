export const getApiUrl = () => {
  if (typeof window === "undefined") {
    return `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_API_PORT}`;
  }

  return `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_API_PORT}`;
};
