import { API_BASE } from "../services/api";

export function getProductImageUrl(img) {
  if (!img) return "https://via.placeholder.com/300x300?text=No+Image";
  
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  
  // If it's a relative path starting with /uploads
  if (img.startsWith("/uploads")) {
    return `${API_BASE}${img}`;
  }
  
  // If it's just a filename
  return `${API_BASE}/uploads/${img}`;
}
