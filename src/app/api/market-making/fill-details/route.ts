import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Fill ID parameter is required' }, { status: 400 });
    }

    const fill = await db.marketMakingFill.findUnique({
      where: { id },
    });

    if (!fill) {
      return NextResponse.json({ error: 'Fill record not found' }, { status: 404 });
    }

    return NextResponse.json({
      fill,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
