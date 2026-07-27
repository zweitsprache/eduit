import { Fragment } from 'react';

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
  const value = text || fallback || '';
  const pattern = /\*\*([^*]+)\*\*/g;
  const parts: Array<{ bold: boolean; text: string }> = [];
  let cursor = 0;
  let match = pattern.exec(value);

  while (match) {
    if (match.index > cursor) {
      parts.push({
        bold: false,
        text: value.slice(cursor, match.index),
      });
    }
    parts.push({ bold: true, text: match[1] });
    cursor = match.index + match[0].length;
    match = pattern.exec(value);
  }

  if (cursor < value.length) {
    parts.push({ bold: false, text: value.slice(cursor) });
  }

  return (
    <span className="custom-block__inline-formatted-text">
      {parts.map((part, index) => (
        <Fragment key={`${index}-${part.text}`}>
          {part.bold ? <strong>{part.text}</strong> : part.text}
        </Fragment>
      ))}
    </span>
  );
}
