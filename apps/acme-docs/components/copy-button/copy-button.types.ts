import { ButtonProps } from '@acme/ui/button'
import { DropdownMenuTrigger } from '@acme/ui/dropdown-menu'
import { Event } from '~/lib/events'

export type DropdownMenuTriggerProps = typeof DropdownMenuTrigger

export interface CopyWithClassNamesProps extends DropdownMenuTriggerProps {
  value: string
  classNames: string
  className?: string
}

export interface CopyButtonProps extends ButtonProps {
  value: string
  event?: Event['name']
}
