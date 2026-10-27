import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CarFront,
  ClipboardCheck,
  RefreshCcw,
  ShieldCheck,
  Truck,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import { escrowService, logisticsService, vehicleService } from '../services/apiServices';
import RatingModal from '../components/RatingModal';
import { Star } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

const roleCopy = {
  BUYER: {
    title: 'Buyer dashboard',
    subtitle: 'Keep tabs on funded escrows, milestones, and payout status.',
    actionLabel: 'Open escrow',
    actionPath: '/marketplace',
  },
  DEALERSHIP: {
    title: 'Dealership dashboard',
    subtitle: 'Track listings, active deals, and delivery milestones from one place.',
    actionLabel: 'List a vehicle',
    actionPath: '/dealer',
  },
  REPAIR_SHOP: {
    title: 'Inspection dashboard',
    subtitle: 'Review incoming inspections and submit condition reports quickly.',
    actionLabel: 'Inspection portal',
    actionPath: '/inspections',
  },
  LOGISTICS: {
    title: 'Carrier dashboard',
    subtitle: 'Monitor assigned routes, delivery status, and transit updates.',
    actionLabel: 'Carrier portal',
    actionPath: '/carrier',
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ratingTarget, setRatingTarget] = useState(null);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [contractData, vehicleData, bookingData] = await Promise.all([
        escrowService.getContracts(),
        user.role === 'DEALERSHIP' ? vehicleService.getVehicles() : Promise.resolve([]),
        user.role === 'LOGISTICS' ? logisticsService.getBookings() : Promise.resolve([]),
      ]);

      setEscrows(contractData);
      setVehicles(vehicleData);
      setBookings(bookingData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.role]);

  const fundEscrow = async (escrow) => {
    setMessage('');
    setError('');
    try {
      await escrowService.fundEscrow(escrow.id, {
        payment_reference: `WEB-${escrow.id}-${Date.now()}`,
      });
      setMessage(`Escrow #${escrow.id} funded.`);
      await loadDashboard();
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
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancellation failed.');
    }
  };

  const statusSummary = {
    total: escrows.length,
    active: escrows.filter((item) => ['ACTIVE', 'INSPECTION', 'LOGISTICS', 'DISPUTED'].includes(item.status)).length,
    pending: escrows.filter((item) => item.status === 'PENDING').length,
    completed: escrows.filter((item) => ['COMPLETED', 'CANCELLED'].includes(item.status)).length,
  };

  const roleInfo = roleCopy[user?.role] || roleCopy.BUYER;
  const quickActions = user?.role === 'REPAIR_SHOP'
    ? [{ label: 'Accept inspection', href: '/inspections' }]
    : user?.role === 'LOGISTICS'
      ? [{ label: 'Book delivery', href: '/carrier' }]
      : [{ label: 'Browse vehicles', href: '/marketplace' }];

  const renderEscrowCard = (escrow) => (
    <article className="item-card stack" key={escrow.id}>
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <strong>Escrow #{escrow.id}</strong>
        <span className="status-pill">{escrow.status}</span>
      </div>
      <div>
        <div>{escrow.vehicle ? `${escrow.vehicle.year} ${escrow.vehicle.make} ${escrow.vehicle.model}` : escrow.vehicle_details}</div>
        <div className="meta">Dealer: {escrow.seller?.company_name || escrow.seller?.username || '—'}</div>
        <div className="meta">Amount: NGN {escrow.amount}</div>
      </div>
      <div className="actions">
        {user?.role === 'BUYER' && escrow.status === 'PENDING' && (
          <button className="button primary" type="button" onClick={() => fundEscrow(escrow)}>
            <WalletCards size={17} /> Fund
          </button>
        )}
        {!['COMPLETED', 'CANCELLED'].includes(escrow.status) && (
          <button className="button danger" type="button" onClick={() => cancelEscrow(escrow)}>
            <XCircle size={17} /> Cancel
          </button>
        )}
        {escrow.seller && escrow.seller.id !== user?.id && (
          <button
            className="button secondary"
            type="button"
            onClick={() => setRatingTarget({ user: escrow.seller, escrowId: escrow.id })}
          >
            <Star size={16} color="#f59e0b" fill="#f59e0b" /> Rate Dealer
          </button>
        )}
      </div>
    </article>
  );

  return (
    <AppLayout title={roleInfo.title} subtitle={roleInfo.subtitle}>
      <div className="stack">
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <div className="actions">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href} className="button secondary" type="button">
                <ArrowUpRight size={17} /> {action.label}
              </Link>
            ))}
          </div>
          <button className="button secondary" type="button" onClick={loadDashboard}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>

        <FormMessage error={error} success={message} />

        {loading ? (
          <div className="empty-state">Loading dashboard...</div>
        ) : (
          <>
            <section className="grid four">
              <div className="panel stack tiny-gap">
                <span className="meta">Total</span>
                <strong className="stat-number">{statusSummary.total}</strong>
                <span className="meta">Contracts</span>
              </div>
              <div className="panel stack tiny-gap">
                <span className="meta">Active</span>
                <strong className="stat-number">{statusSummary.active}</strong>
                <span className="meta">In motion</span>
              </div>
              <div className="panel stack tiny-gap">
                <span className="meta">Pending</span>
                <strong className="stat-number">{statusSummary.pending}</strong>
                <span className="meta">Awaiting action</span>
              </div>
              <div className="panel stack tiny-gap">
                <span className="meta">Completed</span>
                <strong className="stat-number">{statusSummary.completed}</strong>
                <span className="meta">Closed</span>
              </div>
            </section>

            {user?.role === 'DEALERSHIP' && (
              <section className="panel">
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Vehicle listings</h2>
                  <Link to="/dealer" className="button secondary" type="button">
                    <CarFront size={17} /> Manage inventory & photos
                  </Link>
                </div>
                {vehicles.length === 0 ? (
                  <div className="empty-state">No active vehicle listings.</div>
                ) : (
                  <div className="grid two" style={{ marginTop: 14 }}>
                    {vehicles.map((vehicle) => (
                      <article className="item-card stack" key={vehicle.id}>
                        <div className="actions" style={{ justifyContent: 'space-between' }}>
                          <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>
                          <span className="status-pill">{vehicle.is_available ? 'Available' : 'In escrow'}</span>
                        </div>
                        <div className="meta">VIN: {vehicle.vin}</div>
                        <div className="meta">Mileage: {vehicle.mileage}</div>
                        <div className="meta">Price: NGN {vehicle.price}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {user?.role === 'LOGISTICS' && (
              <section className="panel">
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Assigned deliveries</h2>
                  <Link to="/carrier" className="button secondary" type="button">
                    <Truck size={17} /> Open carrier portal
                  </Link>
                </div>
                {bookings.length === 0 ? (
                  <div className="empty-state">No deliveries assigned.</div>
                ) : (
                  <div className="grid two" style={{ marginTop: 14 }}>
                    {bookings.map((booking) => (
                      <article className="item-card stack" key={booking.id}>
                        <div className="actions" style={{ justifyContent: 'space-between' }}>
                          <strong>{booking.tracking_number}</strong>
                          <span className="status-pill">{booking.status}</span>
                        </div>
                        <div className="meta">Escrow #{booking.escrow}</div>
                        <div className="meta">Pickup: {booking.pickup_address}</div>
                        <div className="meta">Delivery: {booking.delivery_address}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="panel">
              <div className="actions" style={{ justifyContent: 'space-between' }}>
                <h2 className="panel-title" style={{ margin: 0 }}>
                  {user?.role === 'REPAIR_SHOP' ? 'Assigned inspections' : user?.role === 'LOGISTICS' ? 'Delivery coverage' : 'Escrow pipeline'}
                </h2>
                <span className="meta">{escrows.length} items</span>
              </div>

              {escrows.length === 0 ? (
                <div className="empty-state">No contracts found for this account yet.</div>
              ) : (
                <div className="grid two" style={{ marginTop: 14 }}>
                  {escrows.map(renderEscrowCard)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {ratingTarget && (
        <RatingModal
          targetUser={ratingTarget.user}
          escrowId={ratingTarget.escrowId}
          onClose={() => setRatingTarget(null)}
          onRatingSubmitted={() => {
            setMessage('Rating submitted successfully! Thank you for validating merchant authenticity.');
            loadDashboard();
          }}
        />
      )}
    </AppLayout>
  );
}
