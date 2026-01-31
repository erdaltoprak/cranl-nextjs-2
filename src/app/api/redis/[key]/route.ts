import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const client = await getRedisClient();
    await client.del(`test:${key}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}