import React, { useState } from 'react';
import api from '../../services/api';

export default function SubmitInspectionForm({ contractId, onReportSubmitted }) {
  const [formData, setFormData] = useState({
    odometer_reading: '',
    overall_condition: 'GOOD', // EXCELLENT, GOOD, FAIR, POOR
    recommendation: 'PASS',
    passed_inspection: true,
    engine_transmission_notes: '',
    body_frame_notes: '',
    interior_notes: '',
    defects_found: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        odometer_reading: parseInt(formData.odometer_reading, 10),
        overall_condition: formData.overall_condition,
        recommendation: formData.recommendation,
        passed_inspection: formData.passed_inspection,
        notes: [
          formData.engine_transmission_notes,
          formData.body_frame_notes,
          formData.interior_notes,
          formData.defects_found,
        ].filter(Boolean).join('\n\n'),
      };

      const response = await api.post(
        `/escrows/${contractId}/submit-report/`,
        payload
      );

      setSuccess(true);
      if (onReportSubmitted) {
        onReportSubmitted(response.data);
      }
    } catch (err) {
      console.error('Inspection submission error:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to submit inspection report. Please check all required fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-green-800">
          Inspection Report Submitted Successfully
        </h3>
        <p className="text-sm text-green-600 mt-1">
          The contract status has been updated and notified to buyer and seller.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
        Submit Vehicle Inspection Report
      </h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Odometer Reading (km / miles)
          </label>
          <input
            type="number"
            name="odometer_reading"
            value={formData.odometer_reading}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 85000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Condition Rating
          </label>
          <select
            name="overall_condition"
            value={formData.overall_condition}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-2 py-2">
        <input
          type="checkbox"
          id="passed_inspection"
          name="passed_inspection"
          checked={formData.passed_inspection}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="passed_inspection" className="text-sm font-medium text-gray-700">
          Vehicle Passes Overall Technical Standard
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Inspection Recommendation
        </label>
        <select
          name="recommendation"
          value={formData.recommendation}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PASS">Pass / Vehicle Approved</option>
          <option value="CONDITIONAL">Conditional / Repairs Required</option>
          <option value="FAIL">Fail / Significant Issues Detected</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Engine & Transmission Assessment
        </label>
        <textarea
          name="engine_transmission_notes"
          rows="2"
          value={formData.engine_transmission_notes}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note drivetrain performance, fluid leaks, fault codes..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Body Integrity & Frame Condition
        </label>
        <textarea
          name="body_frame_notes"
          rows="2"
          value={formData.body_frame_notes}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note rust, prior collision repair marks, paint flaws..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Noted Defects & Required Repairs
        </label>
        <textarea
          name="defects_found"
          rows="3"
          value={formData.defects_found}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="List all specific faults discovered during inspection..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting Inspection Report...' : 'Submit Official Inspection Report'}
      </button>
    </form>
  );
}
