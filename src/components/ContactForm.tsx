"use client";

import { plans, tierIds, tiers } from "@/lib/plans";
import { whatsappLink } from "@/lib/site";

export default function ContactForm() {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const lines = [
      "Namaskaram! I would like to start a project with DV Spaces.",
      `Name: ${f.get("name")}`,
      `Phone: ${f.get("phone")}`,
      `Space: ${f.get("space")}`,
      `Style: ${f.get("style")}`,
      `City: ${f.get("city") || "-"}`,
      f.get("message") ? `Notes: ${f.get("message")}` : "",
    ].filter(Boolean);
    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener");
  };

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label>
        <span>Your name</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        <span>Phone</span>
        <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
      </label>
      <label>
        <span>Space</span>
        <select name="space" defaultValue="2 BHK">
          {plans.map((p) => <option key={p.id}>{p.label}</option>)}
          <option>Something else</option>
        </select>
      </label>
      <label>
        <span>Style</span>
        <select name="style" defaultValue="Signature">
          {tierIds.map((t) => <option key={t}>{tiers[t].label}</option>)}
        </select>
      </label>
      <label className="span-2">
        <span>City</span>
        <input name="city" autoComplete="address-level2" />
      </label>
      <label className="span-2">
        <span>Tell us about your space</span>
        <textarea name="message" rows={3} />
      </label>
      <button type="submit" className="btn btn--gold span-2">Send on WhatsApp</button>
    </form>
  );
}
