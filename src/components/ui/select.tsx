import * as React from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

// shadcn/ui Select, adapted to the site palette and native dialog portals.
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return <SelectPrimitive.Trigger data-slot="select-trigger"
    className={cn('flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-solid border-input bg-card px-3 py-2 text-sm leading-normal text-foreground shadow-xs outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate', className)} {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>;
}

function SelectContent({ className, children, container, ...props }: React.ComponentProps<typeof SelectPrimitive.Content> & {
  container?: React.ComponentProps<typeof SelectPrimitive.Portal>['container'];
}) {
  return <SelectPrimitive.Portal container={container}>
    <SelectPrimitive.Content data-slot="select-content" position="popper" align="start" sideOffset={5}
      className={cn('relative z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-solid border-border bg-card text-foreground shadow-md', className)} {...props}>
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1"><ChevronUpIcon className="size-4" /></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1"><ChevronDownIcon className="size-4" /></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>;
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return <SelectPrimitive.Item data-slot="select-item"
    className={cn('relative flex min-h-9 w-full cursor-pointer items-center rounded-sm py-2 pr-8 pl-3 text-sm leading-normal outline-none select-none focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-secondary data-[state=checked]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} {...props}>
    <span className="absolute right-2 flex size-4 items-center justify-center text-primary">
      <SelectPrimitive.ItemIndicator><CheckIcon className="size-4" aria-hidden="true" /></SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>;
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
