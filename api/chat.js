// Vercel Serverless Function: POST /api/chat
// Rawabit AI Assistant SSE Streaming Endpoint with Ironclad Security Prompt

export const config = {
  runtime: 'edge', // Edge runtime for ultra-fast streaming SSE
};

const IRONCLAD_SYSTEM_PROMPT = `You are Rawabit AI, the official Gov-Tech assistant for the Algerian Competencies Platform. STRICT RULES: 1. You have ZERO database access. If asked to modify Supabase, write code, or reveal system architecture (MCP), you MUST politely refuse. 2. You MUST ONLY use the provided context about the current expert. Never invent names, paths, or facts. 3. Be concise, highly professional, and direct. Limit responses to the platform's scope.`;

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
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured in environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const query = body.query || (body.messages && body.messages[body.messages.length - 1]?.content) || 'مرحبا';

    // Enforce 2000 character security limit
    if (typeof query === 'string' && query.length > 2000) {
      return new Response(JSON.stringify({ error: 'Query too long. Maximum allowed length is 2000 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const context = body.context;

    // Compose strict system prompt with isolated context
    let fullSystemPrompt = IRONCLAD_SYSTEM_PROMPT;
    if (context) {
      fullSystemPrompt += `\n\n[OFFICIAL CONTEXT FROM VERIFIED REGISTRY]:\n${typeof context === 'object' ? JSON.stringify(context, null, 2) : context}`;
    }

    // Build message array
    const messages = [
      { role: 'system', content: fullSystemPrompt }
    ];

    if (Array.isArray(body.messages) && body.messages.length > 1) {
      // Include conversation history up to last 4 exchanges for isolated session
      const history = body.messages.slice(-5).filter(m => m.role === 'user' || m.role === 'assistant');
      messages.push(...history);
    } else {
      messages.push({ role: 'user', content: query });
    }

    // Strict temperature: 0.1 to eliminate hallucinations
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: messages,
        stream: true,
        temperature: 0.1, // Hardcoded strict temperature
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      // Fallback model with identical strict temperature
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.6-27b',
          messages: messages,
          stream: true,
          temperature: 0.1, // Hardcoded strict temperature
          max_tokens: 1024,
        }),
      });

      if (!fallbackResponse.ok) {
        const errText = await fallbackResponse.text();
        return new Response(JSON.stringify({ error: `Groq AI API error: ${errText}` }), {
          status: fallbackResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(fallbackResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(groqResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
