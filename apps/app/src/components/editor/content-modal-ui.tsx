"use client";

import type { ReactNode } from 'react';
import {
  ChevronDown,
  ChevronUp,
  PlusSquare,
  Trash01,
} from '@untitledui/icons';
import { BookOpen } from 'lucide-react';
import {
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components';
import { Toggle } from '@/components/base/toggle/toggle';

export function ContentFieldLabel({
  action,
  children,
  className = '',
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="text-sm font-semibold text-secondary">{children}</span>
      {action}
    </div>
  );
}

export function ContentSectionHeader({
  className = 'mt-6',
  count,
  children,
}: {
  className?: string;
  count?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${className} flex items-center justify-between gap-3`}>
      <p className="text-sm font-semibold text-secondary">{children}</p>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-quaternary">{count}</span>
      )}
    </div>
  );
}

export function ContentCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-secondary bg-secondary p-2.5">
      {children}
    </div>
  );
}

export function ContentItemGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2">
      {children}
    </div>
  );
}

export function ContentItemNumber({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
      {children}
    </span>
  );
}

export function ContentAddButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      <PlusSquare className="size-4" />
      {children}
    </button>
  );
}

export function ContentInlineAddButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-3 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:text-primary disabled:opacity-100"
    >
      {children}
    </button>
  );
}

export function ContentSecondaryButton({
  children,
  className = '',
  disabled,
  icon,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function ContentOptionButtonGroup({
  ariaLabel,
  className = '',
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: Array<{ label: ReactNode; value: string }>;
  value: string;
}) {
  return (
    <ToggleButtonGroup
      aria-label={ariaLabel}
      disallowEmptySelection
      selectionMode="single"
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const selected = [...keys][0];
        if (selected !== undefined) onChange(String(selected));
      }}
      className={`flex w-full gap-2 ${className || 'mt-3'}`}
    >
      {options.map((option) => (
        <ToggleButton
          id={option.value}
          key={option.value}
          className={({ isFocusVisible, isHovered, isSelected }) => [
            'relative flex min-w-0 flex-1 items-center justify-center rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-secondary outline-none',
            isHovered && !isSelected ? 'z-10 bg-primary_hover text-secondary_hover' : '',
            isSelected ? 'z-20 bg-active text-primary ring-1 ring-inset ring-primary' : '',
            isFocusVisible ? 'z-30 ring-2 ring-brand ring-offset-1' : '',
          ].filter(Boolean).join(' ')}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function ContentSwitchGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
      {children}
    </div>
  );
}

export function ContentSwitch({
  isDisabled,
  isSelected,
  label,
  labelClassName = '',
  onChange,
}: {
  isDisabled?: boolean;
  isSelected: boolean;
  label: string;
  labelClassName?: string;
  onChange: (selected: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
      <Toggle
        aria-label={label}
        isDisabled={isDisabled}
        isSelected={isSelected}
        onChange={onChange}
        size="md"
      />
      <span className={labelClassName}>{label}</span>
    </div>
  );
}

export function CorrectState({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`size-4 shrink-0 rounded-[3px] border transition ${
        checked
          ? 'border-fg-success-primary bg-fg-success-primary'
          : 'border-primary bg-primary hover:border-secondary'
      }`}
    />
  );
}

export function ContentItemActions({
  canDelete,
  canMoveDown,
  canMoveUp,
  label,
  onDelete,
  onMoveDown,
  onMoveUp,
}: {
  canDelete: boolean;
  canMoveDown: boolean;
  canMoveUp: boolean;
  label: string;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
}) {
  const buttonClass =
    'flex size-8 items-center justify-center rounded-md text-quaternary transition hover:bg-primary_hover hover:text-secondary disabled:cursor-not-allowed disabled:opacity-25';
  return (
    <div className="flex self-start items-center">
      <button type="button" aria-label={`Move ${label} up`} disabled={!canMoveUp} onClick={onMoveUp} className={buttonClass}>
        <ChevronUp className="size-4" />
      </button>
      <button type="button" aria-label={`Move ${label} down`} disabled={!canMoveDown} onClick={onMoveDown} className={buttonClass}>
        <ChevronDown className="size-4" />
      </button>
      <button type="button" aria-label={`Delete ${label}`} disabled={!canDelete} onClick={onDelete} className={`${buttonClass} hover:text-error-primary`}>
        <Trash01 className="size-4" />
      </button>
    </div>
  );
}

export function ContentManual({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 border-t border-secondary pt-5">
      <BookOpen aria-label="Editing guide" className="size-5 text-secondary" />
      <div className="mt-4 space-y-4 text-sm leading-6 text-tertiary">
        {children}
      </div>
    </div>
  );
}

export function ContentManualItem({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
      <span className="mt-1 flex min-h-5 items-center justify-center text-secondary">
        {icon}
      </span>
      <p>
        <strong className="block font-semibold text-secondary">{title}</strong>
        {children}
      </p>
    </div>
  );
}
