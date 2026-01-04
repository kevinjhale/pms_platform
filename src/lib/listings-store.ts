
// Simplified in-memory store for demo purposes
// In a real app, this would be a database (Prisma, Supabase, etc.)

export type Listing = {
    id: string;
    title: string;
    price: string;
    status: 'Active' | 'Inactive';
    address: string;
    views: number;
    description?: string;
};

// Seed data
let listings: Listing[] = [
    { id: "1", title: "Modern Loft in Downtown", price: "2,500", status: "Active", address: "123 Main St, Central City", views: 450 },
    { id: "2", title: "Sunset Apartments #402", price: "1,800", status: "Active", address: "456 West Ave, North Park", views: 120 },
    { id: "3", title: "Green Valley Lofts", price: "3,200", status: "Inactive", address: "789 Pine Rd, Green Valley", views: 0 },
    { id: "4", title: "Ocean View Condo", price: "4,500", status: "Active", address: "101 Beach Blvd, Seaside", views: 890 },
    { id: "5", title: "Cozy Studio", price: "1,200", status: "Active", address: "555 Elm St, Old Town", views: 230 },
    { id: "6", title: "Luxury Penthouse", price: "8,000", status: "Active", address: " luxury Ln, Skyline", views: 1540 },
    { id: "7", title: "Suburban Family Home", price: "2,800", status: "Active", address: "88 Maple Dr, Suburbia", views: 110 },
    { id: "8", title: "Urban Loft", price: "2,100", status: "Active", address: "33 Industrial Way, Bricktown", views: 67 },
    { id: "9", title: "Riverside Cottage", price: "1,950", status: "Active", address: "7 River Rd, Waterside", views: 45 },
    { id: "10", title: "High-Rise Apartment", price: "2,300", status: "Active", address: "99 Tower Dr, Metropol", views: 190 },
    { id: "11", title: "Garden Duplex", price: "2,600", status: "Active", address: "14 Garden Way, Bloomsbury", views: 33 },
    { id: "12", title: "Modern Terrace", price: "3,000", status: "Active", address: "50 Modern St, New Era", views: 88 },
];

export async function getListings() {
    return listings;
}

export async function getListingById(id: string) {
    return listings.find(l => l.id === id);
}

export async function addListing(listing: Omit<Listing, 'id' | 'views'>) {
    const newListing: Listing = {
        ...listing,
        id: Math.random().toString(36).substr(2, 9),
        views: 0,
    };
    listings = [newListing, ...listings];
    return newListing;
}

export async function updateListing(id: string, updates: Partial<Listing>) {
    listings = listings.map(l => l.id === id ? { ...l, ...updates } : l);
    return listings.find(l => l.id === id);
}

export async function deleteListing(id: string) {
    listings = listings.filter(l => l.id === id);
}
