import apiClient from './apiClient';
import { tokenService } from './tokenService';

// -----------------------------------------------------------------------------
// Authentication Service
// -----------------------------------------------------------------------------
export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    tokenService.setTokens(access, refresh);
    if (user) tokenService.setUser(user);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register/', userData);
    return response.data;
  },

  logout: () => {
    tokenService.clearAuth();
    window.location.href = '/login';
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },
};

// -----------------------------------------------------------------------------
// Vehicle Inventory Service
// -----------------------------------------------------------------------------
export const vehicleService = {
  getVehicles: async (params = {}) => {
    const response = await apiClient.get('/vehicles/', { params });
    return response.data;
  },

  getVehicleById: async (id) => {
    const response = await apiClient.get(`/vehicles/${id}/`);
    return response.data;
  },

  createVehicle: async (vehicleData) => {
    const response = await apiClient.post('/vehicles/', vehicleData);
    return response.data;
  },
};

// -----------------------------------------------------------------------------
// Escrow Contract Service
// -----------------------------------------------------------------------------
export const escrowService = {
  getContracts: async () => {
    const response = await apiClient.get('/escrows/');
    return response.data;
  },

  getContractById: async (id) => {
    const response = await apiClient.get(`/escrows/${id}/`);
    return response.data;
  },

  createContract: async (contractData) => {
    const response = await apiClient.post('/escrows/', contractData);
    return response.data;
  },

  fundEscrow: async (id, paymentDetails) => {
    const response = await apiClient.post(`/escrows/${id}/fund/`, paymentDetails);
    return response.data;
  },
};

// -----------------------------------------------------------------------------
// Field Inspection Service (Repair Shops)
// -----------------------------------------------------------------------------
export const inspectionService = {
  dispatchInspector: async (escrowId, dispatchData) => {
    const response = await apiClient.patch(`/escrows/${escrowId}/dispatch-inspector/`, dispatchData);
    return response.data;
  },

  submitReport: async (escrowId, reportData) => {
    const response = await apiClient.post(`/escrows/${escrowId}/submit-report/`, reportData);
    return response.data;
  },

  getReport: async (escrowId) => {
    const response = await apiClient.get(`/escrows/${escrowId}/report/`);
    return response.data;
  },
};

// -----------------------------------------------------------------------------
// Carrier Delivery & Logistics Service
// -----------------------------------------------------------------------------
export const logisticsService = {
  getBookings: async () => {
    const response = await apiClient.get('/logistics/');
    return response.data;
  },

  bookDelivery: async (bookingData) => {
    const response = await apiClient.post('/logistics/book/', bookingData);
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await apiClient.get(`/logistics/${id}/`);
    return response.data;
  },

  updateTrackingStatus: async (id, statusData) => {
    const response = await apiClient.patch(`/logistics/${id}/update-status/`, statusData);
    return response.data;
  },
};