"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Img = { id: number; image: string; captionAr: string; captionEn: string };

/** Display-only carousel: images are not clickable / orderable. */
export default function Carousel({ images }: { images: Img[] }) {
  const { p } = useLocale();
  const [i, setI] = useState(0);
  const n = images.length;

  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 4500);
    return () => clearInterval(id);
  }, [n]);

  if (!n) return null;
  return (
    <div className="relative mx-auto w-full max-w-5xl select-none overflow-hidden rounded-3xl bg-verde/10 shadow-xl">
      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        {images.map((im, idx) => (
          <div
            key={im.id}
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={idx !== i}
          >
            <img
              src={im.image}
              alt={p(im.captionAr, im.captionEn)}
              draggable={false}
              className="h-full w-full object-cover"
            />
            {(im.captionAr || im.captionEn) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-12 text-lg font-semibold text-white">
                {p(im.captionAr, im.captionEn)}
              </div>
            )}
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button
            onClick={() => setI((i - 1 + n) % n)}
            aria-label="Previous"
            className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-verde shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={() => setI((i + 1) % n)}
            aria-label="Next"
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-verde shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {images.map((im, idx) => (
              <button
                key={im.id}
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
