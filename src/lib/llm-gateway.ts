/**
 * Multi-LLM Gateway
 * Task-based routing across Gemini, Claude, and GPT-4o
 */

export type LLMTask =
    | 'worksheet'
    | 'exam-analysis'
    | 'meta-question'
    | 'feedback'
    | 'math'
    | 'qa'
    | 'level-test'
    | 'general';

export type LLMModel =
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
    | 'claude-sonnet-4'
    | 'gpt-4o'
    | 'auto';

export interface LLMRequest {
    task: LLMTask;
    model?: LLMModel;
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

export interface LLMResponse {
    content: string;
    model: string;
    tokensUsed?: { input: number; output: number };
}

// Task → optimal model routing
const MODEL_ROUTING: Record<LLMTask, LLMModel> = {
    'worksheet': 'gemini-2.5-flash',
    'exam-analysis': 'claude-sonnet-4',
    'meta-question': 'gemini-2.5-flash',
    'feedback': 'gpt-4o',
    'math': 'gemini-2.5-pro',
    'qa': 'gemini-2.5-flash',
    'level-test': 'gemini-2.5-flash',
    'general': 'gemini-2.5-flash',
};

function resolveModel(task: LLMTask, requestedModel?: LLMModel): LLMModel {
    if (requestedModel && requestedModel !== 'auto') return requestedModel;
    return MODEL_ROUTING[task];
}

async function callGemini(req: LLMRequest, modelId: string): Promise<LLMResponse> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: modelId });

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
        systemInstruction: req.systemPrompt ? { role: 'system', parts: [{ text: req.systemPrompt }] } : undefined,
        generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.maxTokens ?? 4096,
        },
    });

    const response = result.response;
    return {
        content: response.text(),
        model: modelId,
        tokensUsed: {
            input: response.usageMetadata?.promptTokenCount ?? 0,
            output: response.usageMetadata?.candidatesTokenCount ?? 0,
        },
    };
}

async function callClaude(req: LLMRequest, modelId: string): Promise<LLMResponse> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

    const message = await client.messages.create({
        model: modelId === 'claude-sonnet-4' ? 'claude-sonnet-4-20250514' : modelId,
        max_tokens: req.maxTokens ?? 4096,
        system: req.systemPrompt || '',
        messages: [{ role: 'user', content: req.userPrompt }],
        temperature: req.temperature ?? 0.7,
    });

    const textBlock = message.content.find(b => b.type === 'text');
    return {
        content: textBlock?.type === 'text' ? textBlock.text : '',
        model: modelId,
        tokensUsed: {
            input: message.usage.input_tokens,
            output: message.usage.output_tokens,
        },
    };
}

async function callOpenAI(req: LLMRequest, modelId: string): Promise<LLMResponse> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

    const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
            ...(req.systemPrompt ? [{ role: 'system' as const, content: req.systemPrompt }] : []),
            { role: 'user' as const, content: req.userPrompt },
        ],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 4096,
    });

    return {
        content: completion.choices[0]?.message?.content ?? '',
        model: modelId,
        tokensUsed: {
            input: completion.usage?.prompt_tokens ?? 0,
            output: completion.usage?.completion_tokens ?? 0,
        },
    };
}

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
    const model = resolveModel(req.task, req.model);

    if (model.startsWith('gemini')) {
        return callGemini(req, model);
    } else if (model.startsWith('claude')) {
        return callClaude(req, model);
    } else if (model.startsWith('gpt')) {
        return callOpenAI(req, model);
    }

    throw new Error(`Unsupported model: ${model}`);
}

export { MODEL_ROUTING };
