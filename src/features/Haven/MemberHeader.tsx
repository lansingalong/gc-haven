import { Icon, Typography } from '@/components'
import sukiIcon from '@/assets/suki.png'
import dockToRightIcon from '/assets/dock_to_right.svg'
import styles from './MemberHeader.module.css'

export interface MemberHeaderProps {
  memberName: string
  phone: string
  memberId: string
  pcp: string
  onSukiClick?: () => void
  onHistoryClick?: () => void
}

export function MemberHeader({ memberName, phone, memberId, pcp, onSukiClick, onHistoryClick }: MemberHeaderProps) {
  return (
    <div className={styles.root}>
      {/* Row 1 — member name */}
      <div className={styles.nameRow}>
        <Icon name="Person" size="md" color="action" />
        <Typography variant="h6">{memberName}</Typography>
        <div className={styles.headerActions}>
          <button className={styles.sukiBtn} type="button" aria-label="Launch Suki voice scribe" onClick={onSukiClick}>
            <img src={sukiIcon} width={28} height={28} alt="Suki" />
          </button>
          <button className={styles.historyBtn} type="button" aria-label="View chat history" onClick={onHistoryClick}>
            <img src={dockToRightIcon} width={14} height={14} alt="" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Row 2 — data fields */}
      <div className={styles.fieldsRow}>
        <div className={styles.field}>
          <Typography variant="caption">Preferred Phone Number</Typography>
          <Typography variant="subtitle2">{phone}</Typography>
        </div>
        <div className={styles.field}>
          <Typography variant="caption">Member ID</Typography>
          <Typography variant="subtitle2">{memberId}</Typography>
        </div>
        <div className={styles.field}>
          <Typography variant="caption">Primary Care Provider</Typography>
          <Typography variant="subtitle2">{pcp}</Typography>
        </div>
      </div>
    </div>
  )
}
