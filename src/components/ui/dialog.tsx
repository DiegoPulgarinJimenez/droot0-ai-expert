"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { CloseIcon } from "./icons";

/**
 * Modal dialog built on Radix Dialog, which provides the focus trap, focus
 * return to the trigger, Escape to close, and scroll locking.
 *
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Delete</Button></DialogTrigger>
 *     <DialogContent title="Delete conversation?" description="This cannot be undone.">
 *       <DialogFooter>
 *         <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
 *         <Button variant="danger">Delete conversation</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  /** Required: names the dialog for assistive technology. */
  title: string;
  description?: string;
  children?: ReactNode;
};

export function DialogContent({
  title,
  description,
  children,
  className,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-overlay-in bg-ink/50" />
      <DialogPrimitive.Content
        // Without a description Radix expects aria-describedby to be opted out explicitly.
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 animate-pop-in rounded-dialog bg-surface shadow-overlay",
          "max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto p-6",
          className,
        )}
        {...props}
      >
        <div className="space-y-1.5 pr-8">
          <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-ink">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-sm leading-6 text-ink-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        {children}
        <DialogPrimitive.Close
          aria-label="Close dialog"
          className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <CloseIcon />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-4 space-y-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
