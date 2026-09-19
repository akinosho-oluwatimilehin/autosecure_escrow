import React, { useEffect, useState } from 'react';
import { ClipboardCheck, RefreshCcw } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import SubmitInspectionForm from '../components/dashboard/SubmitInspectionForm';
import { escrowService, inspectionService } from '../services/apiServices';
import { useAuth } from '../context/AuthContext';

export default function InspectionPortalPage() {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState([]);
  const [dispatchId, setDispatchId] = useState('');
  const [selectedEscrowId, setSelectedEscrowId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadEscrows = async () => {
    setError('');
    try {
      setEscrows(await escrowService.getContracts());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load assigned inspections.');
    }
  };

  useEffect(() => {
    loadEscrows();
  }, []);

  const dispatchSelf = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await inspectionService.dispatchInspector(dispatchId, { inspector_id: user.id });
      setDispatchId('');
      setMessage('Inspection accepted.');
      await loadEscrows();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Could not accept inspection.'));
    }
  };

  return (
    <AppLayout title="Inspection Portal" subtitle="Accept active escrows and submit inspection reports.">
      <div className="stack">
        <FormMessage error={error} success={message} />
        <section className="panel">
          <h2 className="panel-title">Accept inspection</h2>
          <form className="actions" onSubmit={dispatchSelf}>
            <div className="field" style={{ minWidth: 220 }}>
              <label htmlFor="dispatchId">Escrow ID</label>
              <input id="dispatchId" value={dispatchId} onChange={(event) => setDispatchId(event.target.value)} required />
            </div>
            <button className="button primary" type="submit"><ClipboardCheck size={17} /> Accept</button>
          </form>
        </section>

        <section className="panel">
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Assigned inspections</h2>
            <button className="button secondary" type="button" onClick={loadEscrows}><RefreshCcw size={17} /> Refresh</button>
          </div>
          {escrows.length === 0 ? (
            <div className="empty-state">No assigned inspections.</div>
          ) : (
            <div className="grid two" style={{ marginTop: 14 }}>
              {escrows.map((escrow) => (
                <article className="item-card stack" key={escrow.id}>
                  <div className="actions" style={{ justifyContent: 'space-between' }}>
                    <strong>Escrow #{escrow.id}</strong>
                    <span className="status-pill">{escrow.status}</span>
                  </div>
                  <div>{escrow.vehicle ? `${escrow.vehicle.year} ${escrow.vehicle.make} ${escrow.vehicle.model}` : escrow.vehicle_details}</div>
                  <button className="button primary" type="button" onClick={() => setSelectedEscrowId(escrow.id)}>
                    Submit report
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedEscrowId && (
          <section className="panel">
            <SubmitInspectionForm contractId={selectedEscrowId} onReportSubmitted={loadEscrows} />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
