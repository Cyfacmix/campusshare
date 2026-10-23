import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { AlertTriangle, Clock, FileText, HelpCircle, Pencil, Trash2, Users } from 'lucide-react'
import { adminUsers, catalog, dashboard } from '../api'
import { Badge, Button, Card, ConfirmDialog, Input, Modal, PageHeader, Pagination, QueryState, Select, StatCard } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { NIVEAUX, ROLES, TYPES, errorMessage } from '../utils/format'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444']

function Stats() {
  const query = useQuery({ queryKey: ['dashboard-admin'], queryFn: dashboard.admin })
  return (
    <QueryState query={query}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Utilisateurs" value={d.totaux.utilisateurs} icon={Users} />
            <StatCard label="Ressources publiées" value={d.totaux.ressources_publiees} icon={FileText} />
            <StatCard label="En attente" value={d.totaux.ressources_en_attente} icon={Clock} />
            <StatCard label="Questions" value={d.totaux.questions} icon={HelpCircle} />
            <StatCard label="Signalements ouverts" value={d.totaux.signalements_ouverts} icon={AlertTriangle} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-semibold">Ressources par mois</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.ressources_par_mois}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="mois" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
                    <Bar dataKey="total" name="Ressources" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">Matières les plus consultées</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.top_matieres} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="matiere__nom" width={130} fontSize={11} /><Tooltip />
                    <Bar dataKey="vues" name="Vues" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">Répartition par type</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.par_type.map((t) => ({ ...t, name: TYPES[t.type] }))} dataKey="total" nameKey="name" outerRadius={90} label>
                      {d.par_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">Contributeurs les plus actifs</h2>
              <ol className="space-y-2 text-sm">
                {d.top_contributeurs.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <span><b className="mr-2 text-slate-400">{i + 1}</b>{c.nom}</span>
                    <Badge color="brand">{c.total} ressource{c.total > 1 ? 's' : ''}</Badge>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      )}
    </QueryState>
  )
}

function Filieres() {
  const qc = useQueryClient()
  const toast = useToast()
  const query = useQuery({ queryKey: ['filieres'], queryFn: catalog.filieres })
  const [nom, setNom] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const done = (msg) => { qc.invalidateQueries({ queryKey: ['filieres'] }); qc.invalidateQueries({ queryKey: ['matieres-all'] }); toast.success(msg) }
  const create = useMutation({ mutationFn: () => catalog.createFiliere({ nom }), onSuccess: () => { setNom(''); done('Filière créée.') }, onError: (e) => toast.error(errorMessage(e)) })
  const update = useMutation({ mutationFn: () => catalog.updateFiliere(editing.id, { nom: editing.nom }), onSuccess: () => { setEditing(null); done('Filière modifiée.') }, onError: (e) => toast.error(errorMessage(e)) })
  const remove = useMutation({ mutationFn: () => catalog.deleteFiliere(deleting.id), onSuccess: () => { setDeleting(null); done('Filière supprimée.') }, onError: (e) => { setDeleting(null); toast.error(errorMessage(e)) } })
  return (
    <div className="space-y-4">
      <Card className="flex items-end gap-3">
        <Input className="flex-1" label="Nouvelle filière" value={nom} onChange={(e) => setNom(e.target.value)} />
        <Button disabled={!nom.trim()} loading={create.isPending} onClick={() => create.mutate()}>Ajouter</Button>
      </Card>
      <QueryState query={query}>
        {(data) => (
          <Card className="!p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((f) => (
                <li key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>{f.nom}</span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => setEditing({ ...f })}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label="Supprimer" onClick={() => setDeleting(f)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </QueryState>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Modifier la filière"
        footer={(<><Button variant="secondary" onClick={() => setEditing(null)}>Annuler</Button><Button loading={update.isPending} onClick={() => update.mutate()}>Enregistrer</Button></>)}>
        <Input label="Nom" value={editing?.nom || ''} onChange={(e) => setEditing((x) => ({ ...x, nom: e.target.value }))} />
      </Modal>
      
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={remove.isPending}
        title="Supprimer la filière" message={`Supprimer « ${deleting?.nom} » ? Impossible si des matières y sont rattachées.`}
        confirmLabel="Supprimer" onConfirm={() => remove.mutate()} />
    </div>
  )
}

function Matieres() {
  const qc = useQueryClient()
  const toast = useToast()
  const filieres = useQuery({ queryKey: ['filieres'], queryFn: catalog.filieres })
  const query = useQuery({ queryKey: ['matieres-all'], queryFn: () => catalog.matieres() })
  const empty = { code: '', nom: '', niveau: 'L1', semestre: 1, filiere: '' }
  const [form, setForm] = useState(empty)
  const [deleting, setDeleting] = useState(null)
  const [editing, setEditing] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const done = (msg) => { qc.invalidateQueries({ queryKey: ['matieres-all'] }); qc.invalidateQueries({ queryKey: ['matieres'] }); toast.success(msg) }
  const create = useMutation({
    mutationFn: () => catalog.createMatiere({ ...form, semestre: Number(form.semestre), filiere: Number(form.filiere) }),
    onSuccess: () => { setForm(empty); done('Matière créée.') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const update = useMutation({
    mutationFn: () => catalog.updateMatiere(editing.id, {
      code: editing.code, 
      nom: editing.nom,
      niveau: editing.niveau,
      semestre: Number(editing.semestre),
      filiere: Number(editing.filiere), 
    }),
    onSuccess: () => { setEditing(null); done('Matière modifiée.') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: () => catalog.deleteMatiere(deleting.id),
    onSuccess: () => { setDeleting(null); done('Matière supprimée.') },
    onError: (e) => { setDeleting(null); toast.error(errorMessage(e)) },
  })
  const valid = form.code.trim() && form.nom.trim() && form.filiere
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 sm:grid-cols-6">
          <Input label="Code" value={form.code} onChange={set('code')} />
          <Input className="sm:col-span-2" label="Nom" value={form.nom} onChange={set('nom')} />
          <Select label="Niveau" value={form.niveau} onChange={set('niveau')}>{NIVEAUX.map((n) => <option key={n}>{n}</option>)}</Select>
          <Select label="Semestre" value={form.semestre} onChange={set('semestre')}>{[1, 2].map((n) => <option key={n}>{n}</option>)}</Select>
          <Select label="Filière" value={form.filiere} onChange={set('filiere')}>
            <option value="">-- Choisir --</option>{filieres.data?.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex justify-end"><Button disabled={!valid} loading={create.isPending} onClick={() => create.mutate()}>Ajouter la matière</Button></div>
      </Card>
      <QueryState query={query}>
        {(data) => (
          <Card className="overflow-x-auto !p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr>
                <th className="px-4 py-2">Code</th><th className="px-4 py-2">Nom</th><th className="px-4 py-2">Niveau</th><th className="px-4 py-2">Filière</th><th />
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2">{m.code}</td><td className="px-4 py-2">{m.nom}</td>
                    <td className="px-4 py-2">{m.niveau} · S{m.semestre}</td><td className="px-4 py-2">{m.filiere_nom}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => setEditing({ ...m })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" aria-label="Supprimer" onClick={() => setDeleting(m)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </QueryState>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Modifier la matière"
        footer={(<><Button variant="secondary" onClick={() => setEditing(null)}>Annuler</Button><Button loading={update.isPending} onClick={() => update.mutate()}>Enregistrer</Button></>)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Code" value={editing?.code || ''} disabled className="opacity-60" />
          <Input label="Nom" value={editing?.nom || ''} onChange={(e) => setEditing((x) => ({ ...x, nom: e.target.value }))} />
          <Select label="Niveau" value={editing?.niveau || 'L1'} onChange={(e) => setEditing((x) => ({ ...x, niveau: e.target.value }))}>
            {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
          </Select>
          <Select label="Semestre" value={editing?.semestre || 1} onChange={(e) => setEditing((x) => ({ ...x, semestre: e.target.value }))}>
            {[1, 2].map((n) => <option key={n}>{n}</option>)}
          </Select>
          <Select label="Filière" value={editing?.filiere || ''} onChange={(e) => setEditing((x) => ({ ...x, filiere: e.target.value }))}>
            {filieres.data?.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={remove.isPending}
        title="Supprimer la matière" message={`Supprimer « ${deleting?.nom} » ? Impossible si des ressources ou questions y sont rattachées.`}
        confirmLabel="Supprimer" onConfirm={() => remove.mutate()} />
    </div>
  )
}

function UsersAdmin() {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const query = useQuery({ queryKey: ['admin-users', page, search, role], queryFn: () => adminUsers.list({ page, search, role }), placeholderData: (p) => p })
  const update = useMutation({
    mutationFn: ({ id, data }) => adminUsers.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur mis à jour.') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const rename = useMutation({
    mutationFn: () => adminUsers.update(editing.id, { first_name: editing.first_name, last_name: editing.last_name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditing(null); toast.success('Utilisateur modifié.') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: () => adminUsers.remove(deleting.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setDeleting(null); toast.success('Utilisateur supprimé.') },
    onError: (e) => { setDeleting(null); toast.error(errorMessage(e)) },
  })
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input className="sm:col-span-2" label="Recherche (nom, email)" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <Select label="Rôle" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
          <option value="">Tous</option>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <QueryState query={query}>
        {(data) => (
          <>
            <Card className="overflow-x-auto !p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr>
                  <th className="px-4 py-2">Utilisateur</th><th className="px-4 py-2">Rôle</th><th className="px-4 py-2">Points</th><th className="px-4 py-2">Actif</th><th className="px-4 py-2"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.results.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2"><p className="font-medium">{u.first_name} {u.last_name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                      <td className="px-4 py-2">
                        <select aria-label={`Rôle de ${u.email}`} value={u.role} disabled={u.id === me.id}
                          onChange={(e) => update.mutate({ id: u.id, data: { role: e.target.value } })}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900">
                          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">{u.points_reputation}</td>
                      <td className="px-4 py-2">
                        <input type="checkbox" aria-label={`Actif : ${u.email}`} checked={u.is_active} disabled={u.id === me.id}
                          onChange={(e) => update.mutate({ id: u.id, data: { is_active: e.target.checked } })} />
                      </td>
                        <td className="px-4 py-2 text-right">
                        <span className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" aria-label={`Modifier ${u.email}`} onClick={() => setEditing({ ...u })}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" aria-label={`Supprimer ${u.email}`} disabled={u.id === me.id} onClick={() => setDeleting(u)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Pagination page={page} count={data.count} onChange={setPage} />
          </>
        )}
      </QueryState>
        <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Modifier l'utilisateur"
        footer={(<><Button variant="secondary" onClick={() => setEditing(null)}>Annuler</Button><Button loading={rename.isPending} onClick={() => rename.mutate()}>Enregistrer</Button></>)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Prénom" value={editing?.first_name || ''} onChange={(e) => setEditing((x) => ({ ...x, first_name: e.target.value }))} />
          <Input label="Nom" value={editing?.last_name || ''} onChange={(e) => setEditing((x) => ({ ...x, last_name: e.target.value }))} />
          <Input className="sm:col-span-2" label="Email" value={editing?.email || ''} disabled />
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={remove.isPending}
        title="Supprimer l'utilisateur" message={`Supprimer définitivement le compte de ${deleting?.first_name} ${deleting?.last_name} (${deleting?.email}) ? Cette action est irréversible.`}
        confirmLabel="Supprimer" onConfirm={() => remove.mutate()} />
    </div>
  )
}

const TABS = [['stats', 'Statistiques'], ['filieres', 'Filières'], ['matieres', 'Matières'], ['users', 'Utilisateurs']]

export default function Admin() {
  const [tab, setTab] = useState('stats')
  return (
    <div>
      <PageHeader title="Administration" subtitle="Statistiques de la plateforme et gestion du référentiel." />
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'stats' && <Stats />}
      {tab === 'filieres' && <Filieres />}
      {tab === 'matieres' && <Matieres />}
      {tab === 'users' && <UsersAdmin />}
    </div>
  )
}
