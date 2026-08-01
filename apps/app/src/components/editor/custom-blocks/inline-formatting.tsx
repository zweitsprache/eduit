import { Fragment } from 'react';

export function htmlToInlineFormatting(value: string) {
  if (!value.includes('<') && !value.includes('&')) return value;
  return value
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(
      /<(div|span)\b[^>]*data-card-answer(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>([\s\S]*?)<\/\1\s*>/gi,
      (_match, _tag, content: string) => `[[card-answer]]${content}[[/card-answer]]`,
    )
    .replace(
      /<(strong|span)\b[^>]*data-verb-exception(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>([\s\S]*?)<\/\1\s*>/gi,
      (_match, _tag, content: string) => `[[verb-exception]]${content}[[/verb-exception]]`,
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:div|p)\b[^>]*>/gi, (tag) => (
      tag.startsWith('</') ? '\n' : ''
    ))
    .replace(/<(?:strong|b)\b[^>]*>/gi, '**')
    .replace(/<\/(?:strong|b)\s*>/gi, '**')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

export function stripInlineFormatting(value: string) {
  return value.replace(/\*\*/g, '');
}

export function InlineFormattedText({
  fallback,
  text,
}: {
  fallback?: string;
  text: string;
}) {
  const value = htmlToInlineFormatting(text || fallback || '');
  const pattern = /\*\*([^*]+)\*\*|\[\[verb-exception\]\]([\s\S]*?)\[\[\/verb-exception\]\]/g;
  const parts: Array<{ style: 'normal' | 'bold' | 'exception'; text: string }> = [];
  let cursor = 0;
  let match = pattern.exec(value);

  while (match) {
    if (match.index > cursor) {
      parts.push({
        style: 'normal',
        text: value.slice(cursor, match.index),
      });
    }
    parts.push({
      style: match[1] !== undefined ? 'bold' : 'exception',
      text: match[1] ?? match[2],
    });
    cursor = match.index + match[0].length;
    match = pattern.exec(value);
  }

  if (cursor < value.length) {
    parts.push({ style: 'normal', text: value.slice(cursor) });
  }

  return (
    <span className="custom-block__inline-formatted-text">
      {parts.flatMap((part, index) => (
        part.text.split('\n').map((line, lineIndex, lines) => (
          <Fragment key={`${index}-${lineIndex}-${line}`}>
            {part.style === 'bold' ? <strong>{line}</strong> : part.style === 'exception' ? (
              <strong className="custom-block__verb-exception">{line}</strong>
            ) : line}
            {lineIndex < lines.length - 1 && <br />}
          </Fragment>
        ))
      ))}
    </span>
  );
}
