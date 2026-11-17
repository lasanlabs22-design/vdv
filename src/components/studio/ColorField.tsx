"use client";
import { swatchName, swatches } from "@/lib/builder";
export function ColorField({ label, value, onChange, fallback }: { label: string; value?: string; onChange: (v?: string) => void; fallback?: string }) {
  return (
    <div className="colour">
      <div className="colour-head">
        <span>{label}</span>
        <b>{value ? swatchName(value) : fallback ?? "Default"}</b>
      </div>
      <div className="colour-row">
        {fallback && <button className={`colour-swatch colour-swatch--none${!value ? " is-on" : ""}`} onClick={() => onChange(undefined)} aria-label="Use the style's colour" title="Style default" />}
        {swatches.map((s) => (
          <button key={s.hex} className={`colour-swatch${value?.toLowerCase() === s.hex ? " is-on" : ""}`} style={{ background: s.hex }} onClick={() => onChange(s.hex)} aria-label={s.name} title={s.name} />
        ))}
        <label className="colour-custom" title="Any colour">
          <input type="color" value={value ?? "#cccccc"} onChange={(e) => onChange(e.target.value)} aria-label={`Custom ${label.toLowerCase()} colour`} />
          <span aria-hidden="true">+</span>
        </label>
      </div>
    </div>
  );
}
