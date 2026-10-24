import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, Download, ExternalLink, Eye, Flag, Heart, Pencil, ShieldCheck, ThumbsDown, ThumbsUp, Trash2, XCircle,
} from 'lucide-react'
import { resources } from '../api'
import CommentThread from '../components/CommentThread'
import ReportModal from '../components/ReportModal'
import { Badge, Button, Card, ConfirmDialog, Modal, QueryState, Textarea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { STATUTS, TYPES, errorMessage, fmtDate, isImage, isPdf } from '../utils/format'

export default function ResourceDetail() {
  const { id } = useParams()
  const rid = Number(id)
  const { user, isAuthenticated, isModerator, hasRole } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const key = ['resource', rid]

  const [report, setReport] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [motif, setMotif] = useState('')

  const query = useQuery({ queryKey: key, queryFn: () => resources.get(rid) })
  const refresh = (data) => { qc.setQueryData(key, data); qc.invalidateQueries({ queryKey: ['resources'] }) }

  const vote = useMutation({
    mutationFn: (valeur) => resources.vote(rid, valeur),
    onMutate: async (valeur) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData(key)
      if (previous) {
        const current = previous.mon_vote || 0
        const next = valeur === current ? 0 : valeur
        qc.setQueryData(key, { ...previous, mon_vote: next || null, score: previous.score - current + next })
      }
      return { previous }
    },
    onError: (e, _v, ctx) => { qc.setQueryData(key, ctx.previous); toast.error(errorMessage(e)) },
    onSuccess: (res) => qc.setQueryData(key, (old) => ({ ...old, score: res.score, mon_vote: res.mon_vote })),
  })

  const favorite = useMutation({
    mutationFn: (isFav) => (isFav ? resources.unfavorite(rid) : resources.favorite(rid)),
    onMutate: async (isFav) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData(key)
      qc.setQueryData(key, { ...previous, est_favori: !isFav })
      return { previous }
    },
    onError: (e, _v, ctx) => { qc.setQueryData(key, ctx.previous); toast.error(errorMessage(e)) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const download = useMutation({
    mutationFn: () => resources.download(rid),
    onSuccess: (res) => {
      qc.setQueryData(key, (old) => ({ ...old, nb_telechargements: res.nb_telechargements }))
      window.open(res.url, '_blank', 'noopener')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const certify = useMutation({
    mutationFn: () => resources.certify(rid),
    onSuccess: (data) => { refresh(data); toast.success('Ressource certifiée.') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const moderate = useMutation({
    mutationFn: (payload) => resources.moderate(rid, payload),
    onSuccess: (data) => { refresh(data); setRejectOpen(false); setMotif(''); toast.success('Décision enregistrée.') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: () => resources.remove(rid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Ressource supprimée.'); navigate('/resources') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const requireAuth = (fn) => () => (isAuthenticated ? fn() : navigate('/login', { state: { from: `/resources/${rid}` } }))

  return (
    <QueryState query={query}>
      {(r) => {
        const isOwner = user?.id === r.auteur
        const canVote = isAuthenticated && !isOwner && r.statut === 'publiee'
        return (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge color="brand">{TYPES[r.type]}</Badge>
                  {r.certifiee && <Badge color="green"><ShieldCheck className="h-3 w-3" /> Vérifiée par {r.certificateur_nom}</Badge>}
                  {r.statut !== 'publiee' && <Badge color={r.statut === 'rejetee' ? 'red' : 'amber'}>{STATUTS[r.statut]}</Badge>}
                </div>
                <h1 className="text-2xl font-bold">{r.titre}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {r.matiere_nom} · {r.niveau} · {r.filiere_nom} — par{' '}
                  {r.auteur ? <Link to={`/users/${r.auteur}`} className="text-brand-600 hover:underline">{r.auteur_nom}</Link> : r.auteur_nom}
                  {' '}le {fmtDate(r.date_creation)}
                </p>
                {r.statut === 'rejetee' && r.motif_rejet && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">Motif du rejet : {r.motif_rejet}</p>
                )}
                <hr className='mt-1' />
                {r.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{r.description}</p>}
                {r.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.tags.map((t) => <Link key={t} to={`/resources?tag=${encodeURIComponent(t)}`}><Badge>#{t}</Badge></Link>)}
                  </div>
                )}
              </Card>

              {r.fichier && isPdf(r.fichier) && (
                <Card className="!p-2">
                  <iframe title="Aperçu du document" src={r.fichier} className="h-[70vh] w-full rounded-lg" />
                </Card>
              )}
              {r.fichier && isImage(r.fichier) && (
                <Card className="!p-2"><img src={r.fichier} alt={r.titre} className="mx-auto max-h-[70vh] rounded-lg" /></Card>
              )}

              <Card><CommentThread resourceId={rid} onReport={(commentId) => setReport({ commentaire: commentId })} /></Card>
            </div>

            <aside className="space-y-4">
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant={r.mon_vote === 1 ? 'primary' : 'secondary'} size="sm" disabled={!canVote || vote.isPending}
                      aria-label="Utile" aria-pressed={r.mon_vote === 1} onClick={() => vote.mutate(1)}><ThumbsUp className="h-4 w-4" /></Button>
                    <span className="min-w-8 text-center text-lg font-bold" aria-label="Score">{r.score}</span>
                    <Button variant={r.mon_vote === -1 ? 'danger' : 'secondary'} size="sm" disabled={!canVote || vote.isPending}
                      aria-label="Pas utile" aria-pressed={r.mon_vote === -1} onClick={() => vote.mutate(-1)}><ThumbsDown className="h-4 w-4" /></Button>
                  </div>
                  <Button variant={r.est_favori ? 'primary' : 'secondary'} size="sm" onClick={requireAuth(() => favorite.mutate(Boolean(r.est_favori)))}
                    aria-pressed={Boolean(r.est_favori)}><Heart className={`h-4 w-4 ${r.est_favori ? 'fill-current' : ''}`} /> Favori</Button>
                </div>
                {isOwner && <p className="text-xs text-slate-500">Vous ne pouvez pas voter pour votre propre ressource.</p>}

                {(r.fichier || r.lien_externe) && (
                  r.fichier
                    ? <Button className="w-full" loading={download.isPending} onClick={() => download.mutate()}><Download className="h-4 w-4" /> Télécharger</Button>
                    : <a href={r.lien_externe} target="_blank" rel="noopener noreferrer"><Button className="w-full"><ExternalLink className="h-4 w-4" /> Ouvrir le lien</Button></a>
                )}

                <div className="flex justify-around text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{r.nb_vues} vues</span>
                  <span className="flex items-center gap-1"><Download className="h-4 w-4" />{r.nb_telechargements}</span>
                </div>
              </Card>

              {(isOwner || isModerator) && (
                <Card className="space-y-2">
                  <h2 className="text-sm font-semibold">Gestion</h2>
                  {isOwner && <Link to={`/resources/${rid}/edit`}><Button variant="secondary" className="w-full"><Pencil className="h-4 w-4" /> Modifier</Button></Link>}
                  <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> Supprimer</Button>
                </Card>
              )}

              {isModerator && r.statut !== 'publiee' && (
                <Card className="space-y-2">
                  <h2 className="text-sm font-semibold">Modération</h2>
                  <Button variant="success" className="w-full" loading={moderate.isPending} onClick={() => moderate.mutate({ action: 'publish' })}><CheckCircle className="h-4 w-4" /> Publier</Button>
                  {r.statut === 'en_attente' && <Button variant="danger" className="w-full" onClick={() => setRejectOpen(true)}><XCircle className="h-4 w-4" /> Rejeter</Button>}
                </Card>
              )}

              {hasRole('enseignant', 'admin') && r.statut === 'publiee' && !r.certifiee && (
                <Card>
                  <Button variant="secondary" className="w-full" loading={certify.isPending} onClick={() => certify.mutate()}><ShieldCheck className="h-4 w-4" /> Certifier cette ressource</Button>
                </Card>
              )}

              {isAuthenticated && !isOwner && r.statut === 'publiee' && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setReport({ ressource: rid })}><Flag className="h-4 w-4" /> Signaler</Button>
              )}
            </aside>

            <ReportModal open={Boolean(report)} onClose={() => setReport(null)} target={report || {}} />
            <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} loading={remove.isPending}
              title="Supprimer la ressource" message="Cette action est définitive. Les commentaires associés seront supprimés."
              confirmLabel="Supprimer" onConfirm={() => remove.mutate()} />
            <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Rejeter la ressource"
              footer={(<><Button variant="secondary" onClick={() => setRejectOpen(false)}>Annuler</Button>
                <Button variant="danger" loading={moderate.isPending} disabled={!motif.trim()}
                  onClick={() => moderate.mutate({ action: 'reject', motif })}>Rejeter</Button></>)}>
              <Textarea label="Motif du rejet (obligatoire)" value={motif} onChange={(e) => setMotif(e.target.value)} />
            </Modal>
          </div>
        )
      }}
    </QueryState>
  )
}
