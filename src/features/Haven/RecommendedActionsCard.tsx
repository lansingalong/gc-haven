import { Fragment, useState } from 'react'
import { Icon } from '@/components/Icons'
import { AddActivityModal, type ActivityConfig } from './AddActivityModal'
import styles from './RecommendedActionsCard.module.css'

type Destination = 'activities' | 'care-plan'

const ACTIONS: {
  label: string
  processingLabel: string
  destination: Destination
  destinationLabel: string
  activity: ActivityConfig
}[] = [
  {
    label: 'Schedule a follow-up call with the member',
    processingLabel: 'Scheduling follow-up call...',
    destination: 'activities',
    destinationLabel: 'Outstanding Activities',
    activity: {
      title: 'Add Activity',
      activityType: 'Call member',
      contactType: 'Member - Phone',
      scheduledDate: '',
    },
  },
  {
    label: 'Add doctor appointment for member',
    processingLabel: 'Adding doctor appointment...',
    destination: 'activities',
    destinationLabel: 'Outstanding Activities',
    activity: {
      title: 'Add Activity',
      activityType: 'Doctor Appointment',
      contactType: 'Member - In Person',
      scheduledDate: '',
    },
  },
  {
    label: 'Add Improve Knowledge and Skills in Managing Diabetes an opportunity',
    processingLabel: 'Creating education opportunity...',
    destination: 'care-plan',
    destinationLabel: 'Care Plan Overview',
    activity: {
      title: 'Add Activity',
      activityType: 'Education Session',
      contactType: 'Member - Phone',
      scheduledDate: '',
    },
  },
]

type AutoStatus = 'idle' | 'processing' | 'done'

interface RecommendedActionsCardProps {
  memberName?: string
  onDismiss?: () => void
  onActivityAdded?: (config: ActivityConfig, destination: Destination) => void
  onNavigate?: (destination: Destination) => void
}

export function RecommendedActionsCard({
  memberName = 'Jackson Thomas',
  onDismiss,
  onActivityAdded,
  onNavigate,
}: RecommendedActionsCardProps) {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  // Manual mode
  const [added, setAdded] = useState<Set<number>>(new Set())
  const [done, setDone] = useState<Set<number>>(new Set())
  const [view, setView] = useState<'actions' | 'tasklist'>('actions')
  const [openModal, setOpenModal] = useState<number | null>(null)

  // AI mode
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set())
  const [autoStatus, setAutoStatus] = useState<Record<number, AutoStatus>>({})
  const [isAutomating, setIsAutomating] = useState(false)
  const [automationDone, setAutomationDone] = useState(false)

  /* ── Manual handlers ── */
  const toggle = (i: number) => {
    setAdded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }
  const addAll = () => setAdded(new Set(ACTIONS.map((_, i) => i)))
  const allAdded = added.size === ACTIONS.length
  const someAdded = added.size > 0
  const addedItems = ACTIONS.map((a, i) => ({ ...a, i })).filter(({ i }) => added.has(i))

  /* ── AI handlers ── */
  const toggleAi = (i: number) => {
    if (isAutomating || autoStatus[i] === 'done') return
    setAiSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }
  const allAiSelected = aiSelected.size === ACTIONS.length
  const someAiSelected = aiSelected.size > 0

  const runAutomation = async () => {
    setIsAutomating(true)
    const selected = Array.from(aiSelected)
    for (const i of selected) {
      setAutoStatus(prev => ({ ...prev, [i]: 'processing' }))
      await new Promise<void>(resolve => setTimeout(resolve, 1800))
      setAutoStatus(prev => ({ ...prev, [i]: 'done' }))
      onActivityAdded?.(ACTIONS[i].activity, ACTIONS[i].destination)
    }
    setIsAutomating(false)
    setAutomationDone(true)
  }

  /* ── Task list view (manual) ── */
  if (view === 'tasklist') {
    return (
      <>
        <div className={styles.root}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.backBtn} type="button" onClick={() => setView('actions')}>
                <Icon name="ArrowBack" size="xs" color="action" />
              </button>
              <Icon name="TaskAlt" size="sm" color="primary" />
              <span className={styles.title}>Task List</span>
            </div>
            <div className={styles.headerRight}>
              <button className={styles.dismissBtn} type="button" aria-label="Dismiss" onClick={onDismiss}>
                <Icon name="Close" size="xs" color="action" />
              </button>
            </div>
          </div>

          <div className={styles.cards}>
            {addedItems.map(({ label, i }) => {
              const isDone = done.has(i)
              return (
                <div key={i} className={`${styles.taskCard} ${isDone ? styles.taskCardDone : ''}`}>
                  <div className={styles.taskCardLeft}>
                    <Icon
                      name={isDone ? 'CheckCircle' : 'RadioButtonUnchecked'}
                      size="md"
                      color={isDone ? 'success' : 'action'}
                    />
                    <div className={styles.taskCardContent}>
                      <button
                        className={`${styles.taskLinkBtn} ${isDone ? styles.taskLinkBtnDone : ''}`}
                        type="button"
                        onClick={() => !isDone && setOpenModal(i)}
                        disabled={isDone}
                      >
                        {label}
                      </button>
                      {isDone && (
                        <button
                          className={styles.viewInLink}
                          type="button"
                          onClick={() => onNavigate?.(ACTIONS[i].destination)}
                        >
                          View in {ACTIONS[i].destinationLabel} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {openModal !== null && (
          <AddActivityModal
            config={ACTIONS[openModal].activity}
            memberName={memberName}
            onClose={() => setOpenModal(null)}
            onAdd={() => {
              const idx = openModal
              setDone(prev => new Set(prev).add(idx))
              onActivityAdded?.(ACTIONS[idx].activity, ACTIONS[idx].destination)
              setOpenModal(null)
            }}
          />
        )}
      </>
    )
  }

  /* ── Actions view ── */
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icon name="AutoAwesome" size="sm" color="primary" />
          <span className={styles.title}>Review Recommended Actions</span>
        </div>
        <div className={styles.headerRight}>
          {mode === 'manual' && !allAdded && (
            <button className={styles.addAllBtn} type="button" onClick={addAll}>
              Add all to list
            </button>
          )}
          {mode === 'manual' && allAdded && (
            <span className={styles.allDone}>
              <Icon name="PlaylistAddCheck" size="xs" color="primary" />
              All added to list
            </span>
          )}
          {mode === 'ai' && !isAutomating && !automationDone && (
            <button
              className={styles.addAllBtn}
              type="button"
              onClick={allAiSelected
                ? () => setAiSelected(new Set())
                : () => setAiSelected(new Set(ACTIONS.map((_, i) => i)))
              }
            >
              {allAiSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
          <button className={styles.dismissBtn} type="button" aria-label="Dismiss" onClick={onDismiss}>
            <Icon name="Close" size="xs" color="action" />
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
          type="button"
          onClick={() => setMode('manual')}
        >
          Version 1
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'ai' ? styles.modeBtnActive : ''}`}
          type="button"
          onClick={() => setMode('ai')}
        >
          <Icon name="AutoAwesome" size="xs" color="inherit" />
          Version 2
        </button>
      </div>

      {/* Manual cards */}
      {mode === 'manual' && (
        <>
          <div className={styles.cards}>
            {ACTIONS.map(({ label }, i) => {
              const isAdded = added.has(i)
              return (
                <button
                  key={i}
                  className={`${styles.actionCard} ${isAdded ? styles.actionCardAdded : ''}`}
                  type="button"
                  onClick={() => toggle(i)}
                >
                  <span className={styles.addIcon}>
                    {isAdded
                      ? <Icon name="PlaylistAddCheck" size="md" color="primary" />
                      : <Icon name="AddCircleOutline" size="md" color="primary" />
                    }
                  </span>
                  <span className={styles.actionText}>{label}</span>
                  {isAdded && <span className={styles.addedTag}>Added to list</span>}
                </button>
              )
            })}
          </div>

          {someAdded && (
            <button className={styles.finishBtn} type="button" onClick={() => setView('tasklist')}>
              <Icon name="TaskAlt" size="sm" color="inherit" />
              View Task List
            </button>
          )}
        </>
      )}

      {/* AI cards */}
      {mode === 'ai' && (
        <>
          {automationDone && (
            <div className={styles.automationSuccess}>
              <Icon name="CheckCircle" size="sm" color="success" />
              <span>All actions completed by AI</span>
            </div>
          )}

          <div className={styles.cards}>
            {ACTIONS.map(({ label, processingLabel, destination, destinationLabel }, i) => {
              const status = autoStatus[i] ?? 'idle'
              const isSelected = aiSelected.has(i)
              const isProcessing = status === 'processing'
              const isDone = status === 'done'
              return (
                <Fragment key={i}>
                  <button
                    className={`${styles.actionCard} ${isSelected ? styles.actionCardSelected : ''} ${isDone ? styles.actionCardAiDone : ''}`}
                    type="button"
                    onClick={() => toggleAi(i)}
                    disabled={isAutomating || isDone}
                  >
                    <span className={styles.addIcon}>
                      {isDone
                        ? <Icon name="CheckCircle" size="md" color="success" />
                        : isProcessing
                          ? <span className={styles.spinner} aria-label="Processing" />
                          : isSelected
                            ? <Icon name="CheckBox" size="md" color="primary" />
                            : <Icon name="CheckBoxOutlineBlank" size="md" color="action" />
                      }
                    </span>
                    <span className={styles.actionText}>
                      {isProcessing ? processingLabel : label}
                    </span>
                    {isDone && <span className={styles.doneTag}>Completed</span>}
                  </button>
                  {isDone && (
                    <button
                      className={styles.viewInLinkBelow}
                      type="button"
                      onClick={() => onNavigate?.(destination)}
                    >
                      View in {destinationLabel} →
                    </button>
                  )}
                </Fragment>
              )
            })}
          </div>

          {someAiSelected && !isAutomating && !automationDone && (
            <button className={styles.automateBtn} type="button" onClick={runAutomation}>
              <Icon name="AutoAwesome" size="sm" color="inherit" />
              Automate {aiSelected.size === ACTIONS.length ? 'All' : `${aiSelected.size} Selected`}
            </button>
          )}

          {isAutomating && (
            <div className={styles.automatingBar}>
              <span className={styles.spinnerSm} />
              AI is processing your actions...
            </div>
          )}
        </>
      )}
    </div>
  )
}
