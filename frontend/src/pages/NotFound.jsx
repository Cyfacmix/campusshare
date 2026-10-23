import { Link } from 'react-router-dom'
import { EmptyState, Button } from '../components/ui'

export default function NotFound() {
  return (
    <EmptyState title="Page introuvable" description="Cette page n'existe pas ou a été déplacée."
      action={<Link to="/"><Button>Retour à l&apos;accueil</Button></Link>} />
  )
}
