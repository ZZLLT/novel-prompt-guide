import "@testing-library/jest-dom/vitest";

// Polyfill for ResizeObserver (needed by ReactFlow)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill for DOMMatrixReadOnly (needed by ReactFlow)
globalThis.DOMMatrixReadOnly = class DOMMatrixReadOnly {
  m22: number = 1;
  constructor() {}
} as any;

