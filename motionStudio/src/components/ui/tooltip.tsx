import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Replaces the native `title` attribute for icon-only controls. `title` waits
 * about a second before appearing and can't be styled, which is a poor fit for
 * a toolbar where most buttons carry no visible label at all.
 *
 * `delayDuration={200}` is deliberate: fast enough to feel like an answer to
 * hovering, slow enough not to flash while the pointer crosses the toolbar.
 */
function TooltipProvider({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-studio-md bg-studio-overlay px-2 py-1 text-[11px] text-studio-text ring-1 ring-studio-border-strong shadow-md duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

/**
 * The common case: an icon button plus a label.
 *
 * NOT usable inside another `asChild` trigger (a PopoverTrigger, say) — that
 * parent would clone *this* component with its props and ref, and they'd stop
 * here instead of reaching the button, leaving the control dead. Compose the
 * primitives directly in that case so both `asChild` layers land on the same
 * element.
 */
function TooltipHint({
  label,
  shortcut,
  side = "bottom",
  children,
}: {
  label: string
  shortcut?: string
  side?: "top" | "bottom" | "left" | "right"
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        <span className="flex items-center gap-1.5">
          {label}
          {shortcut && (
            <span className="text-studio-text-faint font-mono">{shortcut}</span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipContent, TooltipHint, TooltipProvider, TooltipTrigger }
