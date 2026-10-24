import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellPlus, Check, Plus } from 'lucide-react'
import { catalog, follows } from '../api'
import { Badge, Button, Card, EmptyState, PageHeader, QueryState } from '../components/ui'
import { useToast } from '../context/Toast'
import { errorMessage } from '../utils/format'

export default function Follows() {
  const qc = useQueryClient()
  const toast = useToast()
  const followed = useQuery({ queryKey: ['follows'], queryFn: follows.list })
  const all = useQuery({ queryKey: ['matieres-all'], queryFn: () => catalog.matieres() })

  const toggle = useMutation({
    mutationFn: ({ id, isFollowed }) => (isFollowed ? follows.unfollow(id) : follows.follow(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follows'] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const followedIds = new Set((followed.data || []).map((m) => m.id))

  return (
    <div className="space-y-8">
      <PageHeader title="Matières suivies" subtitle="Recevez une notification à chaque nouvelle ressource publiée dans ces matières." />
      <QueryState query={followed}>
        {(data) => data.length === 0
          ? <EmptyState icon={BellPlus} title="Aucune matière suivie" description="Suivez des matières ci-dessous pour personnaliser vos recommandations." />
          : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((m) => (
                <Card key={m.id} className="flex items-center justify-between !p-4">
                  <div>
                    <Link to={`/resources?matiere=${m.id}`} className="font-semibold hover:text-brand-600">{m.nom}</Link>
                    <p className="text-xs text-slate-500">{m.filiere_nom} · {m.niveau}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => toggle.mutate({ id: m.id, isFollowed: true })}>Ne plus suivre</Button>
                </Card>
              ))}
            </div>
          )}
      </QueryState>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Toutes les matières</h2>
        <QueryState query={all}>
          {(data) => (
            <div className="flex flex-wrap gap-2">
              {data.map((m) => (
                <button key={m.id} onClick={() => toggle.mutate({ id: m.id, isFollowed: followedIds.has(m.id) })}
                  aria-pressed={followedIds.has(m.id)}>
                  <Badge color={followedIds.has(m.id) ? 'brand' : 'slate'} className="cursor-pointer !px-3 !py-1.5">
                    {m.nom} · {m.niveau} {followedIds.has(m.id) ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </QueryState>
      </section>
    </div>
  )
}
