import type { CSSProperties } from 'react';

const slides = [
  { type: 'multiple-choice', activeItem: 0 },
  { type: 'matching', activeItem: 1 },
  { type: 'fill-blanks', activeItem: 2 },
  { type: 'dialogue', activeItem: 3 },
] as const;

function Line({ width = '100%', strong = false }: { width?: string; strong?: boolean }) {
  return <span className={`editor-line ${strong ? 'editor-line--strong' : ''}`} style={{ width }} />;
}

function NavigationSkeleton({ activeItem }: { activeItem: number }) {
  return (
    <div className="editor-nav-skeleton">
      {Array.from({ length: 6 }, (_, index) => (
        <div className={`editor-nav-row ${index === activeItem ? 'editor-nav-row--active' : ''}`} key={index}>
          <span />
          <Line width={`${70 - (index % 3) * 8}%`} />
        </div>
      ))}
    </div>
  );
}

function InspectorSkeleton({ type }: { type: (typeof slides)[number]['type'] }) {
  const fields = type === 'dialogue' ? 2 : 3;
  return (
    <div className="editor-inspector-skeleton">
      <Line width="58%" strong />
      <Line width="38%" />
      {Array.from({ length: fields }, (_, index) => (
        <div className="inspector-field" key={index}>
          <Line width={`${52 + index * 7}%`} />
          <span />
        </div>
      ))}
    </div>
  );
}

function MultipleChoiceBlock() {
  return (
    <div className="canvas-block">
      <span className="block-image-skeleton" />
      {Array.from({ length: 3 }, (_, index) => (
        <div className="canvas-option" key={index}>
          <span className={`canvas-checkbox ${index === 1 ? 'canvas-checkbox--selected' : ''}`} />
          <Line width={`${52 + index * 12}%`} />
        </div>
      ))}
    </div>
  );
}

function MatchingBlock() {
  return (
    <div className="canvas-block matching-block">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="canvas-match" key={index}>
          <Line width={`${62 + index * 7}%`} />
          <span className="match-dots"><i /><i /></span>
          <Line width={`${74 - index * 8}%`} />
        </div>
      ))}
    </div>
  );
}

function FillBlanksBlock() {
  return (
    <div className="canvas-block blank-block">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="canvas-sentence" key={index}>
          <Line width={`${24 + index * 3}%`} />
          <span />
          <Line width={`${30 + (index % 2) * 8}%`} />
        </div>
      ))}
    </div>
  );
}

function DialogueBlock() {
  return (
    <div className="canvas-block dialogue-block">
      {Array.from({ length: 3 }, (_, index) => (
        <div className={`canvas-speech ${index % 2 ? 'canvas-speech--right' : ''}`} key={index}>
          <span className="speaker-dot" />
          <span className="speech-card">
            <Line width={`${68 - index * 8}%`} />
            <Line width={`${46 + index * 5}%`} />
          </span>
        </div>
      ))}
    </div>
  );
}

function CanvasSkeleton({ type }: { type: (typeof slides)[number]['type'] }) {
  return (
    <div className="editor-canvas-skeleton">
      <div className="canvas-page">
        <Line width="48%" strong />
        <Line width="72%" />
        {type === 'multiple-choice' && <MultipleChoiceBlock />}
        {type === 'matching' && <MatchingBlock />}
        {type === 'fill-blanks' && <FillBlanksBlock />}
        {type === 'dialogue' && <DialogueBlock />}
      </div>
      <div className="canvas-footer"><Line width="38%" /></div>
    </div>
  );
}

export function HeroSlideshow() {
  return (
    <div className="hero-slideshow" aria-hidden="true">
      {slides.map((slide, slideIndex) => (
        <div
          className="block-slide"
          key={slide.type}
          style={{ '--slide-index': slideIndex } as CSSProperties}
        >
          <div className="editor-layout-skeleton">
            <NavigationSkeleton activeItem={slide.activeItem} />
            <CanvasSkeleton type={slide.type} />
            <InspectorSkeleton type={slide.type} />
          </div>
        </div>
      ))}

      <div className="slide-progress">
        {slides.map((slide, index) => (
          <span key={slide.type} style={{ '--dot-index': index } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
