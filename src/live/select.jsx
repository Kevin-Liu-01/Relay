import React, { useLayoutEffect, useRef, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, KeyRound } from 'lucide-react';
import './select.css';

function SelectOptions({ children }) {
  const viewport = useRef(null);
  const content = useRef(null);
  useLayoutEffect(() => {
    const element = viewport.current;
    const menu = element.closest('.relay-select-menu');
    // Closed Radix content is mounted in a detached fragment for item lookup.
    if (!menu) return;
    let frame;
    const measure = () => {
      const menuStyle = getComputedStyle(menu);
      const viewportStyle = getComputedStyle(element);
      const available =
        parseFloat(menuStyle.maxHeight) -
        parseFloat(menuStyle.borderTopWidth) -
        parseFloat(menuStyle.borderBottomWidth);
      const needed =
        content.current.offsetHeight +
        parseFloat(viewportStyle.paddingTop) +
        parseFloat(viewportStyle.paddingBottom);
      // Compare natural content with the menu limit, not the already-shrunken
      // viewport. Otherwise reserved arrow space can keep a short menu overflowing.
      menu.toggleAttribute('data-scrollable', needed > available);
      // Radix updates its arrow visibility on scroll, but not on a size change.
      element.dispatchEvent(new Event('scroll'));
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(menu);
    observer.observe(element);
    observer.observe(content.current);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      menu.removeAttribute('data-scrollable');
    };
  }, []);
  return (
    <Select.Viewport className="relay-select-options" ref={viewport}>
      <div ref={content}>{children}</div>
    </Select.Viewport>
  );
}

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
  id,
  open: controlledOpen,
  onOpenChange,
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
      open={(controlledOpen ?? open) && !disabled}
      onOpenChange={(next) => {
        // Native dialogs live in the top layer: keep their menus inside them.
        setContainer(trigger.current?.closest('dialog') ?? undefined);
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <Select.Trigger
        ref={trigger}
        id={id}
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
          onKeyDownCapture={() => setKeyboard(true)}
          onPointerMoveCapture={(event) => {
            if (event.movementX || event.movementY) setKeyboard(false);
          }}
          onEscapeKeyDown={(event) => {
            // One Escape dismisses this menu, not the enclosing native dialog.
            event.preventDefault();
            setOpen(false);
            onOpenChange?.(false);
          }}
        >
          {/* Reserve both arrow slots only when content exceeds the menu limit.
              Keep them fixed while scrolling so a clicked row cannot move. */}
          <div className="relay-select-scroll-slot">
            <Select.ScrollUpButton className="relay-select-scroll">
              <ChevronUp size={14} aria-hidden="true" />
            </Select.ScrollUpButton>
          </div>
          <SelectOptions>
            {options.length ? (
              options.map((option) => (
                <Select.Item
                  className="relay-select-option"
                  key={option.value}
                  value={String(option.value)}
                  textValue={option.label}
                  disabled={option.disabled}
                  title={option.disabled ? option.disabledReason : option.label}
                  onPointerLeave={(event) => {
                    // Keyboard scrolling can move the hovered row under a still
                    // pointer. That layout event must not erase keyboard focus.
                    if (keyboard) event.preventDefault();
                  }}
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
          </SelectOptions>
          <div className="relay-select-scroll-slot">
            <Select.ScrollDownButton className="relay-select-scroll">
              <ChevronDown size={14} aria-hidden="true" />
            </Select.ScrollDownButton>
          </div>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
