const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isLanIp =
  typeof window !== 'undefined' &&
  /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname);

export const API_BASE_URL =
  typeof window !== 'undefined' && (isLocalHost || isLanIp)
    ? `http://${window.location.hostname}:5000`
    : 'https://safra-vv3z.onrender.com';
