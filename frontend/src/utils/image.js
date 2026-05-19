import { API_BASE } from "../services/api";

export function getProductImageUrl(img) {
  if (!img) return "";

  if (img.startsWith("http://localhost:5000")) {
    return img.replace(
      "http://localhost:5000",
      "https://observant-truth-production-f7df.up.railway.app"
    );
  }

  if (img.startsWith("http")) return img;

  return `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
}