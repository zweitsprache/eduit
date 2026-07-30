"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  generateWeatherItems,
  WEATHER_KINDS,
  WEATHER_WEEKDAYS,
  type WeatherItem,
  type WeatherMode,
} from '@/lib/weather-activities';

export type WeatherAttrs = {
  instruction: string;
  mode: WeatherMode;
  items: WeatherItem[];
  questionOrder: string[];
};

export const DEFAULT_WEATHER_ATTRS: WeatherAttrs = {
  instruction: 'Wähle die Aussage, die zur Wetterkarte passt.',
  mode: 'mcq',
  questionOrder: [],
  items: generateWeatherItems({
    count: 4,
    mode: 'mcq',
    weatherKinds: ['sunny', 'cloudy', 'rain', 'snow'],
    minTemperature: -5,
    maxTemperature: 28,
  }),
};

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
  const itemsById = new Map(attrs.items.map((item) => [item.id, item]));
  const questionItems = [
    ...(attrs.questionOrder ?? [])
      .map((id) => itemsById.get(id))
      .filter((item): item is WeatherItem => Boolean(item)),
    ...attrs.items.filter((item) => !(attrs.questionOrder ?? []).includes(item.id)),
  ];
  return (
    <CustomBlockRoot selected={selected} className="weather-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
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
      <div className="weather-node__items">
        {questionItems.map((item, index) => (
          <div
            className={[
              'weather-node__item',
              attrs.mode === 'trueFalse' ? 'weather-node__item--true-false' : '',
            ].join(' ')}
            key={item.id}
          >
            <span className="custom-block__row-index matching-pairs-node__letter">
              {String.fromCharCode(97 + index)}
            </span>
            {attrs.mode === 'mcq' ? (
              <div className="weather-node__options">
                {item.options.map((option) => (
                  <div className="weather-node__option" key={option.id}>
                    <BlockChoiceIndicator checked={false} />
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <span className="weather-node__statement">{item.statement}</span>
                <span className="weather-node__true-false">
                  <span><BlockChoiceIndicator checked={false} /> Richtig</span>
                  <span><BlockChoiceIndicator checked={false} /> Falsch</span>
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
