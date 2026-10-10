import {
    LayoutDashboard,
    Boxes,
    PlusCircle,
    Settings,
    BookOpen,
    Activity,
    Cpu,
    LucideIcon
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    variant?: "default" | "ghost";
    /** Permissions required to see this item. Empty or missing means visible to any signed-in user. */
    permissions?: string[];
}

export const navigationConfig: NavItem[] = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard
    },
    {
        title: "Projects",
        href: "/projects",
        icon: Boxes,
        permissions: ["projects:read"]
    },
    {
        title: "Create Project",
        href: "/projects/new",
        icon: PlusCircle,
        permissions: ["projects:write"]
    },
    {
        title: "Documentation",
        href: "/docs",
        icon: BookOpen
    },
    {
        title: "Model Settings",
        href: "/llm-providers",
        icon: Cpu,
        permissions: ["providers:read"]
    },
    {
        title: "Operations",
        href: "/operations",
        icon: Activity,
        permissions: ["monitoring:read"]
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings
    },
];
