import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './MemberChatWindow.module.css'

interface ChatMsg {
  id: string
  from: 'member' | 'cm'
  text: string
  /** Full datetime string shown above CM bubbles */
  timestamp: string
  /** Care manager display name — CM messages only */
  senderName?: string
}

const MOCK_MESSAGES: Record<string, ChatMsg[]> = {
  'jackson-thomas': [
    { id: '1', from: 'cm', senderName: 'Beatrice Kanya', text: "Hi Jackson, how have your blood sugar readings been this week? Is there anything I can support you with?", timestamp: '11/28/2025 2:10 PM' },
    { id: '2', from: 'member', text: "They've been around 140 fasting. A bit high.", timestamp: '11/28/2025 2:13 PM' },
    { id: '3', from: 'cm', senderName: 'Beatrice Kanya', text: "Thanks for tracking that. Are you remembering to take your metformin every morning?", timestamp: '11/28/2025 2:14 PM' },
    { id: '4', from: 'member', text: "Yes, every morning with breakfast.", timestamp: '11/28/2025 2:16 PM' },
    { id: '5', from: 'cm', senderName: 'Beatrice Kanya', text: "Great. Let's keep monitoring. Your next check-in is scheduled for next week.", timestamp: '11/28/2025 2:17 PM' },
  ],
  'maria-rivera': [
    { id: '1', from: 'cm', senderName: 'Beatrice Kanya', text: "Hi Maria, how are you feeling today? Any shortness of breath?", timestamp: '12/1/2025 10:05 AM' },
    { id: '2', from: 'member', text: "A little more than usual yesterday.", timestamp: '12/1/2025 10:09 AM' },
    { id: '3', from: 'cm', senderName: 'Beatrice Kanya', text: "I'm sorry to hear that. How many pillows are you using to sleep?", timestamp: '12/1/2025 10:11 AM' },
    { id: '4', from: 'member', text: "About 3 now. It's been harder to sleep flat.", timestamp: '12/1/2025 10:14 AM' },
    { id: '5', from: 'cm', senderName: 'Beatrice Kanya', text: "Let's schedule a call to discuss this. Have you been weighing yourself daily?", timestamp: '12/1/2025 10:15 AM' },
  ],
}

const MEMBER_DOBS: Record<string, string> = {
  'jackson-thomas': '01/01/1970',
  'maria-rivera': '07/22/1958',
  'robert-chen': '11/08/1965',
  'sarah-williams': '09/30/1980',
  'james-oconnor': '05/17/1948',
}

const MEMBER_IDS: Record<string, string> = {
  'jackson-thomas': 'AH58319473',
  'maria-rivera': 'AH72940158',
  'robert-chen': 'AH36582091',
  'sarah-williams': 'AH91427634',
  'james-oconnor': 'AH60273845',
}

export interface MemberChatWindowProps {
  memberName: string
  /** Member key (e.g. 'jackson-thomas') used to look up mock data */
  memberKey: string
  onClose: () => void
  /** Bottom edge of the Haven window (px from viewport top) — aligns this window's bottom to match */
  havenBottomY?: number
  /** Override z-index (e.g. lower when a modal overlay is open) */
  zIndex?: number
}

const DEFAULT_WIDTH = 440
const DEFAULT_HEIGHT = 580
const DEFAULT_RIGHT = 24 + 500 + 16
const MIN_W = 320
const MIN_H = 300

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export function MemberChatWindow({ memberName, memberKey, onClose, havenBottomY, zIndex }: MemberChatWindowProps) {
  const dob = MEMBER_DOBS[memberKey] ?? '—'
  const displayId = MEMBER_IDS[memberKey] ?? memberKey
  const initialMsgs = MOCK_MESSAGES[memberKey] ?? []

  const [inputValue, setInputValue] = useState('')
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>(initialMsgs)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [pos, setPos] = useState({ left: 0, top: 0 })
  const [size, setSize] = useState({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT })
  const [posReady, setPosReady] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number; currentLeft: number; currentTop: number } | null>(null)
  const resizeState = useRef<{ dir: ResizeDir; startX: number; startY: number; startLeft: number; startTop: number; startW: number; startH: number } | null>(null)

  useEffect(() => {
    const bottomY = havenBottomY ?? (window.innerHeight - 24)
    setPos({
      left: Math.max(0, Math.min(window.innerWidth - DEFAULT_RIGHT - DEFAULT_WIDTH, window.innerWidth - MIN_W)),
      top: Math.max(0, Math.min(bottomY - DEFAULT_HEIGHT, window.innerHeight - 40)),
    })
    setPosReady(true)
  }, [havenBottomY])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  const onChromeMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    dragState.current = { startX: e.clientX, startY: e.clientY, startLeft: pos.left, startTop: pos.top, currentLeft: pos.left, currentTop: pos.top }
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [pos])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current || !windowRef.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      const newLeft = Math.max(0, Math.min(window.innerWidth - size.w, dragState.current.startLeft + dx))
      const newTop = Math.max(0, Math.min(window.innerHeight - 40, dragState.current.startTop + dy))
      dragState.current.currentLeft = newLeft
      dragState.current.currentTop = newTop
      // GPU-composited transform — no React re-render, no layout recalc
      windowRef.current.style.transform = `translate(${newLeft - dragState.current.startLeft}px, ${newTop - dragState.current.startTop}px)`
    }
    const onMouseUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (!dragState.current) return
      const { currentLeft, currentTop } = dragState.current
      // Commit position before clearing transform so there is no visual jump
      if (windowRef.current) {
        windowRef.current.style.left = `${currentLeft}px`
        windowRef.current.style.top = `${currentTop}px`
        windowRef.current.style.transform = ''
      }
      setPos({ left: currentLeft, top: currentTop })
      dragState.current = null
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [size.w])

  const onResizeMouseDown = useCallback((dir: ResizeDir) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    resizeState.current = { dir, startX: e.clientX, startY: e.clientY, startLeft: pos.left, startTop: pos.top, startW: size.w, startH: size.h }
  }, [pos, size])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizeState.current
      if (!r) return
      const dx = e.clientX - r.startX
      const dy = e.clientY - r.startY
      let { startLeft: newLeft, startTop: newTop, startW: newW, startH: newH } = r
      if (r.dir.includes('e')) newW = Math.max(MIN_W, Math.min(r.startW + dx, window.innerWidth - r.startLeft))
      if (r.dir.includes('w')) { newW = Math.max(MIN_W, r.startW - dx); newLeft = Math.max(0, r.startLeft + (r.startW - newW)) }
      if (r.dir.includes('s')) newH = Math.max(MIN_H, Math.min(r.startH + dy, window.innerHeight - r.startTop))
      if (r.dir.includes('n')) { newH = Math.max(MIN_H, r.startH - dy); newTop = Math.max(0, r.startTop + (r.startH - newH)) }
      setSize({ w: newW, h: newH }); setPos({ left: newLeft, top: newTop })
    }
    const onMouseUp = () => { resizeState.current = null }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [])

  /* ── Clamp position/size when the browser viewport is resized ── */
  useEffect(() => {
    const onViewportResize = () => {
      setPos(prev => ({
        left: Math.max(0, Math.min(prev.left, window.innerWidth - MIN_W)),
        top: Math.max(0, Math.min(prev.top, window.innerHeight - 40)),
      }))
      setSize(prev => ({
        w: Math.min(prev.w, window.innerWidth),
        h: Math.min(prev.h, window.innerHeight),
      }))
    }
    window.addEventListener('resize', onViewportResize)
    return () => window.removeEventListener('resize', onViewportResize)
  }, [])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    const now = new Date()
    const timestamp = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setChatMsgs(prev => [...prev, { id: `msg-${Date.now()}`, from: 'cm', senderName: 'You', text: trimmed, timestamp }])
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  const windowStyle: React.CSSProperties = {
    ...(posReady
      ? { left: pos.left, top: pos.top, width: size.w, height: size.h }
      : { right: DEFAULT_RIGHT, bottom: 24, width: size.w, height: size.h }),
    ...(zIndex !== undefined ? { zIndex } : {}),
  }

  return (
    <div ref={windowRef} className={styles.window} style={windowStyle} role="dialog" aria-label={`Chat with ${memberName}`}>

      {/* Resize handles */}
      <div className={styles.resizeN}  onMouseDown={onResizeMouseDown('n')}  />
      <div className={styles.resizeS}  onMouseDown={onResizeMouseDown('s')}  />
      <div className={styles.resizeE}  onMouseDown={onResizeMouseDown('e')}  />
      <div className={styles.resizeW}  onMouseDown={onResizeMouseDown('w')}  />
      <div className={styles.resizeNE} onMouseDown={onResizeMouseDown('ne')} />
      <div className={styles.resizeNW} onMouseDown={onResizeMouseDown('nw')} />
      <div className={styles.resizeSE} onMouseDown={onResizeMouseDown('se')} />
      <div className={styles.resizeSW} onMouseDown={onResizeMouseDown('sw')} />

      {/* Chrome bar */}
      <div className={styles.chrome} onMouseDown={onChromeMouseDown}>
        <div className={styles.trafficLights}>
          <button className={`${styles.trafficBtn} ${styles.btnClose}`} onClick={onClose} type="button" aria-label="Close" />
          <button className={`${styles.trafficBtn} ${styles.btnMin}`}   type="button" aria-label="Minimize" />
          <button className={`${styles.trafficBtn} ${styles.btnMax}`}   type="button" aria-label="Maximize" />
        </div>
        <span className={styles.chromeTitle}>Chat with {memberName}</span>
      </div>

      {/* Dark teal header */}
      <div className={styles.header}>
        <span className={styles.headerNameId}>{memberName} - {displayId}</span>
        <span className={styles.headerDob}><strong>DOB:</strong>  {dob}</span>
      </div>

      {/* Subtitle bar */}
      <div className={styles.subtitleBar}>
        <span className={styles.subtitleLeft}>Last opened app: a day ago</span>
        <div className={styles.subtitleRight}>
          <span className={styles.refreshIcon}>↻</span>
          <span className={styles.subtitleLabel}>View by type:</span>
          <span className={styles.viewSelect}>All ▾</span>
        </div>
      </div>

      {/* Chat scroll area */}
      <div className={styles.chatArea}>
        {chatMsgs.length === 0 && (
          <div className={styles.emptyState}>No messages yet</div>
        )}
        {chatMsgs.map(msg =>
          msg.from === 'member' ? (
            <div key={msg.id} className={styles.memberRow}>
              <div className={styles.memberBubble}>{msg.text}</div>
            </div>
          ) : (
            <div key={msg.id} className={styles.cmGroup}>
              <div className={styles.cmMeta}>
                <span className={styles.cmName}>{msg.senderName}</span>
                <span className={styles.cmRole}>Care Manager</span>
                <span className={styles.cmTime}>{msg.timestamp}</span>
              </div>
              <div className={styles.cmBubble}>{msg.text}</div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input section */}
      <div className={styles.inputSection}>
        <span className={styles.inputLabel}>Enter message for member</span>
        <div className={styles.inputRow}>
          <button className={styles.plusBtn} type="button" aria-label="Attach">+</button>
          <input
            className={styles.input}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${memberName}`}
            aria-label={`Message ${memberName}`}
          />
          <button className={styles.emojiBtn} type="button" aria-label="Emoji">☺</button>
        </div>
        <div className={styles.inputFooter}>
          <span className={styles.tipText}>Tip: Type "." to get a list of available shortcuts</span>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            type="button"
            disabled={!inputValue.trim()}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
