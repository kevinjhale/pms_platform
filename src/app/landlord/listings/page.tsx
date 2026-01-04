import Link from 'next/link';
import { getListings } from '@/lib/listings-store';

export default async function LandlordListings() {
    const listings = await getListings();

    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>My Listings</h1>
                    <p style={{ color: 'var(--secondary)' }}>Manage and monitor your active property listings.</p>
                </div>
                <Link href="/landlord/listings/new" className="btn btn-primary">Add New Listing</Link>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {listings.map((listing) => (
                    <div key={listing.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ height: '80px', width: '80px', backgroundColor: 'var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                🏠
                            </div>
                            <div>
                                <h3 style={{ marginBottom: '0.25rem' }}>{listing.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>{listing.address}</p>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                    <span>💰 ${listing.price}/mo</span>
                                    <span>👁️ {listing.views} views</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: listing.status === 'Active' ? '#f0fdf4' : '#f1f5f9',
                                color: listing.status === 'Active' ? '#15803d' : '#64748b',
                            }}>
                                {listing.status}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link href={`/landlord/listings/${listing.id}/edit`} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>Edit</Link>
                                <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', border: '1px solid var(--border)', color: 'var(--error)' }}>Archive</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
