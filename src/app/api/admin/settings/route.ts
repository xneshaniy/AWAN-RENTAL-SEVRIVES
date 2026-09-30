import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { settingsUpdateSchema } from '@/lib/validations';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = settings.reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {});
    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Never trust the client: validate keys (shape + safety) and values
    // before anything touches the database.
    const validated = settingsUpdateSchema.safeParse(body);
    if (!validated.success) {
      const message = validated.error.issues[0]?.message || 'Invalid settings payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await prisma.$transaction(
      Object.entries(validated.data).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, group: 'general', label: key },
        })
      )
    );

    return NextResponse.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
