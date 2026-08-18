"use client";

import { useEffect, useMemo, useState } from 'react';

type Card = {
  id: string;
  front: string;
  back: string;
};

function shuffle(values: number[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }
  return next;
}

function blankAnswer(payload: string) {
  const separator = payload.lastIndexOf('|');
  return (separator === -1 ? payload : payload.slice(0, separator)).trim();
}

function normalizeText(value: string, showAnswers: boolean) {
  return value.replace(/\{\{blank:([^{}]+)\}\}/gi, (_match, payload: string) => {
    const answer = blankAnswer(payload);
    return showAnswers ? answer : '_____';
  });
}

function textLines(value: string, showAnswers: boolean) {
  return normalizeText(value, showAnswers)
    .split(/\n{1,2}/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function LearnViewer({
  cards,
  title,
}: {
  cards: Card[];
  title: string;
}) {
  const baseOrder = useMemo(() => cards.map((_, index) => index), [cards]);
  const [queue, setQueue] = useState<number[]>(baseOrder);
  const [history, setHistory] = useState<number[]>([]);
  const [easyStreak, setEasyStreak] = useState<Record<number, number>>({});
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(baseOrder[0] ?? -1);
  const [flipped, setFlipped] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentCard = currentIndex >= 0 ? cards[currentIndex] : null;

  function restart(shuffleCards: boolean) {
    const order = shuffleCards ? shuffle(baseOrder) : baseOrder;
    setQueue(order);
    setHistory([]);
    setEasyStreak({});
    setMastered(new Set());
    setCurrentIndex(order[0] ?? -1);
    setFlipped(false);
    setCompleted(order.length === 0);
  }

  function advance(nextQueue: number[], previousCard: number) {
    if (!nextQueue.length) {
      setQueue([]);
      setCurrentIndex(-1);
      setCompleted(true);
      setFlipped(false);
      return;
    }
    setHistory((current) => [...current, previousCard]);
    setQueue(nextQueue);
    setCurrentIndex(nextQueue[0]);
    setFlipped(false);
  }

  function rateCurrent(easy: boolean) {
    if (currentIndex < 0) return;
    const cursor = queue.indexOf(currentIndex);
    const currentPos = cursor === -1 ? 0 : cursor;
    const reduced = [...queue.slice(0, currentPos), ...queue.slice(currentPos + 1)];
    const currentStreak = easyStreak[currentIndex] ?? 0;

    if (!easy) {
      setEasyStreak((state) => ({ ...state, [currentIndex]: 0 }));
      const insertAt = Math.min(1, reduced.length);
      const nextQueue = [
        ...reduced.slice(0, insertAt),
        currentIndex,
        ...reduced.slice(insertAt),
      ];
      setMastered((current) => {
        if (!current.has(currentIndex)) return current;
        const next = new Set(current);
        next.delete(currentIndex);
        return next;
      });
      advance(nextQueue, currentIndex);
      return;
    }

    const nextStreak = currentStreak + 1;
    setEasyStreak((state) => ({ ...state, [currentIndex]: nextStreak }));
    if (nextStreak >= 2) {
      setMastered((current) => {
        const next = new Set(current);
        next.add(currentIndex);
        return next;
      });
      advance(reduced, currentIndex);
      return;
    }

    const insertAt = Math.min(3, reduced.length);
    const nextQueue = [
      ...reduced.slice(0, insertAt),
      currentIndex,
      ...reduced.slice(insertAt),
    ];
    advance(nextQueue, currentIndex);
  }

  function nextCard() {
    if (completed || currentIndex < 0) return;
    const cursor = queue.indexOf(currentIndex);
    const currentPos = cursor === -1 ? 0 : cursor;
    const rotated = [...queue.slice(currentPos + 1), ...queue.slice(0, currentPos + 1)];
    advance(rotated, currentIndex);
  }

  function previousCard() {
    const previous = history[history.length - 1];
    if (previous === undefined) return;
    setHistory((current) => current.slice(0, -1));
    setCurrentIndex(previous);
    setFlipped(false);
  }

  useEffect(() => {
    if (!autoplay || completed || currentIndex < 0) return;
    const timeout = setTimeout(() => {
      if (flipped) {
        nextCard();
      } else {
        setFlipped(true);
      }
    }, flipped ? 1700 : 2500);
    return () => clearTimeout(timeout);
  }, [autoplay, completed, flipped, currentIndex, queue]);

  return (
    <main className="min-h-screen bg-tertiary px-4 pb-10 pt-6 text-primary">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <section className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-quaternary">Lernkarten</p>
          <h1 className="mt-1 text-xl font-semibold leading-tight text-primary">{title}</h1>
          <p className="mt-2 text-sm text-tertiary">
            {mastered.size} von {cards.length} Karten sicher • {queue.length} in Wiederholung
          </p>
        </section>

        <section className="relative rounded-xl border border-secondary bg-primary p-4 shadow-xs">
          {!currentCard || completed ? (
            <div className="py-10 text-center">
              <p className="text-lg font-semibold text-primary">Session abgeschlossen</p>
              <p className="mt-2 text-sm text-tertiary">Alle Karten wurden mindestens zweimal als einfach markiert.</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-solid_hover"
                  onClick={() => restart(false)}
                  type="button"
                >
                  Neu starten
                </button>
                <button
                  className="rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
                  onClick={() => restart(true)}
                  type="button"
                >
                  Neu starten und mischen
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-quaternary">
                Karte {String(currentIndex + 1).padStart(2, '0')} von {String(cards.length).padStart(2, '0')}
              </p>
              <div className="min-h-56 rounded-lg border border-secondary bg-primary p-4">
                {textLines(flipped ? currentCard.back : currentCard.front, flipped).map((line, index) => (
                  <p className="mb-3 text-base leading-relaxed" key={`${currentCard.id}-${index}`}>{line}</p>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="rounded-lg border border-secondary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
                  onClick={previousCard}
                  type="button"
                >
                  Zurück
                </button>
                <button
                  className="rounded-lg border border-secondary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
                  onClick={nextCard}
                  type="button"
                >
                  Weiter
                </button>
                <button
                  className="col-span-2 rounded-lg bg-brand-solid px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-solid_hover"
                  onClick={() => setFlipped((value) => !value)}
                  type="button"
                >
                  {flipped ? 'Vorderseite zeigen' : 'Karte umdrehen'}
                </button>
              </div>

              {flipped && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="rounded-lg border border-secondary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
                    onClick={() => rateCurrent(false)}
                    type="button"
                  >
                    Schwer
                  </button>
                  <button
                    className="rounded-lg border border-secondary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
                    onClick={() => rateCurrent(true)}
                    type="button"
                  >
                    Einfach
                  </button>
                </div>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm font-medium text-secondary">
                <input
                  checked={autoplay}
                  className="size-4 accent-brand"
                  onChange={(event) => setAutoplay(event.target.checked)}
                  type="checkbox"
                />
                Auto-Play (Flip + nächste Karte)
              </label>
            </>
          )}
        </section>
      </div>
    </main>
  );
}