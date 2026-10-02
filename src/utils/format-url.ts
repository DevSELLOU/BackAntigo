import { logger } from './logger';

export function getBaseUrlFromURLObject(url) {
  try {
    const urlObject = new URL(url);
    const origin = urlObject.origin;
    const encodedPath = urlObject.pathname;
    const decodedPath = decodeURIComponent(encodedPath);
    return origin + decodedPath;
  } catch (error) {
    logger.error('Invalid URL:', url);
    return url;
  }
}
