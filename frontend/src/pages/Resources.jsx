import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, SearchX } from 'lucide-react'
import { catalog, resources } from '../api'
import ResourceCard from '../components/ResourceCard'
import { Button, EmptyState, Input, PageHeader, Pagination, QueryState, Select } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { NIVEAUX, TYPES } from '../utils/format'

const ORDERINGS = {
  '-date_creation': 'Plus récentes',
  '-score': 'Mieux notées',
  '-nb_vues': 'Plus vues',
  '-nb_telechargements': 'Plus téléchargées',
}

export default function Resources() {
  const { isAuthenticated } = useAuth()
  const [params, setParams] = useSearchParams()
  const get = (k, d = '') => params.get(k) ?? d
  const page = Number(get('page', 1))

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const filieres = useQuery({ queryKey: ['filieres'], queryFn: catalog.filieres })
  const matieres = useQuery({
    queryKey: ['matieres', get('filiere'), get('niveau')],
    queryFn: () => catalog.matieres({ filiere: get('filiere'), niveau: get('niveau') }),
  })

  const filters = {
    search: get('search'), filiere: get('filiere'), niveau: get('niveau'), matiere: get('matiere'),
    type: get('type'), tag: get('tag'), certifiee: get('certifiee'),
    ordering: get('ordering', '-date_creation'), page,
  }
  const query = useQuery({
    queryKey: ['resources', filters],
    queryFn: () => resources.list(filters),
    placeholderData: (prev) => prev,
  })

  return (
    <div>
      <PageHeader title="Ressources" subtitle="Cours, résumés, sujets d'examen et tutoriels partagés par la communauté."
        actions={isAuthenticated && <Link to="/resources/new"><Button><Plus className="h-4 w-4" /> Publier</Button></Link>} />

      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
        <Input className="lg:col-span-2" label="Recherche" placeholder="Titre, description, tag…"
          defaultValue={get('search')} key={get('search')}
          onKeyDown={(e) => e.key === 'Enter' && setParam('search', e.target.value.trim())}
          onBlur={(e) => e.target.value.trim() !== get('search') && setParam('search', e.target.value.trim())} />
        <Select label="Type" value={get('type')} onChange={(e) => setParam('type', e.target.value)}>
          <option value="">Tous</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select label="Trier par" value={get('ordering', '-date_creation')} onChange={(e) => setParam('ordering', e.target.value)}>
          {Object.entries(ORDERINGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select label="Filière" value={get('filiere')} onChange={(e) => { setParam('matiere', ''); setParam('filiere', e.target.value) }}>
          <option value="">Toutes</option>
          {filieres.data?.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </Select>
        <Select label="Niveau" value={get('niveau')} onChange={(e) => { setParam('matiere', ''); setParam('niveau', e.target.value) }}>
          <option value="">Tous</option>
          {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
        </Select>
        <Select label="Matière" value={get('matiere')} onChange={(e) => setParam('matiere', e.target.value)}>
          <option value="">Toutes</option>
          {matieres.data?.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </Select>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={get('certifiee') === 'true'}
            onChange={(e) => setParam('certifiee', e.target.checked ? 'true' : '')} />
          Vérifiées par un enseignant
        </label>
        {(get('tag')) && (
          <div className="flex items-end pb-1 text-sm">
            Tag : <b className="ml-1">#{get('tag')}</b>
            <button className="ml-2 text-brand-600 underline" onClick={() => setParam('tag', '')}>retirer</button>
          </div>
        )}
      </div>

      <QueryState query={query}>
        {(data) => (
          <>
            <p className="mb-3 text-sm text-slate-500">{data.count} résultat{data.count > 1 ? 's' : ''}</p>
            {data.results.length === 0
              ? <EmptyState icon={SearchX} title="Aucun résultat" description="Essayez d'élargir votre recherche ou de retirer des filtres."
                  action={<Button variant="secondary" onClick={() => setParams({})}>Réinitialiser les filtres</Button>} />
              : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.results.map((r) => <ResourceCard key={r.id} resource={r} />)}</div>}
            <Pagination page={page} count={data.count} onChange={(p) => setParam('page', String(p))} />
          </>
        )}
      </QueryState>
    </div>
  )
}
