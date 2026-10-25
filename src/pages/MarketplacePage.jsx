import React, { useEffect, useState } from 'react';
import { Plus, RefreshCcw, ShieldCheck } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import { escrowService, vehicleService } from '../services/apiServices';
import { useAuth } from '../context/AuthContext';

const emptyVehicle = {
  make: '',
  model: '',
  year: '',
  vin: '',
  mileage: '',
  price: '',
  transmission: 'Automatic',
  description: '',
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles(await vehicleService.getVehicles());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load marketplace vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setVehicleForm((current) => ({ ...current, [name]: value }));
  };

  const createVehicle = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await vehicleService.createVehicle({
        ...vehicleForm,
        year: Number(vehicleForm.year),
        mileage: Number(vehicleForm.mileage),
      });
      setVehicleForm(emptyVehicle);
      setMessage('Vehicle listing created.');
      await loadVehicles();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Vehicle listing failed.'));
    }
  };

  const createEscrow = async (vehicle) => {
    setError('');
    setMessage('');
    try {
      await escrowService.createContract({
        seller: vehicle.seller.id,
        vehicle: vehicle.id,
        vehicle_details: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        amount: vehicle.price,
      });
      setMessage(`Escrow opened for ${vehicle.year} ${vehicle.make} ${vehicle.model}.`);
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Could not create escrow.'));
    }
  };

  return (
    <AppLayout title="Marketplace" subtitle="List vehicles or open escrow for an available vehicle.">
      <div className="stack">
        <FormMessage error={error} success={message} />
        {user?.role === 'DEALERSHIP' && (
          <section className="panel actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 className="panel-title" style={{ margin: 0 }}>Dealership Inventory & Listings</h2>
              <p className="meta" style={{ margin: '4px 0 0' }}>
                Upload vehicle listings with mandatory multi-photo inspection verification.
              </p>
            </div>
            <a href="/seller" className="button primary">
              <Plus size={17} /> Go to Seller Hub & List Vehicle
            </a>
          </section>
        )}

        <div className="actions">
          <button className="button secondary" type="button" onClick={loadVehicles}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="panel empty-state">No available vehicles.</div>
        ) : (
          <div className="grid three">
            {vehicles.map((vehicle) => {
              const photos = [vehicle.image1, vehicle.image2, vehicle.image3].filter(Boolean);
              return (
                <article className="item-card stack" key={vehicle.id}>
                  {photos.length > 0 && (
                    <div className="vehicle-card-images">
                      {photos.slice(0, 2).map((img, i) => (
                        <img
                          key={i}
                          src={img.startsWith('http') ? img : img.startsWith('/') ? img : `/${img}`}
                          alt={`${vehicle.year} ${vehicle.make} photo ${i + 1}`}
                          className="vehicle-card-image"
                        />
                      ))}
                    </div>
                  )}
                  <div className="actions" style={{ justifyContent: 'space-between' }}>
                    <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>
                    <span className="status-pill">Available</span>
                  </div>
                  <div className="meta">VIN: {vehicle.vin}</div>
                  <div className="meta">Mileage: {vehicle.mileage?.toLocaleString()} km</div>
                  <div><strong>NGN {Number(vehicle.price).toLocaleString()}</strong></div>
                  <p className="meta">{vehicle.description || 'No description provided.'}</p>
                  {user?.role === 'BUYER' && (
                    <button className="button primary" type="button" onClick={() => createEscrow(vehicle)}>
                      <ShieldCheck size={17} /> Open escrow
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
