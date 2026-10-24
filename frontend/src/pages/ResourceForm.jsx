import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalog, resources } from '../api'
import { Button, Card, Input, PageHeader, QueryState, Select, Textarea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { TYPES, errorMessage } from '../utils/format'

function FormBody({ existing }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()
  const [serverError, setServerError] = useState('')

  const filieres = useQuery({ queryKey: ['filieres'], queryFn: catalog.filieres })
  const matieres = useQuery({ queryKey: ['matieres-all'], queryFn: () => catalog.matieres() })

  const defaults = useMemo(() => {
    const matiere = matieres.data?.find((m) => m.id === existing?.matiere)
    return {
      titre: existing?.titre || '',
      description: existing?.description || '',
      type: existing?.type || 'cours',
      filiere: matiere?.filieres?.[0] || user?.filiere || '',
      matiere: existing?.matiere || '',
      lien_externe: existing?.lien_externe || '',
      tags: existing?.tags?.join(', ') || '',
    }
  }, [existing, matieres.data, user])

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues: defaults })
  useEffect(() => { reset(defaults) }, [defaults, reset])

  const filiereId = Number(watch('filiere')) || null
  const options = (matieres.data || []).filter((m) => !filiereId || m.filieres.includes(filiereId))

  const mutation = useMutation({
    mutationFn: (fd) => (existing ? resources.update(existing.id, fd) : resources.create(fd)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['resource', data.id] })
      toast.success(existing
        ? 'Ressource mise à jour.'
        : data.statut === 'publiee' ? 'Ressource publiée !' : 'Ressource envoyée : elle sera visible après validation.')
      navigate(`/resources/${data.id}`)
    },
    onError: (e) => setServerError(errorMessage(e)),
  })

  const onSubmit = (values) => {
    setServerError('')
    const file = values.fichier?.[0]
    if (!file && !values.lien_externe.trim() && !existing?.fichier) {
      setServerError('Ajoutez un fichier ou un lien externe.')
      return
    }
    const fd = new FormData()
    fd.append('titre', values.titre.trim())
    fd.append('description', values.description || '')
    fd.append('type', values.type)
    fd.append('matiere', values.matiere)
    fd.append('lien_externe', values.lien_externe.trim())
    values.tags.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => fd.append('tags', t))
    if (file) fd.append('fichier', file)
    mutation.mutate(fd)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Titre" error={errors.titre?.message} {...register('titre', { required: 'Le titre est obligatoire.', maxLength: { value: 200, message: '200 caractères maximum.' } })} />
        <Textarea label="Description" rows={4} {...register('description')} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Type" {...register('type')}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Filière" {...register('filiere')}>
            <option value="">Toutes</option>
            {filieres.data?.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
          <Select label="Matière" error={errors.matiere?.message} {...register('matiere', { required: 'Choisissez une matière.' })}>
            <option value="">-- Choisir --</option>
            {options.map((m) => <option key={m.id} value={m.id}>{m.nom} ({m.niveau})</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor="fichier" className="mb-1 block text-sm font-medium">Fichier (pdf, docx, pptx, png, jpg, zip — 20 Mo max)</label>
          <input id="fichier" type="file" accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.zip"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-brand-700"
            {...register('fichier')} />
          {existing?.fichier && <p className="mt-1 text-xs text-slate-500">Un fichier est déjà associé. Choisissez-en un nouveau pour le remplacer.</p>}
        </div>
        <Input label="… ou lien externe" type="url" placeholder="https://…" {...register('lien_externe')} />
        <Input label="Tags (séparés par des virgules)" placeholder="partiel, td, synthese" {...register('tags')} />
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{serverError}</p>}
        {!existing && user?.role === 'etudiant' && (
          <p className="text-xs text-slate-500">Votre ressource sera publiée après validation par la modération.</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
          <Button type="submit" loading={mutation.isPending}>{existing ? 'Enregistrer' : 'Publier'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default function ResourceForm() {
  const { id } = useParams()
  const query = useQuery({ queryKey: ['resource', Number(id)], queryFn: () => resources.get(id), enabled: Boolean(id) })
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={id ? 'Modifier la ressource' : 'Publier une ressource'} />
      {id
        ? <QueryState query={query}>{(r) => <FormBody existing={r} />}</QueryState>
        : <FormBody />}
    </div>
  )
}
