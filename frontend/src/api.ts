import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const getTasks = async (token: string) => {
  const response = await api.get('/tasks/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateTaskStatus = async (taskId: string, status: string, token: string) => {
  const response = await api.put(`/tasks/${taskId}`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createTask = async (task: any, token: string) => {
  const response = await api.post('/tasks/', task, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getRescueCenters = async () => {
  const response = await api.get('/resources/rescue-centers/');
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/reports/');
  return response.data;
};

export default api;
