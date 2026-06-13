import type { VercelRequest, VercelResponse } from '@vercel/node'

interface RequestBody {
  messages: Array<{ role: string; content: string }>
  context: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing API key' })
  }

  const { messages, context } = req.body as RequestBody

  if (!Array.isArray(messages) || !context) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: context,
        messages,
      }),
    })

    if (!anthropicRes.ok) {
      const errorBody = await anthropicRes.text()
      return res.status(anthropicRes.status).json({ error: errorBody })
    }

    const data = await anthropicRes.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('Coach API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
