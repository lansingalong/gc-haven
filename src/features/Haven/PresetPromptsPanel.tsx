import styles from './PresetPromptsPanel.module.css'
import { Icon } from '@/components/Icons'

interface PresetPromptsPanelProps {
  onClose: () => void
  onSelectPrompt: (text: string) => void
}

const CATEGORIES = [
  {
    label: 'Member Overview',
    prompts: [
      'Summarize what I should know before calling this member today',
      'What is this member\'s current risk level and what\'s driving it?',
      'What are this member\'s active diagnoses?',
    ],
  },
  {
    label: 'Care Gaps',
    prompts: [
      'What are the open care gaps for this member?',
      'Which HEDIS measures are overdue?',
    ],
  },
  {
    label: 'Medications',
    prompts: [
      'What medications is this member currently on?',
      'How has this member\'s medication adherence been?',
    ],
  },
  {
    label: 'Care Plan',
    prompts: [
      'What does the care plan look like right now?',
      'Which care plan goals are currently in progress?',
      'What interventions are active right now?',
    ],
  },
  {
    label: 'Visits & Claims',
    prompts: [
      'Has this member had any ER visits recently?',
      'Has this member had any recent hospitalizations?',
      'What are this member\'s latest claims?',
    ],
  },
  {
    label: 'Services & Programs',
    prompts: [
      'What services is this member eligible for?',
      'Is this member enrolled in any disease management programs?',
    ],
  },
  {
    label: 'Assessments',
    prompts: [
      'What assessments have been completed for this member?',
      'What did the most recent health risk assessment show?',
    ],
  },
]

export function PresetPromptsPanel({ onClose, onSelectPrompt }: PresetPromptsPanelProps) {
  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close preset prompts">
          <Icon name="Close" size="md" color="action" />
        </button>

        <div className={styles.header}>
          <Icon name="EditNote" size="md" color="primary" />
          <span className={styles.title}>Preset Prompts</span>
        </div>

        <div className={styles.list}>
          {CATEGORIES.map(cat => (
            <div key={cat.label} className={styles.category}>
              <p className={styles.categoryLabel}>{cat.label}</p>
              {cat.prompts.map(prompt => (
                <button
                  key={prompt}
                  className={styles.promptBtn}
                  type="button"
                  onClick={() => { onSelectPrompt(prompt); onClose() }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
    </div>
  )
}
