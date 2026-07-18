import { TenantHealthCenter } from '@/modules/admin/components/PlatformOperatingDashboard';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';

export default async function SuperadminTenantsPage() {
  return <div id="superadmin-tenants"><TenantHealthCenter data={await platformOperatingService.getOperatingData()} /></div>;
}
