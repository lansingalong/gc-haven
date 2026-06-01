import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Icon } from '@/components/Icons'
import contentCopy from '@/assets/content_copy.png'
import checkIcon from '@/assets/check.png'
import thumbUp from '@/assets/thumb_up.png'
import thumbUpFill from '@/assets/thumb_up_fill.png'
import thumbDown from '@/assets/thumb_down.png'
import thumbDownFill from '@/assets/thumb_down_fill.png'
import styles from './ChatMessages.module.css'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
  feedback?: 'up' | 'down' | null
  followUp?: string
  followUpQuery?: string
  suggestedQuestions?: string[]
}

export interface ChatMessagesProps {
  messages: Message[]
  /** Show 3-dot typing indicator */
  loading: boolean
  /** Show animated thinking steps before response */
  thinkingSteps?: string[] | null
  onFeedback?: (id: string, value: 'up' | 'down') => void
  onSuggest?: (question: string) => void
}

/* ── Thinking steps ── */
function ThinkingSteps({ steps }: { steps: string[] }) {
  const [count, setCount] = useState(1)

  useEffect(() => {
    if (count >= steps.length) return
    const t = setTimeout(() => setCount(c => c + 1), 700)
    return () => clearTimeout(t)
  }, [count, steps.length])

  return (
    <div className={styles.thinkingWrap}>
      {steps.slice(0, count).map((step, i) => {
        const done = i < count - 1
        return (
          <div key={i} className={`${styles.thinkingStep} ${done ? styles.thinkingDone : styles.thinkingActive}`}>
            {done
              ? <Icon name="CheckCircle" size="xs" color="action" />
              : <span className={styles.thinkingSpinner} />
            }
            <span>{step}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className={styles.row}>
      <div className={styles.typing}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  )
}

/* ── Suggested follow-up chips ── */
function SuggestedQuestions({ questions, onSuggest }: { questions: string[]; onSuggest?: (q: string) => void }) {
  return (
    <div className={styles.suggestedList} role="list" aria-label="Suggested follow-up questions">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          role="listitem"
          className={styles.suggestedBtn}
          onClick={() => onSuggest?.(q)}
          aria-label={`Ask: ${q}`}
        >
          {q}
        </button>
      ))}
    </div>
  )
}

/* ── Assistant message with actions ── */
function AssistantMessage({
  msg,
  onFeedback,
  suggestedQuestions,
  onSuggest,
}: {
  msg: Message
  onFeedback?: (id: string, value: 'up' | 'down') => void
  suggestedQuestions?: string[]
  onSuggest?: (question: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 5000)
  }

  if (msg.isError) {
    return (
      <div className={styles.row}>
        <div className={styles.errorBubble}>
          <div className={styles.errorHeader}>
            <Icon name="ErrorOutline" size="sm" color="error" />
            <span className={styles.errorTitle}>Unable to retrieve data</span>
          </div>
          <p className={styles.errorBody}>{msg.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.assistantGroup}>
      <div className={styles.row}>
        <div className={styles.assistantBubble}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
      </div>
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${copied ? styles.actionBtnActive : ''}`}
          onClick={handleCopy}
          type="button"
          aria-label="Copy response"
          title={copied ? 'Copied!' : 'Copy'}
        >
          <img src={copied ? checkIcon : contentCopy} width={16} height={16} alt="" aria-hidden="true" />
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <div className={styles.actionDivider} />
        <button
          className={`${styles.actionBtn} ${msg.feedback === 'up' ? styles.actionBtnActive : ''}`}
          onClick={() => onFeedback?.(msg.id, 'up')}
          type="button"
          aria-label="Helpful"
          title="Helpful"
        >
          <img src={msg.feedback === 'up' ? thumbUpFill : thumbUp} width={16} height={16} alt="" aria-hidden="true" />
        </button>
        <button
          className={`${styles.actionBtn} ${msg.feedback === 'down' ? styles.actionBtnActive : ''}`}
          onClick={() => onFeedback?.(msg.id, 'down')}
          type="button"
          aria-label="Not helpful"
          title="Not helpful"
        >
          <img src={msg.feedback === 'down' ? thumbDownFill : thumbDown} width={16} height={16} alt="" aria-hidden="true" />
        </button>
      </div>
      {suggestedQuestions && suggestedQuestions.length > 0 && (
        <SuggestedQuestions questions={suggestedQuestions} onSuggest={onSuggest} />
      )}
    </div>
  )
}

/* ── Main component ── */
export function ChatMessages({ messages, loading, thinkingSteps, onFeedback, onSuggest }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, thinkingSteps])

  const lastAssistantIdx = messages.reduceRight(
    (found, m, i) => (found === -1 && m.role === 'assistant' ? i : found),
    -1
  )

  return (
    <div className={styles.list} aria-live="polite" aria-relevant="additions" aria-label="Chat messages">
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <div key={msg.id} className={styles.userRow}>
            <div className={styles.userBubble}>{msg.content}</div>
          </div>
        ) : (
          <AssistantMessage
            key={msg.id}
            msg={msg}
            onFeedback={onFeedback}
            suggestedQuestions={!loading && !thinkingSteps && i === lastAssistantIdx ? msg.suggestedQuestions : undefined}
            onSuggest={onSuggest}
          />
        )
      )}

      {thinkingSteps && thinkingSteps.length > 0 && (
        <ThinkingSteps steps={thinkingSteps} />
      )}
      {loading && !thinkingSteps && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}
