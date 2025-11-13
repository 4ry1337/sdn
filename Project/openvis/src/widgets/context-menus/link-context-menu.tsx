"use client"

import { D3Link } from "@/features/graph"
import {
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
} from "@/shared/ui/context-menu"

type LinkContextMenuProps = {
  link: D3Link
}

export const LinkContextMenu = ( { link }: LinkContextMenuProps ) => {
  return (
    <ContextMenuSub>
      <ContextMenuLabel>Link Metrics</ContextMenuLabel>
      <ContextMenuSeparator />
    </ContextMenuSub>
  )
}
