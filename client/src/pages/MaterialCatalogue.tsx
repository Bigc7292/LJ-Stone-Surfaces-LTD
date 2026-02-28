import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Filter, ArrowRight, ArrowUpRight } from 'lucide-react';
import libraryData from '@/data/stoneLibrary.json'; // Your new data file

// Deduplicate categories for filter tabs
const CATEGORIES = ['All', ...Array.from(new Set(libraryData.map(s => s.category)))];

export default function MaterialCatalogue() {
    const [location, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    // Filter Logic
    const filteredStones = libraryData.filter(stone => {
        const matchesSearch = stone.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'All' || stone.category === category;
        return matchesSearch && matchesCategory;
    });

    const handleVisualize = (stoneId: string) => {
        // Navigate to Visualizer and pass the stone ID
        setLocation(`/portfolio?preselect=${stoneId}`);
        // Note: Adjust the path '/portfolio' to wherever your Visualizer lives (e.g. '/')
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

            {/* HEADER */}
            <header className="py-20 px-6 border-b border-slate-900 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
                        Stone <span className="text-amber-500">Collection</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Browse our curated selection of premium surfaces. From natural marble to high-performance Dekton.
                    </p>
                </div>
            </header>

            {/* CONTROLS */}
            <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-4 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <label htmlFor="material-search" className="sr-only">Search materials by name</label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            id="material-search"
                            type="text"
                            placeholder="Search 'Calacatta', 'Black', etc..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${category === cat
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GALLERY GRID */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredStones.map((stone) => (
                        <div key={stone.id} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col">

                            {/* Image Container */}
                            <div className="aspect-[4/3] overflow-hidden relative">
                                <img
                                    src={stone.swatchUrl}
                                    alt={stone.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                                {/* Brand Badge (Mock logic based on ID prefix) */}
                                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                                        {stone.id.startsWith('cs') ? 'Caesarstone' : stone.id.startsWith('cos') ? 'Cosentino' : 'Gemini'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">{stone.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-medium">
                                        <span>{stone.category}</span>
                                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                        <span>{stone.texture} Finish</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleVisualize(stone.id)}
                                    className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-900 text-white py-3 rounded-xl transition-all font-bold uppercase text-xs tracking-widest group-hover:translate-y-0"
                                >
                                    <span>Visualize in Room</span>
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredStones.length === 0 && (
                    <div className="text-center py-20">
                        <Filter className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-500">No stones found</h3>
                        <p className="text-slate-600">Try adjusting your search filters.</p>
                    </div>
                )}
            </main>
        </div>
    );
}