"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  FileImage,
  FileMusic,
  FilePlay,
  FileText,
  Mail,
  MoreHorizontal,
  Paperclip,
  Phone,
  User,
  Video,
} from 'lucide-react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type MessengerMessage = {
  id: string;
  side: 'incoming' | 'outgoing';
  text: string;
  time: string;
};

export type MessengerAttrs = {
  contactName: string;
  status: string;
  messages: MessengerMessage[];
};

export type EmailAttrs = {
  fromName: string;
  fromAddress: string;
  to: string;
  date: string;
  subject: string;
  body: string;
  attachmentType: 'none' | 'document' | 'image' | 'video' | 'audio';
  attachmentName: string;
};

export const DEFAULT_MESSENGER_MESSAGES: MessengerMessage[] = [
  {
    id: 'messenger-message-1',
    side: 'incoming',
    text: 'Hallo! Hast du heute Zeit?',
    time: '09:41',
  },
  {
    id: 'messenger-message-2',
    side: 'outgoing',
    text: 'Ja, gerne. Treffen wir uns um 18 Uhr?',
    time: '09:43',
  },
];

export const DEFAULT_MESSENGER_ATTRS: MessengerAttrs = {
  contactName: 'Anna Keller',
  status: 'online',
  messages: DEFAULT_MESSENGER_MESSAGES,
};

export const DEFAULT_EMAIL_ATTRS: EmailAttrs = {
  fromName: 'Anna Keller',
  fromAddress: 'anna.keller@example.ch',
  to: 'michael@example.ch',
  date: '12. August 2026, 09:41',
  subject: 'Unser Termin',
  body: 'Guten Tag Michael\n\nVielen Dank für deine Nachricht. Der vorgeschlagene Termin passt für mich.\n\nFreundliche Grüsse\nAnna',
  attachmentType: 'none',
  attachmentName: '',
};

function cloneDefaultMessages() {
  return DEFAULT_MESSENGER_MESSAGES.map((message) => ({ ...message }));
}

function parseMessages(value: string | null): MessengerMessage[] {
  if (!value) return cloneDefaultMessages();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return cloneDefaultMessages();
    const messages = parsed.flatMap((message, index): MessengerMessage[] => (
      message
      && typeof message === 'object'
      && typeof message.text === 'string'
        ? [{
          id: typeof message.id === 'string'
            ? message.id
            : `messenger-message-${index + 1}`,
          side: message.side === 'outgoing' ? 'outgoing' : 'incoming',
          text: message.text,
          time: typeof message.time === 'string' ? message.time : '',
        }]
        : []
    ));
    return messages.length ? messages : cloneDefaultMessages();
  } catch {
    return cloneDefaultMessages();
  }
}

function textAttribute(key: string, name: string, fallback = '') {
  return {
    default: fallback,
    parseHTML: (element: HTMLElement) => (
      decodeURIComponent(element.getAttribute(name) ?? '')
    ),
    renderHTML: (attributes: Record<string, string>) => ({
      [name]: encodeURIComponent(attributes[key] ?? ''),
    }),
  };
}

function MessengerNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as MessengerAttrs;

  return (
    <CustomBlockRoot selected={selected} className="messenger-node">
      <div className="messenger-node__window">
        <header className="messenger-node__header">
          <span className="messenger-node__avatar" aria-hidden="true">
            <User />
          </span>
          <span className="messenger-node__identity">
            <strong>{attrs.contactName}</strong>
            <small>{attrs.status}</small>
          </span>
          <span className="messenger-node__actions" aria-hidden="true">
            <Phone />
            <Video />
            <MoreHorizontal />
          </span>
        </header>
        <div className="messenger-node__messages">
          {attrs.messages.map((message) => (
            <div
              className="messenger-node__message"
              data-side={message.side}
              key={message.id}
            >
              <p>{message.text}</p>
              {message.time && <time>{message.time}</time>}
            </div>
          ))}
        </div>
      </div>
    </CustomBlockRoot>
  );
}

function EmailNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as EmailAttrs;
  const AttachmentIcon = {
    document: FileText,
    image: FileImage,
    video: FilePlay,
    audio: FileMusic,
  }[attrs.attachmentType as Exclude<EmailAttrs['attachmentType'], 'none'>];
  return (
    <CustomBlockRoot selected={selected} className="email-node">
      <article className="email-node__window">
        <header className="email-node__toolbar">
          <Mail aria-hidden="true" />
          <span aria-hidden="true" />
          <MoreHorizontal aria-hidden="true" />
        </header>
        <div className="email-node__heading">
          <h3>{attrs.subject}</h3>
          <time>{attrs.date}</time>
        </div>
        <dl className="email-node__addresses">
          <div>
            <dt>Von</dt>
            <dd>
              <strong>{attrs.fromName}</strong>
              {attrs.fromAddress.trim() && <> &lt;{attrs.fromAddress}&gt;</>}
            </dd>
          </div>
          <div>
            <dt>An</dt>
            <dd>{attrs.to}</dd>
          </div>
          {attrs.attachmentType !== 'none' && attrs.attachmentName && (
            <Paperclip
              aria-label="Attachment"
              className="email-node__header-attachment"
            />
          )}
        </dl>
        <div className="email-node__body">
          {attrs.body.split(/\n{2,}/).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 20)}`}>
              {paragraph.split('\n').map((line, lineIndex) => (
                <span key={`${lineIndex}-${line}`}>
                  {lineIndex > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          ))}
          {AttachmentIcon && attrs.attachmentName && (
            <div className="email-node__attachment">
              <AttachmentIcon aria-hidden="true" />
              <span>{attrs.attachmentName}</span>
            </div>
          )}
        </div>
      </article>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    messenger: {
      insertMessenger: (attrs?: Partial<MessengerAttrs>) => ReturnType;
    };
    email: {
      insertEmail: (attrs?: Partial<EmailAttrs>) => ReturnType;
    };
  }
}

export const Messenger = Node.create({
  name: 'messenger',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      contactName: textAttribute(
        'contactName',
        'data-contact-name',
        DEFAULT_MESSENGER_ATTRS.contactName,
      ),
      status: textAttribute('status', 'data-status', DEFAULT_MESSENGER_ATTRS.status),
      messages: {
        default: DEFAULT_MESSENGER_MESSAGES,
        parseHTML: (element) => parseMessages(element.getAttribute('data-messages')),
        renderHTML: (attributes) => ({
          'data-messages': encodeURIComponent(JSON.stringify(attributes.messages)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="messenger"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'messenger' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MessengerNodeView);
  },

  addCommands() {
    return {
      insertMessenger: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: {
          ...DEFAULT_MESSENGER_ATTRS,
          ...attrs,
          messages: attrs.messages ?? cloneDefaultMessages(),
        },
      }),
    };
  },
});

export const Email = Node.create({
  name: 'email',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      fromName: textAttribute('fromName', 'data-from-name', DEFAULT_EMAIL_ATTRS.fromName),
      fromAddress: textAttribute(
        'fromAddress',
        'data-from-address',
        DEFAULT_EMAIL_ATTRS.fromAddress,
      ),
      to: textAttribute('to', 'data-to', DEFAULT_EMAIL_ATTRS.to),
      date: textAttribute('date', 'data-date', DEFAULT_EMAIL_ATTRS.date),
      subject: textAttribute('subject', 'data-subject', DEFAULT_EMAIL_ATTRS.subject),
      body: textAttribute('body', 'data-body', DEFAULT_EMAIL_ATTRS.body),
      attachmentType: textAttribute(
        'attachmentType',
        'data-attachment-type',
        DEFAULT_EMAIL_ATTRS.attachmentType,
      ),
      attachmentName: textAttribute(
        'attachmentName',
        'data-attachment-name',
        DEFAULT_EMAIL_ATTRS.attachmentName,
      ),
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="email"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'email' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmailNodeView);
  },

  addCommands() {
    return {
      insertEmail: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { ...DEFAULT_EMAIL_ATTRS, ...attrs },
      }),
    };
  },
});