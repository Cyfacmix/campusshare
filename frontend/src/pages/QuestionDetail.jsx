import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { qna } from '../api'
import { Avatar, Badge, Button, Card, ConfirmDialog, QueryState, Spinner, Textarea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { errorMessage, fmtDateTime } from '../utils/format'

export default function QuestionDetail() {
  const { id } = useParams()
  const qid = Number(id)
  const { user, isAuthenticated, isModerator } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [confirm, setConfirm] = useState(false)

  const question = useQuery({ queryKey: ['question', qid], queryFn: () => qna.get(qid) })
  const answers = useQuery({ queryKey: ['answers', qid], queryFn: () => qna.answers(qid) })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['answers', qid] })
    qc.invalidateQueries({ queryKey: ['question', qid] })
    qc.invalidateQueries({ queryKey: ['questions'] })
  }

  const answer = useMutation({
    mutationFn: () => qna.answer(qid, text),
    onSuccess: () => { setText(''); refresh(); toast.success('Réponse publiée.') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const accept = useMutation({
    mutationFn: (answerId) => qna.accept(answerId),
    onSuccess: () => { refresh(); toast.success('Réponse acceptée.') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: () => qna.remove(qid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions'] }); navigate('/questions') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <QueryState query={question}>
      {(q) => {
        const isAuthor = user?.id === q.auteur_id
        return (
          <div className="mx-auto max-w-3xl space-y-6">
            <Card>
              <div className="mb-2 flex items-center gap-2">
                <Badge color="brand">{q.matiere_nom}</Badge>
                {q.est_resolue && <Badge color="green"><CheckCircle2 className="h-3 w-3" /> Résolue</Badge>}
              </div>
              <h1 className="text-2xl font-bold">{q.titre}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {q.auteur_id ? <Link to={`/users/${q.auteur_id}`} className="hover:text-brand-600">{q.auteur_nom}</Link> : q.auteur_nom} · {fmtDateTime(q.date_creation)}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{q.contenu}</p>
              {(isAuthor || isModerator) && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Supprimer</Button>
                </div>
              )}
            </Card>

            <section>
              <h2 className="mb-3 text-lg font-semibold">{answers.data?.length ?? 0} réponse(s)</h2>
              {answers.isLoading && <Spinner className="py-6" />}
              <div className="space-y-3">
                {answers.data?.map((a) => (
                  <Card key={a.id} className={a.est_acceptee ? '!border-emerald-400 dark:!border-emerald-600' : ''}>
                    <div className="flex gap-3">
                      <Avatar name={a.auteur_nom} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {a.auteur_id ? <Link to={`/users/${a.auteur_id}`} className="font-semibold hover:text-brand-600">{a.auteur_nom}</Link> : <b>{a.auteur_nom}</b>}
                          <span className="text-xs text-slate-400">{fmtDateTime(a.date_creation)}</span>
                          {a.est_acceptee && <Badge color="green"><CheckCircle2 className="h-3 w-3" /> Meilleure réponse</Badge>}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{a.contenu}</p>
                        {isAuthor && !a.est_acceptee && (
                          <Button variant="secondary" size="sm" className="mt-3" loading={accept.isPending && accept.variables === a.id}
                            onClick={() => accept.mutate(a.id)}>Accepter cette réponse</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <Card>
              <h2 className="mb-3 font-semibold">Votre réponse</h2>
              {isAuthenticated ? (
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) answer.mutate() }}>
                  <Textarea aria-label="Votre réponse" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
                  <div className="flex justify-end"><Button type="submit" loading={answer.isPending} disabled={!text.trim()}>Publier la réponse</Button></div>
                </form>
              ) : (
                <p className="text-sm text-slate-500"><Link to="/login" className="text-brand-600 underline">Connectez-vous</Link> pour répondre.</p>
              )}
            </Card>

            <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} loading={remove.isPending}
              title="Supprimer la question" message="La question et toutes ses réponses seront supprimées."
              confirmLabel="Supprimer" onConfirm={() => remove.mutate()} />
          </div>
        )
      }}
    </QueryState>
  )
}
