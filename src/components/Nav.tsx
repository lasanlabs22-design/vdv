"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/#projects", label: "Projects" },
  { href: "/#spaces", label: "Spaces" },
  { href: "/#compare", label: "Compare" },
  { href: "/#work", label: "Work" },
  { href: "/#process", label: "Process" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 40);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <Link href="/" className="nav-brand" aria-label="Venkateshwara DV Spaces, home">
        {/* The client's horizontal logo, used as supplied (transparent margins trimmed only). */}
        <Image src="/brand/logo-horizontal.png" alt="" width={2093} height={587} priority sizes="(max-width: 560px) 170px, 240px" />
      </Link>
      <nav className="nav-links" aria-label="Main">
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <Link href="/studio" className="nav-links-studio" onClick={() => setOpen(false)}>3D Studio</Link>
      </nav>
      <Link href="/studio" className="btn btn--gold nav-cta">3D Studio</Link>
      <button className="nav-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span /><span />
      </button>
    </header>
  );
}
