import { API_BASE } from "../services/api";

export function getProductImageUrl(img) {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
}
