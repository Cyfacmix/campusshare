import api from './client'
import { cleanParams } from '../utils/format'

const get = (url, params) => api.get(url, { params: cleanParams(params) }).then((r) => r.data)
const post = (url, data, config) => api.post(url, data, config).then((r) => r.data)
const patch = (url, data) => api.patch(url, data).then((r) => r.data)
const del = (url) => api.delete(url).then((r) => r.data)

export const auth = {
  register: (d) => post('/auth/register/', d),
  login: (d) => post('/auth/login/', d),
  logout: (refresh) => post('/auth/logout/', { refresh }),
  me: () => get('/auth/me/'),
  updateMe: (formData) => patch('/auth/me/', formData),
  changePassword: (d) => post('/auth/change-password/', d),
  publicUser: (id) => get(`/users/${id}/`),
}

export const catalog = {
  filieres: () => get('/filieres/'),
  matieres: (params) => get('/matieres/', params),
  createFiliere: (d) => post('/filieres/', d),
  updateFiliere: (id, d) => patch(`/filieres/${id}/`, d),
  deleteFiliere: (id) => del(`/filieres/${id}/`),
  createMatiere: (d) => post('/matieres/', d),
  updateMatiere: (id, d) => patch(`/matieres/${id}/`, d),
  deleteMatiere: (id) => del(`/matieres/${id}/`),
  tags: () => get('/tags/'),
}

export const resources = {
  list: (params) => get('/resources/', params),
  mine: (params) => get('/resources/mine/', params),
  recommended: (params) => get('/resources/recommended/', params),
  get: (id) => get(`/resources/${id}/`),
  create: (fd) => post('/resources/', fd),
  update: (id, fd) => patch(`/resources/${id}/`, fd),
  remove: (id) => del(`/resources/${id}/`),
  download: (id) => post(`/resources/${id}/download/`),
  certify: (id) => post(`/resources/${id}/certify/`),
  moderate: (id, payload) => post(`/resources/${id}/moderate/`, payload),
  vote: (id, valeur) => post(`/resources/${id}/vote/`, { valeur }),
  favorite: (id) => post(`/resources/${id}/favorite/`),
  unfavorite: (id) => del(`/resources/${id}/favorite/`),
  favorites: (params) => get('/favorites/', params),
  comments: (id) => get(`/resources/${id}/comments/`),
  addComment: (id, payload) => post(`/resources/${id}/comments/`, payload),
  deleteComment: (id) => del(`/comments/${id}/`),
}

export const follows = {
  list: () => get('/follows/'),
  follow: (matiereId) => post(`/matieres/${matiereId}/follow/`),
  unfollow: (matiereId) => del(`/matieres/${matiereId}/follow/`),
}

export const qna = {
  list: (params) => get('/questions/', params),
  get: (id) => get(`/questions/${id}/`),
  create: (d) => post('/questions/', d),
  remove: (id) => del(`/questions/${id}/`),
  answers: (id) => get(`/questions/${id}/answers/`),
  answer: (id, contenu) => post(`/questions/${id}/answers/`, { contenu }),
  accept: (answerId) => post(`/answers/${answerId}/accept/`),
}

export const moderation = {
  report: (d) => post('/reports/', d),
  reports: (params) => get('/reports/', params),
  resolve: (id, payload) => patch(`/reports/${id}/resolve/`, payload),
}

export const gamification = {
  notifications: (params) => get('/notifications/', params),
  unreadCount: () => get('/notifications/unread-count/'),
  read: (id) => post(`/notifications/${id}/read/`),
  readAll: () => post('/notifications/read-all/'),
  badges: () => get('/badges/'),
  leaderboard: () => get('/leaderboard/'),
}

export const dashboard = {
  me: () => get('/dashboard/me/'),
  admin: () => get('/dashboard/admin/'),
}

export const adminUsers = {
  list: (params) => get('/admin/users/', params),
  update: (id, d) => patch(`/admin/users/${id}/`, d),
}
