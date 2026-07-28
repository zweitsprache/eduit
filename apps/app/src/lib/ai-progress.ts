export type AIProgressEvent<TResult> =
  | { type: 'progress'; label: string }
  | { type: 'result'; result: TResult }
  | { type: 'error'; message: string };

export async function readAIProgressStream<TResult>(
  response: Response,
  onProgress: (label: string) => void,
) {
  if (!response.ok) {
    const result = await response.json().catch(() => null) as {
      error?: string;
    } | null;
    throw new Error(result?.error ?? 'AI generation failed.');
  }
  if (!response.body) throw new Error('The AI response stream is unavailable.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: TResult | undefined;

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as AIProgressEvent<TResult>;
    if (event.type === 'progress') onProgress(event.label);
    if (event.type === 'error') throw new Error(event.message);
    if (event.type === 'result') result = event.result;
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(consumeLine);
    if (done) break;
  }
  if (buffer.trim()) consumeLine(buffer);
  if (result === undefined) throw new Error('AI generation returned no result.');
  return result;
}
