import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGet } from "@/hooks/usePublic";
import { mediaUrl } from "@/lib/api";

function ytEmbed(url = "") {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function SlideMedia({ s }) {
  const yt = s.media_type === "video" ? ytEmbed(s.video_url) : null;
  return (
    <div className="relative h-full w-full">
      {s.media_type === "video" ? (
        yt ? <iframe title={s.title} src={yt} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
           : <video src={mediaUrl(s.video_url)} className="h-full w-full object-cover" controls playsInline />
      ) : (
        <img src={mediaUrl(s.image_url)} alt={s.title || "Announcement"} className="h-full w-full object-cover" />
      )}
      {(s.title || s.description) && s.media_type !== "video" && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-4 text-center text-white sm:p-6">
          {s.title && <h2 className="font-heading text-lg font-bold sm:text-xl">{s.title}</h2>}
          {s.description && <p className="mx-auto mt-1 max-w-2xl text-xs text-slate-200 sm:text-sm">{s.description}</p>}
        </div>
      )}
    </div>
  );
}

export default function HomeSlider() {
  const { data } = useGet("/slides");
  const slides = (data || []).filter((s) => s.image_url || s.video_url);
  const [i, setI] = useState(0);
  const [perView, setPerView] = useState(typeof window !== "undefined" && window.innerWidth >= 768 ? 2 : 1);

  useEffect(() => {
    const onResize = () => setPerView(window.innerWidth >= 768 ? 2 : 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const n = slides.length;
  const maxIndex = Math.max(0, n - perView);

  useEffect(() => { if (i > maxIndex) setI(0); }, [perView, maxIndex, i]);

  useEffect(() => {
    if (n <= perView) return;
    const t = setInterval(() => setI((x) => (x >= maxIndex ? 0 : x + 1)), 6000);
    return () => clearInterval(t);
  }, [n, perView, maxIndex]);

  if (!n) return null;
  const canSlide = n > perView;
  const prev = () => setI((x) => (x <= 0 ? maxIndex : x - 1));
  const next = () => setI((x) => (x >= maxIndex ? 0 : x + 1));

  return (
    <section className="relative bg-slate-950" data-testid="home-slider">
      <div className="relative mx-auto aspect-[16/6] max-h-[420px] w-full overflow-hidden">
        <div className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ width: `${(n * 100) / perView}%`, transform: `translateX(-${i * (100 / n)}%)` }}>
          {slides.map((s, k) => (
            <div key={s.id || k} className="h-full shrink-0 border-r border-slate-950" style={{ width: `${100 / n}%` }} data-testid={`slide-${k}`}>
              <SlideMedia s={s} />
            </div>
          ))}
        </div>
        {canSlide && (
          <>
            <button onClick={prev} data-testid="slider-prev" aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-slate-900 hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={next} data-testid="slider-next" aria-label="Next"
              className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-slate-900 hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, k) => (
                <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
