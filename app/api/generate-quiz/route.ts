import { requireUserForApi } from '@/lib/server/auth';
import { LIMITS, sanitizeText } from '@/lib/server/api-input';
import { NextRequest, NextResponse } from 'next/server';

const FIFA_TOPICS = [
  'FIFA Agent Regulations and licensing requirements',
  'FIFA Football Agent Examination rules and procedures',
  'Representation contracts between agents and players',
  'Service agreements between agents and clubs',
  'FIFA Football Agent fees and commission rules',
  'Transfer windows and international transfer certificates',
  'FIFA Transfer Matching System (TMS)',
  'Minor player transfer regulations',
  'Training compensation and solidarity mechanism',
  'FIFA Dispute Resolution Chamber',
  'CAS Court of Arbitration for Sport procedures',
  'Player registration and eligibility rules',
  'Contract stability and unilateral termination',
  'Protected period in player contracts',
  'Just cause and sporting just cause for termination',
  'FIFA Clearing House regulations',
  'Conflicts of interest for football agents',
  'Dual representation rules',
  'FIFA Code of Ethics for agents',
  'Image rights in football contracts',
];

export async function POST(req: NextRequest) {
  const auth = await requireUserForApi();
  if (auth.unauthorized) return auth.unauthorized;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Request body must be a non-empty JSON object' }, { status: 400 });
  }

  try {
    const body = raw as Record<string, unknown>;
    const topicRaw = body.topic != null ? String(body.topic) : '';
    const topic = topicRaw.trim() ? sanitizeText(topicRaw, LIMITS.topic) : '';
    const countRaw = body.count;
    let count = typeof countRaw === 'number' && Number.isFinite(countRaw) ? Math.floor(countRaw) : 10;
    if (count < 1) count = 1;
    if (count > 30) count = 30;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const selectedTopics = topic
      ? [topic]
      : FIFA_TOPICS.sort(() => Math.random() - 0.5).slice(0, 4);

    const topicsLine = selectedTopics.map((t) => sanitizeText(t, LIMITS.topic)).join(', ');

    const prompt = `You are an expert on FIFA Football Agent Regulations and the FIFA Football Agent Examination.

Generate exactly ${count} multiple choice questions for FIFA Agent Exam preparation.

Topics to cover: ${topicsLine}

Requirements:
- Each question must be factually accurate based on current FIFA regulations
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one answer is correct
- Include a brief explanation (1-2 sentences) of why the correct answer is right
- Questions should range from straightforward to challenging
- Do NOT repeat questions

Respond with ONLY a valid JSON array, no markdown, no explanation, just raw JSON:
[
  {
    "question": "Question text here?",
    "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
    "correct_answer": "A. Option one",
    "explanation": "Brief explanation of why this is correct."
  }
]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) throw new Error('Invalid response format');

    return NextResponse.json({ questions, topics: selectedTopics });
  } catch (err) {
    console.error('generate-quiz error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
