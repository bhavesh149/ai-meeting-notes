import Groq from 'groq-sdk';
import pino from 'pino';

const logger = pino({
  name: 'llm',
  level: process.env.LOG_LEVEL || 'info',
});

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface SummarizeOptions {
  transcript: string;
  prompt: string;
  model?: string;
}

export interface SummarizeResponse {
  summary: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export async function summarizeTranscript({
  transcript,
  prompt,
  model = 'llama3-70b-8192',
}: SummarizeOptions): Promise<SummarizeResponse> {
  try {
    logger.info({ model, transcriptLength: transcript.length }, 'Starting LLM summarization');

    const systemMessage = `You are an AI assistant specialized in creating comprehensive and well-structured meeting summaries. Your task is to analyze meeting transcripts and create clear, actionable summaries that help participants understand key discussions, decisions, and next steps.

Guidelines:
- Extract key topics, decisions, and action items
- Maintain a professional and clear tone
- Organize information logically
- Highlight important deadlines and responsibilities
- Use markdown formatting for better readability
- Focus on actionable insights and outcomes`;

    const userMessage = `${prompt}

Meeting Transcript:
${transcript}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model,
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No content returned from Groq API');
    }

    const tokensIn = completion.usage?.prompt_tokens || 0;
    const tokensOut = completion.usage?.completion_tokens || 0;

    logger.info({
      model,
      tokensIn,
      tokensOut,
      totalTokens: completion.usage?.total_tokens || 0,
    }, 'LLM summarization completed');

    return {
      summary: completion.choices[0].message.content,
      tokensIn,
      tokensOut,
      model,
    };
  } catch (error) {
    logger.error({ error, model }, 'Failed to summarize transcript');
    throw new Error(`Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { groq };
export default groq;
