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
          <section className="panel">
            <h2 className="panel-title">Create vehicle listing</h2>
            <form className="form-grid" onSubmit={createVehicle}>
              <div className="grid three">
                {['make', 'model', 'year'].map((name) => (
                  <div className="field" key={name}>
                    <label htmlFor={name}>{name.replace('_', ' ')}</label>
                    <input id={name} name={name} value={vehicleForm[name]} onChange={handleChange} required />
                  </div>
                ))}
              </div>
              <div className="grid three">
                <div className="field">
                  <label htmlFor="vin">VIN</label>
                  <input id="vin" name="vin" maxLength="17" value={vehicleForm.vin} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="mileage">Mileage</label>
                  <input id="mileage" name="mileage" type="number" value={vehicleForm.mileage} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="price">Price</label>
                  <input id="price" name="price" type="number" step="0.01" value={vehicleForm.price} onChange={handleChange} required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" value={vehicleForm.description} onChange={handleChange} />
              </div>
              <button className="button primary" type="submit"><Plus size={17} /> Create listing</button>
            </form>
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
            {vehicles.map((vehicle) => (
              <article className="item-card stack" key={vehicle.id}>
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>
                  <span className="status-pill">Available</span>
                </div>
                <div className="meta">VIN: {vehicle.vin}</div>
                <div className="meta">Mileage: {vehicle.mileage}</div>
                <div><strong>NGN {vehicle.price}</strong></div>
                <p className="meta">{vehicle.description || 'No description provided.'}</p>
                {user?.role === 'BUYER' && (
                  <button className="button primary" type="button" onClick={() => createEscrow(vehicle)}>
                    <ShieldCheck size={17} /> Open escrow
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
