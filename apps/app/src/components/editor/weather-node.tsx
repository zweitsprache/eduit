"use client";

import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';
import {
  generateWeatherItems,
  WEATHER_KINDS,
  WEATHER_WEEKDAYS,
  type WeatherItem,
  type WeatherKind,
  type WeatherMode,
} from '@/lib/weather-activities';

export type WeatherAttrs = {
  instruction: string;
  mode: WeatherMode;
  items: WeatherItem[];
  questionOrder: string[];
  showInstruction: boolean;
  weatherKinds: WeatherKind[] | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  shuffleQuestions: boolean | null;
  varyWeekdayAndCity: boolean;
};

export const WEATHER_MCQ_INSTRUCTION = 'Welche Information ist richtig? Kreuzen Sie an.';
export const WEATHER_TRUE_FALSE_INSTRUCTION = 'Ist die Information richtig oder falsch? Kreuzen Sie an.';

export const DEFAULT_WEATHER_ATTRS: WeatherAttrs = {
  instruction: WEATHER_MCQ_INSTRUCTION,
  mode: 'mcq',
  questionOrder: [],
  showInstruction: true,
  weatherKinds: ['sunny', 'cloudy', 'rain', 'snow'],
  minTemperature: -5,
  maxTemperature: 28,
  shuffleQuestions: false,
  varyWeekdayAndCity: true,
  items: generateWeatherItems({
    count: 4,
    mode: 'mcq',
    weatherKinds: ['sunny', 'cloudy', 'rain', 'snow'],
    minTemperature: -5,
    maxTemperature: 28,
  }),
};

const LEGACY_WEATHER_INSTRUCTIONS = new Set([
  'Wähle die Aussage, die zur Wetterkarte passt.',
  'Entscheide, ob die Aussage zur Wetterkarte passt.',
]);

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

function WeatherNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as WeatherAttrs;
  const instruction = LEGACY_WEATHER_INSTRUCTIONS.has(attrs.instruction.trim())
    ? attrs.mode === 'trueFalse'
      ? WEATHER_TRUE_FALSE_INSTRUCTION
      : WEATHER_MCQ_INSTRUCTION
    : attrs.instruction;
  const answersRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(answersRef);
  const itemsById = new Map(attrs.items.map((item) => [item.id, item]));
  const questionItems = [
    ...(attrs.questionOrder ?? [])
      .map((id) => itemsById.get(id))
      .filter((item): item is WeatherItem => Boolean(item)),
    ...attrs.items.filter((item) => !(attrs.questionOrder ?? []).includes(item.id)),
  ];
  const questionsRandomized = questionItems.some(
    (item, index) => item.id !== attrs.items[index]?.id,
  );
  return (
    <CustomBlockRoot selected={selected} className="weather-node">
      {attrs.showInstruction !== false ? (
        <BlockInstruction>{instruction}</BlockInstruction>
      ) : null}
      <div className="weather-node__cards">
        {attrs.items.map((item, index) => {
          const weather = WEATHER_KINDS.find(({ value }) => value === item.weather);
          const weekday = item.weekday ?? WEATHER_WEEKDAYS[index % WEATHER_WEEKDAYS.length];
          return (
            <div className="weather-node__card-wrap" key={item.id}>
              <div className="weather-node__number-row">
                <span className="custom-block__row-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="weather-node__card">
                <span className="weather-node__weekday">{weekday}</span>
                <span className="weather-node__city">{item.city}</span>
                <img
                  alt={weather?.label ?? item.weather}
                  className="weather-node__icon"
                  src={weather?.icon}
                />
                <span className="weather-node__temperature">
                  {item.temperature} °C
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="weather-node__items" ref={answersRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        {questionItems.map((item, index) => (
          <div
            className={[
              'weather-node__item',
              attrs.mode === 'trueFalse'
                ? 'weather-node__item--true-false'
                : 'weather-node__item--mcq',
            ].join(' ')}
            key={item.id}
          >
            {attrs.mode === 'trueFalse' ? (
              <span className={`custom-block__row-index weather-node__item-badge weather-node__item-badge--true-false${
                questionsRandomized ? ' matching-pairs-node__letter' : ''
              }`}>
                {questionsRandomized
                  ? String.fromCharCode(97 + index)
                  : String(index + 1).padStart(2, '0')}
              </span>
            ) : null}
            {attrs.mode === 'mcq' ? (
              <div className="weather-node__options">
                {item.options.map((option, optionIndex) => (
                  <div className="weather-node__option" key={option.id}>
                    <span
                      aria-hidden={optionIndex === 0 ? undefined : true}
                      className={`custom-block__row-index weather-node__item-badge weather-node__item-badge--mcq${
                        questionsRandomized ? ' matching-pairs-node__letter' : ''
                      }${
                        optionIndex === 0 ? '' : ' weather-node__item-badge--placeholder'
                      }`}
                    >
                      {questionsRandomized
                        ? String.fromCharCode(97 + index)
                        : String(index + 1).padStart(2, '0')}
                    </span>
                    <BlockChoiceIndicator
                      checked={false}
                      solutionKey={option.correct ? option.id : undefined}
                    />
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <span className="weather-node__statement">{item.statement}</span>
                <span className="weather-node__true-false">
                  <span>
                    <BlockChoiceIndicator
                      checked={false}
                      solutionKey={item.statementCorrect ? `${item.id}:true` : undefined}
                    /> Richtig
                  </span>
                  <span>
                    <BlockChoiceIndicator
                      checked={false}
                      solutionKey={!item.statementCorrect ? `${item.id}:false` : undefined}
                    /> Falsch
                  </span>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    weather: {
      insertWeather: (attrs?: Partial<WeatherAttrs>) => ReturnType;
    };
  }
}

export const Weather = Node.create({
  name: 'weather',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_WEATHER_ATTRS.instruction,
        parseHTML: (element) => element.getAttribute('data-instruction')
          ?? DEFAULT_WEATHER_ATTRS.instruction,
        renderHTML: ({ instruction }) => ({ 'data-instruction': instruction }),
      },
      mode: {
        default: DEFAULT_WEATHER_ATTRS.mode,
        parseHTML: (element) => element.getAttribute('data-mode') ?? 'mcq',
        renderHTML: ({ mode }) => ({ 'data-mode': mode }),
      },
      items: {
        default: DEFAULT_WEATHER_ATTRS.items,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-items'),
          DEFAULT_WEATHER_ATTRS.items,
        ),
        renderHTML: ({ items }) => ({
          'data-items': encodeURIComponent(JSON.stringify(items)),
        }),
      },
      questionOrder: {
        default: DEFAULT_WEATHER_ATTRS.questionOrder,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-question-order'),
          DEFAULT_WEATHER_ATTRS.questionOrder,
        ),
        renderHTML: ({ questionOrder }) => ({
          'data-question-order': encodeURIComponent(JSON.stringify(questionOrder)),
        }),
      },
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-show-instruction') !== 'false'
        ),
        renderHTML: ({ showInstruction }) => ({
          'data-show-instruction': String(showInstruction),
        }),
      },
      weatherKinds: {
        default: null,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-weather-kinds'),
          null,
        ),
        renderHTML: ({ weatherKinds }) => ({
          'data-weather-kinds': weatherKinds == null
            ? undefined
            : encodeURIComponent(JSON.stringify(weatherKinds)),
        }),
      },
      minTemperature: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-min-temperature');
          return value === null ? null : Number(value);
        },
        renderHTML: ({ minTemperature }) => ({
          'data-min-temperature': minTemperature == null ? undefined : String(minTemperature),
        }),
      },
      maxTemperature: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-max-temperature');
          return value === null ? null : Number(value);
        },
        renderHTML: ({ maxTemperature }) => ({
          'data-max-temperature': maxTemperature == null ? undefined : String(maxTemperature),
        }),
      },
      shuffleQuestions: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-shuffle-questions');
          return value === null ? null : value === 'true';
        },
        renderHTML: ({ shuffleQuestions }) => ({
          'data-shuffle-questions': shuffleQuestions == null
            ? undefined
            : String(shuffleQuestions),
        }),
      },
      varyWeekdayAndCity: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-vary-weekday-city') !== 'false'
        ),
        renderHTML: ({ varyWeekdayAndCity }) => ({
          'data-vary-weekday-city': String(varyWeekdayAndCity),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="weather"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'weather' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(WeatherNodeView);
  },
  addCommands() {
    return {
      insertWeather: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { ...DEFAULT_WEATHER_ATTRS, ...attrs },
      }),
    };
  },
});
