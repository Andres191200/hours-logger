'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { PersonObjective, SearchTarget } from '@/types'
import styles from './TargetSearch.module.scss'

interface TargetSearchProps {
  objectives: PersonObjective[]
  onSelect: (target: SearchTarget) => void
  disabled?: boolean
}

function buildTargets(objectives: PersonObjective[]): SearchTarget[] {
  const objectiveTargets: SearchTarget[] = objectives.map((o) => ({
    kind: 'objective',
    objectiveId: o.id,
    title: o.title,
    projectId: o.projectId,
    projectName: o.projectName,
  }))

  const projectMap = new Map<number, SearchTarget>()
  objectives.forEach((o) => {
    if (!projectMap.has(o.projectId)) {
      projectMap.set(o.projectId, {
        kind: 'project',
        projectId: o.projectId,
        projectName: o.projectName,
      })
    }
  })

  return [...objectiveTargets, ...Array.from(projectMap.values())]
}

export function TargetSearch({ objectives, onSelect, disabled }: TargetSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const allTargets = buildTargets(objectives)

  const filtered = query.trim()
    ? allTargets.filter((t) => {
        const q = query.toLowerCase()
        if (t.kind === 'objective') {
          return t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q)
        }
        return t.projectName.toLowerCase().includes(q)
      })
    : allTargets

  const filteredObjectives = filtered.filter((t) => t.kind === 'objective')
  const filteredProjects = filtered.filter((t) => t.kind === 'project')
  const flatList = [...filteredObjectives, ...filteredProjects]
  const maxVisible = 6
  const visible = flatList.slice(0, maxVisible)

  const handleSelect = useCallback(
    (target: SearchTarget) => {
      setQuery('')
      setOpen(false)
      setHighlighted(-1)
      onSelect(target)
    },
    [onSelect]
  )

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        setHighlighted(0)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((h) => Math.min(h + 1, visible.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlighted >= 0 && visible[highlighted]) {
          handleSelect(visible[highlighted])
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlighted(-1)
        break
    }
  }

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]')
      items[highlighted]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  const showObjectivesSection = filteredObjectives.length > 0
  const showProjectsSection = filteredProjects.length > 0
  const objCount = Math.min(filteredObjectives.length, maxVisible)
  const projCount = Math.min(filteredProjects.length, maxVisible - objCount)

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrap}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Search objectives or projects..."
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlighted(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-label="Search objectives or projects"
          role="combobox"
        />
      </div>

      <AnimatePresence>
        {open && visible.length > 0 && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <ul ref={listRef} className={styles.list} role="listbox">
              {showObjectivesSection && (
                <>
                  <li className={styles.sectionHeader} role="presentation">Objectives</li>
                  {filteredObjectives.slice(0, objCount).map((t, idx) => {
                    if (t.kind !== 'objective') return null
                    const globalIdx = idx
                    return (
                      <li
                        key={`obj-${t.objectiveId}`}
                        data-item
                        className={`${styles.item} ${highlighted === globalIdx ? styles.itemHighlighted : ''}`}
                        role="option"
                        aria-selected={highlighted === globalIdx}
                        onMouseEnter={() => setHighlighted(globalIdx)}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelect(t)
                        }}
                      >
                        <span className={styles.itemIcon}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className={styles.itemContent}>
                          <span className={styles.itemTitle}>{t.title}</span>
                          <span className={styles.itemSub}>{t.projectName}</span>
                        </span>
                      </li>
                    )
                  })}
                </>
              )}
              {showProjectsSection && (
                <>
                  <li className={styles.sectionHeader} role="presentation">Projects</li>
                  {filteredProjects.slice(0, projCount).map((t, idx) => {
                    if (t.kind !== 'project') return null
                    const globalIdx = objCount + idx
                    return (
                      <li
                        key={`proj-${t.projectId}`}
                        data-item
                        className={`${styles.item} ${highlighted === globalIdx ? styles.itemHighlighted : ''}`}
                        role="option"
                        aria-selected={highlighted === globalIdx}
                        onMouseEnter={() => setHighlighted(globalIdx)}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelect(t)
                        }}
                      >
                        <span className={styles.itemIcon}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className={styles.itemContent}>
                          <span className={styles.itemTitle}>{t.projectName}</span>
                        </span>
                      </li>
                    )
                  })}
                </>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
