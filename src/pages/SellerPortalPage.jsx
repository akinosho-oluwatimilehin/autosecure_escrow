import React, { useEffect, useState, useRef } from 'react';
import {
  CarFront,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import FormMessage from '../components/FormMessage';
import { vehicleService } from '../services/apiServices';
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

export default function SellerPortalPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehicleService.getVehicles();
      // Filter for vehicles where current user is seller
      const sellerVehicles = data.filter((v) => v.seller?.id === user?.id || v.seller?.username === user?.username);
      setVehicles(sellerVehicles.length > 0 ? sellerVehicles : data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load vehicle listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newFiles = [...selectedImages, ...files];
    setSelectedImages(newFiles);

    // Generate previews
    const newPreviews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2),
    }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      // revoke URL object to avoid memory leak
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const createVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation: Require at least 2 images of the car
    if (selectedImages.length < 2) {
      setError('Please upload at least 2 images of the vehicle (exterior front/rear, interior, or engine).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('make', vehicleForm.make.trim());
      formData.append('model', vehicleForm.model.trim());
      formData.append('year', String(vehicleForm.year));
      formData.append('vin', vehicleForm.vin.trim().toUpperCase());
      formData.append('mileage', String(vehicleForm.mileage));
      formData.append('price', String(vehicleForm.price));
      formData.append('transmission', vehicleForm.transmission);
      formData.append('description', vehicleForm.description);

      // Attach at least 2 images to payload
      if (selectedImages[0]) formData.append('image1', selectedImages[0]);
      if (selectedImages[1]) formData.append('image2', selectedImages[1]);
      if (selectedImages[2]) formData.append('image3', selectedImages[2]);

      await vehicleService.createVehicle(formData);

      setVehicleForm(emptyVehicle);
      setSelectedImages([]);
      setImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage('Vehicle listing created successfully with verified images.');
      await loadVehicles();
    } catch (err) {
      const resp = err.response?.data;
      if (typeof resp === 'object') {
        const firstKey = Object.keys(resp)[0];
        const val = resp[firstKey];
        setError(`${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`);
      } else {
        setError('Vehicle listing failed. Please check required fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Dealer Portal & Inventory"
      subtitle="Licensed dealership inventory management with mandatory multi-photo certification and KYB verification."
    >
      <div className="stack">
        <FormMessage error={error} success={message} />

        {/* Dealer Verification & Ratings Status Banner */}
        <div className="panel actions" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>{user?.company_name || user?.username}</strong>
              {user?.verification_status === 'VERIFIED' ? (
                <span className="dealer-verified-badge"><ShieldCheck size={14} /> CAC Verified Dealer {user?.cac_number && `(RC: ${user.cac_number})`}</span>
              ) : (
                <span className="dealer-unverified-badge"><XCircle size={14} /> KYB Verification Pending</span>
              )}
            </div>
            <div className="meta" style={{ marginTop: '4px' }}>
              Rating: <strong>★ {user?.average_rating || '5.0'}</strong> ({user?.total_ratings || 0} customer reviews) · Only verified car dealers can list vehicles.
            </div>
          </div>
          {user?.verification_status !== 'VERIFIED' && (
            <Link to="/settings" className="button primary">
              Complete Dealer KYB Verification
            </Link>
          )}
        </div>

        {/* Create Vehicle Listing Panel */}
        <section className="panel stack">
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>List a Vehicle for Escrow</h2>
            <span className="dealer-verified-badge">
              <ShieldCheck size={14} /> Registered Dealer Listing Only
            </span>
          </div>

          <form className="form-grid" onSubmit={createVehicle}>
            <div className="grid three">
              <div className="field">
                <label htmlFor="make">MAKE</label>
                <input id="make" name="make" value={vehicleForm.make} onChange={handleChange} placeholder="e.g. Toyota" required />
              </div>
              <div className="field">
                <label htmlFor="model">MODEL</label>
                <input id="model" name="model" value={vehicleForm.model} onChange={handleChange} placeholder="e.g. Camry SE" required />
              </div>
              <div className="field">
                <label htmlFor="year">YEAR</label>
                <input id="year" name="year" type="number" min="1990" max="2030" value={vehicleForm.year} onChange={handleChange} placeholder="2022" required />
              </div>
            </div>

            <div className="grid three">
              <div className="field">
                <label htmlFor="vin">17-DIGIT VIN</label>
                <input id="vin" name="vin" maxLength={17} value={vehicleForm.vin} onChange={handleChange} placeholder="4T1B11HK5JU123456" required />
              </div>
              <div className="field">
                <label htmlFor="mileage">ODOMETER MILEAGE (KM / MILES)</label>
                <input id="mileage" name="mileage" type="number" value={vehicleForm.mileage} onChange={handleChange} placeholder="45000" required />
              </div>
              <div className="field">
                <label htmlFor="price">SELLING PRICE (NGN)</label>
                <input id="price" name="price" type="number" step="0.01" value={vehicleForm.price} onChange={handleChange} placeholder="15000000" required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="transmission">TRANSMISSION</label>
              <select id="transmission" name="transmission" value={vehicleForm.transmission} onChange={handleChange}>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="CVT">CVT</option>
                <option value="Dual-Clutch">Dual-Clutch</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="description">VEHICLE DETAILS & CONDITION</label>
              <textarea
                id="description"
                name="description"
                value={vehicleForm.description}
                onChange={handleChange}
                placeholder="First owner, full service history, pristine interior, zero accident record..."
              />
            </div>

            {/* MANDATORY VEHICLE IMAGES UPLOAD FIELD (AT LEAST 2 REQUIRED) */}
            <div className="field">
              <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ margin: 0, fontWeight: 700 }}>
                  VEHICLE IMAGES (MINIMUM 2 PHOTOS REQUIRED) *
                </label>
                <span className={`image-count-badge ${selectedImages.length >= 2 ? 'valid' : 'invalid'}`}>
                  {selectedImages.length >= 2 ? (
                    <><CheckCircle2 size={13} /> {selectedImages.length} images selected (Requirement met)</>
                  ) : (
                    <><XCircle size={13} /> {selectedImages.length} / 2 required images uploaded</>
                  )}
                </span>
              </div>

              <div
                className="image-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={32} className="image-dropzone-icon" />
                <div className="image-dropzone-title">Click to upload vehicle photos</div>
                <div className="image-dropzone-hint">
                  Upload at least 2 high-resolution photos (Front angle, Rear, Interior cockpit, Dashboard, or Engine bay)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>

              {/* Preview thumbnails */}
              {imagePreviews.length > 0 && (
                <div className="image-preview-list">
                  {imagePreviews.map((preview, idx) => (
                    <div className="image-preview-card" key={idx}>
                      <img src={preview.url} alt={`Vehicle preview ${idx + 1}`} />
                      <span className="image-preview-badge">Photo #{idx + 1}</span>
                      <button
                        type="button"
                        className="image-preview-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="actions" style={{ marginTop: 8 }}>
              <button
                className="button primary large"
                type="submit"
                disabled={submitting || selectedImages.length < 2}
              >
                <Plus size={18} /> {submitting ? 'Uploading & Listing...' : 'Publish Vehicle Listing'}
              </button>
              {selectedImages.length < 2 && (
                <span className="meta" style={{ color: '#ef4444' }}>
                  * Please attach at least {2 - selectedImages.length} more image(s) to publish.
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Existing Inventory List */}
        <section className="panel stack">
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Your Published Vehicle Inventory</h2>
            <button className="button secondary" type="button" onClick={loadVehicles}>
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading your vehicle inventory...</div>
          ) : vehicles.length === 0 ? (
            <div className="empty-state">No vehicles listed yet. Use the form above to add your first car.</div>
          ) : (
            <div className="grid three">
              {vehicles.map((v) => {
                const photos = [v.image1, v.image2, v.image3].filter(Boolean);
                return (
                  <article className="item-card stack" key={v.id}>
                    {photos.length > 0 ? (
                      <div className="vehicle-card-images">
                        {photos.slice(0, 2).map((img, i) => (
                          <img
                            key={i}
                            src={img.startsWith('http') ? img : img.startsWith('/') ? img : `/${img}`}
                            alt={`${v.year} ${v.make} photo ${i + 1}`}
                            className="vehicle-card-image"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state" style={{ padding: 24, textAlign: 'center' }}>
                        <CarFront size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                        <div className="meta">Legacy listing without photos</div>
                      </div>
                    )}

                    <div className="actions" style={{ justifyContent: 'space-between' }}>
                      <strong>{v.year} {v.make} {v.model}</strong>
                      <span className="status-pill">{v.is_available ? 'Available' : 'In Escrow'}</span>
                    </div>

                    <div className="meta">VIN: {v.vin}</div>
                    <div className="meta">Mileage: {v.mileage?.toLocaleString()} km</div>
                    <div><strong>NGN {Number(v.price).toLocaleString()}</strong></div>
                    <p className="meta">{v.description || 'No additional notes.'}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
