import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import {
  getTodayTask,
  type TodayTaskUser,
} from '@/modules/user-shell/services/todayTaskResolver';
import { getProgressLine } from '@/modules/user-shell/services/progressLineResolver';
import { getHomeTaskPresentation } from '@/modules/user-shell/services/homeTaskPresentation';
import { HomePage } from '@/modules/user-shell/components/HomePage';

export default async function Home() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'platform_admin') {
    redirect('/superadmin');
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { businessStartAt: true, createdAt: true },
  });

  if (!userRecord) {
    redirect('/login');
  }

  const todayTaskUser: TodayTaskUser = {
    businessStartAt: userRecord.businessStartAt,
    createdAt: userRecord.createdAt,
  };
  // TODO(批3): 接入 /follow 跟进信号源
  const todayTask = getTodayTask(todayTaskUser, []);
  const todayAction = getHomeTaskPresentation(todayTask).title;
  const progressLine = getProgressLine({
    user: todayTaskUser,
    todayAction,
    confirmedPublishedCount: 0,
    generatedCount: 0,
  });

  return <HomePage todayTask={todayTask} progressLine={progressLine} />;
}
