import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin', 'operator']);

  const [operatingData, stats] = await Promise.all([
    platformOperatingService.getOperatingData(),
    platformAdminService.getPlatformStats(),
  ]);

  const todayGrowth = operatingData.growth.today;
  const weeklyGrowth = operatingData.growth.sevenDays;

  return NextResponse.json({
    data: {
      // Acquisition
      daily_signups: todayGrowth.newUsers,
      weekly_growth_rate: weeklyGrowth.activationPercent,

      // Activation
      total_users: operatingData.summary.totalUsers,
      active_users_weekly: operatingData.summary.activeUsers,
      activation_rate: operatingData.summary.totalUsers > 0
        ? Math.round((operatingData.summary.activeUsers / operatingData.summary.totalUsers) * 100)
        : 0,

      // Engagement
      ai_calls_this_month: operatingData.ai.calls,
      funnels_created: stats.total_funnels,
      leads_total: stats.total_leads,

      // Revenue
      mrr: operatingData.revenue.mrr,
      arr: operatingData.revenue.arr,
      arpu: operatingData.revenue.arpu,
      growth_percent: operatingData.revenue.growthPercent,

      // Health
      active_tenants: operatingData.summary.activeTenants,
      churn_risk_tenants: operatingData.tenants.filter(t => t.churnRisk === 'High' || t.churnRisk === 'Critical').length,
      gross_margin: operatingData.summary.grossMargin,
      ai_cost_monthly: operatingData.ai.cost,

      // Growth details
      growth: {
        today: todayGrowth,
        seven_days: weeklyGrowth,
        thirty_days: operatingData.growth.thirtyDays,
        ninety_days: operatingData.growth.ninetyDays,
      },

      // Revenue breakdown
      revenue: {
        mrr: operatingData.revenue.mrr,
        arr: operatingData.revenue.arr,
        arpu: operatingData.revenue.arpu,
        plan_distribution: operatingData.revenue.planDistribution,
      },

      // Alerts
      alerts: operatingData.alerts,
    },
  });
});
