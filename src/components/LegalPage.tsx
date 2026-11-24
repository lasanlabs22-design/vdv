import { legalMeta, legalTagline, type LegalDoc } from "@/lib/legal";
import { site } from "@/lib/site";

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <article className="section legal">
      <div className="wrap legal-wrap">
        <header className="legal-head">
          <p className="legal-company">{site.name}</p>
          <p className="eyebrow eyebrow--center">{legalTagline}</p>
          <h1 className="title">{doc.title}</h1>
          <p className="legal-meta">{legalMeta}</p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.heading} className="legal-section">
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        {doc.closing?.map((line) => <p key={line} className="legal-closing">{line}</p>)}
      </div>
    </article>
  );
}
