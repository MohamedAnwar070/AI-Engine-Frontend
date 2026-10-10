
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
    roles?: Array<"admin" | "editor" | "viewer">;
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
        icon: Boxes
    },
    {
        title: "Create Project",
        href: "/projects/new",
        icon: PlusCircle,
        roles: ["admin", "editor"]
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
        roles: ["admin", "editor"]
    },
    {
        title: "Operations",
        href: "/operations",
        icon: Activity,
        roles: ["admin"]
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings
    },
];
