import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDashboardConfig, saveDashboardConfig, getDefaultDashboardCards } from '@/services/dashboard';
import type { DashboardCard } from '@/db/schema/dashboard';
import { CARD_TYPE_DEFINITIONS } from '@/lib/dashboard/cardTypes';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getDashboardConfig(session.user.id);
    const cards = config?.cards ?? getDefaultDashboardCards();

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Failed to get dashboard config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cards } = body as { cards: DashboardCard[] };

    // Validate cards array
    if (!Array.isArray(cards)) {
      return NextResponse.json({ error: 'Invalid cards format' }, { status: 400 });
    }

    // Validate each card
    for (const card of cards) {
      if (!card.id || !card.type || !card.position) {
        return NextResponse.json({ error: 'Invalid card structure' }, { status: 400 });
      }
      if (!CARD_TYPE_DEFINITIONS[card.type]) {
        return NextResponse.json({ error: `Unknown card type: ${card.type}` }, { status: 400 });
      }
    }

    await saveDashboardConfig(session.user.id, cards);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save dashboard config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
