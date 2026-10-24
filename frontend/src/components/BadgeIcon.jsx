import { Award, BookOpen, GraduationCap, Sprout, Trophy } from 'lucide-react'

const ICONS = {
  sprout: Sprout,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  trophy: Trophy,
}

export default function BadgeIcon({ name, className = 'h-3.5 w-3.5' }) {
  const Icon = ICONS[name] || Award
  return <Icon className={className} aria-hidden="true" />
}