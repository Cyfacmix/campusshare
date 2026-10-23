import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Input } from '../components/ui'
import { errorMessage } from '../utils/format'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ email, password }) => {
    setError('')
    try {
      await login(email, password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (e) {
      setError(e?.response?.status === 401 ? 'Email ou mot de passe incorrect.' : errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <div className="mb-6 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-2 text-2xl font-bold">Connexion</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message}
            {...register('email', { required: "L'email est obligatoire." })} />
          <Input label="Mot de passe" type="password" autoComplete="current-password" error={errors.password?.message}
            {...register('password', { required: 'Le mot de passe est obligatoire.' })} />
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <Button type="submit" className="w-full" loading={isSubmitting}>Se connecter</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Pas encore de compte ? <Link to="/register" className="text-brand-600 underline">Créer un compte</Link>
        </p>
      </Card>
    </div>
  )
}
