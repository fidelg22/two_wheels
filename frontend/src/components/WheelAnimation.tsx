import { useEffect, useRef } from "react";
import styles from "./WheelAnimation.module.css";

export default function WheelAnimation() {
  const imgRef  = useRef<HTMLImageElement>(null);
  const rotRef  = useRef(0);
  const tgtRef  = useRef(0);
  const rafRef  = useRef<number>(0);
  const reduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced.current) return;
    const onScroll = () => { tgtRef.current = (window.scrollY / 480) * 360; };
    window.addEventListener("scroll", onScroll, { passive: true });
    const tick = () => {
      rotRef.current += (tgtRef.current - rotRef.current) * 0.07;
      if (imgRef.current)
        imgRef.current.style.transform = `rotate(${rotRef.current}deg)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={styles.container} aria-hidden="true">
      <img
        ref={imgRef}
        src="/rueda.png"
        className={styles.wheel}
        alt=""
        draggable={false}
      />
    </div>
  );
}
