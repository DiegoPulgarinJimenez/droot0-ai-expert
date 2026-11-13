// @vitest-environment jsdom
import "./setup";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Alert,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  ErrorState,
  Field,
  Input,
  ToastProvider,
  useToast,
} from "@/components/ui";

describe("Button", () => {
  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole("button", { name: "Save changes" })).toHaveAttribute("type", "button");
  });

  it("blocks clicks and reports busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Field", () => {
  it("associates the label, hint, and error with the control", () => {
    render(
      <Field label="Email" hint="Use your university address." error="Enter a valid email.">
        {(control) => <Input type="email" {...control} />}
      </Field>,
    );

    const input = screen.getByLabelText("Email");

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Enter a valid email. Use your university address.");
  });

  it("does not mark the control invalid without an error", () => {
    render(<Field label="Name">{(control) => <Input {...control} />}</Field>);

    expect(screen.getByLabelText("Name")).toBeValid();
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-describedby");
  });
});

describe("Alert and ErrorState", () => {
  it("uses an assertive role for errors and a polite role for info", () => {
    render(
      <>
        <Alert variant="error" title="Request failed" />
        <Alert title="Heads up" />
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    expect(screen.getByRole("status")).toHaveTextContent("Heads up");
  });

  it("calls onRetry from the retry button", async () => {
    const onRetry = vi.fn();
    render(<ErrorState description="Conversations could not be loaded." onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});

function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete</Button>
      </DialogTrigger>
      <DialogContent title="Delete this conversation?" description="This cannot be undone.">
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens with an accessible name and description and moves focus inside", async () => {
    render(<DeleteDialog />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete this conversation?" });

    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    render(<DeleteDialog />);
    const trigger = screen.getByRole("button", { name: "Delete" });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});

describe("Dropdown", () => {
  it("opens from the keyboard and selects an item with Enter", async () => {
    const onSelect = vi.fn();
    render(
      <Dropdown>
        <DropdownTrigger asChild>
          <Button>Account</Button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onSelect={onSelect}>Sign out</DropdownItem>
        </DropdownContent>
      </Dropdown>,
    );

    screen.getByRole("button", { name: "Account" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});

function ToastTrigger({ duration }: { duration?: number }) {
  const { toast } = useToast();

  return (
    <Button onClick={() => toast({ title: "Changes saved", variant: "success", duration })}>
      Save
    </Button>
  );
}

describe("Toast", () => {
  it("announces a toast and removes it when dismissed", async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("status")).toHaveTextContent("Changes saved");

    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("dismisses itself after its duration", () => {
    vi.useFakeTimers();

    try {
      render(
        <ToastProvider>
          <ToastTrigger duration={1000} />
        </ToastProvider>,
      );

      act(() => screen.getByRole("button", { name: "Save" }).click());
      expect(screen.getByRole("status")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws a clear error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ToastTrigger />)).toThrow("useToast must be used inside <ToastProvider>.");
  });
});
