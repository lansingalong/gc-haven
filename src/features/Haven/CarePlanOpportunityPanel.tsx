import { Icon } from '@/components/Icons'
import type { ActivityConfig } from './AddActivityModal'
import styles from './CarePlanOpportunityPanel.module.css'

export interface AddedOpportunity {
  config: ActivityConfig
  memberName: string
  addedAt: string
}

interface Props {
  opportunities: AddedOpportunity[]
  onBack: () => void
}

export function CarePlanOpportunityPanel({ opportunities, onBack }: Props) {
  return (
    <div className={styles.root}>
      <button className={styles.backBtn} type="button" onClick={onBack}>
        <Icon name="ArrowBack" size="xs" color="action" />
        Back
      </button>

      <div className={styles.header}>
        <Icon name="FolderOpen" size="sm" color="primary" />
        <span className={styles.title}>Care Plan Overview</span>
      </div>

      <div className={styles.goal}>
        <div className={styles.goalHeader}>
          <div className={styles.goalLeft}>
            <Icon name="MonitorHeart" size="sm" color="primary" />
            <span className={styles.goalTitle}>Diabetes Management</span>
          </div>
          <span className={styles.priorityBadge}>High Priority</span>
        </div>

        <p className={styles.goalDesc}>
          Reduce HbA1c to below 7.0% through lifestyle modifications and medication adherence
        </p>

        <div className={styles.goalStatus}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>In Progress</span>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Icon name="Lightbulb" size="xs" color="primary" />
            Opportunities
          </div>

          {opportunities.length === 0 ? (
            <p className={styles.empty}>No opportunities added yet.</p>
          ) : (
            opportunities.map((opp, i) => (
              <div key={i} className={styles.oppCard}>
                <div className={styles.oppLeft}>
                  <Icon name="School" size="sm" color="primary" />
                  <div className={styles.oppBody}>
                    <div className={styles.oppTitle}>
                      Improve Knowledge and Skills in Managing Diabetes
                    </div>
                    <div className={styles.oppMeta}>
                      <span>{opp.config.activityType}</span>
                      <span className={styles.dot}>·</span>
                      <span>{opp.config.contactType}</span>
                      <span className={styles.dot}>·</span>
                      <span>Added {opp.addedAt}</span>
                    </div>
                  </div>
                </div>
                <span className={styles.newBadge}>New</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
