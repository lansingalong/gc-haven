import { useState } from 'react'
import styles from './AddActivityModal.module.css'

export interface ActivityConfig {
  title: string
  activityType: string
  contactType: string
  scheduledDate: string
}

interface AddActivityModalProps {
  config: ActivityConfig
  memberName: string
  onClose: () => void
  onAdd?: () => void
}

export function AddActivityModal({ config, memberName, onClose, onAdd }: AddActivityModalProps) {
  const [assignedFor, setAssignedFor] = useState<'care' | 'external' | 'pharmacist'>('care')
  const [activityType, setActivityType] = useState(config.activityType)
  const [contactType, setContactType] = useState(config.contactType)
  const [scheduledDate, setScheduledDate] = useState(config.scheduledDate)
  const [dueDate, setDueDate] = useState('')
  const [durationHrs, setDurationHrs] = useState('00')
  const [durationMins, setDurationMins] = useState('30')
  const [priority, setPriority] = useState('')
  const [script, setScript] = useState('')
  const [workQueue, setWorkQueue] = useState(false)

  const handleAdd = (andClose: boolean) => {
    onAdd?.()
    if (andClose) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={config.title}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{config.title}</h2>
          <button className={styles.closeBtn} type="button" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className={styles.topAccent} />

        <div className={styles.body}>
          <p className={styles.required}>* Indicates required field</p>

          {/* Add Activity For */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Add Activity For</p>
            <div className={styles.radioGroup}>
              {(['care', 'external', 'pharmacist'] as const).map(v => (
                <label key={v} className={styles.radioLabel}>
                  <input
                    type="radio"
                    className={styles.radioInput}
                    name="assignedFor"
                    checked={assignedFor === v}
                    onChange={() => setAssignedFor(v)}
                  />
                  <span className={`${styles.radioCircle} ${assignedFor === v ? styles.radioCircleActive : ''}`} />
                  {v === 'care' ? 'Care Staff' : v === 'external' ? 'External Care Team' : 'Pharmacist'}
                </label>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}><span className={styles.star}>*</span>Type</label>
              <select className={styles.select}>
                <option>Scheduled</option>
                <option>Unscheduled</option>
              </select>
            </div>
          </div>

          {/* Work Queue */}
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={workQueue} onChange={e => setWorkQueue(e.target.checked)} className={styles.checkboxInput} />
            <span className={`${styles.checkbox} ${workQueue ? styles.checkboxChecked : ''}`} />
            Work Queue Activity
          </label>

          {/* Member Name + Care Staff */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Member Name</label>
              <p className={styles.staticValue}>{memberName}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}><span className={styles.star}>*</span>Care Staff</label>
              <input className={styles.input} type="text" defaultValue="Lansing Cai : All Access Admin" />
            </div>
          </div>

          {/* Activity Type + Script + Priority */}
          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label}><span className={styles.star}>*</span>Activity Type</label>
              <select className={styles.select} value={activityType} onChange={e => setActivityType(e.target.value)}>
                <option>Call member</option>
                <option>Doctor Appointment</option>
                <option>Education Session</option>
                <option>Care Plan Review</option>
                <option>Follow-up</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Script</label>
              <select className={styles.select} value={script} onChange={e => setScript(e.target.value)}>
                <option value="">Select</option>
                <option>Diabetes Check-In</option>
                <option>Medication Review</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.select} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="">Select</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          {/* Contact Type */}
          <div className={styles.row}>
            <div className={styles.field} style={{ maxWidth: 220 }}>
              <label className={styles.label}><span className={styles.star}>*</span>Contact Type</label>
              <select className={styles.select} value={contactType} onChange={e => setContactType(e.target.value)}>
                <option>Member - Phone</option>
                <option>Member - In Person</option>
                <option>Member - Portal</option>
                <option>Provider - Phone</option>
              </select>
            </div>
          </div>

          {/* Scheduled Duration + Date */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}><span className={styles.star}>*</span>Scheduled Duration</label>
              <div className={styles.durationRow}>
                <input className={styles.durationInput} type="text" value={durationHrs} onChange={e => setDurationHrs(e.target.value)} maxLength={2} />
                <span className={styles.durationLabel}>Hrs</span>
                <input className={styles.durationInput} type="text" value={durationMins} onChange={e => setDurationMins(e.target.value)} maxLength={2} />
                <span className={styles.durationLabel}>Mins</span>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}><span className={styles.star}>*</span>Scheduled Date <span className={styles.formatHint}>MM/DD/YYYY HH:MM</span></label>
              <div className={styles.dateRow}>
                <input className={styles.dateInput} type="text" placeholder="MM/DD/YYYY HH:MM" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                <button className={styles.calBtn} type="button" aria-label="Pick date">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className={styles.row}>
            <div className={styles.field} style={{ maxWidth: 220 }}>
              <label className={styles.label}>Due Date <span className={styles.formatHint}>MM/DD/YYYY HH:MM</span></label>
              <div className={styles.dateRow}>
                <input className={styles.dateInput} type="text" placeholder="MM/DD/YYYY HH:MM" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                <button className={styles.calBtn} type="button" aria-label="Pick date">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Enter Member Contact */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Enter Member Contact</label>
              <input className={styles.input} type="text" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.addBtn} type="button" onClick={() => handleAdd(false)}>Add</button>
          <button className={styles.addCloseBtn} type="button" onClick={() => handleAdd(true)}>Add and Close</button>
        </div>
      </div>
    </div>
  )
}
