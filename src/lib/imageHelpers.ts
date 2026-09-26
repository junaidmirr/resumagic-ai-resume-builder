/**
 * Image Helper Utilities
 * Handles image loading errors and fallbacks
 */

/**
 * Gets a fallback avatar URL based on user's name or email
 */
export function getFallbackAvatar(name?: string, email?: string): string {
  // Use UI Avatars API for fallback
  const displayName = name || email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1e3a8a&color=fff&size=96&bold=true`;
}

/**
 * Handles image loading errors with fallback
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string
): void {
  const img = event.currentTarget;

  // Prevent infinite loop
  if (img.src === fallbackUrl) {
    console.warn('[ImageHelper] Fallback image also failed to load');
    return;
  }

  console.warn('[ImageHelper] Image failed to load, using fallback:', img.src);
  img.src = fallbackUrl;
}

/**
 * Proxies Google profile images through a reliable service to avoid CORS/network issues
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's a Google profile image, it might have CORS/network issues
  if (url.includes('googleusercontent.com')) {
    console.warn('[ImageHelper] Google profile image detected, may have loading issues:', url);
    // Return the original URL but we'll handle errors gracefully
    return url;
  }

  return url;
}
