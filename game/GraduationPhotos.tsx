import { useEffect, useRef, useState } from "react";
import { CharacterArt } from "./WorldArt";
import { PHOTO_DURATION, SNAPSHOT_CAPTIONS, photoFrame } from "./graduation";

/** A single white fade, followed by three still snapshots. No pose choices. */
export function GraduationPhotos({ blocked, onComplete }: { blocked: boolean; onComplete: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const clock = useRef(0);
  const completed = useRef(false);
  const complete = useRef(onComplete);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (blocked || completed.current) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      if (!document.hidden) clock.current = Math.min(PHOTO_DURATION,clock.current+Math.min(now-previous,100));
      previous = now;
      const time = clock.current;
      setElapsed(previous => previous < 1000 || photoFrame(previous).index !== photoFrame(time).index || time === PHOTO_DURATION ? time : previous);
      if (clock.current >= PHOTO_DURATION) { completed.current = true; complete.current(); }
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [blocked]);
  const state = photoFrame(elapsed);
  return <section className="graduation-photos" style={{ visibility:blocked ? "hidden" : undefined }} role="dialog" aria-modal="true" aria-label="Schnappschüsse von Elias und Felice" data-testid="graduation-photos" data-photo-index={state.index} data-photo-time={Math.round(elapsed)}>
    <div className="graduation-photo-background"/>
    <div className="snapshot-stack">
      {SNAPSHOT_CAPTIONS.map((caption,index) => <figure className={`graduation-snapshot snapshot-${index}${state.index === index ? " is-visible" : ""}`} key={caption} aria-hidden={state.index !== index}>
        <div className="snapshot-picture" role="img" aria-label={`Elias und Felice – ${caption}`}>
          <div className="snapshot-gym"/>
          <div className="snapshot-person snapshot-felice"><CharacterArt id="felice"/></div>
          <div className="snapshot-person snapshot-elias"><CharacterArt id="elias"/></div>
          <div className="snapshot-sunlight"/>
        </div>
        <figcaption>{caption}<small>Elias & Felice · Sommer 2026</small></figcaption>
      </figure>)}
    </div>
    <span className="snapshot-white" style={{ opacity:state.flash }} aria-hidden="true" data-testid="snapshot-white"/>
    <p className="snapshot-memory-caption" aria-live="polite">Ein Moment von uns beiden.</p>
  </section>;
}
