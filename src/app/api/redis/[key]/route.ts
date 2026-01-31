import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const client = await getRedisClient();

    // UI sends full keys (already prefixed) when deleting.
    const decodedKey = typeof key === 'string' ? decodeURIComponent(key) : '';
    const normalizedKey = decodedKey.trim();
    if (!normalizedKey) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    const fullKey = normalizedKey.startsWith('test:') ? normalizedKey : `test:${normalizedKey}`;

    await client.del(fullKey);
    
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
