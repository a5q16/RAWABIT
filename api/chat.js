// Vercel Serverless Function: POST /api/chat
// Rawabit AI Assistant SSE Streaming Endpoint

export const config = {
  runtime: 'edge', // Edge runtime for ultra-fast streaming SSE
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { query, context } = await req.json();
    const groqApiKey = process.env.GROQ_API_KEY || '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';

    const systemPrompt = `أنت المساعد الذكي لمنصة روابط الجزائرية (Rawabit) للكفاءات والمواهب الوطنية.
مهمتك مساعدة المستخدمين في استكشاف الكفاءات والخبراء والمشاريع في مختلف ولايات الجزائر.
${context ? `السياق الحالي للملف الشخصي: ${JSON.stringify(context)}` : ''}
أجب بلغة عربية فصحى واضحة، مهنية وموجزة ومباشرة.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query || 'مرحبا' },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      // Fallback model if primary model is unavailable
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.6-27b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query || 'مرحبا' },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Groq API error: ${fallbackResponse.statusText}`);
      }

      return createStreamResponse(fallbackResponse.body);
    }

    return createStreamResponse(groqResponse.body);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

function createStreamResponse(upstreamBody) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          continue;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`));
          }
        } catch (_) {
          // ignore parse chunk fragments
        }
      }
    },
  });

  return new Response(upstreamBody.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
