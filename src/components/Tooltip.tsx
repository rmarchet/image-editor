import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react"
import * as React from "react"
import { useEditorEnvironment } from '../app/EditorEnvironment';

export interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement | null>
  content: React.ReactNode
  contentProps?: ChakraTooltip.ContentProps
  disabled?: boolean
  positioning?: { placement: 'top' | 'right' | 'bottom' | 'left' }
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, ref) {
    const environment = useEditorEnvironment();
    const {
      showArrow = true,
      children,
      disabled,
      portalled = true,
      content,
      contentProps,
      portalRef,
      positioning = { placement: 'bottom' },
      ...rest
    } = props

    const resolvedPortalRef = portalRef ?? environment?.portalRef

    if (disabled || !content) return children

    return (
      <ChakraTooltip.Root positioning={positioning} {...rest}>
        <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
        <Portal disabled={!portalled} container={resolvedPortalRef}>
          <ChakraTooltip.Positioner>
            <ChakraTooltip.Content ref={ref} py={2} px={3} {...contentProps}>
              {showArrow && (
                <ChakraTooltip.Arrow>
                  <ChakraTooltip.ArrowTip />
                </ChakraTooltip.Arrow>
              )}
              {content}
            </ChakraTooltip.Content>
          </ChakraTooltip.Positioner>
        </Portal>
      </ChakraTooltip.Root>
    )
  },
)
