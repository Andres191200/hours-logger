'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { formatMinutes } from '@/lib/dates'
import type { PersonObjective, Project, SearchTarget } from '@/types'
import styles from './AiLogInput.module.scss'

interface AiLogInputProps {
  objectives: PersonObjective[]
  projects: Project[]
  onAdd: (target: SearchTarget, hours: number, minutes: number) => void
  disabled?: boolean
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }

export function AiLogInput({ objectives, projects, onAdd, disabled }: AiLogInputProps) {
  const [value, setValue] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    const msg = value.trim()
    if (!msg || state.status === 'loading') return

    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/ai-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, objectives, projects }),
      })

      const data = await res.json()

      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Something went wrong' })
        return
      }

      const { target, hours, minutes } = data as {
        target: SearchTarget
        hours: number
        minutes: number
      }

      onAdd(target, hours, minutes)
      setValue('')
      setState({ status: 'idle' })
      inputRef.current?.focus()
    } catch {
      setState({ status: 'error', message: 'Network error' })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') {
      setValue('')
      setState({ status: 'idle' })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrap}>
        <span className={styles.aiIcon} aria-hidden="true">✦</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder={`e.g. "log 2h on platform migration"`}
          value={value}
          disabled={disabled || state.status === 'loading'}
          onChange={e => {
            setValue(e.target.value)
            if (state.status === 'error') setState({ status: 'idle' })
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Natural language time entry"
        />
        <button
          className={styles.sendBtn}
          onClick={submit}
          disabled={!value.trim() || state.status === 'loading' || disabled}
          aria-label="Submit"
        >
          {state.status === 'loading' ? (
            <div className={styles.spinner} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <AnimatePresence>
        {state.status === 'error' && (
          <motion.p
            className={styles.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
