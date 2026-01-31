import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function DELETE(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const client = await getRedisClient();
    await client.del(`test:${params.key}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}