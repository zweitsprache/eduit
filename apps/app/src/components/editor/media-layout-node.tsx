"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';

export type MediaLayoutMode =
  | 'full'
  | 'image-left'
  | 'image-right'
  | 'grid';
export type MediaLayoutColumns = 1 | 2 | 3 | 4;
export type MediaLayoutRatio = 'auto' | 'square' | 'four-three' | 'three-two' | 'wide';
export type MediaLayoutGap = 'none' | 'small' | 'medium' | 'large';
export type MediaLayoutRadius = 'none' | 'small' | 'medium' | 'large';

export type MediaLayoutItem = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  credit: string;
  href: string;
  focalX: number;
  focalY: number;
};

export type MediaLayoutAttrs = {
  layout: MediaLayoutMode;
  columns: MediaLayoutColumns;
  imageWidth: number;
  gap: MediaLayoutGap;
  aspectRatio: MediaLayoutRatio;
  fit: 'cover' | 'contain';
  radius: MediaLayoutRadius;
  showCaptions: boolean;
  text: string;
  textVertical: 'start' | 'center' | 'end';
  items: MediaLayoutItem[];
};

const DEFAULT_ITEM: MediaLayoutItem = {
  id: 'media-item-1',
  src: '/placeholders/rewrite-landscape.svg',
  alt: 'Worksheet illustration',
  caption: '',
  credit: '',
  href: '',
  focalX: 50,
  focalY: 50,
};

export const DEFAULT_MEDIA_LAYOUT_ATTRS: MediaLayoutAttrs = {
  layout: 'full',
  columns: 2,
  imageWidth: 50,
  gap: 'medium',
  aspectRatio: 'wide',
  fit: 'cover',
  radius: 'small',
  showCaptions: true,
  text: '',
  textVertical: 'start',
  items: [DEFAULT_ITEM],
};

function parseItems(value: string | null): MediaLayoutItem[] {
  if (!value) return [{ ...DEFAULT_ITEM }];
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) return [{ ...DEFAULT_ITEM }];
    const parsed = items.flatMap((item, index): MediaLayoutItem[] => (
      item && typeof item.src === 'string'
        ? [{
            id: typeof item.id === 'string' ? item.id : `media-item-${index + 1}`,
            src: item.src,
            alt: typeof item.alt === 'string' ? item.alt : '',
            caption: typeof item.caption === 'string' ? item.caption : '',
            credit: typeof item.credit === 'string' ? item.credit : '',
            href: typeof item.href === 'string' ? item.href : '',
            focalX: Number.isFinite(Number(item.focalX))
              ? Math.min(100, Math.max(0, Number(item.focalX)))
              : 50,
            focalY: Number.isFinite(Number(item.focalY))
              ? Math.min(100, Math.max(0, Number(item.focalY)))
              : 50,
          }]
        : []
    ));
    return parsed.length ? parsed : [{ ...DEFAULT_ITEM }];
  } catch {
    return [{ ...DEFAULT_ITEM }];
  }
}

function safeLink(value: string) {
  const normalized = value.trim();
  return /^(?:https?:|mailto:|tel:)/i.test(normalized) ? normalized : '';
}

function textToHtml(value: string) {
  if (/<(?:p|div|br|strong|b|em|i|ul|ol|li|a)\b/i.test(value)) return value;
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '<br>');
}

export function MediaLayoutContent({ attrs }: { attrs: MediaLayoutAttrs }) {
  const imageWidth = Math.min(99, Math.max(1, Number(attrs.imageWidth) || 50));
  const splitStyle = attrs.layout === 'image-left'
    ? { gridTemplateColumns: `${imageWidth}% minmax(0, 1fr)` }
    : attrs.layout === 'image-right'
      ? { gridTemplateColumns: `minmax(0, 1fr) ${imageWidth}%` }
      : undefined;
  const media = (
    <div className="media-layout-node__media" data-columns={attrs.columns}>
      {attrs.items.map((item) => {
        const href = safeLink(item.href);
        const image = (
          <img
            alt={item.alt}
            className="media-layout-node__image"
            src={item.src}
            style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
          />
        );
        return (
          <figure className="media-layout-node__item" key={item.id}>
            {href ? (
              <a href={href} rel="noreferrer" target="_blank">
                {image}
              </a>
            ) : image}
            {attrs.showCaptions && (item.caption || item.credit) && (
              <figcaption className="media-layout-node__caption">
                {item.caption && <span>{item.caption}</span>}
                {item.credit && (
                  <span className="media-layout-node__credit">{item.credit}</span>
                )}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
  const text = attrs.text && (
    <div
      className="media-layout-node__text"
      dangerouslySetInnerHTML={{ __html: textToHtml(attrs.text) }}
    />
  );

  return (
    <div
      className="media-layout-node__layout"
      data-aspect-ratio={attrs.aspectRatio}
      data-fit={attrs.fit}
      data-gap={attrs.gap}
      data-layout={attrs.layout}
      data-radius={attrs.radius}
      data-text-vertical={attrs.textVertical}
      style={splitStyle}
    >
      {attrs.layout === 'image-right' ? <>{text}{media}</> : <>{media}{text}</>}
    </div>
  );
}

function MediaLayoutNodeView({ node, selected }: NodeViewProps) {
  return (
    <CustomBlockRoot selected={selected} className="media-layout-node">
      <MediaLayoutContent attrs={node.attrs as MediaLayoutAttrs} />
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaLayout: {
      insertMediaLayout: (attrs?: Partial<MediaLayoutAttrs>) => ReturnType;
    };
  }
}

export const MediaLayout = Node.create({
  name: 'mediaLayout',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    const encoded = (
      key: keyof Pick<MediaLayoutAttrs, 'text'>,
      fallback = '',
    ) => ({
      default: fallback,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute(`data-media-${key}`);
        if (!value) return fallback;
        try {
          return decodeURIComponent(value);
        } catch {
          return fallback;
        }
      },
      renderHTML: (attributes: MediaLayoutAttrs) => ({
        [`data-media-${key}`]: encodeURIComponent(attributes[key]),
      }),
    });
    return {
      layout: {
        default: DEFAULT_MEDIA_LAYOUT_ATTRS.layout,
        parseHTML: (element) => element.getAttribute('data-media-layout') ?? 'full',
        renderHTML: (attributes) => ({ 'data-media-layout': attributes.layout }),
      },
      columns: {
        default: 2,
        parseHTML: (element) => Math.min(4, Math.max(1, Number(
          element.getAttribute('data-media-columns') ?? 2,
        ))),
        renderHTML: (attributes) => ({ 'data-media-columns': attributes.columns }),
      },
      imageWidth: {
        default: 50,
        parseHTML: (element) => {
          const explicit = Number(element.getAttribute('data-media-image-width'));
          if (Number.isFinite(explicit) && explicit > 0 && explicit < 100) {
            return explicit;
          }
          const legacy = element.getAttribute('data-media-split');
          if (legacy === 'one-third') return 33;
          if (legacy === 'two-thirds') return 66;
          return 50;
        },
        renderHTML: (attributes) => ({
          'data-media-image-width': attributes.imageWidth,
        }),
      },
      gap: {
        default: 'medium',
        parseHTML: (element) => element.getAttribute('data-media-gap') ?? 'medium',
        renderHTML: (attributes) => ({ 'data-media-gap': attributes.gap }),
      },
      aspectRatio: {
        default: 'wide',
        parseHTML: (element) => element.getAttribute('data-media-aspect') ?? 'wide',
        renderHTML: (attributes) => ({ 'data-media-aspect': attributes.aspectRatio }),
      },
      fit: {
        default: 'cover',
        parseHTML: (element) => element.getAttribute('data-media-fit') ?? 'cover',
        renderHTML: (attributes) => ({ 'data-media-fit': attributes.fit }),
      },
      radius: {
        default: 'small',
        parseHTML: (element) => element.getAttribute('data-media-radius') ?? 'small',
        renderHTML: (attributes) => ({ 'data-media-radius': attributes.radius }),
      },
      showCaptions: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-media-captions') !== 'false',
        renderHTML: (attributes) => ({
          'data-media-captions': String(attributes.showCaptions),
        }),
      },
      text: encoded('text'),
      textVertical: {
        default: 'start',
        parseHTML: (element) => element.getAttribute('data-media-text-vertical') ?? 'start',
        renderHTML: (attributes) => ({
          'data-media-text-vertical': attributes.textVertical,
        }),
      },
      items: {
        default: [DEFAULT_ITEM],
        parseHTML: (element) => parseItems(element.getAttribute('data-media-items')),
        renderHTML: (attributes) => ({
          'data-media-items': encodeURIComponent(JSON.stringify(attributes.items)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="media-layout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'media-layout' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaLayoutNodeView);
  },

  addCommands() {
    return {
      insertMediaLayout:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: { ...DEFAULT_MEDIA_LAYOUT_ATTRS, ...attrs },
        }),
    };
  },
});
