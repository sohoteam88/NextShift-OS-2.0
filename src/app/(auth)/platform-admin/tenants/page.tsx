import { redirect } from 'next/navigation';

// Tenants content lives in the main platform-admin page under the "tenants" tab
export default function TenantsPage() {
  redirect('/platform-admin?tab=tenants');
}
