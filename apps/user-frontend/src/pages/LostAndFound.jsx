import { useState, useEffect } from 'react';
import { api } from '../api/client.js';

export default function LostAndFound() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  const fetchItems = async () => {
    try {
      // User fetches the items via user API
      const data = await api('/user/items');
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api('/user/items', { 
        method: 'POST', 
        body: { name: newItemName, description: 'User report', status: 'LOST' } 
      });
      setNewItemName('');
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex gap-6">
      <div className="flex-1 bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Lost and Found</h1>
        
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input 
            type="text" 
            placeholder="Report a lost item..." 
            className="border p-2 rounded flex-1"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Report</button>
        </form>

        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.id} className="border p-3 rounded flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => setSelectedItem(item)}>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">Status: {item.status}</p>
              </div>
            </li>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm">No items reported yet.</p>}
        </ul>
      </div>

      {selectedItem && (
        <div className="w-1/3 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">History Log</h2>
          <p className="text-sm text-gray-600 mb-4">Item: {selectedItem.name}</p>
          
          <div className="space-y-4">
            {selectedItem.history?.map((log, idx) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-4 py-1">
                <p className="text-sm font-semibold">{log.action}</p>
                <p className="text-xs text-gray-500">By: {log.name}</p>
                <p className="text-xs text-gray-400">{log.date} at {log.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
