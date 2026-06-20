import { AdminShell } from "@/components/admin/admin-shell";
import { SourceManager } from "@/components/admin/source-manager";
import { getSources } from "@/lib/data";

export default async function AdminSourcesPage() {
  const sources = await getSources();

  return (
    <AdminShell title="Manage Sources">
      <SourceManager initialSources={sources} />
    </AdminShell>
  );
}
