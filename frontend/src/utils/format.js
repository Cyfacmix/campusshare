export const TYPES = {
  cours: 'Cours',
  resume: 'Résumé',
  examen: "Sujet d'examen",
  tutoriel: 'Tutoriel',
}
export const ROLES = {
  etudiant: 'Étudiant',
  enseignant: 'Enseignant',
  moderateur: 'Modérateur',
  admin: 'Administrateur',
}
export const STATUTS = { en_attente: 'En attente', publiee: 'Publiée', rejetee: 'Rejetée' }
export const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2']

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : ''

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?'

export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false),
  )
}

export function errorMessage(err, fallback = 'Une erreur est survenue.') {
  const data = err?.response?.data
  if (!data) return err?.message === 'Network Error' ? 'Impossible de joindre le serveur.' : fallback
  if (typeof data === 'string') return fallback
  if (data.detail) return data.detail
  const first = Object.values(data)[0]
  if (Array.isArray(first)) return String(first[0])
  if (typeof first === 'string') return first
  return fallback
}

export const isPdf = (url = '') => url.toLowerCase().split('?')[0].endsWith('.pdf')
export const isImage = (url = '') => /\.(png|jpe?g)$/i.test(url.split('?')[0])
export const fullName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || ''
