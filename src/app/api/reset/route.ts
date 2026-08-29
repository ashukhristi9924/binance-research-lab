import { NextResponse } from 'next/server';
import { engineManager } from '../../../engine/manager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action; // 'account' or 'all'
    const newCapital = body.startingCapital ? Number(body.startingCapital) : undefined;

    if (action === 'account') {
      await engineManager.paperEngine.resetPaperAccount(newCapital);
      return NextResponse.json({ success: true, message: 'Paper account reset successfully.' });
    } else if (action === 'all') {
      await engineManager.paperEngine.resetAllResearchData();
      return NextResponse.json({ success: true, message: 'All research data reset successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
