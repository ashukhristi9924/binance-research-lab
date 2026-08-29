import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const universe = engineManager.scalperEngine.getUniverseManager().getUniverseInfo();
    const targetSize = engineManager.scalperEngine.getUniverseManager().getTargetSize();

    return NextResponse.json({
      targetSize,
      universe,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
