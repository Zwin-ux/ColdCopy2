import { cn } from "@/lib/utils"

const Sidebar = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "pb-12 min-h-screen w-64 border-r bg-background",
      className
    )}
    {...props}
  />
)

const SidebarHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-6 py-4 border-b", className)}
    {...props}
  />
)

const SidebarContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-3 py-4", className)}
    {...props}
  />
)

const SidebarNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <nav
    className={cn("space-y-1", className)}
    {...props}
  />
)

const SidebarNavItem = ({
  className,
  active,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { active?: boolean }) => (
  <div
    className={cn(
      "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors",
      active 
        ? "bg-primary/10 text-primary border-r-2 border-primary" 
        : "text-muted-foreground hover:text-foreground hover:bg-accent",
      className
    )}
    {...props}
  />
)

export { Sidebar, SidebarHeader, SidebarContent, SidebarNav, SidebarNavItem }