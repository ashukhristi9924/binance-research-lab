import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  const status = engineManager.getMarketDataStatus();
  return NextResponse.json(status);
}
