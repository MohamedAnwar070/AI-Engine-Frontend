import { AlertCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AsyncStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AsyncState({ title, description, actionLabel, onAction }: AsyncStateProps) {
  return (
    <Card className="surface-high border-none cloud-shadow p-12 text-center rounded-[12px]">
      <AlertCircle className="mx-auto mb-6 h-12 w-12 text-destructive" />
      <h3 className="mb-3 text-2xl font-display font-bold text-foreground leading-tight">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground font-sans leading-relaxed">{description}</p>
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="outline" className="mt-8 rounded-[8px] font-bold px-6">
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
