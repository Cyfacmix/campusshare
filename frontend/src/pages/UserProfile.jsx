import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, Calendar, GraduationCap } from 'lucide-react'
import { auth, resources } from '../api'
import ResourceCard from '../components/ResourceCard'
import { Avatar, Badge, Card, EmptyState, QueryState } from '../components/ui'
import { ROLES, fmtDate, fullName } from '../utils/format'
import BadgeIcon from '../components/BadgeIcon'

export default function UserProfile() {
  const { id } = useParams()
  const user = useQuery({ queryKey: ['public-user', id], queryFn: () => auth.publicUser(id) })
  const list = useQuery({
    queryKey: ['resources', 'by-author', id],
    queryFn: () => resources.list({ auteur: id, ordering: '-date_creation', page_size: 24 }),
  })

  return (
    <div className="space-y-8">
      <QueryState query={user}>
        {(u) => (
          <Card className="flex flex-col items-center gap-6 sm:flex-row">
            <Avatar name={fullName(u)} src={u.avatar} size="lg" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{fullName(u)}</h1>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge color="brand">{ROLES[u.role]}</Badge>
                {u.filiere_nom && <Badge><GraduationCap className="h-3 w-3" /> {u.filiere_nom} {u.niveau}</Badge>}
                <Badge color="amber"><Award className="h-3 w-3" /> {u.points_reputation} points</Badge>
                <Badge><Calendar className="h-3 w-3" /> Membre depuis {fmtDate(u.date_joined)}</Badge>
              </div>
              {u.bio && <p className="mt-3 text-sm">{u.bio}</p>}
              {u.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {u.badges.map((b) => <Badge key={b.nom} color="green" title={b.description}><BadgeIcon name={b.icone} /> {b.nom}</Badge>)}
                </div>
              )}
            </div>
          </Card>
        )}
      </QueryState>

      <section>
        <h2 className="mb-4 text-xl font-bold">Ressources publiées</h2>
        <QueryState query={list}>
          {(data) => data.results.length === 0
            ? <EmptyState title="Aucune ressource publiée" />
            : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((r) => <ResourceCard key={r.id} resource={r} />)}</div>}
        </QueryState>
      </section>
    </div>
  )
}
