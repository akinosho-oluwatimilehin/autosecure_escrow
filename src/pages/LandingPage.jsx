import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Truck,
  Wallet,
  CircleDashed,
  HandCoins,
  LockKeyhole,
} from 'lucide-react';

const roleCards = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Funds lock on offer acceptance. Release is automatic — no manual handoff, no chasing.',
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'List, verify the deposit, and ship to a confirmed address. Payout lands on clearance.',
  },
  {
    id: 'inspector',
    title: 'Inspector',
    description: 'On-site technical report gates the vault — condition must match the listing exactly.',
  },
  {
    id: 'carrier',
    title: 'Carrier',
    description: 'Live shipment tracking provides the final proof before the key turns and funds move.',
  },
];

const flowSteps = [
  {
    number: '01',
    title: 'Deposit locked',
    description: 'Buyer funds enter segregated escrow the instant the offer is accepted.',
    icon: Wallet,
  },
  {
    number: '02',
    title: 'Inspection',
    description: 'A verified inspector confirms VIN, condition, and title authenticity on site.',
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: 'Shipping',
    description: 'GPS-tracked transport with photo proof at pickup and drop-off keeps every handoff visible.',
    icon: Truck,
  },
  {
    number: '04',
    title: 'Payout',
    description: 'The vault releases to the seller once the key verifies and title transfers.',
    icon: HandCoins,
  },
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="brand" aria-label="AutoSecure Escrow home">
          <span className="brand-mark">A</span>
          <span className="brand-name">AutoSecure</span>
        </div>

        <div className="nav-tag">ESCROW</div>
      </header>

      <main className="landing-page">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow-wrap">PEER-TO-PEER VEHICLE ESCROW</div>

            <h1>
              The vault closes on
              <span className="hero-break"> the key the moment</span>
              <span className="hero-break"> every milestone clicks.</span>
            </h1>

            <p>
              Buyer funds lock in escrow and release only when verification, inspection, and shipment each confirm.
              No trust assumptions — just proof.
            </p>

            <div className="milestone-card">
              <div className="milestone-header">
                <span>ESCROW MILESTONES · VIN1HGCM82633A</span>
                <span>3 of 4 locked</span>
              </div>

              <div className="milestone-track" aria-label="Escrow progress">
                <div className="milestone-step active">
                  <div className="step-dot active">1</div>
                  <span>Deposit</span>
                </div>
                <div className="milestone-step active">
                  <div className="step-dot active">2</div>
                  <span>Inspect</span>
                </div>
                <div className="milestone-step active">
                  <div className="step-dot active">3</div>
                  <span>Ship</span>
                </div>
                <div className="milestone-step">
                  <div className="step-dot">4</div>
                  <span>Payout</span>
                </div>
              </div>

              <div className="milestone-line-row">
                <span className="line-fill" />
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

        <section className="roles-grid">
          {roleCards.map(({ id, title, description }) => (
            <article key={id} className="role-card">
              <div className="role-title">{title}</div>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="flow-section">
          <h2>The milestone flow</h2>

          <div className="flow-list">
            {flowSteps.map(({ number, title, description, icon: Icon }) => (
              <div key={number} className="flow-item">
                <div className="flow-node-wrap">
                  <span className="flow-node">{number}</span>
                  <span className="flow-connector" />
                </div>
                <div className="flow-copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="mini-badges">
                    <span className="mini-badge"><Icon size={14} /></span>
                    <span className="mini-badge"><Truck size={14} /></span>
                    <span className="mini-badge"><FileText size={14} /></span>
                    <span className="mini-badge"><CheckCircle2 size={14} /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-panel">
          <h3>Lock the sale. Prove the handoff.</h3>
          <p>Start a secure transaction and watch funds move only when the milestones click.</p>

          <div className="cta-actions">
            <Link to="/register" className="primary-btn">
              Start a secure transaction
            </Link>
            <Link to="/login" className="secondary-btn">
              See a live escrow timeline
            </Link>
          </div>
        </section>

        <footer className="landing-footer">
          <span>AutoSecure Escrow</span>
          <div className="tiny-icons">
            <span className="tiny-icon"><CarFront size={16} /></span>
            <span className="tiny-icon"><LockKeyhole size={16} /></span>
            <span className="tiny-icon"><Truck size={16} /></span>
            <span className="tiny-icon"><CheckCircle2 size={16} /></span>
          </div>
          <span>Funds held in segregated custody</span>
        </footer>
      </main>
    </div>
  );
}
