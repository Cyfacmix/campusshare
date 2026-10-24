import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { nav } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'

const EMPTY = { ressources: 0, questions: 0, moderation: 0 }
const storageKey = (userId, name) => `campusshare:lastSeen:${userId}:${name}`
const plural = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}.`

// Date de derniere visite d'une page (initialisee a maintenant a la premiere utilisation)
function loadSeen(userId, name) {
  try {
    const saved = localStorage.getItem(storageKey(userId, name))
    if (saved) return saved
    const now = new Date().toISOString()
    localStorage.setItem(storageKey(userId, name), now)
    return now
  } catch {
    return new Date().toISOString()
  }
}

export function useNavCounts() {
  const { user, isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const toast = useToast()
  const qc = useQueryClient()
  const userId = user?.id
  const seen = useRef({})
  const previous = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    previous.current = null
    if (!isAuthenticated || !userId) {
      setReady(false)
      return
    }
    seen.current = {
      ressources: loadSeen(userId, 'ressources'),
      questions: loadSeen(userId, 'questions'),
    }
    setReady(true)
  }, [isAuthenticated, userId])

  const query = useQuery({
    queryKey: ['nav-counts', userId],
    queryFn: () => nav.counts({
      ressources_since: seen.current.ressources,
      questions_since: seen.current.questions,
    }),
    enabled: ready,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })
  const counts = query.data ?? EMPTY

  const markSeen = useCallback((name) => {
    const now = new Date().toISOString()
    seen.current = { ...seen.current, [name]: now }
    try { localStorage.setItem(storageKey(userId, name), now) } catch { /* stockage indisponible */ }
    qc.invalidateQueries({ queryKey: ['nav-counts'] })
  }, [userId, qc])

  // Ouvrir la page remet son compteur a zero
  useEffect(() => {
    if (!ready) return
    if (pathname.startsWith('/resources') && counts.ressources > 0) markSeen('ressources')
    if (pathname.startsWith('/questions') && counts.questions > 0) markSeen('questions')
  }, [pathname, ready, counts.ressources, counts.questions, markSeen])

  // Notification quand un compteur augmente
  useEffect(() => {
    const d = query.data
    if (!d) return
    const prev = previous.current
    previous.current = d
    if (!prev) return
    if (d.ressources > prev.ressources) {
      toast.info(plural(d.ressources - prev.ressources, 'nouvelle ressource publiée', 'nouvelles ressources publiées'))
    }
    if (d.questions > prev.questions) {
      toast.info(plural(d.questions - prev.questions, 'nouvelle question posée', 'nouvelles questions posées'))
    }
    if (d.moderation > prev.moderation) {
      toast.info('Nouvel élément à modérer.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  return counts
}