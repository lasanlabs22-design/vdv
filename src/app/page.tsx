import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Frieze from "@/components/Frieze";
import Services from "@/components/Services";
import SpacePicker from "@/components/SpacePicker";
import MoodSlider from "@/components/MoodSlider";
import Gallery from "@/components/Gallery";
import Projects from "@/components/Projects";
import SevenHills from "@/components/SevenHills";
import BuildReel from "@/components/BuildReel";
import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Intro />
      <Hero />

      <section id="about" className="section about">
        <div className="wrap about-grid">
          <figure className="framed reveal-img">
            <Image src="/works/24-pooja-room-balaji.jpg" alt="Pooja room with Lord Venkateshwara at its heart, designed by Dr. Anil Verma" width={1199} height={1312} sizes="(max-width: 900px) 92vw, 480px" />
            <figcaption>Srivari pooja room</figcaption>
          </figure>
          <div>
            <p className="eyebrow reveal">DV means Divine Vision</p>
            <h2 className="title reveal" data-delay="80">Thirty years of architecture, <em>offered to every home.</em></h2>
            <p className="lead reveal" data-delay="160">
              {site.founder} is an award-winning architect. He studied at the University of Virginia, holds a PhD in Architecture and has delivered more than 400 government and private projects across the globe.
            </p>
            <p className="body reveal" data-delay="220">
              DV Spaces is how he shares that experience. A modest budget or a generous one receives the same care, and no design is ever copied from another project. Every space is drawn new, for the family or business that will use it, and every project begins with the Lord.
            </p>
            <p className="signature reveal" data-delay="280">
              {site.founder}
              <span>Founder &amp; Principal Architect</span>
            </p>
          </div>
        </div>
      </section>

      <section id="services" className="section services-section">
        <div className="wrap">
          <div className="section-head section-head--center">
            <p className="eyebrow eyebrow--center reveal">Our services</p>
            <h2 className="title reveal" data-delay="80">From the first sketch <em>to your griha pravesh.</em></h2>
            <p className="lead reveal" data-delay="160">
              Five disciplines under one roof, guided by thirty years of practice and one promise: every space is designed new, for the people who will use it.
            </p>
          </div>
          <Services />
        </div>
      </section>

      <section id="projects" className="section projects-section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow reveal">One vision, every scale</p>
            <h2 className="title reveal" data-delay="80">From a first 1 BHK <em>to a city mall.</em></h2>
            <p className="lead reveal" data-delay="160">
              Homes, towers, gated communities, salons, malls and factories. {site.founder} turns each one into something no one else has, and every one carries the same divine vision.
            </p>
          </div>
          <Projects />
        </div>
      </section>

      <section id="spaces" className="section spaces">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow reveal">Choose your space</p>
            <h2 className="title reveal" data-delay="80">Every scale. <em>Your signature.</em></h2>
            <p className="lead reveal" data-delay="160">From a first home to a skyline. Explore residences, villas, communities, workplaces, retail, salons and industrial spaces. Shape the plan, compose the materials and study your building in light.</p>
          </div>
          <SpacePicker />
        </div>
      </section>

      <section id="compare" className="mood-section">
        <MoodSlider
          intro={
            <>
              <p className="eyebrow">Minimal to premium</p>
              <h2 className="title">Every budget. <em>The same devotion.</em></h2>
              <p className="mood-lead">Choose a room, a home or a building, then drag across to compare a minimal design with a premium one. Every pair is by {site.founder}.</p>
            </>
          }
        />
      </section>

      <section id="work" className="work">
        <Gallery
          intro={
            <>
              <p className="eyebrow">Selected work</p>
              <h2 className="title">Spaces drawn new, <em>every single time.</em></h2>
              <p className="wk-lead">Twenty-one rooms from {site.founder}&apos;s recent homes. No two share a design, because no two families live the same way.</p>
            </>
          }
        />
      </section>

      <section id="build" className="build">
        <div className="build-screen">
          <div className="build-copy">
            <p className="eyebrow">From plot to home</p>
            <h2 className="title">Every home begins <em>with bare earth.</em></h2>
            <p className="build-lead">Before the marble and the lamps there is only a plot. Watch an empty site become a finished family home, floor by floor.</p>
          </div>
          <BuildReel src="/videos/build-plot.mp4" label="Aerial film of an empty plot becoming a finished home" />
        </div>
      </section>

      <section className="build build--flip">
        <div className="build-screen">
          <div className="build-copy">
            <p className="eyebrow">Drawing to doorstep</p>
            <h2 className="title">From the first line <em>to the front door.</em></h2>
            <p className="build-lead">Every home starts as a plan. The structure follows the drawing, and the rooms inside are finished exactly as they were designed.</p>
          </div>
          <BuildReel src="/videos/build-walkthrough.mp4" label="Film of a home rising from its plans, then a walk through the front door into the finished interior" />
        </div>
      </section>

      <section id="process" className="process">
        <div className="process-screen">
          <div className="process-head">
            <div>
              <p className="eyebrow">Turnkey, start to finish</p>
              <h2 className="title">Seven hills <em>to your new home.</em></h2>
            </div>
            <p className="lead">Pilgrims climb the seven hills of Tirumala to reach Venkatadri. Every project with us follows seven steps, from the first conversation to the griha pravesh. Tap a hill to see each one.</p>
          </div>
          <SevenHills />
        </div>
      </section>

      <section className="vision" aria-label="Every project is an offering">
        <div className="vision-bg" aria-hidden="true">
          <Image src="/devotional/temple-gates.webp" alt="" fill sizes="100vw" />
        </div>
        {/* A brass deepam on either side, as at a temple threshold. */}
        <div className="vision-lamp vision-lamp--l" aria-hidden="true"><Image src="/devotional/brass-deepam.webp" alt="" fill sizes="20vw" /></div>
        <div className="vision-lamp vision-lamp--r" aria-hidden="true"><Image src="/devotional/brass-deepam.webp" alt="" fill sizes="20vw" /></div>
        <div className="wrap vision-inner">
          <p className="vision-mantra" lang="te">ఓం నమో వేంకటేశాయ</p>
          <Frieze className="frieze--short" />
          <blockquote className="vision-text reveal">
            After thirty years of building across the world, his path leads to <em>Tirupati</em>, at the feet of the Lord. Until then, every project is <em>an offering.</em>
          </blockquote>
          <p className="vision-sign reveal" data-delay="80">{site.founder}<span>Founder &amp; Principal Architect</span></p>
          <div className="vision-actions reveal" data-delay="160">
            <Link href="/studio" className="btn btn--gold">Begin your project in 3D <span aria-hidden="true">↗</span></Link>
            <a href="#contact" className="btn btn--ghost">Talk to Dr. Verma&apos;s team</a>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact">
        <div className="wrap contact-grid">
          <div>
            <p className="eyebrow reveal">Start a project</p>
            <h2 className="title reveal" data-delay="80">Tell us about <em>your space.</em></h2>
            <p className="lead reveal" data-delay="160">2 BHK interiors start from ₹3.5 L and 3 BHK from ₹7.5 L. Villas, offices and showrooms are quoted after a site visit.</p>
            <ul className="contact-services reveal" data-delay="220">
              {site.services.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="reveal" data-delay="120"><ContactForm /></div>
        </div>
      </section>
    </>
  );
}

