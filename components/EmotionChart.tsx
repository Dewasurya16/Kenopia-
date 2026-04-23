'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChatMessage, EMOTIONS, EmotionKey } from '@/lib/types'

interface Props {
  history: ChatMessage[]
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function EmotionChart({ history }: Props) {
  const data = useMemo(() => {
    const counts: Record<EmotionKey, number> = {
      senang: 0, cinta: 0, marah: 0, takut: 0, sedih: 0,
    }
    for (const msg of history) {
      if (msg.emotion in counts) counts[msg.emotion]++
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        key,
        name: EMOTIONS[key as EmotionKey].label,
        emoji: EMOTIONS[key as EmotionKey].emoji,
        value,
        color: EMOTIONS[key as EmotionKey].color,
      }))
  }, [history])

  const total = history.length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <span className="text-4xl opacity-40">📊</span>
        <p className="text-sm text-center" style={{ color: 'var(--text-faint)' }}>
          Grafik emosimu akan<br />muncul setelah curhat
        </p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}x`,
              name,
            ]}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'var(--text)',
              boxShadow: 'var(--shadow-md)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="text-center -mt-2 mb-4">
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Total curhat</p>
        <p className="text-2xl font-bold font-display" style={{ color: 'var(--accent)' }}>{total}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: d.color }}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {d.emoji} {d.name}
              </span>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {d.value}x
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
