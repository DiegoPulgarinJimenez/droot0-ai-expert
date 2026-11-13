"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Menu built on Radix DropdownMenu, which provides arrow-key navigation,
 * typeahead, Escape to close, and focus return to the trigger.
 *
 *   <Dropdown>
 *     <DropdownTrigger asChild><Button variant="secondary">Account</Button></DropdownTrigger>
 *     <DropdownContent>
 *       <DropdownLabel>Signed in as ada@example.com</DropdownLabel>
 *       <DropdownSeparator />
 *       <DropdownItem onSelect={signOut}>Sign out</DropdownItem>
 *     </DropdownContent>
 *   </Dropdown>
 */
export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-48 animate-pop-in rounded-card border border-line bg-surface p-1 shadow-overlay",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

type DropdownItemProps = ComponentProps<typeof DropdownPrimitive.Item> & {
  /** Styles the item as a destructive action. */
  destructive?: boolean;
};

export function DropdownItem({ destructive = false, className, ...props }: DropdownItemProps) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-control px-3 py-2 text-sm outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:text-ink-subtle",
        destructive
          ? "text-danger data-highlighted:bg-danger-soft"
          : "text-ink data-highlighted:bg-sunken",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn("px-3 py-2 text-xs font-medium text-ink-muted", className)}
      {...props}
    />
  );
}

export function DropdownSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-line", className)} {...props} />
  );
}
