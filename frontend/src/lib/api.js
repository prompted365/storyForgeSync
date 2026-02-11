import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const api = axios.create({ baseURL: API });

export const projects = {
  list: () => api.get('/projects').then(r => r.data),
  get: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
  export: (id) => api.get(`/projects/${id}/export`).then(r => r.data),
};

export const worlds = {
  list: (pid) => api.get(`/projects/${pid}/worlds`).then(r => r.data),
  get: (pid, id) => api.get(`/projects/${pid}/worlds/${id}`).then(r => r.data),
  create: (pid, data) => api.post(`/projects/${pid}/worlds`, data).then(r => r.data),
  update: (pid, id, data) => api.put(`/projects/${pid}/worlds/${id}`, data).then(r => r.data),
  delete: (pid, id) => api.delete(`/projects/${pid}/worlds/${id}`).then(r => r.data),
};

export const characters = {
  list: (pid) => api.get(`/projects/${pid}/characters`).then(r => r.data),
  get: (pid, id) => api.get(`/projects/${pid}/characters/${id}`).then(r => r.data),
  create: (pid, data) => api.post(`/projects/${pid}/characters`, data).then(r => r.data),
  update: (pid, id, data) => api.put(`/projects/${pid}/characters/${id}`, data).then(r => r.data),
  delete: (pid, id) => api.delete(`/projects/${pid}/characters/${id}`).then(r => r.data),
};

export const objects = {
  list: (pid) => api.get(`/projects/${pid}/objects`).then(r => r.data),
  get: (pid, id) => api.get(`/projects/${pid}/objects/${id}`).then(r => r.data),
  create: (pid, data) => api.post(`/projects/${pid}/objects`, data).then(r => r.data),
  update: (pid, id, data) => api.put(`/projects/${pid}/objects/${id}`, data).then(r => r.data),
  delete: (pid, id) => api.delete(`/projects/${pid}/objects/${id}`).then(r => r.data),
};

export const scenes = {
  list: (pid) => api.get(`/projects/${pid}/scenes`).then(r => r.data),
  get: (pid, id) => api.get(`/projects/${pid}/scenes/${id}`).then(r => r.data),
  create: (pid, data) => api.post(`/projects/${pid}/scenes`, data).then(r => r.data),
  update: (pid, id, data) => api.put(`/projects/${pid}/scenes/${id}`, data).then(r => r.data),
  delete: (pid, id) => api.delete(`/projects/${pid}/scenes/${id}`).then(r => r.data),
};

export const shots = {
  list: (pid, sceneId) => api.get(`/projects/${pid}/shots`, { params: sceneId ? { scene_id: sceneId } : {} }).then(r => r.data),
  get: (pid, id) => api.get(`/projects/${pid}/shots/${id}`).then(r => r.data),
  create: (pid, data) => api.post(`/projects/${pid}/shots`, data).then(r => r.data),
  update: (pid, id, data) => api.put(`/projects/${pid}/shots/${id}`, data).then(r => r.data),
  updateStatus: (pid, id, status) => api.patch(`/projects/${pid}/shots/${id}/status?status=${status}`).then(r => r.data),
  batchStatus: (pid, data) => api.post(`/projects/${pid}/shots/batch-status`, data).then(r => r.data),
  reorder: (pid, shotIds) => api.post(`/projects/${pid}/shots/reorder`, { shot_ids: shotIds }).then(r => r.data),
  delete: (pid, id) => api.delete(`/projects/${pid}/shots/${id}`).then(r => r.data),
};

export const compiler = {
  compile: (pid, data) => api.post(`/projects/${pid}/compile`, data).then(r => r.data),
  batchCompile: (pid, shotIds) => api.post(`/projects/${pid}/batch-compile`, { shot_ids: shotIds }).then(r => r.data),
  history: (pid, shotId) => api.get(`/projects/${pid}/compilations`, { params: shotId ? { shot_id: shotId } : {} }).then(r => r.data),
};

export const notion = {
  push: (pid) => api.post(`/projects/${pid}/notion/push`).then(r => r.data),
};

export const imageDescribe = {
  describe: (pid, data) => api.post(`/projects/${pid}/describe-image`, data).then(r => r.data),
};

export const continuity = {
  chain: (pid) => api.get(`/projects/${pid}/continuity`).then(r => r.data),
};

export const secrets = {
  list: () => api.get('/secrets').then(r => r.data),
  update: (key, value) => api.put('/secrets', { key, value }).then(r => r.data),
  delete: (key) => api.delete(`/secrets/${key}`).then(r => r.data),
};

export const dashboard = {
  stats: () => api.get('/dashboard/stats').then(r => r.data),
};

export const enums = {
  get: () => api.get('/enums').then(r => r.data),
};

export const seed = {
  mito: () => api.post('/seed/mito').then(r => r.data),
};

export const health = {
  check: () => api.get('/health').then(r => r.data),
};

export default api;
