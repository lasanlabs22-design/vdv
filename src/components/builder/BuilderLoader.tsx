"use client";

import dynamic from "next/dynamic";

// Client only: the builder restores the visitor's saved design from this browser before its first render.
const Builder = dynamic(() => import("./Builder"), {
  ssr: false,
  loading: () => (
    <div className="builder builder--loading">
      <div className="scene-loading"><span />Opening your site…</div>
    </div>
  ),
});

export default function BuilderLoader() {
  return <Builder />;
}
