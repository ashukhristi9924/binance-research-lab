import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST() {
  try {
    const legacyFills = await db.marketMakingFill.findMany({
      where: {
        OR: [
          { midPlacement: 0.0 },
          { fillStatus: 'INVALIDATED' },
        ],
      },
    });

    let invalidatedCount = 0;

    for (const fill of legacyFills) {
      if (fill.midPlacement === 0.0) {
        await db.marketMakingFill.update({
          where: { id: fill.id },
          data: {
            fillStatus: 'INVALIDATED',
            invalidationReason: 'Historical market snapshot unavailable / accounting model mismatch',
          },
        });
        invalidatedCount++;
      }
    }

    return NextResponse.json({
      message: 'Historical fill audit completed',
      invalidatedCount,
      totalAudited: legacyFills.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
