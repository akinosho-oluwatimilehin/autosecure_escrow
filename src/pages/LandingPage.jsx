import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

const featureCards = [
  {
    icon: ShieldCheck,
    title: 'Escrow protected',
    description: 'Funds stay secure until the vehicle meets the agreed condition and handoff requirements.',
  },
  {
    icon: FileCheck,
    title: 'Inspection verified',
    description: 'Repair shops document the car’s health before funds are released, reducing surprises and disputes.',
  },
  {
    icon: Truck,
    title: 'Carrier tracking',
    description: 'Track delivery milestones in real time with logistics updates and clear handoff checkpoints.',
  },
  {
    icon: CarFront,
    title: 'Marketplace ready',
    description: 'List verified vehicles, match buyers, and manage every handoff from one modern workflow.',
  },
];

const steps = [
  'Create a secure escrow agreement',
  'Inspect the vehicle before release',
  'Track delivery and settle funds',
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="brand" aria-label="AutoSecure Escrow home">
          <span className="brand-mark"><ShieldCheck size={18} /></span>
          <span>AutoSecure Escrow</span>
        </div>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#security">Security</a>
        </nav>

        <div className="landing-actions">
          <Link to="/login" className="button ghost">Sign in</Link>
          <Link to="/register" className="button primary">Create account</Link>
        </div>
      </header>

      <main className="landing-page">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow-wrap">
              <Sparkles size={16} />
              Trusted automotive escrow for modern buyers and sellers
            </div>

            <h1>
              Secure every vehicle deal
              <span className="hero-highlight"> from listing to final delivery.</span>
            </h1>
            <p>
              AutoSecure Escrow helps dealers, buyers, repair shops, and logistics teams manage vehicle transactions
              with safer payments, inspection accountability, and transparent status updates.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="button primary large">
                Start now <ArrowRight size={18} />
              </Link>
              <Link to="/marketplace" className="button secondary large">
                Explore marketplace
              </Link>
            </div>

            <div className="hero-metrics">
              <div>
                <strong>2,500+</strong>
                <span>Protected transactions</span>
              </div>
              <div>
                <strong>99.8%</strong>
                <span>On-time delivery</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Escrow monitoring</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Escrow workflow overview">
            <div className="glow-orb orb-one" />
            <div className="glow-orb orb-two" />

            <div className="visual-card main-card">
              <div className="visual-topline">
                <span className="dot green" />
                Active escrow
              </div>
              <h3>2022 Toyota Camry</h3>
              <div className="price-row">
                <span>Escrow value</span>
                <strong>$18,000</strong>
              </div>
              <div className="progress-row">
                <div className="progress-line">
                  <span style={{ width: '72%' }} />
                </div>
                <span>72% complete</span>
              </div>
            </div>

            <div className="floating-card card-one">
              <CheckCircle2 size={18} />
              <div>
                <strong>Inspection approved</strong>
                <span>passed by repair team</span>
              </div>
            </div>

            <div className="floating-card card-two">
              <Truck size={18} />
              <div>
                <strong>In transit</strong>
                <span>Tracking ID: TRK-1B8A511F</span>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-bar" id="security">
          <span>Trusted by private buyers</span>
          <span>Dealer networks</span>
          <span>Repair shops</span>
          <span>Carrier partners</span>
        </section>

        <section className="feature-section" id="features">
          <div className="section-heading">
            <p className="eyebrow">Why AutoSecure</p>
            <h2>Built to reduce risk at every handoff.</h2>
          </div>

          <div className="feature-grid">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article key={title} className="feature-card">
                <span className="feature-icon">
                  <Icon size={18} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow-section" id="workflow">
          <div className="section-heading narrow">
            <p className="eyebrow">How it works</p>
            <h2>A simple flow that keeps everyone aligned.</h2>
          </div>

          <div className="workflow-grid">
            {steps.map((step, index) => (
              <div key={step} className="workflow-step">
                <span className="step-index">0{index + 1}</span>
                <h3>{step}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-panel">
          <div>
            <p className="eyebrow">Ready to begin?</p>
            <h2>Launch a safer vehicle transaction today.</h2>
          </div>
          <div className="cta-actions">
            <Link to="/register" className="button primary">Get started</Link>
            <Link to="/login" className="button ghost">Log in</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
