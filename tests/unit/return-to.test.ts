import { describe, expect, it } from "vitest";
import { getSafeReturnTo } from "@/lib/utils/return-to";

describe("getSafeReturnTo", () => {
  it("returns an internal path", () => {
    expect(getSafeReturnTo("/history?page=2")).toBe("/history?page=2");
  });

  it("uses the fallback for missing values", () => {
    expect(getSafeReturnTo(null)).toBe("/chat");
    expect(getSafeReturnTo("")).toBe("/chat");
  });

  it("rejects absolute URLs", () => {
    expect(getSafeReturnTo("https://evil.example/path")).toBe("/chat");
  });

  it("rejects protocol-relative URLs", () => {
    expect(getSafeReturnTo("//evil.example/path")).toBe("/chat");
  });

  it("rejects backslash-prefixed paths", () => {
    expect(getSafeReturnTo("/\\evil.example")).toBe("/chat");
  });

  it("supports a custom fallback", () => {
    expect(getSafeReturnTo("https://evil.example", "/login")).toBe("/login");
  });
});
