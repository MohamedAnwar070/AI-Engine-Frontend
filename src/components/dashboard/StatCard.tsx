import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatCard({ title, value, icon: Icon, trend, description }: StatCardProps) {
  return (
    <Card className="surface-high border-none cloud-shadow p-6 group relative overflow-hidden transition-all duration-300 hover:bg-surface rounded-[12px]">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-32 w-32 bg-primary/10 blur-[50px] rounded-full absolute -top-10 -right-10 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-sans">{title}</p>
        <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-surface-highest ghost-border shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
          <Icon className="h-5 w-5 transition-colors" />
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <h3 className="text-3xl font-display font-bold text-foreground group-hover:translate-x-1 transition-transform duration-300">
          {value}
        </h3>
        {description && (
          <p className="mt-2 text-xs font-semibold text-muted-foreground flex items-center gap-1 font-sans">
            {trend && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-[4px] font-bold",
                trend.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
