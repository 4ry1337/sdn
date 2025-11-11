import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn( ...inputs: ClassValue[] ) {
  return twMerge( clsx( inputs ) )
}

export const add_prefix = ( prefix: string, value: string ): string => {
  return `${prefix}::${value}`
}

export const remove_prefix = ( prefix: string ): string => {
  const parts = prefix.split( '::' )
  return parts.length > 1 ? parts[ 1 ] : prefix
}
