import { Icon } from '@/components/Icons'
import type { ActivityConfig } from './AddActivityModal'
import styles from './OutstandingActivitiesPanel.module.css'

export interface AddedActivity {
  config: ActivityConfig
  memberName: string
  addedAt: string
}

interface Props {
  activities: AddedActivity[]
  onBack: () => void
}

const TYPE_ICON: Record<string, string> = {
  'Call member': 'Phone',
  'Doctor Appointment': 'LocalHospital',
  'Education Session': 'School',
  'Care Plan Review': 'Assignment',
  'Follow-up': 'Replay',
}

export function OutstandingActivitiesPanel({ activities, onBack }: Props) {
  return (
    <div className={styles.root}>
      <button className={styles.backBtn} type="button" onClick={onBack}>
        <Icon name="ArrowBack" size="xs" color="action" />
        Back
      </button>

      <div className={styles.header}>
        <Icon name="Assignment" size="sm" color="primary" />
        <span className={styles.title}>Outstanding Activities</span>
        {activities.length > 0 && (
          <span className={styles.count}>{activities.length}</span>
        )}
      </div>

      <div className={styles.list}>
        {activities.length === 0 ? (
          <p className={styles.empty}>No outstanding activities.</p>
        ) : (
          activities.map((a, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>
                <Icon name={TYPE_ICON[a.config.activityType] ?? 'Event'} size="md" color="primary" />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{a.config.activityType}</div>
                <div className={styles.cardMeta}>
                  <span>{a.memberName}</span>
                  <span className={styles.dot}>·</span>
                  <span>{a.config.contactType}</span>
                  <span className={styles.dot}>·</span>
                  <span>Added {a.addedAt}</span>
                </div>
              </div>
              <span className={styles.statusBadge}>Scheduled</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
