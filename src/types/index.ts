export interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    budget?: string;
    location?: string;
    preferences?: string;
    status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'callback';
    leadScore?: 'hot' | 'warm' | 'cold';
    createdAt: Date;
    updatedAt: Date;
}

export interface CallLog {
    id: string;
    leadId: string;
    duration: number;
    status: 'completed' | 'failed' | 'no_answer' | 'busy';
    transcript?: string;
    recordingUrl?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    createdAt: Date;
}

export interface Property {
    id: string;
    name: string;
    description: string;
    price: number;
    location: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    images: string[];
    amenities?: string[];
    createdAt: Date;
}

export interface Campaign {
    id: string;
    name: string;
    propertyId: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    totalLeads: number;
    calledLeads: number;
    successfulCalls: number;
    createdAt: Date;
}

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'admin' | 'client';
    createdAt: Date;
}
