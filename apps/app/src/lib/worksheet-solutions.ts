import type { ArticlePluralAttrs } from '@/components/editor/article-plural-node';
import type { ChooseCorrectWordsAttrs } from '@/components/editor/choose-correct-words-node';
import type { DialogueAttrs } from '@/components/editor/dialogue-node';
import type { DominoAttrs } from '@/components/editor/domino-node';
import type { ErrorCorrectionAttrs } from '@/components/editor/error-correction-node';
import type { FamilyKinshipAttrs } from '@/components/editor/family-kinship-node';
import type { FillInTheBlankAttrs } from '@/components/editor/fill-in-the-blank-node';
import type { InlineChoiceAttrs } from '@/components/editor/inline-choice-node';
import type { MatchingPairsAttrs } from '@/components/editor/matching-pairs-node';
import type { MCHAttrs } from '@/components/editor/mch-node';
import type { MCMAttrs } from '@/components/editor/mcm-node';
import type { MCQAttrs } from '@/components/editor/mcq-node';
import type { MiniFormAttrs } from '@/components/editor/mini-form-node';
import type { OrderingAttrs } from '@/components/editor/ordering-node';
import type { RewriteSentencesAttrs } from '@/components/editor/rewrite-sentences-node';
import type { SortingCategoriesAttrs } from '@/components/editor/sorting-categories-node';
import type { TimeMatchingAttrs } from '@/components/editor/time-matching-node';
import type { TrueFalseAttrs } from '@/components/editor/true-false-node';
import type { WeatherAttrs } from '@/components/editor/weather-node';
import type { WorksheetTableAttrs } from '@/components/editor/worksheet-table-node';
import type { InformationGapActivityAttrs } from '@/components/editor/information-gap-activity-node';
import type { WordGridAttrs } from '@/components/editor/word-grid-node';

type SolutionNode = {
  descendants?: (callback: (node: SolutionNode) => boolean | void) => void;
  attrs?: Record<string, unknown>;
  type?: {
    name?: string;
  };
};

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function hasMeaningfulText(value: unknown): boolean {
  const normalized = asString(value);
  return Boolean(normalized && normalized.length > 0);
}

function hasMeaningfulAnswerList(values: unknown): boolean {
  if (!Array.isArray(values)) return false;
  return values.some((value) => hasMeaningfulText(value));
}

function hasMeaningfulBooleanAnswers(rows: unknown): boolean {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const candidate = row as Record<string, unknown>;
    const correctValue = candidate.correctValue;
    return correctValue === 'true' || correctValue === 'false' || correctValue === 'na';
  });
}

function hasMeaningfulArticlePluralAnswers(rows: unknown): boolean {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const candidate = row as Record<string, unknown>;
    const articles = Array.isArray(candidate.articles) ? candidate.articles : [];
    const article = candidate.article;
    const plural = asString(candidate.plural);
    return articles.some((value) => value === 'der' || value === 'das' || value === 'die')
      || article === 'der' || article === 'das' || article === 'die'
      || Boolean(plural && plural.length > 0);
  });
}

function hasMeaningfulMatchingPairsAnswers(pairs: unknown): boolean {
  if (!Array.isArray(pairs)) return false;
  return pairs.some((pair) => {
    if (!pair || typeof pair !== 'object') return false;
    const candidate = pair as Record<string, unknown>;
    return hasMeaningfulText(candidate.rightText) || hasMeaningfulText(candidate.leftText);
  });
}

export function hasMeaningfulSolutions(doc: SolutionNode | null | undefined): boolean {
  if (!doc) return false;
  let found = false;

  doc.descendants?.((node: SolutionNode) => {
    if (found) return false;
    const attrs = (node.attrs ?? {}) as Record<string, unknown>;
    switch (node.type?.name) {
      case 'mcq': {
        const blockAttrs = attrs as MCQAttrs;
        const questions = Array.isArray(blockAttrs.questions)
          ? blockAttrs.questions
          : [{ question: blockAttrs.question, options: blockAttrs.options }];
        found = questions.some((question) => {
          if (!question || typeof question !== 'object') return false;
          const candidate = question as Record<string, unknown>;
          const options = Array.isArray(candidate.options) ? candidate.options : [];
          return options.some((option) => {
            if (!option || typeof option !== 'object') return false;
            const opt = option as Record<string, unknown>;
            return opt.correct === true;
          });
        });
        break;
      }
      case 'mcm': {
        const blockAttrs = attrs as MCMAttrs;
        found = Array.isArray(blockAttrs.rows)
          && blockAttrs.rows.some((row) => Array.isArray(row?.options)
            && row.options.some((option) => option?.correct === true));
        break;
      }
      case 'mch': {
        const blockAttrs = attrs as MCHAttrs;
        found = Array.isArray(blockAttrs.rows)
          && blockAttrs.rows.some((row) => row?.correctOptionId != null && row.correctOptionId.length > 0);
        break;
      }
      case 'trueFalse': {
        const blockAttrs = attrs as TrueFalseAttrs;
        found = hasMeaningfulBooleanAnswers(blockAttrs.rows);
        break;
      }
      case 'weather': {
        const blockAttrs = attrs as WeatherAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => (
            typeof item?.statementCorrect === 'boolean'
            || (Array.isArray(item?.options)
              && item.options.some((option) => option?.correct === true))
          ));
        break;
      }
      case 'fillInTheBlank': {
        const blockAttrs = attrs as FillInTheBlankAttrs;
        found = hasMeaningfulText(blockAttrs.text);
        break;
      }
      case 'matchingPairs': {
        const blockAttrs = attrs as MatchingPairsAttrs;
        found = Array.isArray(blockAttrs.pairs)
          && blockAttrs.pairs.some((pair) => {
            if (!pair || typeof pair !== 'object') return false;
            const candidate = pair as Record<string, unknown>;
            return hasMeaningfulText(candidate.left) || hasMeaningfulText(candidate.right);
          });
        break;
      }
      case 'dialogue': {
        const blockAttrs = attrs as DialogueAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Record<string, unknown>;
            const text = asString(candidate.text);
            return Boolean(text && /\{\{blank:([^{}]+)\}\}/i.test(text));
          });
        break;
      }
      case 'worksheetTable': {
        const blockAttrs = attrs as WorksheetTableAttrs;
        found = Array.isArray(blockAttrs.rows)
          && blockAttrs.rows.some((row) => Array.isArray(row?.cells)
            && row.cells.some((cell) => hasMeaningfulText(cell?.answer)));
        break;
      }
      case 'informationGapActivity': {
        const blockAttrs = attrs as InformationGapActivityAttrs;
        found = Array.isArray(blockAttrs.rows)
          && blockAttrs.rows.some((row) => !row?.isHeader
            && row?.cells
            && Object.values(row.cells).some(hasMeaningfulText));
        break;
      }
      case 'ordering': {
        const blockAttrs = attrs as OrderingAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Record<string, unknown>;
            return hasMeaningfulText(candidate.text);
          });
        break;
      }
      case 'rewriteSentences': {
        const blockAttrs = attrs as RewriteSentencesAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Record<string, unknown>;
            return hasMeaningfulText(candidate.solution);
          });
        break;
      }
      case 'sortingCategories': {
        const blockAttrs = attrs as SortingCategoriesAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => Boolean(item?.categoryId));
        break;
      }
      case 'familyKinship': {
        const blockAttrs = attrs as FamilyKinshipAttrs;
        found = Array.isArray(blockAttrs.riddles)
          && blockAttrs.riddles.some((riddle) => {
            if (!riddle || typeof riddle !== 'object') return false;
            const candidate = riddle as Record<string, unknown>;
            return candidate.answerMode === 'open'
              ? hasMeaningfulText(candidate.answer)
              : candidate.answerMode === 'trueFalse'
                ? hasMeaningfulBooleanAnswers(candidate.rows)
                : hasMeaningfulText(candidate.correctOptionId);
          });
        break;
      }
      case 'miniForm': {
        const blockAttrs = attrs as MiniFormAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Record<string, unknown>;
            const values = candidate.values;
            if (!values || typeof values !== 'object') return false;
            return Object.values(values as Record<string, unknown>).some((value) => hasMeaningfulText(value));
          });
        break;
      }
      case 'inlineChoice': {
        const blockAttrs = attrs as InlineChoiceAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Record<string, unknown>;
            const text = asString(candidate.text);
            return Boolean(text && /\{\{[^}]*\*[^}]*\}\}/i.test(text));
          });
        break;
      }
      case 'articlePlural': {
        const blockAttrs = attrs as ArticlePluralAttrs;
        found = hasMeaningfulArticlePluralAnswers(blockAttrs.rows);
        break;
      }
      case 'wordGrid': {
        const blockAttrs = attrs as WordGridAttrs;
        found = Array.isArray(blockAttrs.words)
          && blockAttrs.words.some((word) => hasMeaningfulText(word));
        break;
      }
      case 'domino': {
        const blockAttrs = attrs as DominoAttrs;
        found = Array.isArray(blockAttrs.pairs)
          && blockAttrs.pairs.some((pair) => {
            if (!pair || typeof pair !== 'object') return false;
            const candidate = pair as Record<string, unknown>;
            return hasMeaningfulText(candidate.left) || hasMeaningfulText(candidate.right);
          });
        break;
      }
      case 'chooseCorrectWords': {
        const blockAttrs = attrs as ChooseCorrectWordsAttrs;
        found = Array.isArray(blockAttrs.items)
          && blockAttrs.items.some((item) => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Record<string, unknown>;
            return hasMeaningfulText(candidate.word);
          });
        break;
      }
      case 'errorCorrection': {
        const blockAttrs = attrs as ErrorCorrectionAttrs;
        found = Array.isArray(blockAttrs.errors)
          && blockAttrs.errors.some((error) => {
            if (!error || typeof error !== 'object') return false;
            const candidate = error as Record<string, unknown>;
            return hasMeaningfulText(candidate.correct);
          });
        break;
      }
      case 'timeMatching': {
        const blockAttrs = attrs as TimeMatchingAttrs;
        found = Array.isArray(blockAttrs.times)
          && blockAttrs.times.some((time) => Boolean(time && typeof time === 'object'));
        break;
      }
      case 'learningCards': {
        found = true;
        break;
      }
      default:
        break;
    }

    return !found;
  });

  return found;
}
