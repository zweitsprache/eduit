import taxonomy from '../data/daz-grammar-taxonomy.json';

type GrammarTagNode = {
  id?: string;
  label?: string;
  children?: GrammarTagNode[];
};

type GrammarTagOption = {
  id: string;
  label: string;
  pathLabel: string;
};

type GrammarTaxonomy = {
  grammar?: GrammarTagNode[];
};

function collectGrammarTagOptions(
  nodes: GrammarTagNode[],
  path: string[],
  target: GrammarTagOption[],
) {
  nodes.forEach((node) => {
    const label = typeof node.label === 'string' ? node.label.trim() : '';
    const id = typeof node.id === 'string' ? node.id.trim() : '';
    const nextPath = label ? [...path, label] : path;

    if (id && label) {
      target.push({
        id,
        label,
        pathLabel: nextPath.join(' > '),
      });
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      collectGrammarTagOptions(node.children, nextPath, target);
    }
  });
}

const rawOptions: GrammarTagOption[] = [];
const grammarNodes = Array.isArray((taxonomy as GrammarTaxonomy).grammar)
  ? (taxonomy as GrammarTaxonomy).grammar
  : [];
collectGrammarTagOptions(grammarNodes, [], rawOptions);

const dedupedById = new Map<string, GrammarTagOption>();
rawOptions.forEach((option) => {
  if (!dedupedById.has(option.id)) {
    dedupedById.set(option.id, option);
  }
});

export const GRAMMAR_TAG_OPTIONS = [...dedupedById.values()];

export const GRAMMAR_TAG_ID_SET = new Set(
  GRAMMAR_TAG_OPTIONS.map((option) => option.id),
);

export const GRAMMAR_TAG_LABEL_BY_ID = new Map(
  GRAMMAR_TAG_OPTIONS.map((option) => [option.id, option.pathLabel]),
);
