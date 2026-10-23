import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, MessageCircleQuestion, Plus } from 'lucide-react'
import { catalog, qna } from '../api'
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Pagination, QueryState, Select, Textarea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { errorMessage, fmtDate } from '../utils/format'

function AskModal({ open, onClose, matieres }) {
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ titre: '', contenu: '', matiere: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const mutation = useMutation({
    mutationFn: () => qna.create({ ...form, matiere: Number(form.matiere) }),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: ['questions'] })
      toast.success('Question publiée.')
      onClose()
      navigate(`/questions/${q.id}`)
    },
    onError: (e) => setError(errorMessage(e)),
  })
  const valid = form.titre.trim() && form.contenu.trim() && form.matiere
  return (
    <Modal open={open} onClose={onClose} title="Poser une question"
      footer={(<><Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button loading={mutation.isPending} disabled={!valid} onClick={() => mutation.mutate()}>Publier</Button></>)}>
      <div className="space-y-4">
        <Select label="Matière" value={form.matiere} onChange={set('matiere')}>
          <option value="">— Choisir —</option>
          {matieres?.map((m) => <option key={m.id} value={m.id}>{m.nom} ({m.niveau})</option>)}
        </Select>
        <Input label="Titre" value={form.titre} onChange={set('titre')} maxLength={200} />
        <Textarea label="Détails" value={form.contenu} onChange={set('contenu')} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}

export default function Questions() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [asking, setAsking] = useState(false)
  const get = (k) => params.get(k) || ''
  const page = Number(get('page') || 1)
  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }
  const matieres = useQuery({ queryKey: ['matieres-all'], queryFn: () => catalog.matieres() })
  const filters = { search: get('search'), matiere: get('matiere'), est_resolue: get('est_resolue'), page }
  const query = useQuery({ queryKey: ['questions', filters], queryFn: () => qna.list(filters), placeholderData: (p) => p })

  return (
    <div>
      <PageHeader title="Questions & réponses" subtitle="Posez vos questions, aidez les autres et gagnez en réputation."
        actions={<Button onClick={() => (isAuthenticated ? setAsking(true) : navigate('/login'))}><Plus className="h-4 w-4" /> Poser une question</Button>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Input label="Recherche" defaultValue={get('search')} key={get('search')}
          onKeyDown={(e) => e.key === 'Enter' && setParam('search', e.target.value.trim())}
          onBlur={(e) => e.target.value.trim() !== get('search') && setParam('search', e.target.value.trim())} />
        <Select label="Matière" value={get('matiere')} onChange={(e) => setParam('matiere', e.target.value)}>
          <option value="">Toutes</option>
          {matieres.data?.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </Select>
        <Select label="Statut" value={get('est_resolue')} onChange={(e) => setParam('est_resolue', e.target.value)}>
          <option value="">Toutes</option>
          <option value="true">Résolues</option>
          <option value="false">Sans réponse acceptée</option>
        </Select>
      </div>
      <QueryState query={query}>
        {(data) => (
          <>
            {data.results.length === 0
              ? <EmptyState icon={MessageCircleQuestion} title="Aucune question" description="Soyez le premier à poser une question." />
              : (
                <div className="space-y-3">
                  {data.results.map((q) => (
                    <Card key={q.id} className="flex items-start justify-between gap-4 !p-4">
                      <div className="min-w-0">
                        <Link to={`/questions/${q.id}`} className="font-semibold hover:text-brand-600">{q.titre}</Link>
                        <p className="mt-1 text-sm text-slate-500">{q.matiere_nom} · {q.auteur_nom} · {fmtDate(q.date_creation)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {q.est_resolue && <Badge color="green"><CheckCircle2 className="h-3 w-3" /> Résolue</Badge>}
                        <Badge>{q.nb_reponses} réponse{q.nb_reponses > 1 ? 's' : ''}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            <Pagination page={page} count={data.count} onChange={(p) => setParam('page', String(p))} />
          </>
        )}
      </QueryState>
      <AskModal open={asking} onClose={() => setAsking(false)} matieres={matieres.data} />
    </div>
  )
}
