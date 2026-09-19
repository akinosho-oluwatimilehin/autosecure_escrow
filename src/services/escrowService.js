import api from './api';
import { tokenService } from './tokenService';

export const escrowService = {
  // Authentication & User
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    if (response.data.access) {
      tokenService.setTokens(response.data.access, response.data.refresh);
    }
    if (response.data.user) {
      tokenService.setUser(response.data.user);
    }
    return response.data;
  },

  getProfile: () => api.get('/auth/profile/'),

  // Vehicles
  getVehicles: () => api.get('/vehicles/'),
  createVehicle: (vehicleData) => api.post('/vehicles/', vehicleData),

  // Escrow Contracts
  getContracts: () => api.get('/escrows/'),
  getContractDetail: (id) => api.get(`/escrows/${id}/`),
  createContract: (contractData) => api.post('/escrows/', contractData),
  fundContract: (id, paymentReference) =>
    api.post(`/escrows/${id}/fund/`, { payment_reference: paymentReference }),
  cancelContract: (id, reason) =>
    api.post(`/escrows/${id}/cancel/`, { reason }),

  // Inspection Workflows
  dispatchInspector: (contractId, inspectorId) =>
    api.patch(`/escrows/${contractId}/dispatch-inspector/`, { inspector_id: inspectorId }),
  submitInspectionReport: (contractId, reportData) =>
    api.post(`/escrows/${contractId}/submit-report/`, reportData),

  // Logistics Workflows
  bookDelivery: (bookingData) =>
    api.post('/logistics/book/', bookingData),
  updateLogisticsStatus: (logisticsId, statusData) =>
    api.patch(`/logistics/${logisticsId}/update-status/`, statusData),

  // Disputes
  openDispute: (contractId, disputeData) =>
    api.post(`/escrows/${contractId}/dispute/`, disputeData),
  resolveDispute: (contractId, resolutionData) =>
    api.post(`/escrows/${contractId}/resolve-dispute/`, resolutionData),
};
