
import { getListings } from '@/lib/listings-store';
import Link from 'next/link';

export default async function RenterBrowsePage({
    searchParams
}: {
    searchParams: Promise<{ query?: string, page?: string }>
}) {
    const params = await searchParams;
    const query = params.query || "";
    const currentPage = parseInt(params.page || "1", 10);
    const pageSize = 10;

    let allListings = await getListings();

    // Filter by query if present
    if (query) {
        allListings = allListings.filter(l =>
            l.title.toLowerCase().includes(query.toLowerCase()) ||
            l.address.toLowerCase().includes(query.toLowerCase())
        );
    }

    // Filter only active listings for renters
    allListings = allListings.filter(l => l.status === 'Active');

    const totalListings = allListings.length;
    const totalPages = Math.ceil(totalListings / pageSize);
    const paginatedListings = allListings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Browse Listings</h1>
                <p style={{ color: 'var(--secondary)' }}>Find your next home from our verified properties.</p>
            </div>

            {/* Search Bar */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <form action="/renter/browse" method="GET" style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        name="query"
                        defaultValue={query}
                        placeholder="Search by city, address, or building name..."
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)'
                        }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>Search</button>
                </form>
            </div>

            {/* Listings Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem' }}>Property</th>
                            <th style={{ padding: '1rem' }}>Location</th>
                            <th style={{ padding: '1rem' }}>Price</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedListings.length > 0 ? (
                            paginatedListings.map((listing) => (
                                <tr key={listing.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600' }}>{listing.title}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--secondary)', fontSize: '0.875rem' }}>
                                        {listing.address}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                        ${listing.price}<span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>/mo</span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>Apply Now</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    No listings found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <Link
                            key={pageNum}
                            href={`/renter/browse?query=${query}&page=${pageNum}`}
                            className="btn"
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--border)',
                                backgroundColor: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                                color: currentPage === pageNum ? 'white' : 'inherit',
                                textDecoration: 'none'
                            }}
                        >
                            {pageNum}
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
