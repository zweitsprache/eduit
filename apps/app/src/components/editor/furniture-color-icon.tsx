"use client";

function fillMaskFor(src: string) {
  return src
    .replace('/moebel/', '/moebel/fills/')
    .replace(/\.svg$/, '.png');
}

export function FurnitureColorIcon({
  alt,
  className = '',
  color,
  src,
}: {
  alt: string;
  className?: string;
  color: string;
  src: string;
}) {
  const mask = `url(${fillMaskFor(src)})`;
  return (
    <span
      aria-label={alt}
      className={`furniture-color-icon ${className}`}
      role="img"
    >
      <span
        aria-hidden="true"
        className="furniture-color-icon__fill"
        style={{
          backgroundColor: color,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="furniture-color-icon__outline"
        src={src}
      />
    </span>
  );
}
