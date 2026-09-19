import React, { useEffect, useState } from 'react';
import { PackageCheck, RefreshCcw } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import CarrierLogisticsUpdate from '../components/dashboard/CarrierLogisticsUpdate';
import { logisticsService } from '../services/apiServices';

export default function CarrierPortalPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    escrow: '',
    pickup_address: '',
    delivery_address: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadBookings = async () => {
    setError('');
    try {
      setBookings(await logisticsService.getBookings());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load carrier bookings.');
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  };

  const bookDelivery = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await logisticsService.bookDelivery(bookingForm);
      setBookingForm({ escrow: '', pickup_address: '', delivery_address: '' });
      setMessage('Delivery booked.');
      await loadBookings();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Could not book delivery.'));
    }
  };

  return (
    <AppLayout title="Carrier Portal" subtitle="Book deliveries and update vehicle transit status.">
      <div className="stack">
        <FormMessage error={error} success={message} />
        <section className="panel">
          <h2 className="panel-title">Book delivery</h2>
          <form className="form-grid" onSubmit={bookDelivery}>
            <div className="grid three">
              <div className="field">
                <label htmlFor="escrow">Escrow ID</label>
                <input id="escrow" name="escrow" value={bookingForm.escrow} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="pickup_address">Pickup address</label>
                <input id="pickup_address" name="pickup_address" value={bookingForm.pickup_address} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="delivery_address">Delivery address</label>
                <input id="delivery_address" name="delivery_address" value={bookingForm.delivery_address} onChange={handleChange} required />
              </div>
            </div>
            <button className="button primary" type="submit"><PackageCheck size={17} /> Book delivery</button>
          </form>
        </section>

        <section className="panel">
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Assigned deliveries</h2>
            <button className="button secondary" type="button" onClick={loadBookings}><RefreshCcw size={17} /> Refresh</button>
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
                  <button className="button primary" type="button" onClick={() => setSelectedBooking(booking)}>
                    Update status
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedBooking && (
          <section className="panel">
            <CarrierLogisticsUpdate
              logisticsId={selectedBooking.id}
              currentLogistics={selectedBooking}
              onUpdateSuccess={loadBookings}
            />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
