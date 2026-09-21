"use client";

import * as React from "react";
import { ArrowLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";

type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "step" | "min" | "max" | "inputMode"
> & {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  dragSensitivity?: number;
  icon?: React.ReactNode;
  onValueChange?: (value: number) => void;
};

function getPrecision(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const valueAsString = value.toString().toLowerCase();

  if (valueAsString.includes("e-")) {
    const exponent = Number(valueAsString.split("e-")[1]);
    return Number.isFinite(exponent) ? exponent : 0;
  }

  const decimalPart = valueAsString.split(".")[1];
  return decimalPart?.length ?? 0;
}

function formatValue(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function parseValue(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function NumberInput({
  className,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  dragSensitivity = 8,
  icon = <ArrowLeftRight className="size-4" />,
  onValueChange,
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  disabled,
  readOnly,
  ...props
}: NumberInputProps) {
  const isControlled = value !== undefined;
  const safeStep = step === 0 ? 1 : Math.abs(step);
  const stepPrecision = getPrecision(safeStep);

  const normalizeValue = React.useCallback(
    (nextValue: number) => {
      let normalized = nextValue;

      if (min !== undefined) {
        normalized = Math.max(normalized, min);
      }

      if (max !== undefined) {
        normalized = Math.min(normalized, max);
      }

      return Number(normalized.toFixed(stepPrecision));
    },
    [max, min, stepPrecision]
  );

  const resolveInitialValue = React.useCallback(() => {
    const initial = value ?? defaultValue ?? min ?? 0;
    return normalizeValue(initial);
  }, [defaultValue, min, normalizeValue, value]);

  const committedValueRef = React.useRef<number>(resolveInitialValue());
  const [displayValue, setDisplayValue] = React.useState<string>(() =>
    formatValue(resolveInitialValue())
  );
  const [isDragging, setIsDragging] = React.useState(false);

  const pointerIdRef = React.useRef<number | null>(null);
  const dragStartXRef = React.useRef(0);
  const dragStartValueRef = React.useRef(resolveInitialValue());
  const bodyCursorRef = React.useRef<string | null>(null);
  const bodyUserSelectRef = React.useRef<string | null>(null);

  const applyBodyDragStyles = React.useCallback((active: boolean) => {
    if (typeof document === "undefined") {
      return;
    }

    if (active) {
      bodyCursorRef.current = document.body.style.cursor;
      bodyUserSelectRef.current = document.body.style.userSelect;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      return;
    }

    document.body.style.cursor = bodyCursorRef.current ?? "";
    document.body.style.userSelect = bodyUserSelectRef.current ?? "";
    bodyCursorRef.current = null;
    bodyUserSelectRef.current = null;
  }, []);

  const commitValue = React.useCallback(
    (nextValue: number, emit = true) => {
      const normalized = normalizeValue(nextValue);
      committedValueRef.current = normalized;
      setDisplayValue(formatValue(normalized));

      if (emit) {
        onValueChange?.(normalized);
      }
    },
    [normalizeValue, onValueChange]
  );

  React.useEffect(() => {
    if (!isControlled) {
      return;
    }

    const next = normalizeValue(value ?? committedValueRef.current);
    committedValueRef.current = next;
    setDisplayValue(formatValue(next));
  }, [isControlled, normalizeValue, value]);

  React.useEffect(() => {
    if (isControlled) {
      return;
    }

    const next = normalizeValue(committedValueRef.current);

    if (next !== committedValueRef.current) {
      committedValueRef.current = next;
      setDisplayValue(formatValue(next));
    }
  }, [isControlled, normalizeValue]);

  React.useEffect(() => {
    return () => applyBodyDragStyles(false);
  }, [applyBodyDragStyles]);

  const commitFromDisplay = React.useCallback(
    (emit = true) => {
      const parsed = parseValue(displayValue);

      if (parsed === null) {
        setDisplayValue(formatValue(committedValueRef.current));
        return;
      }

      commitValue(parsed, emit);
    },
    [commitValue, displayValue]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || readOnly) {
      return;
    }

    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartValueRef.current = parseValue(displayValue) ?? committedValueRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    applyBodyDragStyles(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || readOnly || pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    const stepsMoved = deltaX / Math.max(1, dragSensitivity);
    commitValue(dragStartValueRef.current + stepsMoved * safeStep);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    setIsDragging(false);
    applyBodyDragStyles(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && !readOnly && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? 1 : -1;
      const start = parseValue(displayValue) ?? committedValueRef.current;
      commitValue(start + direction * safeStep);
      event.currentTarget.select();
    } else if (!disabled && !readOnly && event.key === "Enter") {
      commitFromDisplay();
      event.currentTarget.select();
    }

    onKeyDown?.(event);
  };

  return (
    <div
      data-slot="number-input"
      className={cn(
        "border-input dark:bg-input/30 flex h-10 w-full min-w-0 rounded-xl border bg-transparent text-sm shadow-md shadow-shade transition-all duration-150 ease-out hover:border-border/0 hover:bg-muted hover:shadow-none hover:duration-75",
        "focus-within:border-primary focus-within:ring-primary/30 focus-within:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div
        data-slot="number-input-scrubber"
        className={cn(
          "text-muted-foreground hover:text-foreground flex h-full shrink-0 items-center justify-center px-3 transition-colors touch-none select-none",
          disabled || readOnly ? "cursor-not-allowed" : "cursor-ew-resize",
          isDragging && "text-foreground"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        aria-hidden="true"
      >
        {icon}
      </div>
      <input
        data-slot="number-input-input"
        type="text"
        inputMode={safeStep % 1 === 0 ? "numeric" : "decimal"}
        value={displayValue}
        min={min}
        max={max}
        step={safeStep}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-full w-full min-w-0 bg-transparent px-4 py-2 text-right outline-none disabled:cursor-not-allowed"
        )}
        onChange={(event) => setDisplayValue(event.target.value)}
        onClick={(event) => {
          event.currentTarget.select();
          onClick?.(event);
        }}
        onFocus={(event) => {
          onFocus?.(event);
        }}
        onBlur={(event) => {
          commitFromDisplay();
          onBlur?.(event);
        }}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
}

export { NumberInput };
