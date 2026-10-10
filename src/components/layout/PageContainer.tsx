import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  return (
    <div className={cn("p-6 md:p-12", className)}>
      {(title || description || actions) && (
        <div className="mb-10 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-3">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground font-sans font-medium text-lg leading-relaxed max-w-2xl">{description}</p>
              )}
            </div>
            {actions && <div className="flex gap-3 items-center">{actions}</div>}
          </div>
        </div>
      )}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {children}
      </div>
    </div>
  );
}
