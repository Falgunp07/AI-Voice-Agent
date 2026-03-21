import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai'];
const types = ['Apartment', 'Villa', 'Penthouse', 'Plot'];

const amenitiesList = [
    'Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Security', 'Power Backup',
    'Parking', 'Jogging Track', 'Kids Play Area', 'Indoor Games'
];

function getRandomItems(arr: string[], count: number) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

const properties: any[] = [];

for (let i = 1; i <= 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const bhk = Math.floor(Math.random() * 4) + 1; // 1 to 4 BHK

    let price = 0;
    let size = 0;

    if (type === 'Villa') {
        price = 20000000 + Math.random() * 50000000; // 2Cr - 7Cr
        size = 2500 + Math.random() * 2000;
    } else if (type === 'Penthouse') {
        price = 15000000 + Math.random() * 40000000; // 1.5Cr - 5.5Cr
        size = 2000 + Math.random() * 1500;
    } else {
        price = 5000000 + Math.random() * 15000000; // 50L - 2Cr
        size = 800 + Math.random() * 1200;
    }

    // Rounding
    price = Math.floor(price / 100000) * 100000;
    size = Math.floor(size / 50) * 50;

    const name = `${type === 'Apartment' ? 'Skyline' : type === 'Villa' ? 'Royal' : 'Grand'} ${['Residency', 'Heights', 'Enclave', 'Greens', 'Towers'][Math.floor(Math.random() * 5)]} ${i}`;

    properties.push({
        name: name,
        description: `Luxurious ${bhk} BHK ${type} in ${city}. Features modern amenities and great connectivity.`,
        price: price,
        location: `${['Andheri', 'Whitefield', 'Banjara Hills', 'Koramangala', 'Vasant Vihar'][Math.floor(Math.random() * 5)]}, ${city}`,
        bedrooms: bhk,
        bathrooms: bhk,
        area: size,
        amenities: getRandomItems(amenitiesList, 4),
        images: [],
    });
}

async function seed() {
    console.log(`Seeding 50 properties...`);

    // We might need to sign in anonymously or essentially bypass RLS if using anon key?
    // Actually, usually anon key + RLS means we need a user.
    // For this script, I'll assume we can insert if I just use the service role key if available? 
    // Wait, the user only has NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
    // Let's check if there's a SERVICE_ROLE_KEY. If not, I'll log in a dummy user.

    // Let's try raw insert. If it fails, I'll auth.
    const { error } = await supabase.from('properties').insert(properties);

    if (error) {
        console.error('Error seeding:', error);
    } else {
        console.log('✅ Success! 50 properties added.');
    }
}

seed();
