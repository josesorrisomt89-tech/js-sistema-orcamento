
import React, { useState } from 'react';
import { Supplier } from '../types';
import { UserPlus, Trash2, Phone, User, Search, Settings, Edit2, Check, X } from 'lucide-react';

interface SettingsViewProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onAddSupplier({ name, phone });
      setName('');
      setPhone('');
    }
  };

  const startEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setEditName(supplier.name);
    setEditPhone(supplier.phone);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    onUpdateSupplier({ id, name: editName, phone: editPhone });
    setEditingId(null);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Configurações</h2>
        <p className="text-slate-500 font-medium">Cadastre e gerencie seus fornecedores para agilizar o processo de orçamento.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Cadastro */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={20} />
              Novo Fornecedor
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Empresa / Fornecedor</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Peças & Cia"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">WhatsApp (com DDD)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required
                    placeholder="66999990000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                Salvar Contato
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Fornecedores */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="text-slate-400" size={20} />
                Meus Fornecedores ({suppliers.length})
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
                />
              </div>
            </div>

            {filteredSuppliers.length === 0 ? (
              <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <User className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum fornecedor encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between">
                    {editingId === supplier.id ? (
                      <div className="flex-1 flex flex-col md:flex-row gap-2">
                        <input 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1 text-sm border border-indigo-300 rounded outline-none"
                        />
                        <input 
                          value={editPhone} 
                          onChange={e => setEditPhone(e.target.value)}
                          className="w-40 px-3 py-1 text-sm border border-indigo-300 rounded outline-none"
                        />
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(supplier.id)} className="p-1 bg-emerald-500 text-white rounded"><Check size={18} /></button>
                          <button onClick={cancelEdit} className="p-1 bg-slate-200 text-slate-600 rounded"><X size={18} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all font-bold text-lg">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{supplier.name}</h4>
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                              <Phone size={12} className="text-emerald-500" />
                              {supplier.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(supplier)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => onDeleteSupplier(supplier.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
