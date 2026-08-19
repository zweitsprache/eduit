import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export type PageArea = {
  top: number;
  bottom: number;
};

export function getEditorPageAreas(editor: HTMLElement | null): PageArea[] {
  if (!editor) return [];
  const headers = Array.from(editor.querySelectorAll<HTMLElement>('.tiptap-page-header'));
  const footers = Array.from(editor.querySelectorAll<HTMLElement>('.tiptap-page-footer'));
  return headers.flatMap((header, index) => {
    const footer = footers[index];
    if (!footer) return [];
    const top = header.getBoundingClientRect().bottom;
    const bottom = footer.getBoundingClientRect().top;
    return bottom > top ? [{ top, bottom }] : [];
  });
}

export function getSectionStartsFromPageBreaks(
  doc: ProseMirrorNode,
  getPageForPosition: ((pos: number) => number) | undefined,
  pageCount: number,
) {
  const restartPages: number[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'pageBreak' || node.attrs.restartPagination !== true) {
      return true;
    }
    const breakPage = getPageForPosition?.(pos);
    if (breakPage && breakPage >= 1) {
      const restartPage = Math.min(pageCount, breakPage);
      if (restartPage > 1) restartPages.push(restartPage);
    }
    return false;
  });

  return Array.from(new Set([1, ...restartPages])).sort((left, right) => left - right);
}