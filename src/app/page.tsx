'use client';

import { useState, useEffect } from 'react';

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

export default function Home() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDbInfo = async () => {
    try {
      const res = await fetch('/api/db-info');
      const data = await res.json();
      setDbInfo(data);
    } catch (error) {
      setDbInfo({ connected: false, error: 'Failed to fetch DB info' });
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const addItem = async () => {
    if (!newItemName) return;
    setLoading(true);
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName, description: newItemDesc }),
      });
      setNewItemName('');
      setNewItemDesc('');
      await fetchItems();
      await fetchDbInfo();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
    setLoading(false);
  };

  const deleteItem = async (id: number) => {
    setLoading(true);
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
      await fetchItems();
      await fetchDbInfo();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDbInfo();
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">
          PostgreSQL Connection Test
        </h1>

        {/* DB Info Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Database Info
          </h2>
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
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Add Test Item
          </h2>
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
            />
            <button
              onClick={addItem}
              disabled={loading || !newItemName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Test Items ({items.length})
          </h2>
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
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              fetchDbInfo();
              fetchItems();
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