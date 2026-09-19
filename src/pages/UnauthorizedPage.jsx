import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <h1 className="page-title"><LockKeyhole size={26} /> Unauthorized</h1>
        <p className="page-subtitle">Your current role does not have access to this workspace.</p>
        <div className="actions" style={{ marginTop: 18 }}>
          <Link className="button primary" to="/dashboard">Go to dashboard</Link>
          <Link className="button ghost" to="/marketplace">Open marketplace</Link>
        </div>
      </section>
    </main>
  );
}
