import React from 'react';
import { Search, UserPlus, Clock, Phone, MapPin } from 'lucide-react';
import { MissingPerson, fetchMissingPersons } from '../../../lib/api';

export default function MissingPersonsRegistry() {
    const [persons, setPersons] = React.useState<MissingPerson[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function loadPersons() {
            setLoading(true);
            const data = await fetchMissingPersons();
            setPersons(data);
            setLoading(false);
        }
        loadPersons();
    }, []);

    const filteredPersons = persons.filter(p =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="relative group flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search registry indices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase tracking-widest"
                    />
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 border border-blue-400/30">
                    <UserPlus className="w-4 h-4" />
                    New Missing Report
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPersons.length === 0 ? (
                        <div className="col-span-full bg-white/5 border border-white/5 rounded-3xl p-12 text-center">
                            <p className="text-slate-500 uppercase font-black text-xs tracking-widest">No matching registry records found</p>
                        </div>
                    ) : (
                        filteredPersons.map(person => (
                            <div key={person.id} className="glass-card-premium group hover:scale-[1.02] transition-all duration-300">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-500">
                                            {person.photo_url ? (
                                                <img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <span className="text-xl font-black uppercase">{person.full_name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-1 rounded border uppercase tracking-widest ${person.status === 'MISSING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                person.status === 'FOUND' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {person.status}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{person.full_name}</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest mb-4">{person.age} Years • {person.gender}</p>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">
                                            <Clock className="w-3 h-3 text-blue-500" />
                                            Last Seen: {new Date(person.last_seen).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">
                                            <Phone className="w-3 h-3 text-blue-500" />
                                            Contact: {person.contact_number}
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-slate-500 dark:text-white/40 leading-relaxed font-bold italic line-clamp-2">
                                        "{person.description}"
                                    </p>
                                </div>
                                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between items-center group-hover:bg-blue-600/5 transition-colors">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REG_ID: {person.id.substring(0, 8)}</span>
                                    <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400">View Dossier →</button>
                                </div>
                            </div>
                        )
                        ))}
                </div>
            )}
        </div>
    );
}
