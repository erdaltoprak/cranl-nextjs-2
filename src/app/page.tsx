'use client';

import { useState, useEffect, useRef } from 'react';

interface DbInfo {
  connected: boolean;
  version?: string;
  tables?: string[];
  databaseSize?: string;
  error?: string;
}

interface Item {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface RedisInfo {
  connected: boolean;
  ping?: string;
  dbSize?: number;
  info?: string;
  error?: string;
}

interface RedisItem {
  key: string;
  value: string | null;
  ttl: number;
}

export default function Home() {
  const cacheBustRef = useRef<string>('');
  const requestSeqRef = useRef(0);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');


  const [redisInfo, setRedisInfo] = useState<RedisInfo | null>(null);
  const [redisItems, setRedisItems] = useState<RedisItem[]>([]);
  const [newRedisKey, setNewRedisKey] = useState('');
  const [newRedisValue, setNewRedisValue] = useState('');
  const [newRedisTtl, setNewRedisTtl] = useState('');

  const cacheBustedUrl = (path: string) => {
    const params = new URLSearchParams();
    if (cacheBustRef.current) params.set('v', cacheBustRef.current);
    params.set('r', String(requestSeqRef.current++));
    return `${path}?${params.toString()}`;
  };

  const fetchDbInfo = async () => {
    try {
      const res = await fetch(cacheBustedUrl('/api/db-info'), {
        cache: 'no-store',
      });
      const data = await res.json();
      setDbInfo(data);
    } catch {
      setDbInfo({ connected: false, error: 'Failed to fetch DB info' });
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(cacheBustedUrl('/api/items'), {
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error('Failed to fetch items:', await res.text());
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const addItem = async () => {
    if (!newItemName) return;
    console.log('[Frontend] Adding item:', newItemName);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ name: newItemName, description: newItemDesc }),
      });
      console.log('[Frontend] Add item response:', res.status);
      if (!res.ok) {
        console.error('[Frontend] Add item failed:', await res.text());
        return;
      }
      setNewItemName('');
      setNewItemDesc('');
      await fetchItems();
      await fetchDbInfo();
    } catch (error) {
      console.error('[Frontend] Failed to add item:', error);
    }
  };

  const deleteItem = async (id: number) => {
    console.log('[Frontend] Deleting item:', id);
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE', cache: 'no-store' });
      console.log('[Frontend] Delete response:', res.status);
      if (!res.ok) {
        console.error('[Frontend] Delete failed:', await res.text());
        return;
      }
      await fetchItems();
      await fetchDbInfo();
    } catch (error) {
      console.error('[Frontend] Failed to delete item:', error);
    }
  };

  const fetchRedisInfo = async () => {
    try {
      const res = await fetch(cacheBustedUrl('/api/redis-info'), {
        cache: 'no-store',
      });
      const data = await res.json();
      setRedisInfo(data);
    } catch {
      setRedisInfo({ connected: false, error: 'Failed to fetch Redis info' });
    }
  };

  const fetchRedisItems = async () => {
    try {
      const res = await fetch(cacheBustedUrl('/api/redis'), {
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error('Failed to fetch Redis items:', await res.text());
        return;
      }
      const data = await res.json();
      setRedisItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch Redis items:', error);
    }
  };

  const addRedisItem = async () => {
    if (!newRedisKey || !newRedisValue) {
      console.log('[Frontend] Key or value missing');
      return;
    }
    console.log('[Frontend] Adding Redis item:', { key: newRedisKey, value: newRedisValue });
    // setLoading removed
    try {
      const body: { key: string; value: string; ttl?: number } = {
        key: newRedisKey,
        value: newRedisValue,
      };
      if (newRedisTtl) {
        body.ttl = parseInt(newRedisTtl, 10);
      }
      const res = await fetch('/api/redis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      });
      console.log('[Frontend] Redis add response:', res.status);
      if (!res.ok) {
        console.error('[Frontend] Redis add failed:', await res.text());
        return;
      }
      const data = await res.json();
      console.log('[Frontend] Redis add success:', data);
      setNewRedisKey('');
      setNewRedisValue('');
      setNewRedisTtl('');
      await fetchRedisItems();
      await fetchRedisInfo();
    } catch (error) {
      console.error('Failed to add Redis item:', error);
    }
    // setLoading removed
  };

  const deleteRedisItem = async (key: string) => {
    // setLoading removed
    try {
      await fetch(`/api/redis/${encodeURIComponent(key)}`, { method: 'DELETE', cache: 'no-store' });
      await fetchRedisItems();
      await fetchRedisInfo();
    } catch (error) {
      console.error('Failed to delete Redis item:', error);
    }
    // setLoading removed
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const buildId = (window as unknown as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__?.buildId;
    cacheBustRef.current = typeof buildId === 'string' ? buildId : '';
    void fetchDbInfo();
    void fetchItems();
    void fetchRedisInfo();
    void fetchRedisItems();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">
          Database Connection Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PostgreSQL Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-black dark:text-white">
              PostgreSQL
            </h2>

            {/* DB Info Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Database Info
              </h3>
              {dbInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className={dbInfo.connected ? 'text-green-600' : 'text-red-600'}>
                      {dbInfo.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {dbInfo.version && (
                    <div>
                      <span className="font-medium">Version:</span>{' '}
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {dbInfo.version}
                      </span>
                    </div>
                  )}
                  {dbInfo.databaseSize && (
                    <div>
                      <span className="font-medium">Database Size:</span>{' '}
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {dbInfo.databaseSize}
                      </span>
                    </div>
                  )}
                  {dbInfo.tables && (
                    <div>
                      <span className="font-medium">Tables:</span>{' '}
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {dbInfo.tables.length > 0 ? dbInfo.tables.join(', ') : 'None'}
                      </span>
                    </div>
                  )}
                  {dbInfo.error && (
                    <div className="text-red-600 text-sm">{dbInfo.error}</div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-500">Loading...</div>
              )}
            </div>

            {/* Add Item Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Add Test Item
              </h3>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                />
                <button
                  onClick={addItem}
                  disabled={!newItemName}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Test Items ({items.length})
              </h3>
              {items.length === 0 ? (
                <div className="text-zinc-500">No items yet. Add one above!</div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-black dark:text-white">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {item.description}
                          </div>
                        )}
                        <div className="text-xs text-zinc-400">
                          Created: {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Redis Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-black dark:text-white">
              Redis
            </h2>

            {/* Redis Info Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Redis Info
              </h3>
              {redisInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className={redisInfo.connected ? 'text-green-600' : 'text-red-600'}>
                      {redisInfo.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {redisInfo.ping && (
                    <div>
                      <span className="font-medium">Ping:</span>{' '}
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {redisInfo.ping}
                      </span>
                    </div>
                  )}
                  {redisInfo.dbSize !== undefined && (
                    <div>
                      <span className="font-medium">DB Size:</span>{' '}
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {redisInfo.dbSize} keys
                      </span>
                    </div>
                  )}
                  {redisInfo.error && (
                    <div className="text-red-600 text-sm">{redisInfo.error}</div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-500">Loading...</div>
              )}
            </div>

            {/* Add Redis Item Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Add Key-Value Pair
              </h3>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Key"
                  value={newRedisKey}
                  onChange={(e) => setNewRedisKey(e.target.value)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newRedisValue}
                  onChange={(e) => setNewRedisValue(e.target.value)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                />
                <input
                  type="number"
                  placeholder="TTL in seconds (optional)"
                  value={newRedisTtl}
                  onChange={(e) => setNewRedisTtl(e.target.value)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                />
                <button
                  onClick={addRedisItem}
                  disabled={!newRedisKey || !newRedisValue}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Key
                </button>
              </div>
            </div>

            {/* Redis Items List */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Keys ({redisItems.length})
              </h3>
              {redisItems.length === 0 ? (
                <div className="text-zinc-500">No keys yet. Add one above!</div>
              ) : (
                <div className="space-y-3">
                  {redisItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="font-medium text-black dark:text-white truncate">
                          {item.key}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                          Value: {item.value || '(null)'}
                        </div>
                        <div className="text-xs text-zinc-400">
                          TTL: {item.ttl === -1 ? 'No expiration' : `${item.ttl}s`}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRedisItem(item.key)}
                        
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              fetchDbInfo();
              fetchItems();
              fetchRedisInfo();
              fetchRedisItems();
            }}
            className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
