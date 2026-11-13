import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiKitShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "UI kit",
  robots: { index: false, follow: false },
};

/**
 * Development-only reference page for the shared UI kit.
 * It returns 404 in production builds.
 */
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <UiKitShowcase />;
}
