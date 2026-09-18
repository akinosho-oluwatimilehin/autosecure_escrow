import api from './api';

export const escrowService = {
  // Authentication & User
  login: async (credentials) => {
    const response = await api.post('/token/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  getProfile: () => api.get('/profile/'),

  // Vehicles
  getVehicles: () => api.get('/vehicles/'),
  createVehicle: (vehicleData) => api.post('/vehicles/', vehicleData),

  // Escrow Contracts
  getContracts: () => api.get('/escrow/'),
  getContractDetail: (id) => api.get(`/escrow/${id}/`),
  createContract: (contractData) => api.post('/escrow/', contractData),
  fundContract: (id, paymentReference) =>
    api.post(`/escrow/${id}/fund/`, { payment_reference: paymentReference }),
  releaseContract: (id) =>
    api.post(`/escrow/${id}/release/`, { confirmation: true }),
  cancelContract: (id, reason) =>
    api.post(`/escrow/${id}/cancel/`, { reason }),

  // Inspection Workflows
  dispatchInspector: (contractId, inspectorId) =>
    api.post(`/escrow/${contractId}/dispatch-inspector/`, { inspector_id: inspectorId }),
  submitInspectionReport: (contractId, reportData) =>
    api.post(`/escrow/${contractId}/submit-inspection/`, reportData),

  // Logistics Workflows
  assignCarrier: (contractId, carrierData) =>
    api.post(`/escrow/${contractId}/assign-carrier/`, carrierData),
  updateLogisticsStatus: (logisticsId, statusData) =>
    api.patch(`/logistics/${logisticsId}/`, statusData),

  // Disputes
  openDispute: (contractId, disputeData) =>
    api.post(`/escrow/${contractId}/dispute/`, disputeData),
  resolveDispute: (disputeId, resolutionData) =>
    api.post(`/disputes/${disputeId}/resolve/`, resolutionData),
};