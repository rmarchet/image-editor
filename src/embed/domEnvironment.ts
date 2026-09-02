interface EditorDomEnvironment {
  hostElement: HTMLElement | null;
  mountRoot: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
}

const environment: EditorDomEnvironment = {
  hostElement: null,
  mountRoot: null,
  shadowRoot: null,
};

export function setEditorDomEnvironment(next: EditorDomEnvironment) {
  environment.hostElement = next.hostElement;
  environment.mountRoot = next.mountRoot;
  environment.shadowRoot = next.shadowRoot;
}

export function clearEditorDomEnvironment() {
  environment.hostElement = null;
  environment.mountRoot = null;
  environment.shadowRoot = null;
}

export function getEditorShadowRoot() {
  return environment.shadowRoot;
}

export function getEditorMountRoot() {
  return environment.mountRoot;
}

export function getEditorDocument() {
  return environment.hostElement?.ownerDocument ?? document;
}

export function getActiveEditorElement() {
  if (environment.shadowRoot?.activeElement) {
    return environment.shadowRoot.activeElement;
  }

  const activeElement = getEditorDocument().activeElement;
  return activeElement instanceof Element ? activeElement : null;
}

export function isNodeInsideEditor(node: Node | null | undefined) {
  if (!node) {
    return false;
  }

  if (environment.mountRoot?.contains(node)) {
    return true;
  }

  if (environment.shadowRoot?.contains(node)) {
    return true;
  }

  return false;
}

export function shouldHandleEditorKeyboardEvent(event: KeyboardEvent) {
  const target = event.target as Node | null;
  if (isNodeInsideEditor(target)) {
    return true;
  }

  return isNodeInsideEditor(getActiveEditorElement());
}

export function queryEditorElement<T extends Element>(selector: string): T | null {
  if (environment.shadowRoot) {
    return environment.shadowRoot.querySelector<T>(selector);
  }

  return environment.mountRoot?.querySelector<T>(selector) ?? null;
}

export function focusEditorMountRoot() {
  environment.mountRoot?.focus({ preventScroll: true });
}