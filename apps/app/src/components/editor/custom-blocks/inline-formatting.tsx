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
    .replace(/<img\b[^>]*\/\s*>/gi, (tag) => {
      const hour = /\bhour=(\d+)/i.exec(tag)?.[1];
      const minute = /\bminute=(\d+)/i.exec(tag)?.[1];
      if (hour === undefined || minute === undefined) return '';
      return `[[clock hour=${hour} minute=${minute}]]`;
    })
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

type InlinePart =
  | { style: 'normal'; text: string }
  | { style: 'bold'; text: string }
  | { style: 'exception'; text: string }
  | { style: 'clock'; hour: number; minute: number };

export function InlineFormattedText({
  fallback,
  text,
}: {
  fallback?: string;
  text: string;
}) {
  const value = htmlToInlineFormatting(text || fallback || '');
  const pattern = /\*\*([^*]+)\*\*|\[\[verb-exception\]\]([\s\S]*?)\[\[\/verb-exception\]\]|\[\[clock\s+hour=(\d+)\s+minute=(\d+)\s*\]\]/g;
  const parts: InlinePart[] = [];
  let cursor = 0;
  let match = pattern.exec(value);

  while (match) {
    if (match.index > cursor) {
      parts.push({
        style: 'normal',
        text: value.slice(cursor, match.index),
      });
    }
    if (match[3] !== undefined && match[4] !== undefined) {
      parts.push({
        style: 'clock',
        hour: Number(match[3]),
        minute: Number(match[4]),
      });
    } else {
      parts.push({
        style: match[1] !== undefined ? 'bold' : 'exception',
        text: match[1] ?? match[2],
      });
    }
    cursor = match.index + match[0].length;
    match = pattern.exec(value);
  }

  if (cursor < value.length) {
    parts.push({ style: 'normal', text: value.slice(cursor) });
  }

  return (
    <span className="custom-block__inline-formatted-text">
      {parts.flatMap((part, index) => (
        part.style === 'clock'
          ? [
            <img
              alt=""
              aria-hidden="true"
              className="custom-block__clock"
              key={`clock-${index}-${part.hour}-${part.minute}`}
              src={`/api/time-clock?hour=${part.hour}&minute=${part.minute}`}
            />,
          ]
          : part.text.split('\n').map((line, lineIndex, lines) => (
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
