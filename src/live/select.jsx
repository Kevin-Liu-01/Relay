import React, { useRef, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, KeyRound } from 'lucide-react';
import './select.css';

// Only operator controls use this primitive; Slack remains its own environment.
export function RelaySelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Choose an option',
  placeholderIcon,
  emptyText = 'No options available',
  disabled = false,
  className = '',
  wide = false,
}) {
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState(undefined);
  const [keyboard, setKeyboard] = useState(false);
  const selected = options.find((option) => String(option.value) === String(value));
  return (
    <Select.Root
      value={String(value ?? '')}
      onValueChange={onChange}
      disabled={disabled}
      open={open && !disabled}
      onOpenChange={(next) => {
        // Native dialogs live in the top layer: keep their menus inside them.
        setContainer(trigger.current?.closest('dialog') ?? undefined);
        setOpen(next);
      }}
    >
      <Select.Trigger
        ref={trigger}
        className={`relay-select ${className}`}
        aria-label={label}
        title={selected?.label ?? placeholder}
        onPointerDownCapture={() => setKeyboard(false)}
        onKeyDownCapture={() => setKeyboard(true)}
      >
        <span className="relay-select-glyph" aria-hidden="true">
          {selected?.icon ?? placeholderIcon}
        </span>
        <span className="relay-select-value">
          <Select.Value placeholder={placeholder}>{selected?.label}</Select.Value>
        </span>
        <Select.Icon className="relay-select-chevron">
          <ChevronDown size={14} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container}>
        <Select.Content
          className={`relay-select-menu ${wide ? 'relay-select-menu-wide' : ''}`}
          position="popper"
          sideOffset={7}
          collisionPadding={12}
          data-keyboard={keyboard ? '' : undefined}
          aria-label={label}
          onEscapeKeyDown={(event) => {
            // One Escape dismisses this menu, not the enclosing native dialog.
            event.preventDefault();
            setOpen(false);
          }}
        >
          <Select.ScrollUpButton className="relay-select-scroll">
            <ChevronUp size={14} aria-hidden="true" />
          </Select.ScrollUpButton>
          <Select.Viewport className="relay-select-options">
            {options.length ? (
              options.map((option) => (
                <Select.Item
                  className="relay-select-option"
                  key={option.value}
                  value={String(option.value)}
                  textValue={option.label}
                  disabled={option.disabled}
                  title={option.disabled ? option.disabledReason : option.label}
                >
                  <span className="relay-select-option-glyph" aria-hidden="true">
                    {option.icon}
                  </span>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="relay-select-check">
                    <Check size={15} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))
            ) : (
              <Select.Item className="relay-select-option" value="__empty__" disabled>
                <KeyRound size={16} aria-hidden="true" />
                <Select.ItemText>{emptyText}</Select.ItemText>
              </Select.Item>
            )}
          </Select.Viewport>
          <Select.ScrollDownButton className="relay-select-scroll">
            <ChevronDown size={14} aria-hidden="true" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
