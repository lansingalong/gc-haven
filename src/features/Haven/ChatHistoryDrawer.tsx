import { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/Icons'
import type { ChatSession } from './useChatHistory'
import type { Message } from './ChatMessages'
import styles from './ChatHistoryDrawer.module.css'

interface ChatHistoryDrawerProps {
  sessions: ChatSession[]
  onClose: () => void
  onSelectSession: (messages: Message[]) => void
  onNewConversation: () => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

function SessionItem({ session, onSelect, onDelete, onToggleFavorite }: {
  session: ChatSession
  onSelect: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className={styles.sessionRow}>
      <button
        className={styles.sessionItem}
        onClick={onSelect}
        type="button"
      >
        {session.favorited && <Icon name="Star" size="xs" color="primary" />}
        <span className={styles.sessionText}>{session.summary ?? session.preview}</span>
      </button>

      <div className={styles.menuWrap} ref={menuRef}>
        <button
          className={styles.menuBtn}
          type="button"
          aria-label="More options"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
        >
          <Icon name="MoreVert" size="sm" color="inherit" />
        </button>

        {menuOpen && (
          <div className={styles.dropdown}>
            <button
              className={styles.dropdownItem}
              type="button"
              onClick={() => { onToggleFavorite(); setMenuOpen(false) }}
            >
              <Icon name={session.favorited ? 'StarBorder' : 'Star'} size="sm" color="action" />
              {session.favorited ? 'Unfavorite' : 'Favorite'}
            </button>
            <button
              className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`}
              type="button"
              onClick={() => { onDelete(); setMenuOpen(false) }}
            >
              <Icon name="DeleteOutlined" size="sm" color="error" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatHistoryDrawer({ sessions, onClose, onSelectSession, onNewConversation, onDelete, onToggleFavorite }: ChatHistoryDrawerProps) {
  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close sidebar">
          <Icon name="Close" size="md" color="action" />
        </button>

        <button
          className={styles.newChatBtn}
          onClick={() => { onNewConversation(); onClose() }}
          type="button"
        >
          <span className={styles.newChatIcon}>
            <Icon name="Add" size="sm" color="inverse" />
          </span>
          <span className={styles.newChatLabel}>New Chat</span>
        </button>

        <div className={styles.list}>
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              onSelect={() => { onSelectSession(session.messages); onClose() }}
              onDelete={() => onDelete(session.id)}
              onToggleFavorite={() => onToggleFavorite(session.id)}
            />
          ))}
        </div>

        <button className={styles.settingsBtn} type="button">
          <Icon name="Settings" size="sm" color="action" />
          <span className={styles.settingsLabel}>Settings</span>
        </button>
      </div>

      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
    </div>
  )
}
