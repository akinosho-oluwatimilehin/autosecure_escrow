import React, { useState } from 'react';
import api from '../../services/api';

export default function CarrierLogisticsUpdate({ logisticsId, currentLogistics, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    status: currentLogistics?.status || 'ASSIGNED',
    estimated_delivery: currentLogistics?.estimated_delivery || '',
    delivered_at: currentLogistics?.delivered_at || '',
  });

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.patch(`/logistics/${logisticsId}/update-status/`, formData);

      setMessage('Logistics status updated successfully!');
      if (onUpdateSuccess) {
        onUpdateSuccess(response.data);
      }
    } catch (err) {
      console.error('Logistics update error:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to update logistics details. Verify tracking parameters.'
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
        Carrier Logistics & Dispatch Tracking
      </h2>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Waybill / Tracking Number
          </label>
          <input
            type="text"
            value={currentLogistics?.tracking_number || ''}
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. TRK-8920119-NG"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transit Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ASSIGNED">Carrier Assigned</option>
            <option value="PICKED_UP">Vehicle Picked Up</option>
            <option value="DELAYED">Transit Delayed</option>
            <option value="DELIVERED">Delivered to Buyer</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Delivery Date & Time
          </label>
          <input
            type="datetime-local"
            name="estimated_delivery"
            value={formData.estimated_delivery}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivered Date & Time
          </label>
          <input
            type="datetime-local"
            name="delivered_at"
            value={formData.delivered_at}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={updating}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded text-sm transition-colors disabled:opacity-50"
      >
        {updating ? 'Updating Dispatch Status...' : 'Update Logistics Status'}
      </button>
    </form>
  );
}
