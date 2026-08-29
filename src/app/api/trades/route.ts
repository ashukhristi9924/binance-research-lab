import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const trades = await db.paperTrade.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        legs: {
          orderBy: { legIndex: 'asc' },
        },
      },
    });

    const account = await db.paperAccount.findUnique({ where: { id: 'default' } });

    return NextResponse.json({
      account,
      trades,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
