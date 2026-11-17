import Image from "next/image";
import Link from "next/link";
import { site, waNumber } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/brand/logo.png" alt={`${site.name} logo`} width={1254} height={1254} sizes="220px" />
          <p className="footer-statement">{site.statement}</p>
        </div>
        <div className="footer-col">
          <h3>Services</h3>
          <ul>{site.services.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="footer-col">
          <h3>Explore</h3>
          <ul>
            <li><Link href="/studio">3D Studio</Link></li>
            <li><Link href="/builder">Design your own</Link></li>
            <li><Link href="/#work">Our work</Link></li>
            <li><Link href="/#process">Seven hills process</Link></li>
            <li><Link href="/#contact">Start a project</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>WhatsApp</h3>
          <ul>
            {site.phones.map((p) => (
              <li key={p}><a href={`https://wa.me/${waNumber(p)}`} target="_blank" rel="noopener noreferrer">{p}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-base">
        <p lang="te" className="footer-mantra">ఓం నమో వేంకటేశాయ</p>
        <p className="powered-by">
          <span>Powered by</span>
          <span className="lasan-signature">Lasan Labs</span>
        </p>
        <p className="footer-copy">© {new Date().getFullYear()} {site.name}.</p>
      </div>
    </footer>
  );
}
