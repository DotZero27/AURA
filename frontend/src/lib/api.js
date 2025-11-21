import { apiClient } from '@/config';

// Tournaments API
export const tournamentsApi = {
  // GET /tournaments - Get all tournaments with filtering
  getAll: (params = {}) => {
    return apiClient.get('/tournaments', { params });
  },

  // GET /tournaments/:id - Get individual tournament details
  getById: (id, mini = false) => {
    const params = mini ? { mini: 'true' } : {};
    return apiClient.get(`/tournaments/${id}`, { params });
  },

  // GET /tournaments/:id/:round - Get tournament round details
  getRound: (id, round) => {
    return apiClient.get(`/tournaments/${id}/${round}`);
  },

  // POST /tournaments/:id/join - Join as referee
  joinAsReferee: (id) => {
    return apiClient.post(`/tournaments/${id}/join`);
  },

  // GET /tournaments/:id/:round/:match - Get match details
  getMatch: (id, round, match) => {
    return apiClient.get(`/tournaments/${id}/${round}/${match}`);
  },

  // GET /tournaments/referee/:id/:round/:match - Get referee match details
  getRefereeMatch: (id, round, match) => {
    return apiClient.get(`/tournaments/referee/${id}/${round}/${match}`);
  },

  // POST /tournaments/referee/:id/:round/:match - Update referee match score
  updateRefereeMatch: (id, round, match, data) => {
    return apiClient.post(`/tournaments/referee/${id}/${round}/${match}`, data);
  },
};

// User API
export const userApi = {
  // GET /user/details - Get comprehensive user details
  getDetails: () => {
    return apiClient.get('/user/details');
  },
};

