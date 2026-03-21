'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Plus,
    X,
    MapPin,
    BedDouble,
    Bath,
    Ruler,
    Trash2,
    Building2,
    Pencil,
    ArrowLeft,
    ImagePlus,
    ChevronDown,
    ExternalLink,
    Link as LinkIcon,
} from 'lucide-react';

interface Property {
    id: string;
    name: string;
    description: string;
    price: number;
    location: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    images: string[];
    amenities: string[];
    created_at: string;
    address?: string;
    map_link?: string;
}

// Indian States
const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState('');
    const [city, setCity] = useState('');
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        amenities: '',
        address: '',
        map_link: '',
    });

    const fetchProperties = async () => {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });
        setProperties(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setForm({ name: '', description: '', price: '', bedrooms: '', bathrooms: '', area: '', amenities: '', address: '', map_link: '' });
        setSelectedState('');
        setCity('');
        setImagePreviews([]);
        setEditingId(null);
    };

    const getLocation = () => {
        if (city && selectedState) return `${city}, ${selectedState}`;
        if (selectedState) return selectedState;
        if (city) return city;
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const supabase = createSupabaseBrowserClient();
        const location = getLocation();

        const propertyData: any = {
            name: form.name,
            description: form.description,
            price: parseFloat(form.price),
            location,
            bedrooms: parseInt(form.bedrooms) || 0,
            bathrooms: parseInt(form.bathrooms) || 0,
            area: parseFloat(form.area) || 0,
            amenities: form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
            images: imagePreviews,
        };

        // Store address and map_link in description JSON if the columns don't exist
        // We'll store them as part of the description for now
        const metaInfo = [];
        if (form.address) metaInfo.push(`Address: ${form.address}`);
        if (form.map_link) metaInfo.push(`Map: ${form.map_link}`);
        const descWithMeta = form.description + (metaInfo.length > 0 ? `\n---\n${metaInfo.join('\n')}` : '');
        propertyData.description = descWithMeta;

        if (editingId) {
            await supabase
                .from('properties')
                .update({ ...propertyData, updated_at: new Date().toISOString() })
                .eq('id', editingId);
        } else {
            await supabase.from('properties').insert(propertyData);
        }

        resetForm();
        setShowForm(false);
        fetchProperties();
        setSaving(false);
    };

    const handleEdit = (property: Property) => {
        setEditingId(property.id);
        const parts = (property.location || '').split(', ');
        setCity(parts[0] || '');
        setSelectedState(parts[1] || '');

        // Parse description to extract address and map_link
        let desc = property.description || '';
        let address = '';
        let mapLink = '';
        if (desc.includes('\n---\n')) {
            const [mainDesc, meta] = desc.split('\n---\n');
            desc = mainDesc;
            const lines = meta.split('\n');
            lines.forEach(line => {
                if (line.startsWith('Address: ')) address = line.replace('Address: ', '');
                if (line.startsWith('Map: ')) mapLink = line.replace('Map: ', '');
            });
        }

        setForm({
            name: property.name,
            description: desc,
            price: property.price?.toString() || '',
            bedrooms: property.bedrooms?.toString() || '',
            bathrooms: property.bathrooms?.toString() || '',
            area: property.area?.toString() || '',
            amenities: property.amenities?.join(', ') || '',
            address,
            map_link: mapLink,
        });
        setImagePreviews(property.images || []);
        setShowForm(true);
        setSelectedProperty(null);
    };

    const handleDelete = async (id: string) => {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('properties').delete().eq('id', id);
        setProperties(properties.filter((p) => p.id !== id));
        if (selectedProperty?.id === id) setSelectedProperty(null);
    };

    const formatPrice = (price: number) => {
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getMapLink = (property: Property) => {
        const desc = property.description || '';
        if (desc.includes('Map: ')) {
            const match = desc.match(/Map: (.+)/);
            return match?.[1] || '';
        }
        return '';
    };

    const getAddress = (property: Property) => {
        const desc = property.description || '';
        if (desc.includes('Address: ')) {
            const match = desc.match(/Address: (.+)/);
            return match?.[1] || '';
        }
        return '';
    };

    const getCleanDescription = (property: Property) => {
        const desc = property.description || '';
        if (desc.includes('\n---\n')) return desc.split('\n---\n')[0];
        return desc;
    };

    // --- Detail View ---
    if (selectedProperty) {
        const mapLink = getMapLink(selectedProperty);
        const address = getAddress(selectedProperty);
        const cleanDesc = getCleanDescription(selectedProperty);

        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedProperty(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Properties
                </button>

                <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                    {/* Image Gallery */}
                    {selectedProperty.images && selectedProperty.images.length > 0 ? (
                        <div className={`grid gap-1 h-64 md:h-80 ${selectedProperty.images.length === 1 ? 'grid-cols-1' : selectedProperty.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                            {selectedProperty.images.slice(0, 4).map((img, i) => (
                                <div key={i} className={`relative overflow-hidden ${i === 0 && selectedProperty.images.length >= 3 ? 'row-span-2' : ''}`}>
                                    <img src={img} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                                    {i === 3 && selectedProperty.images.length > 4 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-lg font-bold">+{selectedProperty.images.length - 4} more</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-slate-600" />
                        </div>
                    )}

                    <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedProperty.name}</h2>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                    {selectedProperty.location}
                                </div>
                                {address && (
                                    <p className="text-slate-500 text-sm mt-1">{address}</p>
                                )}
                                {mapLink && (
                                    <a
                                        href={mapLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm mt-1 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        View on Map
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(selectedProperty)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all text-sm"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedProperty.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>

                        <p className="text-3xl font-bold text-indigo-400 mb-6">
                            {formatPrice(selectedProperty.price)}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-white/10">
                            {selectedProperty.bedrooms > 0 && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <BedDouble className="w-5 h-5 text-slate-500" />
                                    <span>{selectedProperty.bedrooms} Bedrooms</span>
                                </div>
                            )}
                            {selectedProperty.bathrooms > 0 && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Bath className="w-5 h-5 text-slate-500" />
                                    <span>{selectedProperty.bathrooms} Bathrooms</span>
                                </div>
                            )}
                            {selectedProperty.area > 0 && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Ruler className="w-5 h-5 text-slate-500" />
                                    <span>{selectedProperty.area} sqft</span>
                                </div>
                            )}
                        </div>

                        {cleanDesc && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-slate-400 leading-relaxed">{cleanDesc}</p>
                            </div>
                        )}

                        {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProperty.amenities.map((amenity, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-slate-600 mt-8">
                            Added on {new Date(selectedProperty.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // --- Grid View ---
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Properties</h2>
                    <p className="text-slate-400 text-sm mt-1">{properties.length} properties listed</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Add Property
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 animate-pulse">
                            <div className="h-32 bg-slate-800 rounded-xl mb-4" />
                            <div className="h-5 bg-slate-800 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-slate-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : properties.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No properties yet</p>
                    <p className="text-slate-500 text-sm mt-1">Add your first property listing</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                        <div
                            key={property.id}
                            onClick={() => setSelectedProperty(property)}
                            className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
                        >
                            {property.images && property.images.length > 0 ? (
                                <div className="h-36 overflow-hidden">
                                    <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ) : (
                                <div className="h-36 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Building2 className="w-10 h-10 text-slate-600" />
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg truncate">{property.name}</h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(property.id); }}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {property.location}
                                </div>
                                <p className="text-xl font-bold text-indigo-400 mb-3">
                                    {formatPrice(property.price)}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    {property.bedrooms > 0 && (
                                        <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {property.bedrooms} Bed</span>
                                    )}
                                    {property.bathrooms > 0 && (
                                        <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms} Bath</span>
                                    )}
                                    {property.area > 0 && (
                                        <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {property.area} sqft</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Property Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit Property' : 'Add Property'}</h3>
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Property Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Sunset Heights Apartment"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                />
                            </div>

                            {/* State (dropdown) & City (textbox) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">State *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={selectedState}
                                            onChange={(e) => setSelectedState(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-900">Select State</option>
                                            {indianStates.map(s => (
                                                <option key={s} value={s} className="bg-slate-900">{s}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">City *</label>
                                    <input
                                        type="text"
                                        required
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Enter city name"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Full Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Address</label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder="Flat No. 301, Tower B, Sunrise Complex, MG Road..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
                                />
                            </div>

                            {/* Map Link (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Map / Location Link
                                        <span className="text-slate-500 font-normal">(optional)</span>
                                    </span>
                                </label>
                                <input
                                    type="url"
                                    value={form.map_link}
                                    onChange={(e) => setForm({ ...form, map_link: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                />
                            </div>

                            {/* Price & Area */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        placeholder="5000000"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Area (sqft)</label>
                                    <input
                                        type="number"
                                        value={form.area}
                                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                                        placeholder="1200"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Bedrooms & Bathrooms */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Bedrooms</label>
                                    <input
                                        type="number"
                                        value={form.bedrooms}
                                        onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                                        placeholder="3"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Bathrooms</label>
                                    <input
                                        type="number"
                                        value={form.bathrooms}
                                        onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                                        placeholder="2"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Beautiful apartment with sea view..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
                                />
                            </div>

                            {/* Amenities */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Amenities <span className="text-slate-500">(comma separated)</span></label>
                                <input
                                    type="text"
                                    value={form.amenities}
                                    onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                                    placeholder="Parking, Swimming Pool, Gym, Garden"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                />
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Photos</label>
                                <div className="space-y-3">
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {imagePreviews.map((preview, i) => (
                                                <div key={i} className="relative aspect-video rounded-lg overflow-hidden group/img border border-white/10">
                                                    <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(i)}
                                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/30 cursor-pointer transition-colors">
                                        <ImagePlus className="w-5 h-5 text-slate-500" />
                                        <span className="text-sm text-slate-400">Click to add photos</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingId ? 'Update Property' : 'Add Property'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
