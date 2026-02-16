import { describe, it, expect, beforeEach } from "vitest";
import { store, dismissToast, resolveAutopilot, createToast, updateToast } from "./store";

beforeEach(() => {
  store.toasts = [];
  store.position = "top-right";
  store.options = undefined;
  store.toaster = null;
});

describe("resolveAutopilot", () => {
  it("returns empty when autopilot is false", () => {
    expect(resolveAutopilot({ autopilot: false }, 6000)).toEqual({});
  });

  it("returns empty when duration is null", () => {
    expect(resolveAutopilot({}, null)).toEqual({});
  });

  it("returns defaults when autopilot is true or undefined", () => {
    const result = resolveAutopilot({}, 6000);
    expect(result.expandDelayMs).toBe(150);
    expect(result.collapseDelayMs).toBe(4000);
  });

  it("clamps values to duration", () => {
    const result = resolveAutopilot({ autopilot: { expand: 99999 } }, 1000);
    expect(result.expandDelayMs).toBe(1000);
  });
});

describe("createToast", () => {
  it("creates a toast with default id", () => {
    const { id } = createToast({ title: "Hello" });
    expect(id).toBe("sileo-default");
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].title).toBe("Hello");
  });

  it("updates existing toast with same id", () => {
    createToast({ title: "First", id: "test" });
    createToast({ title: "Second", id: "test" });
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].title).toBe("Second");
  });

  it("uses store.position as fallback", () => {
    store.position = "bottom-left";
    createToast({ title: "Hello" });
    expect(store.toasts[0].position).toBe("bottom-left");
  });
});

describe("dismissToast", () => {
  it("marks toast as exiting", () => {
    createToast({ title: "Hello", id: "t1" });
    dismissToast("t1");
    expect(store.toasts[0].exiting).toBe(true);
  });

  it("ignores already exiting toast", () => {
    createToast({ title: "Hello", id: "t1" });
    dismissToast("t1");
    dismissToast("t1"); // should not throw
    expect(store.toasts[0].exiting).toBe(true);
  });
});

describe("updateToast", () => {
  it("updates an existing toast", () => {
    createToast({ title: "Loading", id: "t1" });
    updateToast("t1", { title: "Done", state: "success", id: "t1" });
    expect(store.toasts[0].title).toBe("Done");
    expect(store.toasts[0].state).toBe("success");
  });

  it("does nothing for non-existent toast", () => {
    updateToast("nope", { title: "X" });
    expect(store.toasts).toHaveLength(0);
  });
});
