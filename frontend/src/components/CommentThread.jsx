import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Reply, Trash2 } from 'lucide-react'
import { resources } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Avatar, Button, Spinner, Textarea } from './ui'
import { errorMessage, fmtDateTime } from '../utils/format'

function CommentForm({ resourceId, parent, onDone, autoFocus }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [text, setText] = useState('')
  const mutation = useMutation({
    mutationFn: () => resources.addComment(resourceId, { contenu: text, parent: parent ?? null }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['comments', resourceId] })
      onDone?.()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) mutation.mutate() }}>
      <Textarea aria-label="Votre commentaire" rows={2} value={text} autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)} placeholder="Écrire un commentaire…" />
      <div className="flex justify-end gap-2">
        {onDone && <Button variant="ghost" size="sm" onClick={onDone}>Annuler</Button>}
        <Button size="sm" type="submit" loading={mutation.isPending} disabled={!text.trim()}>Publier</Button>
      </div>
    </form>
  )
}

function CommentItem({ comment, replies, resourceId, onReport, depth = 0 }) {
  const { user, isAuthenticated, isModerator } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [replying, setReplying] = useState(false)
  const remove = useMutation({
    mutationFn: () => resources.deleteComment(comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', resourceId] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const canDelete = user && (user.id === comment.auteur_id || isModerator)
  return (
    <li className={depth > 0 ? 'ml-6 border-l border-slate-200 pl-4 dark:border-slate-700' : ''}>
      <div className="flex gap-3">
        <Avatar name={comment.auteur_nom} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            {comment.auteur_id
              ? <Link to={`/users/${comment.auteur_id}`} className="font-semibold hover:text-brand-600">{comment.auteur_nom}</Link>
              : <span className="font-semibold">{comment.auteur_nom}</span>}
            <span className="ml-2 text-xs text-slate-400">{fmtDateTime(comment.date_creation)}</span>
          </p>
          <p className={`mt-1 whitespace-pre-wrap text-sm ${comment.est_masque ? 'italic text-slate-400' : ''}`}>{comment.contenu}</p>
          {isAuthenticated && (
            <div className="mt-1 flex gap-3 text-xs text-slate-500">
              {depth < 2 && <button className="flex items-center gap-1 hover:text-brand-600" onClick={() => setReplying((r) => !r)}><Reply className="h-3.5 w-3.5" />Répondre</button>}
              {user.id !== comment.auteur_id && <button className="flex items-center gap-1 hover:text-red-600" onClick={() => onReport(comment.id)}><Flag className="h-3.5 w-3.5" />Signaler</button>}
              {canDelete && <button className="flex items-center gap-1 hover:text-red-600" onClick={() => remove.mutate()}><Trash2 className="h-3.5 w-3.5" />Supprimer</button>}
            </div>
          )}
          {replying && <div className="mt-2"><CommentForm resourceId={resourceId} parent={comment.id} autoFocus onDone={() => setReplying(false)} /></div>}
        </div>
      </div>
      {replies.length > 0 && (
        <ul className="mt-3 space-y-3">
          {replies.map((c) => (
            <CommentItem key={c.id} comment={c.node} replies={c.children} resourceId={resourceId} onReport={onReport} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function buildTree(list) {
  const byId = new Map(list.map((c) => [c.id, { node: c, children: [] }]))
  const roots = []
  byId.forEach((entry) => {
    const parent = entry.node.parent && byId.get(entry.node.parent)
    if (parent) parent.children.push(entry)
    else roots.push(entry)
  })
  return roots
}

export default function CommentThread({ resourceId, onReport }) {
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['comments', resourceId],
    queryFn: () => resources.comments(resourceId),
  })
  const tree = useMemo(() => buildTree(data || []), [data])

  return (
    <section aria-label="Commentaires">
      <h2 className="mb-4 text-lg font-semibold">Commentaires {data ? `(${data.length})` : ''}</h2>
      {isAuthenticated
        ? <CommentForm resourceId={resourceId} />
        : <p className="text-sm text-slate-500"><Link to="/login" className="text-brand-600 underline">Connectez-vous</Link> pour commenter.</p>}
      {isLoading && <Spinner className="py-6" />}
      {isError && <p className="mt-4 text-sm text-red-600">Impossible de charger les commentaires.</p>}
      {data && tree.length === 0 && <p className="mt-4 text-sm text-slate-500">Aucun commentaire pour le moment.</p>}
      <ul className="mt-6 space-y-5">
        {tree.map((c) => (
          <CommentItem key={c.node.id} comment={c.node} replies={c.children} resourceId={resourceId} onReport={onReport} />
        ))}
      </ul>
    </section>
  )
}
