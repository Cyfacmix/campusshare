import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ShieldAlert, XCircle } from 'lucide-react'
import { moderation, resources } from '../api'
import { Badge, Button, Card, EmptyState, Modal, PageHeader, QueryState, Textarea } from '../components/ui'
import { useToast } from '../context/Toast'
import { TYPES, errorMessage, fmtDate } from '../utils/format'

function PendingResources() {
  const qc = useQueryClient()
  const toast = useToast()
  const [rejecting, setRejecting] = useState(null)
  const [motif, setMotif] = useState('')
  const query = useQuery({ queryKey: ['pending-resources'], queryFn: () => resources.list({ statut: 'en_attente', ordering: 'date_creation', page_size: 50 }) })

  const moderate = useMutation({
    mutationFn: ({ id, payload }) => resources.moderate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-resources'] })
      qc.invalidateQueries({ queryKey: ['resources'] })
      setRejecting(null); setMotif('')
      toast.success('Décision enregistrée.')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <>
      <QueryState query={query}>
        {(data) => data.results.length === 0
          ? <EmptyState icon={CheckCircle} title="Tout est à jour" description="Aucune ressource en attente de validation." />
          : (
            <div className="space-y-3">
              {data.results.map((r) => (
                <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                  <div className="min-w-0">
                    <Link to={`/resources/${r.id}`} className="font-semibold hover:text-brand-600">{r.titre}</Link>
                    <p className="text-sm text-slate-500">
                      <Badge color="brand" className="mr-2">{TYPES[r.type]}</Badge>{r.matiere_nom} · {r.auteur_nom} · {fmtDate(r.date_creation)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" onClick={() => moderate.mutate({ id: r.id, payload: { action: 'publish' } })}><CheckCircle className="h-4 w-4" /> Publier</Button>
                    <Button variant="danger" size="sm" onClick={() => setRejecting(r)}><XCircle className="h-4 w-4" /> Rejeter</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </QueryState>
      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title={`Rejeter « ${rejecting?.titre || ''} »`}
        footer={(<><Button variant="secondary" onClick={() => setRejecting(null)}>Annuler</Button>
          <Button variant="danger" disabled={!motif.trim()} loading={moderate.isPending}
            onClick={() => moderate.mutate({ id: rejecting.id, payload: { action: 'reject', motif } })}>Rejeter</Button></>)}>
        <Textarea label="Motif (obligatoire, transmis à l'auteur)" value={motif} onChange={(e) => setMotif(e.target.value)} />
      </Modal>
    </>
  )
}

function Reports() {
  const qc = useQueryClient()
  const toast = useToast()
  const query = useQuery({ queryKey: ['reports'], queryFn: () => moderation.reports({ statut: 'ouvert' }) })
  const resolve = useMutation({
    mutationFn: ({ id, decision }) => moderation.resolve(id, { decision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      qc.invalidateQueries({ queryKey: ['resources'] })
      toast.success('Signalement traité.')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <QueryState query={query}>
      {(data) => {
        const items = data.results ?? data
        return items.length === 0
          ? <EmptyState icon={ShieldAlert} title="Aucun signalement ouvert" />
          : (
            <div className="space-y-3">
              {items.map((s) => (
                <Card key={s.id} className="!p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge color="red">{s.motif}</Badge>
                        <Badge>{s.cible_type === 'ressource' ? 'Ressource' : 'Commentaire'}</Badge>
                        <span className="text-xs text-slate-400">{fmtDate(s.date_signalement)} · par {s.signaleur_nom}</span>
                      </p>
                      <Link to={`/resources/${s.cible_id}`} className="text-sm font-medium hover:text-brand-600">{s.cible_texte}</Link>
                      {s.description && <p className="mt-1 text-sm text-slate-500">« {s.description} »</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" onClick={() => resolve.mutate({ id: s.id, decision: 'traiter' })}>
                        {s.cible_type === 'ressource' ? 'Rejeter la ressource' : 'Masquer le commentaire'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => resolve.mutate({ id: s.id, decision: 'rejeter' })}>Ignorer</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
      }}
    </QueryState>
  )
}

export default function Moderation() {
  const [tab, setTab] = useState('pending')
  const tabCls = (t) => `rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`
  return (
    <div>
      <PageHeader title="Modération" subtitle="Validez les nouvelles ressources et traitez les signalements." />
      <div className="mb-6 flex gap-2" role="tablist">
        <button role="tab" aria-selected={tab === 'pending'} className={tabCls('pending')} onClick={() => setTab('pending')}>Ressources en attente</button>
        <button role="tab" aria-selected={tab === 'reports'} className={tabCls('reports')} onClick={() => setTab('reports')}>Signalements ouverts</button>
      </div>
      {tab === 'pending' ? <PendingResources /> : <Reports />}
    </div>
  )
}
