/**
 * One-time UID sync endpoint.
 * If a user was manually inserted with a non-matching Supabase Auth UID,
 * this reads the active session, finds the DB user by email, and updates the ID.
 * Remove this file after use.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({
        ok: false,
        message: 'No active session. Please login first, then visit this URL.',
      }, { status: 401 });
    }

    // Find DB user by email
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email! },
      select: { id: true, email: true, role: true, tenantId: true },
    });

    if (!dbUser) {
      return NextResponse.json({
        ok: false,
        message: `No DB user found for email ${user.email}`,
        supabase_uid: user.id,
      }, { status: 404 });
    }

    if (dbUser.id === user.id) {
      return NextResponse.json({
        ok: true,
        message: 'IDs already match. No fix needed.',
        uid: user.id,
      });
    }

    // IDs don't match — update DB user ID to match Supabase Auth UID
    const oldId = dbUser.id;

    // Update all foreign key references first
    await prisma.$transaction([
      // Update tenant sponsorId references
      prisma.user.updateMany({ where: { sponsorId: oldId }, data: { sponsorId: user.id } }),
      // Update leads ownerId
      prisma.lead.updateMany({ where: { ownerId: oldId }, data: { ownerId: user.id } }),
      // Update activities userId
      prisma.activity.updateMany({ where: { userId: oldId }, data: { userId: user.id } }),
      // Update notes userId
      prisma.note.updateMany({ where: { userId: oldId }, data: { userId: user.id } }),
      // Update funnels ownerId
      prisma.funnel.updateMany({ where: { ownerId: oldId }, data: { ownerId: user.id } }),
      // Update the user ID itself
      prisma.user.update({ where: { id: oldId }, data: { id: user.id } }),
    ]);

    return NextResponse.json({
      ok: true,
      message: `UID synced successfully. Login should now work.`,
      old_uid: oldId,
      new_uid: user.id,
      email: user.email,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
