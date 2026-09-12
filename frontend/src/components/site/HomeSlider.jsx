import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGet } from "@/hooks/usePublic";
import { mediaUrl } from "@/lib/api";

function ytEmbed(url = "") {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function HomeSlider() {
  const { data } = useGet("/slides");
  const slides = (data || []).filter((s) => s.image_url || s.video_url);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;
  const s = slides[i % slides.length];
  const yt = s.media_type === "video" ? ytEmbed(s.video_url) : null;

  return (
    <section className="relative bg-slate-950" data-testid="home-slider">
      <div className="relative mx-auto flex aspect-[16/6] max-h-[420px] w-full items-center justify-center overflow-hidden">
        {s.media_type === "video" ? (
          yt ? <iframe title={s.title} src={yt} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
             : <video src={mediaUrl(s.video_url)} className="h-full w-full object-cover" controls playsInline />
        ) : (
          <img src={mediaUrl(s.image_url)} alt={s.title || "Announcement"} className="h-full w-full object-cover" />
        )}
        {(s.title || s.description) && s.media_type !== "video" && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-6 text-center text-white">
            {s.title && <h2 className="font-heading text-xl font-bold sm:text-2xl">{s.title}</h2>}
            {s.description && <p className="mx-auto mt-1 max-w-2xl text-sm text-slate-200">{s.description}</p>}
          </div>
        )}
        {slides.length > 1 && (
          <>
            <button onClick={() => setI((i - 1 + slides.length) % slides.length)} data-testid="slider-prev" aria-label="Previous"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-slate-900"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => setI((i + 1) % slides.length)} data-testid="slider-next" aria-label="Next"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-slate-900"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {slides.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
