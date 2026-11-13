"use client";

import { useState, type ReactNode } from "react";
import { Cluster, Container, Grid, Stack } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Spinner,
  Textarea,
  useToast,
} from "@/components/ui";

const swatches = [
  ["canvas", "bg-canvas"],
  ["surface", "bg-surface"],
  ["sunken", "bg-sunken"],
  ["ink", "bg-ink"],
  ["ink-muted", "bg-ink-muted"],
  ["line-strong", "bg-line-strong"],
  ["primary", "bg-primary"],
  ["primary-soft", "bg-primary-soft"],
  ["danger", "bg-danger"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["code", "bg-code"],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-line pb-2 text-lg font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function UiKitShowcase() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  function simulateSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ variant: "success", title: "Changes saved" });
    }, 1200);
  }

  return (
    <main className="py-10">
      <Container>
        <Stack gap="xl">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">UI kit</h1>
            <p className="max-w-prose text-ink-muted">
              Development reference for the shared components. Everything on this page is sample
              content, and the page is not available in production.
            </p>
          </header>

          <Section title="Color">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {swatches.map(([name, className]) => (
                <li key={name} className="space-y-1.5">
                  <div className={`h-14 rounded-control border border-line ${className}`} />
                  <code className="text-xs text-ink-muted">{name}</code>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Typography">
            <Stack gap="sm">
              <p className="text-4xl font-bold tracking-tight">Understand the code you write</p>
              <p className="text-xl font-semibold tracking-tight">Section heading in Inter</p>
              <p className="max-w-prose leading-7 text-ink-muted">
                Body text is set in Inter. A closure is a function that keeps access to the
                variables of the scope where it was created, even after that scope has returned.
              </p>
              <pre className="overflow-x-auto rounded-card bg-code p-4 text-sm leading-6 text-code-ink">
                <code>{`function counter() {\n  let count = 0;\n  return () => ++count;\n}`}</code>
              </pre>
            </Stack>
          </Section>

          <Section title="Buttons">
            <Stack>
              <Cluster>
                <Button>Send message</Button>
                <Button variant="secondary">Cancel</Button>
                <Button variant="ghost">View history</Button>
                <Button variant="danger">Delete conversation</Button>
              </Cluster>
              <Cluster>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
                <Button loading={saving} onClick={simulateSave}>
                  {saving ? "Saving changes" : "Save changes"}
                </Button>
              </Cluster>
            </Stack>
          </Section>

          <Section title="Form controls">
            <Grid columns={2} gap="lg">
              <Field label="Email" hint="Use the address you registered with.">
                {(control) => <Input type="email" placeholder="ada@example.com" {...control} />}
              </Field>
              <Field label="Password" error="Enter at least 8 characters.">
                {(control) => <Input type="password" defaultValue="short" {...control} />}
              </Field>
              <Field label="System prompt">
                {(control) => (
                  <Textarea
                    defaultValue="You are AI Expert Chat, a programming expert assistant."
                    {...control}
                  />
                )}
              </Field>
              <Field label="Model" hint="Disabled controls cannot be edited.">
                {(control) => <Input disabled defaultValue="deepseek-chat" {...control} />}
              </Field>
            </Grid>
          </Section>

          <Section title="Badges and spinners">
            <Cluster gap="md">
              <Badge>USER</Badge>
              <Badge variant="primary">ADMIN</Badge>
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="danger">Failed</Badge>
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" className="text-primary" />
            </Cluster>
          </Section>

          <Section title="Cards">
            <Grid columns={3}>
              <Card>
                <CardHeader>
                  <CardTitle>Debugging</CardTitle>
                  <CardDescription>
                    Paste an error and the code around it to find the cause.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6">Card content goes here.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="secondary">
                    Ask about a bug
                  </Button>
                </CardFooter>
              </Card>
            </Grid>
          </Section>

          <Section title="Alerts">
            <Grid columns={2}>
              <Alert title="Changes apply to future messages only">
                Existing conversations keep the replies they already have.
              </Alert>
              <Alert variant="success" title="Role updated" />
              <Alert variant="warning" title="Too many requests">
                Wait a moment before sending another message.
              </Alert>
              <Alert
                variant="error"
                title="The assistant took too long to respond"
                action={
                  <Button size="sm" variant="secondary">
                    Try again
                  </Button>
                }
              >
                Your message was not sent.
              </Alert>
            </Grid>
          </Section>

          <Section title="Empty and error states">
            <Grid columns={2}>
              <EmptyState
                title="No conversations yet"
                description="Conversations appear here after you send your first message."
                action={<Button>Start a conversation</Button>}
              />
              <ErrorState
                description="Conversations could not be loaded. Check your connection and try again."
                onRetry={() => toast({ title: "Retry requested" })}
              />
            </Grid>
          </Section>

          <Section title="Dialog, dropdown, and toast">
            <Cluster gap="md">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="danger">Delete conversation</Button>
                </DialogTrigger>
                <DialogContent
                  title="Delete this conversation?"
                  description="The conversation and all of its messages will be removed. This cannot be undone."
                >
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="danger">Delete conversation</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dropdown>
                <DropdownTrigger asChild>
                  <Button variant="secondary">Account</Button>
                </DropdownTrigger>
                <DropdownContent align="start">
                  <DropdownLabel>ada@example.com</DropdownLabel>
                  <DropdownSeparator />
                  <DropdownItem>Conversation history</DropdownItem>
                  <DropdownItem disabled>Administration</DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem destructive>Sign out</DropdownItem>
                </DropdownContent>
              </Dropdown>

              <Button
                variant="secondary"
                onClick={() => toast({ title: "Copied to clipboard", variant: "success" })}
              >
                Show success toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast({
                    variant: "error",
                    title: "Connection lost",
                    description: "Your message is still in the composer.",
                  })
                }
              >
                Show error toast
              </Button>
            </Cluster>
          </Section>
        </Stack>
      </Container>
    </main>
  );
}
