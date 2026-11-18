import Image from "next/image";
import Link from "next/link";
import DarshanButton from "./DarshanButton";
import Showcase from "./Showcase";

export default function Hero() {
  return (
    <section className="divine-home" aria-labelledby="divine-title">
      <div className="divine-hero">
        <div className="divine-copy">
          <p className="divine-overline"><span /> Inspired by Tirumala. Created for you.</p>
          <h1 id="divine-title" tabIndex={-1}>A divine vision.<br />A space <em>uniquely<br className="desktop-break" /> yours.</em></h1>
          <p className="divine-description">At the feet of Lord Venkateshwara, every creation begins. We translate that devotion into architecture, interiors and homes with soul.</p>
          <div className="divine-actions">
            <Link href="/studio" className="btn btn--gold">Create your space <span aria-hidden="true">↗</span></Link>
            <a href="#work" className="divine-text-link">Explore our work <span aria-hidden="true">→</span></a>
          </div>
          <div className="divine-signature"><span className="sacred-mark" aria-hidden="true">∪<i /></span><p>Rooted in devotion.<br /><strong>Designed for generations.</strong></p></div>
        </div>
        <figure className="divine-shrine">
          <div className="shrine-orbit" aria-hidden="true" />
          <div className="shrine-portrait"><Image src="/devotional/lord-balaji.webp" alt="Lord Balaji, the inspiration behind Venkateshwara DV Spaces" fill sizes="(max-width: 700px) 100vw, 60vw" loading="eager" /></div>
          <figcaption><span lang="te">ఓం నమో వేంకటేశాయ</span><small>In His grace, we create.</small></figcaption>
          <DarshanButton />
        </figure>
        <span className="divine-side-note" aria-hidden="true">THE SACRED IN THE EVERYDAY</span>
      </div>
      <div className="divine-foundation">
        <p>Divine inspiration.<br /><em>Enduring expertise.</em></p>
        <dl><div><dt>30<span>+</span></dt><dd>Years of practice</dd></div><div><dt>400<span>+</span></dt><dd>Projects delivered</dd></div><div><dt>One</dt><dd>Unwavering devotion</dd></div></dl>
        <a href="#about" aria-label="Discover our philosophy">↓</a>
      </div>
      <Showcase />
    </section>
  );
}
