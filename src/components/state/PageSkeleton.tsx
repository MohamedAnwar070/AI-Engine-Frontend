import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";

interface PageSkeletonProps {
  title?: string;
  description?: string;
  cards?: number;
}

export function PageSkeleton({ title = "Loading", description = "Fetching data", cards = 3 }: PageSkeletonProps) {
  return (
    <PageContainer title={title} description={description}>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, index) => (
            <Card key={index} className="surface-high border-none cloud-shadow p-6 rounded-[12px] space-y-5 animate-pulse">
              <div className="h-12 w-12 rounded-[8px] bg-surface-highest" />
              <div className="h-6 w-2/3 bg-surface-highest rounded-[4px]" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-surface-highest rounded-[4px]" />
                <div className="h-4 w-5/6 bg-surface-highest rounded-[4px]" />
              </div>
              <div className="h-10 w-full bg-surface-highest rounded-[8px] mt-2" />
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
