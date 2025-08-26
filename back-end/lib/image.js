// lib/image.js

/**
 * Build a Cloudinary CDN URL for an image.
 */
export function cdnUrl(publicId) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${publicId}`;
}

/**
 * Map a simple aspect ratio string to a DALL·E 3 size.
 * Defaults to "1024x1024" if the ratio is unrecognized.
 */
export function sizeForAR(ar) {
  const s = (ar || "").trim();
  if (s === "16:9") return "1792x1024";
  if (s === "9:16") return "1024x1792";
  return "1024x1024"; // 1:1 default
}

export default { cdnUrl, sizeForAR };
