import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Trophy } from 'lucide-react'
import { gamification, resources } from '../api'
import ResourceCard from '../components/ResourceCard'
import { Avatar, Button, Card, EmptyState, QueryState } from '../components/ui'
import { useAuth } from '../context/AuthContext'

function ResourceSection({ title, queryKey, params, link }) {
  const query = useQuery({ queryKey, queryFn: () => resources.list(params) })
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link to={link} className="text-sm text-brand-600 hover:underline">Tout voir</Link>
      </div>
      <QueryState query={query}>
        {(data) => data.results.length === 0
          ? <EmptyState title="Aucune ressource pour le moment" description="Soyez le premier à partager un document !" />
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((r) => <ResourceCard key={r.id} resource={r} />)}</div>}
      </QueryState>
    </section>
  )
}

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const leaders = useQuery({ queryKey: ['leaderboard'], queryFn: gamification.leaderboard })

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center text-white">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Le savoir de votre campus, partagé par les étudiants</h1>
        <p className="mx-auto mt-3 max-w-2xl text-brand-100">
          Cours, résumés, sujets d&apos;examen corrigés et tutoriels, classés par filière, niveau et matière.
        </p>
        <form className="mx-auto mt-8 flex max-w-xl gap-2"
          onSubmit={(e) => { e.preventDefault(); navigate(`/resources?search=${encodeURIComponent(search)}`) }}>
          <label className="relative flex-1">
            <span className="sr-only">Rechercher une ressource</span>
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cours, une matière, un tag…"
              className="w-full rounded-lg py-3 pl-10 pr-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-white" />
          </label>
          <Button type="submit" variant="secondary" size="lg" className="!border-0">Rechercher</Button>
        </form>
        {!isAuthenticated && (
          <div className="mt-6"><Link to="/register"><Button variant="ghost" className="!text-white underline">Créer un compte gratuit</Button></Link></div>
        )}
      </section>

      <ResourceSection title="Ajoutées récemment" queryKey={['home-recent']}
        params={{ ordering: '-date_creation', page_size: 6 }} link="/resources" />
      <ResourceSection title="Les mieux notées" queryKey={['home-top']}
        params={{ ordering: '-score', page_size: 6 }} link="/resources?ordering=-score" />

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Trophy className="h-5 w-5 text-amber-500" /> Meilleurs contributeurs</h2>
        <QueryState query={leaders}>
          {(data) => (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {data.slice(0, 5).map((u, i) => (
                <Card key={u.id} className="flex items-center gap-3 !p-4">
                  <span className="text-lg font-bold text-slate-400">{i + 1}</span>
                  <Avatar name={u.nom} size="sm" />
                  <div className="min-w-0">
                    <Link to={`/users/${u.id}`} className="block truncate text-sm font-semibold hover:text-brand-600">{u.nom}</Link>
                    <p className="text-xs text-slate-500">{u.points_reputation} pts</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </QueryState>
      </section>
    </div>
  )
}
