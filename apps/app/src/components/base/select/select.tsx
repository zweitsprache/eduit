"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from "react-aria-components";
import { Check, ChevronDown, Search } from "lucide-react";
import { cx } from "@/utils/cx";

export type SelectOption = {
  label: string;
  value: string;
};

export function Select({
  ariaLabel,
  onChange,
  options,
  placeholder = "Select an option",
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
}) {
  return (
    <AriaSelect
      aria-label={ariaLabel}
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(String(key))}
      className="w-full"
    >
      <Button className="flex w-full items-center justify-between gap-2 rounded-md border border-primary bg-primary px-3 py-2 text-left text-sm text-secondary outline-none transition hover:bg-primary_hover focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand">
        <SelectValue className="min-w-0 flex-1 truncate data-[placeholder]:text-placeholder">
          {({ selectedText }) => selectedText || placeholder}
        </SelectValue>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-quaternary" />
      </Button>
      <Popover
        placement="bottom start"
        className="z-[90] w-[var(--trigger-width)] overflow-hidden rounded-md border border-secondary bg-primary shadow-lg"
      >
        <ListBox className="max-h-72 overflow-y-auto p-1 outline-none">
          {options.map((option) => (
            <ListBoxItem
              id={option.value}
              key={option.value}
              textValue={option.label}
              className={({ isFocused, isSelected }) => cx(
                "flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm text-secondary outline-none",
                isFocused && "bg-primary_hover",
                isSelected && "font-semibold text-primary",
              )}
            >
              {({ isSelected }) => (
                <>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden="true" className="size-4" />}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SearchSelect({
  ariaLabel,
  onChange,
  options,
  placeholder = "Search options",
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label
    ?? "";
  const [inputValue, setInputValue] = useState(selectedLabel);

  useEffect(() => {
    setInputValue(selectedLabel);
  }, [selectedLabel]);

  const filteredOptions = useMemo(() => {
    const query = inputValue.trim().toLocaleLowerCase();
    if (!query || inputValue === selectedLabel) return options;
    return options.filter((option) => (
      option.label.toLocaleLowerCase().includes(query)
    ));
  }, [inputValue, options, selectedLabel]);

  return (
    <ComboBox
      aria-label={ariaLabel}
      inputValue={inputValue}
      menuTrigger="focus"
      selectedKey={value || null}
      onInputChange={setInputValue}
      onSelectionChange={(key) => {
        const nextValue = key === null ? "" : String(key);
        onChange(nextValue);
        setInputValue(
          options.find((option) => option.value === nextValue)?.label ?? "",
        );
      }}
      className="w-full"
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-quaternary"
        />
        <Input
          placeholder={placeholder}
          className="w-full rounded-md border border-primary bg-primary py-2 pr-9 pl-9 text-sm font-normal text-secondary outline-none transition placeholder:text-placeholder hover:bg-primary_hover focus:border-brand focus:ring-2 focus:ring-brand"
        />
        <Button className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-quaternary outline-none">
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <Popover
        placement="bottom start"
        className="z-[90] w-[var(--trigger-width)] overflow-hidden rounded-md border border-secondary bg-primary shadow-lg"
      >
        <ListBox
          items={filteredOptions}
          className="max-h-72 overflow-y-auto p-1 outline-none"
          renderEmptyState={() => (
            <p className="px-2.5 py-3 text-sm text-quaternary">
              No subjects found
            </p>
          )}
        >
          {(option) => (
            <ListBoxItem
              id={option.value}
              textValue={option.label}
              className={({ isFocused, isSelected }) => cx(
                "flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm text-secondary outline-none",
                isFocused && "bg-primary_hover",
                isSelected && "font-semibold text-primary",
              )}
            >
              {({ isSelected }) => (
                <>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden="true" className="size-4" />}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
