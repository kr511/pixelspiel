"use client";

import { useEffect, useState } from "react";
import { assetUrl } from "./assets";
import { START_SLIDES, START_SLIDE_MS } from "./start-slides";

export function StartBackdrop() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex(current => (current + 1) % START_SLIDES.length), START_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="start-backdrop" aria-hidden="true" data-testid="start-backdrop" data-slide={index}>
    {START_SLIDES.map((slide, i) => <img key={slide.src} src={assetUrl(slide.src)} alt="" className={i === index ? "active" : undefined} draggable={false}/>)}
    <span className="start-backdrop-caption">{START_SLIDES[index].caption}</span>
  </div>;
}
