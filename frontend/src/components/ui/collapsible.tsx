"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentProps<typeof CollapsiblePrimitive.Root>
>(({ ...props }, ref) => {
  return <CollapsiblePrimitive.Root data-slot="collapsible" ref={ref} {...props} />;
});

Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ ...props }, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      ref={ref}
      {...props}
    />
  );
});

CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ ...props }, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      ref={ref}
      {...props}
    />
  );
});

CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
