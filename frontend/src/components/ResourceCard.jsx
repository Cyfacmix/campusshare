import { Link } from 'react-router-dom'
import { Download, Eye, ShieldCheck, ThumbsUp } from 'lucide-react'
import { Badge, Card } from './ui'
import { STATUTS, TYPES, fmtDate } from '../utils/format'

const TYPE_COLOR = { cours: 'brand', resume: 'green', examen: 'amber', tutoriel: 'blue' }
const STATUT_COLOR = { en_attente: 'amber', publiee: 'green', rejetee: 'red' }

export default function ResourceCard({ resource: r, showStatus = false }) {
  return (
    <Card className="flex flex-col transition hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge color={TYPE_COLOR[r.type]}>{TYPES[r.type]}</Badge>
        {r.certifiee && <Badge color="green"><ShieldCheck className="h-3 w-3" /> Vérifiée</Badge>}
        {(showStatus || r.statut !== 'publiee') && <Badge color={STATUT_COLOR[r.statut]}>{STATUTS[r.statut]}</Badge>}
      </div>
      <Link to={`/resources/${r.id}`} className="font-semibold leading-snug hover:text-brand-600">{r.titre}</Link>
      <p className="mt-1 text-sm text-slate-500">{r.matiere_nom} · {r.niveau} · {r.filiere_nom}</p>
      {r.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {r.tags.slice(0, 4).map((t) => <span key={t} className="text-xs text-slate-400">#{t}</span>)}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-slate-500">
        <span className="truncate">{r.auteur_nom} · {fmtDate(r.date_creation)}</span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1" title="Score"><ThumbsUp className="h-3.5 w-3.5" />{r.score}</span>
          <span className="flex items-center gap-1" title="Vues"><Eye className="h-3.5 w-3.5" />{r.nb_vues}</span>
          <span className="flex items-center gap-1" title="Téléchargements"><Download className="h-3.5 w-3.5" />{r.nb_telechargements}</span>
        </span>
      </div>
    </Card>
  )
}
