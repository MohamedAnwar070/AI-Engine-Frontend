import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Bot, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navigationConfig } from "@/config/navigation";
import { useAuth } from "@/lib/auth";

export function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, hasPermissions, logout } = useAuth();

  const visibleItems = navigationConfig.filter((item) => {
    if (!isAuthenticated) return false;
    return hasPermissions(item.permissions ?? []);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-500 ease-in-out surface-lowest border-r ghost-border",
        isHovered ? "w-72" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo Section */}
        <div className="flex h-24 items-center justify-between px-6 shrink-0 border-b ghost-border">
          <Link to="/" className="flex items-center gap-4 group w-full">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-primary/20 rounded-[12px] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[8px] bg-surface-highest ghost-border transition-all duration-500 group-hover:scale-105 shadow-sm">
                <Bot className="h-7 w-7 text-primary transition-colors" />
              </div>
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                  <span className="text-xl font-display font-bold tracking-tight text-foreground uppercase">
                    Synthetix
                  </span>
                  <span className="text-[10px] font-sans font-bold text-primary tracking-[0.2em] uppercase mt-0.5">
                    AI Engine Pro
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1.5 px-3 py-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative group/nav flex items-center gap-4 px-3 py-3 rounded-[8px] transition-all duration-300",
                  isActive
                    ? "bg-surface-highest"
                    : "hover:bg-surface-high"
                )}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] transition-all duration-500 shadow-sm",
                  isActive
                    ? "bg-primary text-black"
                    : "bg-surface-high text-muted-foreground group-hover/nav:text-primary group-hover/nav:bg-surface-highest ghost-border"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>

                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "relative z-10 whitespace-nowrap text-sm font-sans font-bold tracking-tight transition-colors duration-300",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover/nav:text-foreground"
                      )}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-4 shrink-0 border-t ghost-border">
          <div className={cn(
            "group/footer flex items-center gap-3 bg-surface-high p-3 rounded-[10px] ghost-border transition-all duration-500 hover:bg-surface-highest",
            !isHovered && "justify-center p-2 mb-2"
          )}>
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-surface-highest flex items-center justify-center border-2 border-surface-lowest shadow-sm">
                 <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80" />
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-surface-highest" />
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden whitespace-nowrap"
                >
                   <p className="text-sm font-display font-bold text-foreground truncate">{isAuthenticated && user ? user.email : "Guest Console"}</p>
                   <p className="text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{isAuthenticated && user ? user.role : "Offline"}</p>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>
          
          {isHovered && isAuthenticated && (
            <button 
              onClick={logout} 
              className="mt-3 flex items-center gap-3 w-full px-3 py-2 text-xs font-bold font-sans text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-[6px] transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>SIGN OUT ENGINE</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
