import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Serif_Telugu, Playfair_Display, Space_Grotesk } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { site } from "@/lib/site";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Motion from "@/components/Motion";
import FloatingContact from "@/components/FloatingContact";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], style: ["normal", "italic"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const telugu = Noto_Serif_Telugu({ variable: "--font-telugu", subsets: ["telugu"], weight: ["500", "700"] });
// Only for the "Powered by Lasan Labs" signature in the footer.
const grotesk = Space_Grotesk({ variable: "--font-space-grotesk", weight: "600", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${site.name} | Architecture, Interiors & Turnkey Projects`, template: `%s | ${site.name}` },
  description: site.statement,
  openGraph: { title: site.name, description: site.statement, siteName: site.name, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#0b0806" };

// Runs before first paint: enables JS-only reveal styles. The temple-door intro plays on every visit;
// the "dv-intro" session flag only exists so the screenshot harness can skip it.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('dv-intro'))d.classList.add('intro-seen')}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable} ${telugu.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>

        <Nav />
        <main>{children}</main>
        <Footer />
        <FloatingContact />
        <Motion />
      </body>
    </html>
  );
}

