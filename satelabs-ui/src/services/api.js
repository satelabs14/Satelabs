import axios from 'axios';
import { API_BASE } from '../context/AuthContext';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('satelabs_token')}`
});

const get = async (path, config = {}) => {
  const response = await axios.get(`${API_BASE}${path}`, {
    ...config,
    headers: {
      ...authHeaders(),
      ...(config.headers || {})
    }
  });
  return response.data;
};

export const dashboardApi = {
  getDashboard: () => get('/dashboard'),
  getStats: () => get('/dashboard/stats'),
  getRankProgress: () => get('/dashboard/rank-progress'),
  getActivity: () => get('/dashboard/activity'),
  getLeaderboard: (limit = 10) => get(`/dashboard/leaderboard?limit=${limit}`),
  getCourses: () => get('/courses'),
  getCertificates: () => get('/certificates'),
  getLabs: () => get('/labs'),
  getQuiz: () => get('/quiz')
};
