import type { Product } from "@/lib/api";
import styles from "./ProductPlaceholder.module.css";

interface Props {
  product: Product;
}

function getCategoryIcon(slug: string): () => React.ReactElement {
  if (slug.includes("llanta") || slug.includes("tire")) return TireIcon;
  if (slug.includes("pastilla") || slug.includes("freno") || slug.includes("brake") || slug.includes("ebc")) return BrakeIcon;
  if (slug.includes("cadena") || slug.includes("chain")) return ChainIcon;
  if (slug.includes("aceite") || slug.includes("lubric") || slug.includes("oil")) return OilIcon;
  if (slug.includes("filtro") || slug.includes("filter")) return FilterIcon;
  return GearIcon;
}

export default function ProductPlaceholder({ product }: Props) {
  const Icon = getCategoryIcon(product.category?.slug ?? "");

  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>
        <Icon />
      </div>
    </div>
  );
}

/* ── Category SVG Icons ─────────────────────────────────────────────────── */

function TireIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4.5" />
      <circle cx="32" cy="32" r="17" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="32" r="5" fill="currentColor" />
      <line x1="32" y1="15" x2="32" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="37" x2="32" y2="49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="15" y1="32" x2="27" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="32" x2="49" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20.7" y1="20.7" x2="27" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="37" x2="43.3" y2="43.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="43.3" y1="20.7" x2="37" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20.7" y1="43.3" x2="27" y2="37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BrakeIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="32" r="24" stroke="currentColor" strokeWidth="4" />
      <circle cx="30" cy="32" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="9.5" r="2.5" fill="currentColor" />
      <circle cx="44.5" cy="17.5" r="2.5" fill="currentColor" />
      <circle cx="44.5" cy="46.5" r="2.5" fill="currentColor" />
      <circle cx="30" cy="54.5" r="2.5" fill="currentColor" />
      <circle cx="15.5" cy="46.5" r="2.5" fill="currentColor" />
      <circle cx="15.5" cy="17.5" r="2.5" fill="currentColor" />
      {/* Caliper bracket */}
      <path
        d="M54 24 L62 24 L62 40 L54 40 L54 36 L58 36 L58 28 L54 28 Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function ChainIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Three outer-plate links */}
      <rect x="4" y="22" width="20" height="20" rx="10" stroke="currentColor" strokeWidth="2.8" />
      <rect x="22" y="22" width="20" height="20" rx="10" stroke="currentColor" strokeWidth="2.8" />
      <rect x="40" y="22" width="20" height="20" rx="10" stroke="currentColor" strokeWidth="2.8" />
      {/* Rollers at pin joints */}
      <circle cx="24" cy="32" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="42" cy="32" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
      {/* Pin centers */}
      <circle cx="24" cy="32" r="2" fill="currentColor" />
      <circle cx="42" cy="32" r="2" fill="currentColor" />
      {/* Inner link plates between rollers */}
      <rect x="22" y="27" width="20" height="10" rx="5" stroke="currentColor" strokeWidth="1.8" strokeOpacity="0.5" />
    </svg>
  );
}

function OilIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="16" y="24" width="28" height="34" rx="4" stroke="currentColor" strokeWidth="3" />
      {/* Neck */}
      <rect x="22" y="14" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2.5" />
      {/* Cap */}
      <rect x="24" y="8" width="12" height="8" rx="2" fill="currentColor" fillOpacity="0.7" />
      {/* Spout nub */}
      <rect x="30" y="5" width="4" height="5" rx="2" fill="currentColor" fillOpacity="0.5" />
      {/* Oil drop inside body */}
      <path
        d="M32 33 C29.5 37.5 27 40.5 27 43 C27 46.3 29.2 49 32 49 C34.8 49 37 46.3 37 43 C37 40.5 34.5 37.5 32 33Z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main canister body */}
      <rect x="17" y="14" width="30" height="40" rx="5" stroke="currentColor" strokeWidth="3" />
      {/* Top end cap */}
      <rect x="21" y="10" width="22" height="7" rx="3" stroke="currentColor" strokeWidth="2" />
      {/* Bottom drain */}
      <rect x="26" y="52" width="12" height="5" rx="2.5" stroke="currentColor" strokeWidth="2" />
      {/* Filter media lines */}
      <line x1="23" y1="23" x2="41" y2="23" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
      <line x1="23" y1="29" x2="41" y2="29" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
      <line x1="23" y1="35" x2="41" y2="35" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
      <line x1="23" y1="41" x2="41" y2="41" stroke="currentColor" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
      {/* Center seam */}
      <line x1="32" y1="14" x2="32" y2="54" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
}

function GearIcon() {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="32" r="4.5" fill="currentColor" />
      {teeth.map((deg) => {
        const r = Math.PI / 180;
        const x1 = 32 + 14 * Math.cos(deg * r);
        const y1 = 32 + 14 * Math.sin(deg * r);
        const x2 = 32 + 24 * Math.cos(deg * r);
        const y2 = 32 + 24 * Math.sin(deg * r);
        return (
          <line
            key={deg}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
