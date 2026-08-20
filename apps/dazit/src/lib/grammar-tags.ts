import taxonomy from '@/data/daz-grammar-taxonomy.json';

type GrammarTagNode = {
  id?: string;
  label?: string;
  children?: GrammarTagNode[];
};

type GrammarTaxonomy = {
  grammar?: GrammarTagNode[];
};

function collect(nodes: GrammarTagNode[], target: Map<string, string>) {
  nodes.forEach((node) => {
    const id = typeof node.id === 'string' ? node.id.trim() : '';
    const label = typeof node.label === 'string' ? node.label.trim() : '';
    if (id && label && !target.has(id)) {
      target.set(id, label);
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      collect(node.children, target);
    }
  });
}

const labelById = new Map<string, string>();
const taxonomyData = taxonomy as GrammarTaxonomy;
const grammarNodes: GrammarTagNode[] = Array.isArray(taxonomyData.grammar)
  ? taxonomyData.grammar
  : [];
collect(grammarNodes, labelById);

export const GRAMMAR_TAG_LABEL_BY_ID = labelById;
