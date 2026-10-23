import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { resources } from '../api'
import ResourceCard from '../components/ResourceCard'
import { Button, EmptyState, PageHeader, Pagination, QueryState } from '../components/ui'

export default function Favorites() {
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ['favorites', page], queryFn: () => resources.favorites({ page }), placeholderData: (p) => p })
  return (
    <div>
      <PageHeader title="Mes favoris" />
      <QueryState query={query}>
        {(data) => (
          <>
            {data.results.length === 0
              ? <EmptyState icon={Heart} title="Aucun favori" description="Ajoutez des ressources en favori pour les retrouver ici."
                  action={<Link to="/resources"><Button>Parcourir les ressources</Button></Link>} />
              : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((r) => <ResourceCard key={r.id} resource={r} />)}</div>}
            <Pagination page={page} count={data.count} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  )
}
