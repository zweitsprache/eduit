"use client";

import type { ReactNode } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";

export type ButtonColor = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends AriaButtonProps {
  color?: ButtonColor;
  size?: ButtonSize;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const sizes = sortCx({
  sm: "gap-1.5 rounded-lg px-3 py-2 text-sm",
  md: "gap-1.5 rounded-lg px-3.5 py-2.5 text-sm",
  lg: "gap-2 rounded-lg px-4 py-2.5 text-base",
  xl: "gap-2.5 rounded-lg px-4.5 py-3 text-base",
});

const colors = sortCx({
  primary:
    "bg-brand-solid text-primary_on-brand shadow-xs ring-1 ring-transparent hover:bg-brand-solid_hover",
  secondary:
    "bg-primary text-secondary shadow-xs ring-1 ring-inset ring-primary hover:bg-primary_hover hover:text-secondary_hover",
  tertiary:
    "bg-transparent text-tertiary hover:bg-primary_hover hover:text-tertiary_hover",
  destructive:
    "bg-error-solid text-white shadow-xs ring-1 ring-transparent hover:opacity-90",
});

export const Button = ({
  color = "primary",
  size = "md",
  iconLeading,
  iconTrailing,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <AriaButton
      {...props}
      className={cx(
        "relative inline-flex cursor-pointer items-center justify-center font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled disabled:ring-disabled",
        sizes[size],
        colors[color],
        className,
      )}
    >
      {iconLeading && <span className="shrink-0">{iconLeading}</span>}
      {children}
      {iconTrailing && <span className="shrink-0">{iconTrailing}</span>}
    </AriaButton>
  );
};
