import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icons'
import { MemberHeader } from './MemberHeader'
import { ChatWelcome } from './ChatWelcome'
import { MemberDetailMenu } from './MemberDetailMenu'
import { ChatMessages, type Message } from './ChatMessages'
import { AskHavenInput } from './AskHavenInput'
import styles from './HavenWindow.module.css'
import panelStyles from './HavenPanel.module.css'
import { getMockReply, getFollowUp, getFollowUpQuery, getGuardrailMessage } from './mockReplies'
import { HomeWelcome } from './HomeWelcome'
import { MemberChatWindow } from './MemberChatWindow'
import { SukiWindow } from './SukiWindow'
import chatIcon from '@/assets/chat.png'
import chevronForwardIcon from '@/assets/chevron_forward.png'

export interface HavenWindowProps {
  memberName?: string
  phone?: string
  memberId?: string
  pcp?: string
  /** Provide to wire a real AI backend; omit to use built-in demo replies */
  onSend?: (value: string) => Promise<string>
  onLearnMore?: () => void
  defaultRight?: number
  defaultBottom?: number
  defaultWidth?: number
  defaultHeight?: number
  /** Member ID used to select the correct mock data set */
  mockMemberId?: string
  /** Whether clinical data is available for this member in Haven */
  hasData?: boolean
  /** Confirmation message shown when the window is first opened after a member switch */
  switchConfirmation?: string
  /** True when the care manager is on the home dashboard (no active member) */
  isHome?: boolean
  age?: string
  gender?: string
  dob?: string
}

type WindowState = 'open' | 'minimized' | 'closed'
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_W = 360
const MIN_H = 300

export function HavenWindow({
  memberName = 'Henry Tom Garcia',
  phone = '909-851-3064',
  memberId = 'AH000000009',
  pcp = 'Ambetter',
  onSend,
  defaultRight = 24,
  defaultBottom = 100,
  defaultWidth = 500,
  defaultHeight = 657,
  mockMemberId = 'AH0000007',
  hasData = true,
  switchConfirmation,
  isHome = false,
  age = '26',
  gender = 'Male',
  dob = '03/01/1989',
}: HavenWindowProps) {
  const [winState, setWinState] = useState<WindowState>('closed')
  const [menuOpen, setMenuOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)
  const [memberChatOpen, setMemberChatOpen] = useState(false)
  const [sukiOpen, setSukiOpen] = useState(false)
  const [fabExpanded, setFabExpanded] = useState(true)

  const [pos, setPos] = useState({ left: 0, top: 0 })
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })
  const [posReady, setPosReady] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)

  // Set to true on unmount so any in-progress async response is discarded (member switched)
  const cancelledRef = useRef(false)
  // Prevents showing the open-time message more than once per member instance
  const openMsgShownRef = useRef(false)

  useEffect(() => {
    setPos({
      left: window.innerWidth - defaultRight - defaultWidth,
      top: window.innerHeight - defaultBottom - defaultHeight,
    })
    setPosReady(true)
    // On unmount (member switch), cancel any in-flight response
    return () => { cancelledRef.current = true }
  }, [defaultBottom, defaultRight, defaultWidth, defaultHeight])

  /* ── Show confirmation or no-data message on first open ── */
  useEffect(() => {
    if (winState !== 'open' || openMsgShownRef.current) return
    openMsgShownRef.current = true

    if (!hasData) {
      // Restricted member: surface a clear no-data message, enforce restricted context
      setMessages([{
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `No clinical data is currently available for ${memberName} in Haven.\n\nPlease verify the member's record in GuidingCare before proceeding. Haven cannot answer clinical questions for this member until their data is available in the system.`,
        isError: true,
      }])
    } else if (switchConfirmation) {
      // Acknowledge the member switch
      setMessages([{
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: switchConfirmation,
      }])
    }
  }, [winState, hasData, memberName, switchConfirmation])

  /* ── Learn more ── */
  const handleLearnMore = useCallback(() => {
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: 'What does Haven have access to?' }
    const replyMsg: Message = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      content: `Here's what I can and cannot help with:\n\nI don't have access to:\n• Clinical decisions or diagnosis\n• Systems outside this platform\n• Guaranteed accurate information — always verify yourself\n\nI have access to:\n• Member demographics\n• Clinical history\n• Care plan (goals, interventions)\n• Assessments\n• Eligibility\n• Care gaps\n• Claims data`,
    }
    setMessages(prev => [...prev, userMsg, replyMsg])
    setMenuOpen(false)
    setLearnMoreOpen(true)
  }, [])

  /* ── Send a message ── */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // No-data members: block queries and surface a clear message
    if (!hasData) {
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: 'user', content: trimmed },
        {
          id: `a-${Date.now() + 1}`,
          role: 'assistant',
          content: `Haven does not have clinical data available for ${memberName}. Questions about this member cannot be answered until their record is available in the system.`,
          isError: true,
        },
      ])
      return
    }

    // If user says "yes", resolve against the last assistant message's follow-up query
    const isYes = /^yes[.!]?\s*$/i.test(trimmed)
    const lastFollowUpQuery = isYes
      ? [...messages].reverse().find(m => m.role === 'assistant' && m.followUpQuery)?.followUpQuery
      : undefined
    const resolvedText = lastFollowUpQuery ?? trimmed

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setMenuOpen(false)
    setLearnMoreOpen(false)
    setLoading(true)

    try {
      // Check guardrails before any backend call
      const guardrail = getGuardrailMessage(resolvedText)
      if (guardrail) {
        await new Promise(r => setTimeout(r, 100))
        if (cancelledRef.current) return // Member switched mid-response — discard
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: guardrail }])
        return
      }

      let reply: string
      if (onSend) {
        reply = await onSend(resolvedText)
        if (cancelledRef.current) return
      } else {
        await new Promise(r => setTimeout(r, 100))
        if (cancelledRef.current) return // Member switched while generating — discard partial output
        reply = getMockReply(resolvedText, memberName, mockMemberId)
      }

      if (cancelledRef.current) return

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        followUp: getFollowUp(resolvedText),
        followUpQuery: getFollowUpQuery(resolvedText),
      }])
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [loading, hasData, memberName, mockMemberId, onSend, messages])

  /* ── Drag ── */
  const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null)

  const onChromeMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    dragState.current = { startX: e.clientX, startY: e.clientY, startLeft: pos.left, startTop: pos.top }
  }, [pos])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      setPos({
        left: Math.max(0, Math.min(window.innerWidth - size.w, dragState.current.startLeft + dx)),
        top: Math.max(0, Math.min(window.innerHeight - 28, dragState.current.startTop + dy)),
      })
    }
    const onMouseUp = () => { dragState.current = null }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [size.w])

  /* ── Resize ── */
  const resizeState = useRef<{ dir: ResizeDir; startX: number; startY: number; startLeft: number; startTop: number; startW: number; startH: number } | null>(null)

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
      if (r.dir.includes('e')) newW = Math.max(MIN_W, r.startW + dx)
      if (r.dir.includes('w')) { newW = Math.max(MIN_W, r.startW - dx); newLeft = r.startLeft + (r.startW - newW) }
      if (r.dir.includes('s')) newH = Math.max(MIN_H, r.startH + dy)
      if (r.dir.includes('n')) { newH = Math.max(MIN_H, r.startH - dy); newTop = r.startTop + (r.startH - newH) }
      setSize({ w: newW, h: newH }); setPos({ left: newLeft, top: newTop })
    }
    const onMouseUp = () => { resizeState.current = null }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [])

  /* ── Window controls ── */
  const handleClose    = () => { setWinState('closed'); setMenuOpen(false); setMessages([]) }
  const handleMinimize = () => setWinState(s => s === 'minimized' ? 'open' : 'minimized')
  const handleMaximize = () => { if (winState === 'minimized') setWinState('open') }

  const openWindow = useCallback(() => {
    setPos({ left: window.innerWidth - defaultRight - defaultWidth, top: window.innerHeight - defaultBottom - defaultHeight })
    setPosReady(true)
    setWinState('open')
  }, [defaultRight, defaultWidth, defaultBottom, defaultHeight])

  const openMemberChat = useCallback(() => {
    setMemberChatOpen(true)
  }, [])

  // Bottom edge of the Haven window (px from viewport top) — used to align MemberChatWindow
  const havenBottomY = posReady
    ? pos.top + size.h
    : window.innerHeight - defaultBottom

  const memberChat = !isHome && memberChatOpen ? (
    <MemberChatWindow
      memberName={memberName}
      memberKey={memberId}
      onClose={() => setMemberChatOpen(false)}
      havenBottomY={havenBottomY}
    />
  ) : null

  // ── FAB — always rendered ──
  const fab = isHome ? null : !fabExpanded ? (
    <button
      className={styles.fabMinimized}
      onClick={() => setFabExpanded(true)}
      type="button"
      aria-label="Expand"
    >
      <img src={chevronForwardIcon} width={29} height={29} alt="" aria-hidden="true" className={styles.fabChevronMin} style={{ transform: 'rotate(180deg)' }} />
    </button>
  ) : (
    <div className={styles.fabCard}>
      <button
        className={styles.fabChevronBtn}
        onClick={() => setFabExpanded(false)}
        type="button"
        aria-label="Minimize"
      >
        <img src={chevronForwardIcon} width={29} height={29} alt="" aria-hidden="true" className={styles.fabChevron} />
      </button>
      <div className={styles.fabDivider} />
      <button className={styles.fabMember} onClick={openMemberChat} type="button" aria-label={`Message ${memberName}`}>
        <img src={chatIcon} width={33} height={33} alt="" aria-hidden="true" />
        <span className={styles.fabMemberName}>{memberName}</span>
      </button>
      <div className={styles.fabDivider} />
      <button className={styles.fabHaven} onClick={openWindow} type="button" aria-label="Open Haven AI assistant">
        <Icon name="AutoAwesome" size="md" color="inverse" />
        Haven
      </button>
    </div>
  )

  if (winState === 'closed') {
    return (
      <>
        {memberChat}
        {fab}
      </>
    )
  }

  const isMinimized = winState === 'minimized'
  const windowStyle: React.CSSProperties = posReady
    ? { left: pos.left, top: pos.top, width: size.w, height: isMinimized ? 28 : size.h }
    : { right: defaultRight, bottom: defaultBottom, width: size.w, height: isMinimized ? 28 : size.h }

  const hasMessages = messages.length > 0 || loading

  return (
    <>
    {memberChat}
    {fab}
    {sukiOpen && !isHome && (
      <SukiWindow
        onClose={() => setSukiOpen(false)}
        onNoteSent={() => { setSukiOpen(false); setWinState('closed') }}
        memberName={memberName}
        memberId={memberId}
        phone={phone}
        pcp={pcp}
        age={age}
        gender={gender}
        dob={dob}
        havenLeft={posReady ? pos.left : window.innerWidth - defaultRight - defaultWidth}
        havenTop={posReady ? pos.top : window.innerHeight - defaultBottom - defaultHeight}
      />
    )}
    <div ref={windowRef} className={styles.window} style={windowStyle} role="dialog" aria-label="Haven AI assistant" aria-modal="false">
      {/* Resize handles */}
      {!isMinimized && (
        <>
          <div className={styles.resizeN}  onMouseDown={onResizeMouseDown('n')}  />
          <div className={styles.resizeS}  onMouseDown={onResizeMouseDown('s')}  />
          <div className={styles.resizeE}  onMouseDown={onResizeMouseDown('e')}  />
          <div className={styles.resizeW}  onMouseDown={onResizeMouseDown('w')}  />
          <div className={styles.resizeNE} onMouseDown={onResizeMouseDown('ne')} />
          <div className={styles.resizeNW} onMouseDown={onResizeMouseDown('nw')} />
          <div className={styles.resizeSE} onMouseDown={onResizeMouseDown('se')} />
          <div className={styles.resizeSW} onMouseDown={onResizeMouseDown('sw')} />
        </>
      )}

      {/* Chrome bar */}
      <div className={styles.chrome} onMouseDown={onChromeMouseDown}>
        <div className={styles.trafficLights}>
          <button className={`${styles.trafficBtn} ${styles.btnClose}`}  onClick={handleClose}    type="button" aria-label="Close"    title="Close"    />
          <button className={`${styles.trafficBtn} ${styles.btnMin}`}    onClick={handleMinimize} type="button" aria-label={isMinimized ? 'Restore' : 'Minimize'} title={isMinimized ? 'Restore' : 'Minimize'} />
          <button className={`${styles.trafficBtn} ${styles.btnMax}`}    onClick={handleMaximize} type="button" aria-label="Maximize"  title="Maximize"  />
        </div>
        <span className={styles.chromeTitle}>Haven</span>
      </div>

      {/* Window body */}
      {!isMinimized && (
        <div className={styles.body}>
          {!isHome && <MemberHeader memberName={memberName} phone={phone} memberId={memberId} pcp={pcp} onSukiClick={() => setSukiOpen(true)} />}

          <div className={panelStyles.chatArea}>
            {/* Back button */}
            {learnMoreOpen && (
              <button
                type="button"
                className={panelStyles.backBtn}
                onClick={() => { setMessages([]); setLearnMoreOpen(false) }}
                aria-label="Back"
              >
                <Icon name="ArrowBack" size="sm" color="action" />
                Back
              </button>
            )}

            {/* Scroll area */}
            <div className={panelStyles.chatScroll}>
              {hasMessages ? (
                <ChatMessages messages={messages} loading={loading} />
              ) : (
                <div className={panelStyles.welcomeWrap}>
                  {isHome
                    ? <HomeWelcome onPrompt={sendMessage} />
                    : <ChatWelcome onMemberDetails={() => setMenuOpen(true)} />
                  }
                </div>
              )}
            </div>

            {/* Member detail menu — floats above input bar (member view only) */}
            {!isHome && menuOpen && !hasMessages && (
              <div className={panelStyles.menuOverlay}>
                <MemberDetailMenu
                  onClose={() => setMenuOpen(false)}
                  onSelect={sendMessage}
                />
              </div>
            )}

            {/* Input + disclaimer */}
            <div className={panelStyles.bottom}>
              <AskHavenInput onSubmit={sendMessage} />
              <p className={panelStyles.disclaimer}>
                Check your responses for accuracy.{' '}
                <button type="button" className={panelStyles.disclaimerLink} onClick={handleLearnMore}>
                  What this assistant can and cannot do
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
