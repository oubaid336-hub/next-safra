export function getApiBaseUrl() {
  if (typeof window === "undefined") return "https://safra-vv3z.onrender.com";
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isLanIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname);
  return (isLocalHost || isLanIp)
    ? `http://${window.location.hostname}:5000`
    : "https://safra-vv3z.onrender.com";
}
