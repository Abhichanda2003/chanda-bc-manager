import { useEffect, useState } from 'react';
import { Grip, Pencil, Trash2, X } from 'lucide-react';
import Button from './Button.jsx';
import { deleteGroup, updateGroupOrder } from '../services/bcDataService.js';

export default function ManageBCsModal({ open, onClose, groups, onGroupsUpdated, onEditGroup }) {
  const [items, setItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && groups) {
      setItems(groups.map((g) => ({ ...g })));
    }
  }, [open, groups]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === targetIndex) return;

    const newItems = [...items];
    const [draggedItemContent] = newItems.splice(draggedItem, 1);
    newItems.splice(targetIndex, 0, draggedItemContent);
    setItems(newItems);
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const groupIds = items.map((item) => item.id);
      await updateGroupOrder(groupIds);
      if (onGroupsUpdated) onGroupsUpdated();
    } catch (err) {
      console.error('Failed to save order:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditGroup = (group) => {
    if (onEditGroup) {
      onEditGroup(group);
    }
  };

  const handleDelete = async (groupId) => {
    if (deleteConfirm.id !== groupId || deleteConfirm.text !== 'DELETE') {
      return;
    }

    setSaving(true);
    try {
      await deleteGroup(groupId);
      setItems(items.filter((item) => item.id !== groupId));
      setDeleteConfirm({ id: null, text: '' });
      if (onGroupsUpdated) onGroupsUpdated();
    } catch (err) {
      console.error('Failed to delete group:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center">
      <div className="w-full max-h-[90vh] bg-white p-6 rounded-t-lg sm:rounded-lg sm:max-w-2xl overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Manage BCs</h2>
          <button
            onClick={onClose}
            className="rounded-lg hover:bg-slate-100 p-2"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Instructions */}
        <p className="mb-4 text-sm text-slate-600">Drag to reorder. Changes save automatically when you drop.</p>

        {/* Draggable List */}
        <div className="space-y-2 mb-6">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-4 p-4 rounded-lg border transition ${
                  draggedItem === index
                    ? 'bg-slate-100 border-slate-300 opacity-50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Drag Handle */}
                <Grip size={18} className="text-slate-400 flex-shrink-0" />

                {/* BC Name */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg border border-blue-500 text-sm focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditGroup(item)}
                    className="rounded-lg hover:bg-slate-100 p-2"
                    title="Edit"
                  >
                    <Pencil size={16} className="text-slate-600" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: item.id, text: '' })}
                    className="rounded-lg hover:bg-slate-100 p-2"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-slate-500">No BCs to manage</p>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="font-bold text-slate-900 mb-2">Delete BC?</h3>
              <p className="text-sm text-slate-600 mb-4">
                This action cannot be undone. Type "DELETE" to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm.text}
                onChange={(e) => setDeleteConfirm({ ...deleteConfirm, text: e.target.value })}
                placeholder='Type "DELETE"'
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm({ id: null, text: '' })}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={deleteConfirm.text !== 'DELETE' || saving}
                  className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 border-t pt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Done
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
