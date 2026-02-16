import { describe, it, expect, beforeEach } from "vitest";
import { sileo } from "./api";
import { store } from "./store";

beforeEach(() => {
  store.toasts = [];
  store.position = "top-right";
  store.options = undefined;
  store.toaster = null;
  document.body.innerHTML = "";
});

describe("sileo API", () => {
  it("sileo.success() creates a success toast", () => {
    const id = sileo.success({ title: "Saved" });
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].state).toBe("success");
    expect(store.toasts[0].title).toBe("Saved");
    expect(typeof id).toBe("string");
  });

  it("sileo.error() creates an error toast", () => {
    sileo.error({ title: "Failed" });
    expect(store.toasts[0].state).toBe("error");
  });

  it("sileo.warning() creates a warning toast", () => {
    sileo.warning({ title: "Careful" });
    expect(store.toasts[0].state).toBe("warning");
  });

  it("sileo.info() creates an info toast", () => {
    sileo.info({ title: "FYI" });
    expect(store.toasts[0].state).toBe("info");
  });

  it("sileo.action() creates an action toast", () => {
    sileo.action({ title: "Go" });
    expect(store.toasts[0].state).toBe("action");
  });

  it("sileo.dismiss() marks toast as exiting", () => {
    const id = sileo.success({ title: "X" });
    sileo.dismiss(id);
    expect(store.toasts[0].exiting).toBe(true);
  });

  it("sileo.clear() removes all toasts", () => {
    sileo.success({ title: "A", id: "a" });
    sileo.error({ title: "B", id: "b" });
    sileo.clear();
    expect(store.toasts).toHaveLength(0);
  });

  it("sileo.clear(position) removes toasts at position", () => {
    sileo.success({ title: "A", id: "a", position: "top-left" });
    sileo.error({ title: "B", id: "b", position: "bottom-right" });
    sileo.clear("top-left");
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].id).toBe("b");
  });

  it("sileo.promise() transitions loading → success", async () => {
    const p = sileo.promise(Promise.resolve("data"), {
      loading: { title: "Loading" },
      success: { title: "Done" },
      error: { title: "Oops" },
    });
    expect(store.toasts[0].state).toBe("loading");
    await p;
    expect(store.toasts[0].state).toBe("success");
    expect(store.toasts[0].title).toBe("Done");
  });

  it("sileo.promise() transitions loading → error on rejection", async () => {
    const p = sileo.promise(Promise.reject(new Error("fail")), {
      loading: { title: "Loading" },
      success: { title: "Done" },
      error: { title: "Oops" },
    });
    try { await p; } catch {}
    // Wait a tick for the catch handler
    await new Promise((r) => setTimeout(r, 10));
    expect(store.toasts[0].state).toBe("error");
  });
});
