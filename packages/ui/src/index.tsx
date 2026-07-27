import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';

export function EduitLogo({
  className,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  return (
    <img
      src="/logo/eduit_logo.svg"
      alt="Eduit"
      className={className}
      {...props}
    />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  tone?: 'primary' | 'secondary';
};

export function ButtonLink({
  tone = 'primary',
  className = '',
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={`button-link button-link--${tone} ${className}`.trim()}
      {...props}
    />
  );
}
