import React from 'react';
import { Link } from 'react-router-dom';

const highlightFeatures = [
  {
    badge: 'F',
    title: 'Funds locked',
    description: 'Deposits held in segregated custody until each milestone clears.',
  },
  {
    badge: 'VI',
    title: 'Verified inspection',
    description: 'On-site tech sign-off with timestamped photo evidence.',
  },
];

const roleCards = [
  {
    id: 'buyer',
    title: 'BUYER',
    description: 'Funds lock on offer acceptance. Release is automatic — no manual handoff, no chasing.',
  },
  {
    id: 'dealer',
    title: 'VERIFIED DEALER',
    description: 'Only licensed car dealers with CAC business verification can list inventory and receive automated escrow payouts.',
  },
  {
    id: 'inspector',
    title: 'INSPECTOR',
    description: 'On-site technical report gates the vault — condition must match the listing exactly.',
  },
  {
    id: 'carrier',
    title: 'CARRIER',
    description: 'Live shipment tracking provides the final proof before the key turns and funds move.',
  },
];

const flowSteps = [
  {
    number: '01',
    title: 'Deposit locked',
    description: 'Buyer funds enter segregated escrow the instant the offer is accepted.',
  },
  {
    number: '02',
    title: 'Inspection',
    description: 'A verified inspector confirms VIN, condition, and title authenticity on site.',
  },
  {
    number: '03',
    title: 'Shipping',
    description: 'GPS-tracked transport with photo proof at pickup and drop-off.',
  },
  {
    number: '04',
    title: 'Payout',
    description: 'The vault releases to the dealer once the key verifies and title transfers.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <Link to="/" className="brand" aria-label="AutoSecure Escrow home">
          <span className="brand-mark">A</span>
          <span className="brand-name">AutoSecure</span>
        </Link>

        <div className="landing-header-right">
          <span className="nav-tag">ESCROW</span>
          <Link to="/login" className="nav-signin-btn">
            Sign In
          </Link>
        </div>
      </header>

      <main className="landing-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow-wrap">PEER-TO-PEER VEHICLE ESCROW</div>

            <h1>
              The vault closes on<br />
              the key the moment<br />
              every milestone clicks.
            </h1>

            <p>
              Buyer funds lock in escrow and release only when verification, inspection, and
              shipment each confirm. No trust assumptions — just proof.
            </p>

            <div className="milestone-card">
              <div className="milestone-header">
                <span>ESCROW MILESTONES · VIN 1HGCM82633A</span>
                <span className="milestone-status">3 of 4 locked</span>
              </div>

              <div className="milestone-track" aria-label="Escrow progress">
                <div className="milestone-step active">
                  <div className="step-dot active">1</div>
                  <span className="step-name">Deposit</span>
                </div>
                <div className="milestone-line active" />

                <div className="milestone-step active">
                  <div className="step-dot active">2</div>
                  <span className="step-name">Inspect</span>
                </div>
                <div className="milestone-line active" />

                <div className="milestone-step active">
                  <div className="step-dot active">3</div>
                  <span className="step-name">Ship</span>
                </div>
                <div className="milestone-line" />

                <div className="milestone-step">
                  <div className="step-dot">4</div>
                  <span className="step-name">Payout</span>
                </div>
              </div>

              <div className="locked-panel">
                <div className="locked-number">04</div>
                <div className="locked-copy">
                  <strong>Auction '21 Camry LE · $24,000</strong>
                  <span>Locked by escrow · releases on title transfer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights (Funds locked & Verified inspection) */}
        <section className="features-grid">
          {highlightFeatures.map(({ badge, title, description }) => (
            <div key={title} className="feature-card">
              <div className="feature-badge">{badge}</div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </section>

        {/* Four Roles Section */}
        <section className="roles-section">
          <h2>Four roles. One locked pipeline.</h2>
          <p className="roles-subtitle">
            Each party works their lane; the vault only opens when they line up.
          </p>

          <div className="roles-grid">
            {roleCards.map(({ id, title, description }) => (
              <article key={id} className="role-card">
                <div className="role-header">
                  <span className="role-title">{title}</span>
                  <span className="role-rule" />
                </div>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Milestone Flow Timeline */}
        <section className="flow-section">
          <h2>The milestone flow</h2>

          <div className="flow-list">
            {flowSteps.map(({ number, title, description }, index) => (
              <div key={number} className="flow-item">
                <div className="flow-node-col">
                  <span className="flow-node">{number}</span>
                  {index < flowSteps.length - 1 && <span className="flow-connector" />}
                </div>
                <div className="flow-copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disputes & Tracking */}
        <section className="disputes-section">
          <h2>Disputes &amp; tracking</h2>
          <p>
            Every milestone is logged and time-stamped, so a dispute resolves against
            evidence, not memory. Carriers report in real time; both parties see the same record.
          </p>
        </section>

        {/* CTA Panel */}
        <section className="cta-panel">
          <h3>Lock the sale. Prove the handoff.</h3>
          <p>Start a secure transaction and watch funds move only when the milestones click.</p>

          <div className="cta-actions">
            <Link to="/register" className="cta-primary-btn">
              Start a secure transaction
            </Link>
            <div className="cta-subtext">
              New here? You'll create a free account — <Link to="/login">existing users can switch to sign in.</Link>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="landing-footer">
          <span>AutoSecure Escrow</span>
          <span>Funds held in segregated custody</span>
        </footer>
      </main>
    </div>
  );
}

