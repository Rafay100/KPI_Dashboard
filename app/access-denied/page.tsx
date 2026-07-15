import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="glass-card flex flex-col items-center justify-center px-8 py-16 text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-4 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <PageHeader
            title="Access denied"
            description="You do not have permission to view this area. Please contact your administrator."
          />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
