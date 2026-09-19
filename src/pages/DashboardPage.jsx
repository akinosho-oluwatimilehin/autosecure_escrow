import React, { useEffect, useState } from 'react';
import { RefreshCcw, WalletCards, XCircle } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import { escrowService } from '../services/apiServices';
import apiClient from '../services/apiClient';

export default function DashboardPage() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadEscrows = async () => {
    setLoading(true);
    setError('');
    try {
      setEscrows(await escrowService.getContracts());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load escrow contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscrows();
  }, []);

  const fundEscrow = async (escrow) => {
    setMessage('');
    setError('');
    try {
      await escrowService.fundEscrow(escrow.id, {
        payment_reference: `WEB-${escrow.id}-${Date.now()}`,
      });
      setMessage(`Escrow #${escrow.id} funded.`);
      await loadEscrows();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Funding failed.');
    }
  };

  const cancelEscrow = async (escrow) => {
    setMessage('');
    setError('');
    try {
      await apiClient.post(`/escrows/${escrow.id}/cancel/`, { reason: 'Cancelled from dashboard' });
      setMessage(`Escrow #${escrow.id} cancelled.`);
      await loadEscrows();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancellation failed.');
    }
  };

  return (
    <AppLayout title="Dashboard" subtitle="Track your active vehicle escrow contracts.">
      <div className="stack">
        <div className="actions">
          <button className="button secondary" type="button" onClick={loadEscrows}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
        <FormMessage error={error} success={message} />
        {loading ? (
          <div className="empty-state">Loading escrows...</div>
        ) : escrows.length === 0 ? (
          <div className="panel empty-state">No escrow contracts yet.</div>
        ) : (
          <div className="grid two">
            {escrows.map((escrow) => (
              <article className="item-card stack" key={escrow.id}>
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <strong>Escrow #{escrow.id}</strong>
                  <span className="status-pill">{escrow.status}</span>
                </div>
                <div>
                  <div>{escrow.vehicle ? `${escrow.vehicle.year} ${escrow.vehicle.make} ${escrow.vehicle.model}` : escrow.vehicle_details}</div>
                  <div className="meta">Seller: {escrow.seller?.company_name || escrow.seller?.username}</div>
                  <div className="meta">Amount: NGN {escrow.amount}</div>
                </div>
                <div className="actions">
                  {escrow.status === 'PENDING' && (
                    <button className="button primary" type="button" onClick={() => fundEscrow(escrow)}>
                      <WalletCards size={17} /> Fund
                    </button>
                  )}
                  {!['COMPLETED', 'CANCELLED'].includes(escrow.status) && (
                    <button className="button danger" type="button" onClick={() => cancelEscrow(escrow)}>
                      <XCircle size={17} /> Cancel
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
