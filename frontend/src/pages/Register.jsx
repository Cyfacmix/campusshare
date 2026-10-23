import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { catalog } from '../api'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Input, Select } from '../components/ui'
import { NIVEAUX, errorMessage } from '../utils/format'

export default function Register() {
  const { register: signup } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const filieres = useQuery({ queryKey: ['filieres'], queryFn: catalog.filieres })
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (values) => {
    setError('')
    const payload = {
      email: values.email, password: values.password,
      first_name: values.first_name, last_name: values.last_name,
      niveau: values.niveau || '',
      ...(values.filiere ? { filiere: Number(values.filiere) } : {}),
    }
    try {
      await signup(payload)
      navigate('/', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="mb-6 text-center text-2xl font-bold">Créer un compte</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Prénom" error={errors.first_name?.message} {...register('first_name', { required: 'Obligatoire.' })} />
            <Input label="Nom" error={errors.last_name?.message} {...register('last_name', { required: 'Obligatoire.' })} />
          </div>
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message}
            {...register('email', { required: "L'email est obligatoire.", pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide.' } })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Filière" {...register('filiere')}>
              <option value="">— Choisir —</option>
              {filieres.data?.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
            <Select label="Niveau" {...register('niveau')}>
              <option value="">— Choisir —</option>
              {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
            </Select>
          </div>
          <Input label="Mot de passe" type="password" autoComplete="new-password" error={errors.password?.message}
            {...register('password', { required: 'Obligatoire.', minLength: { value: 8, message: '8 caractères minimum.' } })} />
          <Input label="Confirmer le mot de passe" type="password" autoComplete="new-password" error={errors.confirm?.message}
            {...register('confirm', { validate: (v) => v === watch('password') || 'Les mots de passe diffèrent.' })} />
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <Button type="submit" className="w-full" loading={isSubmitting}>Créer mon compte</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Déjà inscrit ? <Link to="/login" className="text-brand-600 underline">Se connecter</Link>
        </p>
      </Card>
    </div>
  )
}
