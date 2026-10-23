import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { gamification } from '../api'
import { Button, Card, EmptyState, PageHeader, Pagination, QueryState } from '../components/ui'
import { fmtDateTime } from '../utils/format'

const ROUTES = { ressource: (id) => `/resources/${id}`, question: (id) => `/questions/${id}` }

export default function Notifications() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['notifications', page], queryFn: () => gamification.notifications({ page }), placeholderData: (p) => p })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['unread-count'] })
  }
  const readOne = useMutation({ mutationFn: gamification.read, onSuccess: refresh })
  const readAll = useMutation({ mutationFn: gamification.readAll, onSuccess: refresh })

  const open = (n) => {
    if (!n.est_lue) readOne.mutate(n.id)
    const target = ROUTES[n.objet_type]
    if (target && n.objet_id) navigate(target(n.objet_id))
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications"
        actions={<Button variant="secondary" size="sm" loading={readAll.isPending} onClick={() => readAll.mutate()}><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</Button>} />
      <QueryState query={query}>
        {(data) => (
          <>
            {data.results.length === 0
              ? <EmptyState icon={Bell} title="Aucune notification" description="Vous serez prévenu des nouveautés qui vous concernent." />
              : (
                <div className="space-y-2">
                  {data.results.map((n) => (
                    <Card key={n.id} className={`!p-4 ${n.est_lue ? 'opacity-70' : '!border-brand-300 dark:!border-brand-700'}`}>
                      <button className="flex w-full items-start gap-3 text-left" onClick={() => open(n)}>
                        {!n.est_lue && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="Non lue" />}
                        <span className="flex-1">
                          <span className="block text-sm">{n.message}</span>
                          <span className="text-xs text-slate-400">{fmtDateTime(n.date_creation)}</span>
                        </span>
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            <Pagination page={page} count={data.count} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  )
}
