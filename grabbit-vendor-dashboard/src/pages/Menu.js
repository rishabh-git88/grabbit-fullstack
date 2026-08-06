import React, { useState, useEffect } from 'react';
import { menuAPI } from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Other'];

const EMPTY_FORM = { name: '', description: '', price: '', category: 'Snacks', preparationTime: '10', isAvailable: true };

const MenuItemForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...form, price: parseFloat(form.price), preparationTime: parseInt(form.preparationTime) });
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', props = {}) => (
    <div>
      <label className="block text-xs text-[#8892A4] mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#0F3460] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF6B2C] transition-colors"
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-[#16213E] rounded-2xl border border-[#FF6B2C]/30 p-5 mb-6">
      <h3 className="font-display font-semibold text-white mb-4">{initial ? 'Edit Item' : 'Add New Item'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Name', 'name', 'text', { required: true, placeholder: 'e.g. Masala Dosa' })}
        {field('Price (₹)', 'price', 'number', { required: true, min: 0, step: '0.5', placeholder: '45' })}
        <div>
          <label className="block text-xs text-[#8892A4] mb-1.5 uppercase tracking-wider">Category</label>
          <select
            value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-[#0F3460] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B2C] transition-colors"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {field('Prep Time (min)', 'preparationTime', 'number', { min: 1, placeholder: '10' })}
        <div className="md:col-span-2">
          {field('Description', 'description', 'text', { placeholder: 'Optional short description…' })}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8892A4] uppercase tracking-wider">Available</label>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isAvailable ? 'bg-green-500' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button type="submit" disabled={loading}
          className="flex-1 bg-[#FF6B2C] hover:bg-[#e55a1f] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm">
          {loading ? 'Saving…' : initial ? 'Update Item' : 'Add Item'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-white/10 text-[#8892A4] hover:text-white text-sm transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
};

const Menu = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await menuAPI.getVendorMenu();
      setMenu(res.data.menu);
    } catch (err) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data) => {
    try {
      await menuAPI.add(data);
      toast.success('Item added!');
      setShowForm(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleEdit = async (data) => {
    try {
      await menuAPI.update(editItem._id, data);
      toast.success('Item updated!');
      setEditItem(null);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await menuAPI.delete(id);
      toast.success('Item deleted');
      setMenu(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvail = async (item) => {
    try {
      await menuAPI.update(item._id, { isAvailable: !item.isAvailable });
      setMenu(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: !m.isAvailable } : m));
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const categories = ['All', ...CATEGORIES.filter(c => menu.some(m => m.category === c))];
  const filtered = filterCat === 'All' ? menu : menu.filter(m => m.category === filterCat);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Menu</h1>
          <p className="text-xs text-[#8892A4] mt-1">{menu.length} items</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditItem(null); }}
          className="bg-[#FF6B2C] hover:bg-[#e55a1f] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
          + Add Item
        </button>
      </div>

      {(showForm && !editItem) && <MenuItemForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editItem && <MenuItemForm initial={editItem} onSave={handleEdit} onCancel={() => setEditItem(null)} />}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCat === c ? 'bg-[#FF6B2C] text-white' : 'bg-[#16213E] text-[#8892A4] hover:text-white border border-white/5'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-[#16213E] rounded-2xl h-24 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item._id} className={`bg-[#16213E] rounded-2xl border p-4 transition-all ${item.isAvailable ? 'border-white/5' : 'border-white/5 opacity-60'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{item.name}</p>
                  <p className="text-xs text-[#8892A4] mt-0.5">{item.category} · {item.preparationTime}min</p>
                </div>
                <p className="font-display font-bold text-[#FF6B2C] text-lg">₹{item.price}</p>
              </div>
              {item.description && <p className="text-xs text-[#8892A4] mb-3 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between">
                <button onClick={() => handleToggleAvail(item)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${item.isAvailable ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-white/5 text-[#8892A4] hover:bg-white/10'}`}>
                  {item.isAvailable ? '● Available' : '○ Unavailable'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setEditItem(item); setShowForm(false); window.scrollTo(0,0); }}
                    className="text-xs text-[#8892A4] hover:text-white transition-colors">Edit</button>
                  <button onClick={() => handleDelete(item._id, item.name)}
                    className="text-xs text-[#8892A4] hover:text-red-400 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
