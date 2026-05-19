import { API_BASE } from "../services/api";

export function getProductImageUrl(img) {
  if (!img) return "https://via.placeholder.com/300x300?text=No+Image";

  if (img.startsWith("http://localhost:5000")) {
    return img.replace(
      "http://localhost:5000",
      "https://observant-truth-production-f7df.up.railway.app"
    );
  }

  if (img.startsWith("https://") || img.startsWith("http://") || img.startsWith("data:")) {
    return img;
  }

  if (img.startsWith("/uploads")) {
    return `${API_BASE}${img}`;
  }

  return `${API_BASE}/uploads/${img}`;
}