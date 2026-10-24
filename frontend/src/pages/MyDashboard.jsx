import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, Download, Eye, FileText, MessageSquare, ThumbsUp } from 'lucide-react'
import { dashboard, resources } from '../api'
import ResourceCard from '../components/ResourceCard'
import { Badge, Button, Card, EmptyState, PageHeader, QueryState, StatCard } from '../components/ui'
import BadgeIcon from '../components/BadgeIcon'

function MyResources() {
  const query = useQuery({ queryKey: ['resources', 'mine'], queryFn: () => resources.mine({ page_size: 24 }) })
  return (
    <QueryState query={query}>
      {(data) => data.results.length === 0
        ? <EmptyState title="Vous n'avez rien publié" description="Partagez votre premier document avec le campus."
            action={<Link to="/resources/new"><Button>Publier une ressource</Button></Link>} />
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((r) => <ResourceCard key={r.id} resource={r} showStatus />)}</div>}
    </QueryState>
  )
}

export default function MyDashboard() {
  const query = useQuery({ queryKey: ['dashboard-me'], queryFn: dashboard.me })
  return (
    <div className="space-y-8">
      <PageHeader title="Mon tableau de bord" subtitle="Vos contributions et votre progression."
        actions={<Link to="/resources/new"><Button>Publier une ressource</Button></Link>} />
      <QueryState query={query}>
        {(d) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Ressources publiées" value={d.nb_publiees} icon={FileText} />
              <StatCard label="Vues totales" value={d.total_vues} icon={Eye} />
              <StatCard label="Téléchargements" value={d.total_telechargements} icon={Download} />
              <StatCard label="Votes reçus (score)" value={d.votes_recus} icon={ThumbsUp} />
              <StatCard label="Réponses acceptées" value={d.reponses_acceptees} icon={MessageSquare} />
              <StatCard label="Points de réputation" value={d.points_reputation} icon={Award} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <h2 className="mb-4 font-semibold">Mes publications par mois</h2>
                {d.ressources_par_mois.length === 0
                  ? <p className="py-10 text-center text-sm text-slate-500">Pas encore de données.</p>
                  : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.ressources_par_mois}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="mois" fontSize={12} />
                          <YAxis allowDecimals={false} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="total" name="Ressources" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </Card>
              <Card>
                <h2 className="mb-3 font-semibold">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {d.badges.length === 0 && <p className="text-sm text-slate-500">Aucun badge pour l&apos;instant.</p>}
                  {d.badges.map((b) => <Badge key={b.nom} color="green" title={b.description}><BadgeIcon name={b.icone} /> {b.nom}</Badge>)}
                </div>
                {d.prochain_badge && (
                  <div className="mt-5">
                    <p className="text-sm">Prochain badge : <b>{d.prochain_badge.nom}</b></p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full bg-brand-600"
                        style={{ width: `${Math.min(100, Math.round((d.points_reputation / d.prochain_badge.seuil) * 100))}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Encore {d.prochain_badge.restant} points</p>
                  </div>
                )}
                <div className="mt-5 space-y-1 text-sm text-slate-500">
                  <p>En attente : {d.nb_en_attente} · Rejetées : {d.nb_rejetees}</p>
                  <p>Questions : {d.nb_questions} · Réponses : {d.nb_reponses}</p>
                </div>
              </Card>
            </div>

            {d.top_ressources.length > 0 && (
              <Card>
                <h2 className="mb-3 font-semibold">Mes ressources les plus vues</h2>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {d.top_ressources.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <Link to={`/resources/${r.id}`} className="hover:text-brand-600">{r.titre}</Link>
                      <span className="text-slate-500">{r.nb_vues} vues · {r.nb_telechargements} téléch.</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </QueryState>
      <section>
        <h2 className="mb-4 text-xl font-bold">Mes ressources</h2>
        <MyResources />
      </section>
    </div>
  )
}
