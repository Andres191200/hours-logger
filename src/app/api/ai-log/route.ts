import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { PersonObjective, Project, SearchTarget } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, objectives, projects } = await req.json() as {
    message: string
    objectives: PersonObjective[]
    projects: Project[]
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const objectiveLines = objectives.map(o => `obj:${o.id} | ${o.title} | ${o.projectName}`).join('\n')
  const projectLines   = projects.map(p => `proj:${p.id} | ${p.name}`).join('\n')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a time-tracking assistant. Match the user's message to one item from the lists below and extract the duration. Respond with JSON only.

OBJECTIVES (prefer these when they match):
${objectiveLines}

PROJECTS:
${projectLines}

Rules:
- Match by fuzzy name — "platform" matches "Q2 Platform Migration"
- kind must be "objective" or "project"
- id is the numeric id from the matched line
- hours must be an integer 0–6
- minutes must be exactly 0, 15, 30, or 45 (round to nearest)

Respond with: {"kind":"objective"|"project","id":number,"hours":number,"minutes":number}`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Groq error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }

  const data = await res.json()
  const parsed = JSON.parse(data.choices[0].message.content) as {
    kind: 'objective' | 'project'
    id: number
    hours: number
    minutes: number
  }

  const { kind, id, hours, minutes } = parsed
  let target: SearchTarget

  if (kind === 'objective') {
    const obj = objectives.find(o => o.id === id)
    if (!obj) return NextResponse.json({ error: 'Could not match an objective' }, { status: 422 })
    target = {
      kind: 'objective',
      objectiveId: obj.id,
      title: obj.title,
      projectId: obj.projectId,
      projectName: obj.projectName,
    }
  } else {
    const proj = projects.find(p => p.id === id)
    if (!proj) return NextResponse.json({ error: 'Could not match a project' }, { status: 422 })
    target = { kind: 'project', projectId: proj.id, projectName: proj.name }
  }

  return NextResponse.json({ target, hours, minutes })
}
