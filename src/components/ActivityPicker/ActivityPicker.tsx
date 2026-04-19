'use client'
import { useState } from 'react'
import { motion } from 'motion/react'
import type { ActivityType, ActivityOption } from '@/types'
import styles from './ActivityPicker.module.scss'

interface ActivityPickerProps {
  projectName: string
  onSelect: (activity: ActivityType) => void
}

const ACTIVITIES: ActivityOption[] = [
  { type: 'meeting', label: 'Meeting', icon: '📅' },
  { type: 'technical-discussion', label: 'Tech Discussion', icon: '💬' },
  { type: 'code-review', label: 'Code Review', icon: '🔍' },
]

export function ActivityPicker({ projectName, onSelect }: ActivityPickerProps) {
  const [selected, setSelected] = useState<ActivityType | null>(null)

  const handleSelect = (type: ActivityType) => {
    setSelected(type)
    onSelect(type)
  }

  return (
    <div className={styles.container}>
      <p className={styles.label}>
        Activity type for <strong>{projectName}</strong>
      </p>
      <div className={styles.grid}>
        {ACTIVITIES.map((activity, index) => (
          <motion.button
            key={activity.type}
            className={`${styles.card} ${selected === activity.type ? styles.cardSelected : ''}`}
            onClick={() => handleSelect(activity.type)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className={styles.icon}>{activity.icon}</span>
            <span className={styles.activityLabel}>{activity.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
