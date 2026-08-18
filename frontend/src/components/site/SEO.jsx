import { useEffect } from "react";

export default function SEO({ title, description, canonical }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
      m.content = description;
      let og = document.querySelector('meta[property="og:title"]');
      if (og) og.content = title || "";
    }
    if (canonical) {
      let l = document.querySelector('link[rel="canonical"]');
      if (!l) { l = document.createElement("link"); l.rel = "canonical"; document.head.appendChild(l); }
      l.href = canonical;
    }
  }, [title, description, canonical]);
  return null;
}
