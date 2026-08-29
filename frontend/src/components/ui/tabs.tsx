import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      data-orientation={orientation}
      className={cn(
        orientation === "vertical"
          ? "flex flex-col sm:flex-row gap-0 w-full"
          : "flex flex-col gap-4 w-full",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Horizontal style (default)
        "group-data-[orientation=horizontal]:inline-flex group-data-[orientation=horizontal]:items-center group-data-[orientation=horizontal]:gap-1.5 group-data-[orientation=horizontal]:rounded-xl group-data-[orientation=horizontal]:bg-muted/80 group-data-[orientation=horizontal]:p-1.5 group-data-[orientation=horizontal]:text-muted-foreground group-data-[orientation=horizontal]:w-max group-data-[orientation=horizontal]:border group-data-[orientation=horizontal]:min-h-[44px]",
        // Vertical style
        "flex flex-col gap-0.5 min-w-[180px] shrink-0 rounded-xl border bg-muted/40 p-2",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Shared base
        "inline-flex items-center whitespace-nowrap rounded-lg text-xs font-medium ring-offset-background transition-all outline-none cursor-pointer select-none",
        // Idle state
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        // Active / selected state — strong highlight
        "data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:shadow-sm data-[active]:font-semibold",
        // Padding (vertical tabs are left-aligned, horizontal are centered)
        "px-3.5 py-2.5 justify-start w-full text-left",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("outline-none flex-1 min-w-0", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
