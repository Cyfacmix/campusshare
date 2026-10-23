import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auth, catalog } from '../api'
import { Avatar, Badge, Button, Card, Input, PageHeader, Select, Textarea } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { NIVEAUX, ROLES, errorMessage, fullName } from '../utils/format'

function ProfileForm() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const filieres = useQuery({ queryKey: ['filieres'], queryFn: catalog.filieres })
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  useEffect(() => {
    reset({ first_name: user.first_name, last_name: user.last_name, bio: user.bio || '', niveau: user.niveau || '', filiere: user.filiere || '' })
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (fd) => auth.updateMe(fd),
    onSuccess: (data) => { setUser(data); toast.success('Profil mis à jour.') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const onSubmit = (v) => {
    const fd = new FormData()
    fd.append('first_name', v.first_name)
    fd.append('last_name', v.last_name)
    fd.append('bio', v.bio || '')
    fd.append('niveau', v.niveau || '')
    if (v.filiere) fd.append('filiere', v.filiere)
    if (v.avatar?.[0]) fd.append('avatar', v.avatar[0])
    mutation.mutate(fd)
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Informations personnelles</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Prénom" error={errors.first_name?.message} {...register('first_name', { required: 'Obligatoire.' })} />
          <Input label="Nom" error={errors.last_name?.message} {...register('last_name', { required: 'Obligatoire.' })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Filière" {...register('filiere')}>
            <option value="">—</option>
            {filieres.data?.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
          <Select label="Niveau" {...register('niveau')}>
            <option value="">—</option>
            {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
          </Select>
        </div>
        <Textarea label="Bio" rows={3} {...register('bio')} />
        <div>
          <label htmlFor="avatar" className="mb-1 block text-sm font-medium">Photo de profil</label>
          <input id="avatar" type="file" accept="image/*" className="block w-full text-sm" {...register('avatar')} />
        </div>
        <div className="flex justify-end"><Button type="submit" loading={mutation.isPending}>Enregistrer</Button></div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [error, setError] = useState('')
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const mutation = useMutation({
    mutationFn: (v) => auth.changePassword({ old_password: v.old_password, new_password: v.new_password }),
    onSuccess: () => { reset(); setError(''); toast.success('Mot de passe modifié.') },
    onError: (e) => setError(errorMessage(e)),
  })
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Changer le mot de passe</h2>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        <Input label="Mot de passe actuel" type="password" autoComplete="current-password" error={errors.old_password?.message}
          {...register('old_password', { required: 'Obligatoire.' })} />
        <Input label="Nouveau mot de passe" type="password" autoComplete="new-password" error={errors.new_password?.message}
          {...register('new_password', { required: 'Obligatoire.', minLength: { value: 8, message: '8 caractères minimum.' } })} />
        <Input label="Confirmation" type="password" autoComplete="new-password" error={errors.confirm?.message}
          {...register('confirm', { validate: (v) => v === watch('new_password') || 'Les mots de passe diffèrent.' })} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end"><Button type="submit" loading={mutation.isPending}>Modifier</Button></div>
      </form>
    </Card>
  )
}

export default function Me() {
  const { user } = useAuth()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mon profil" />
      <Card className="flex items-center gap-4">
        <Avatar name={fullName(user)} src={user.avatar} size="lg" />
        <div>
          <p className="text-lg font-semibold">{fullName(user)}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex gap-2"><Badge color="brand">{ROLES[user.role]}</Badge><Badge color="amber">{user.points_reputation} points</Badge></div>
          <div className="mt-3 flex gap-4 text-sm">
            <Link to="/me/dashboard" className="text-brand-600 hover:underline">Mon tableau de bord</Link>
            <Link to="/me/favorites" className="text-brand-600 hover:underline">Favoris</Link>
            <Link to={`/users/${user.id}`} className="text-brand-600 hover:underline">Profil public</Link>
          </div>
        </div>
      </Card>
      <ProfileForm />
      <PasswordForm />
    </div>
  )
}
