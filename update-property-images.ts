import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// High-quality real estate images from Unsplash (direct URLs, no API key needed)
const realEstateImages = [
    // Apartments / Interiors
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', // Modern apartment
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', // Living room
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Bedroom
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80', // Kitchen
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // House exterior
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // Luxury house
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', // Villa
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Modern villa
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', // Luxury home
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Beautiful house
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', // Swimming pool
    'https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=800&q=80', // Interior
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', // Apartment view
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80', // Living space
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', // Modern house
    'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&q=80', // Exterior
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Pool villa
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', // Colorful house
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', // Suburban home
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', // Villa front
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Bathroom
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80', // Dining room
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', // Home exterior
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', // Interior design
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80', // Penthouse view
];

function getRandomImages(count: number): string[] {
    const shuffled = [...realEstateImages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function updateImages() {
    console.log('Fetching properties...');

    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, name')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching properties:', error);
        return;
    }

    if (!properties || properties.length === 0) {
        console.log('No properties found.');
        return;
    }

    console.log(`Found ${properties.length} properties. Adding images...`);

    let updated = 0;
    for (const prop of properties) {
        // Each property gets 2-4 random images
        const imageCount = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
        const images = getRandomImages(imageCount);

        const { error: updateError } = await supabase
            .from('properties')
            .update({ images })
            .eq('id', prop.id);

        if (updateError) {
            console.error(`Error updating ${prop.name}:`, updateError);
        } else {
            updated++;
            console.log(`✅ ${prop.name}: ${images.length} images added`);
        }
    }

    console.log(`\n🎉 Done! Updated ${updated}/${properties.length} properties with images.`);
}

updateImages();
