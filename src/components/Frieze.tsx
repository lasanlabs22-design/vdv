import { useId } from "react";

/** A fine-line temple border (lotus buds between diamonds), used as a static divider. Tiles at real size. */
export default function Frieze({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`frieze ${className}`} width="100%" height="18" aria-hidden="true">
      <defs>
        <pattern id={`${id}-m`} width="40" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 9H12M28 9H40" />
          <path d="M20 2L27 9L20 16L13 9Z" />
          <path d="M20 5.5L23.5 9L20 12.5L16.5 9Z" className="frieze-fill" />
          <path d="M3 9C3 6 5 4.5 6 4.5C7 4.5 9 6 9 9" />
          <path d="M31 9C31 6 33 4.5 34 4.5C35 4.5 37 6 37 9" />
        </pattern>
      </defs>
      <line x1="0" y1="0.5" x2="100%" y2="0.5" />
      <rect width="100%" height="18" fill={`url(#${id}-m)`} />
      <line x1="0" y1="17.5" x2="100%" y2="17.5" />
    </svg>
  );
}
