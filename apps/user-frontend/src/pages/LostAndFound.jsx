import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';

export default function LostAndFound() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: user?.name || '',
    status: 'Lost',
    lastFound: '',
    date: '',
    time: '',
    item: '',
    description: '',
    image: '',
  });

  const apiEndpoint = portal.key === 'admin' ? '/admin/lost-and-found' : '/user/lost-and-found';

  useEffect(() => {
    let mounted = true;
    async function fetchTickets() {
      try {
        setLoading(true);
        const data = await api(apiEndpoint);
        if (mounted) {
          setTickets(Array.isArray(data) ? data : (data.tickets || []));
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load tickets.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchTickets();
    return () => {
      mounted = false;
    };
  }, [apiEndpoint]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields (everything except image)
    if (
      !form.name.trim() ||
      !form.lastFound.trim() ||
      !form.date ||
      !form.time ||
      !form.item.trim() ||
      !form.description.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api(apiEndpoint, {
        method: 'POST',
        body: {
          name: form.name.trim(),
          status: form.status,
          lastFound: form.lastFound.trim(),
          date: form.date,
          time: form.time,
          item: form.item.trim(),
          description: form.description.trim(),
          image: form.image || undefined,
        },
      });

      const newTicket = res.ticket || res;
      setTickets((prev) => [newTicket, ...prev]);

      // Reset form
      setForm({
        name: user?.name || '',
        status: 'Lost',
        lastFound: '',
        date: '',
        time: '',
        item: '',
        description: '',
        image: '',
      });
      // Clear file input if present
      const fileInput = document.getElementById('ticket-image');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-normal text-maroon mb-6">Lost and Found</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form: Add ticket */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-gray-50/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ticket-name" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Name *
              </label>
              <input
                id="ticket-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Reporter's name"
                required
                className="w-full rounded-md border border-gray-300 bg-field px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Status *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: 'Lost' }))}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold uppercase rounded-md border transition-colors ${
                    form.status === 'Lost'
                      ? 'bg-maroon text-white border-maroon'
                      : 'bg-field text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Lost
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: 'Found' }))}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold uppercase rounded-md border transition-colors ${
                    form.status === 'Found'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-field text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Found
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="ticket-item" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Item *
              </label>
              <input
                id="ticket-item"
                type="text"
                value={form.item}
                onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                placeholder="e.g. Scientific Calculator, Umbrella"
                required
                className="w-full rounded-md border border-gray-300 bg-field px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
              />
            </div>

            <div>
              <label htmlFor="ticket-location" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Last found (location) *
              </label>
              <input
                id="ticket-location"
                type="text"
                value={form.lastFound}
                onChange={(e) => setForm((f) => ({ ...f, lastFound: e.target.value }))}
                placeholder="e.g. Library 3rd Floor, Main Canteen"
                required
                className="w-full rounded-md border border-gray-300 bg-field px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ticket-date" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Date *
                </label>
                <input
                  id="ticket-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full rounded-md border border-gray-300 bg-field px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
              <div>
                <label htmlFor="ticket-time" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Time *
                </label>
                <input
                  id="ticket-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                  className="w-full rounded-md border border-gray-300 bg-field px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ticket-desc" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Description *
              </label>
              <textarea
                id="ticket-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Provide a detailed description of the item"
                required
                className="w-full rounded-md border border-gray-300 bg-field px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
              />
            </div>

            <div>
              <label htmlFor="ticket-image" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Image (optional)
              </label>
              <input
                id="ticket-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-300"
              />
              {form.image && (
                <div className="relative mt-2 inline-block">
                  <img src={form.image} alt="Upload preview" className="h-16 w-16 rounded-md object-cover border border-gray-300" />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, image: '' }));
                      const fileInput = document.getElementById('ticket-image');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-700"
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-maroon w-full text-xs py-2.5"
            >
              {submitting ? 'Saving Ticket…' : 'Submit Ticket'}
            </button>
          </form>
        </div>

        {/* List: View list of lost or found items */}
        <div className="lg:col-span-7">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tickets</h2>
          {loading ? (
            <div className="flex h-56 items-center justify-center text-gray-400">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500">
              <p className="text-base font-medium">No items yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-maroon/50 hover:shadow-md"
                >
                  {ticket.image ? (
                    <img
                      src={ticket.image}
                      alt={ticket.item}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      No image
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate text-base">{ticket.item}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          ticket.status === 'Found'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-maroon-light text-maroon'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Last found:</span> {ticket.lastFound}
                    </p>

                    <div className="mt-1.5 flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <strong className="text-gray-700 font-medium">Date:</strong> {ticket.date}
                      </span>
                      <span>
                        <strong className="text-gray-700 font-medium">Time:</strong> {ticket.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase mb-1.5 ${
                    selectedTicket.status === 'Found'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-maroon-light text-maroon'
                  }`}
                >
                  {selectedTicket.status}
                </span>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.item}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {selectedTicket.image && (
              <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                  src={selectedTicket.image}
                  alt={selectedTicket.item}
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Name: </span>
                <span className="text-gray-900">{selectedTicket.name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Last found (location): </span>
                <span className="text-gray-900">{selectedTicket.lastFound}</span>
              </div>
              <div className="flex gap-6">
                <div>
                  <span className="font-semibold text-gray-700">Date: </span>
                  <span className="text-gray-900">{selectedTicket.date}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Time: </span>
                  <span className="text-gray-900">{selectedTicket.time}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="block font-semibold text-gray-700 mb-1">Description:</span>
                <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-800 border border-gray-100 text-sm">
                  {selectedTicket.description}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="btn-maroon w-full text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
