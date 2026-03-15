import { createContext, useContext, useRef, type PropsWithChildren, type RefObject } from 'react';

interface EditorEnvironmentValue {
  portalRef: RefObject<HTMLElement | null>;
}

const EditorEnvironmentContext = createContext<EditorEnvironmentValue | null>(null);

interface EditorEnvironmentProviderProps extends PropsWithChildren {
  portalHost: HTMLElement;
}

export const EditorEnvironmentProvider = ({
  children,
  portalHost,
}: EditorEnvironmentProviderProps) => {
  const portalRef = useRef<HTMLElement | null>(portalHost);

  return (
    <EditorEnvironmentContext.Provider value={{ portalRef }}>
      {children}
    </EditorEnvironmentContext.Provider>
  );
};

export function useEditorEnvironment() {
  return useContext(EditorEnvironmentContext);
}