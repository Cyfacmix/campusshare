import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { moderation } from '../api'
import { useToast } from '../context/Toast'
import { Button, Modal, Select, Textarea } from './ui'
import { errorMessage } from '../utils/format'

const MOTIFS = ['Contenu inapproprié', 'Spam ou publicité', 'Plagiat / droits d\'auteur', 'Contenu erroné ou trompeur', 'Autre']

export default function ReportModal({ open, onClose, target }) {
  const toast = useToast()
  const [motif, setMotif] = useState(MOTIFS[0])
  const [description, setDescription] = useState('')
  const mutation = useMutation({
    mutationFn: () => moderation.report({ ...target, motif, description }),
    onSuccess: () => { toast.success('Merci, votre signalement a été transmis.'); setDescription(''); onClose() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open={open} onClose={onClose} title="Signaler ce contenu"
      footer={(<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button variant="danger" loading={mutation.isPending} onClick={() => mutation.mutate()}>Envoyer</Button></>)}>
      <div className="space-y-4">
        <Select label="Motif" value={motif} onChange={(e) => setMotif(e.target.value)}>
          {MOTIFS.map((m) => <option key={m}>{m}</option>)}
        </Select>
        <Textarea label="Précisions (facultatif)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Modal>
  )
}
