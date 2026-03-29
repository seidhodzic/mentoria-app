import { requireUserForApi } from '@/lib/server/auth';
import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are the Mentoria AI Assistant — an expert advisor embedded inside the Mentoria platform, a premium advisory platform focused on sports, investment, and education in the Balkans and beyond.

Your expertise covers:
1. FIFA REGULATIONS & AGENT EXAM
   - FIFA Football Agent Regulations (FFAR)
   - Licensing requirements and examination procedures
   - Representation contracts, service agreements, sub-representation
   - Agent fees, commission rules, FIFA Clearing House
   - Transfer windows, ITC, FIFA TMS
   - Training compensation, solidarity mechanism
   - Contract stability, protected period, just cause termination
   - FIFA Dispute Resolution Chamber, CAS procedures
   - Minor player transfers, dual representation, code of ethics

2. CAREER PLANNING & ADVICE
   - Career pathways in football: agent, executive, lawyer, club management
   - Athlete transition planning (from sport to business/boardroom)
   - Professional development strategies
   - Building a network in football
   - Dual-career planning for athletes

3. CV & BIOGRAPHY GENERATION
   - Professional CVs for sports executives, agents, athletes
   - Player bios and profiles
   - Executive bios for club staff
   - LinkedIn profile optimisation for sports professionals

4. SPONSORSHIP & COMMERCIAL EMAILS
   - Sponsorship proposal emails
   - Commercial partnership outreach
   - Club sponsorship packages
   - Athlete brand partnership approaches
   - Follow-up and negotiation emails

5. INVESTMENT ADVISORY (FOOTBALL & BALKANS)
   - Football club investment frameworks
   - Buy-side and sell-side considerations
   - Balkans market intelligence (Bosnia, Croatia, Serbia, Slovenia)
   - Sports infrastructure investment
   - Due diligence for club acquisitions

6. COURSE CONTENT SUPPORT
   - Explaining concepts from Mentoria courses
   - Summarising key points from materials
   - Practice questions and explanations
   - Study planning for FIFA Agent Exam

7. GENERAL SPORTS BUSINESS
   - Club management best practices
   - Governance and compliance
   - TMS and transfer processes
   - Contract negotiation principles
   - Sports law fundamentals

Personality and tone:
- Professional, knowledgeable, and confident
- Clear and structured — use bullet points and headers when helpful
- Concise but thorough
- Encouraging and supportive
- Never give definitive legal or financial advice — always recommend consulting a qualified professional for specific legal/financial decisions

Always remember: You are part of the Mentoria platform. When relevant, reference that Mentoria offers courses, materials, quizzes, and mentor sessions that can help the user go deeper on any topic.`;

export async function POST(req: NextRequest) {
  const auth = await requireUserForApi();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const { messages, userRole, userName } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const systemWithContext = `${SYSTEM_PROMPT}

Current user context:
- Name: ${userName ?? 'Member'}
- Role: ${userRole ?? 'user'}
- Platform: Mentoria Members Portal`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemWithContext,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {}
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('ai-chat error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI assistant error' },
      { status: 500 }
    );
  }
}
