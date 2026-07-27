"use client";

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function markupToHtml(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replaceAll('\n', '<br>');
}

function serializeNodes(nodes: Node[]) {
  let value = '';

  nodes.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      value += node.textContent ?? '';
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') {
      value += '\n';
      return;
    }

    const isBlock = node.tagName === 'DIV' || node.tagName === 'P';
    if (isBlock && value && !value.endsWith('\n')) value += '\n';
    const content = serializeNodes(Array.from(node.childNodes));
    value += node.tagName === 'STRONG' || node.tagName === 'B'
      ? (content ? `**${content}**` : '')
      : content;
    if (
      isBlock
      && index < nodes.length - 1
      && !value.endsWith('\n')
    ) value += '\n';
  });

  return value;
}

function serializeInput(root: HTMLElement) {
  return serializeNodes(Array.from(root.childNodes));
}

export function InlineFormattedInput({
  ariaLabel,
  className,
  multiline = false,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel: string;
  className?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  const synchronize = () => {
    const root = rootRef.current;
    if (!root) return;
    const html = markupToHtml(value);
    if (root.innerHTML !== html) root.innerHTML = html;
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root || document.activeElement === root) return;
    synchronize();
  }, [value]);

  const emitChange = (event: FormEvent<HTMLDivElement>) => {
    onChange(serializeInput(event.currentTarget));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key.toLocaleLowerCase() === 'b'
      && (event.metaKey || event.ctrlKey)
      && !event.altKey
    ) {
      event.preventDefault();
      document.execCommand('bold');
      onChange(serializeInput(event.currentTarget));
      return;
    }
    if (!multiline && event.key === 'Enter') event.preventDefault();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, multiline
      ? text
      : text.replace(/\r?\n/g, ' '));
  };

  return (
    <div
      aria-label={ariaLabel}
      aria-multiline={multiline}
      className={className}
      contentEditable
      data-placeholder={placeholder}
      onBlur={synchronize}
      onInput={emitChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      ref={rootRef}
      role="textbox"
      suppressContentEditableWarning
    />
  );
}
