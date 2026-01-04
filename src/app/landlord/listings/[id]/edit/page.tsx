import { getListingById, updateListing } from '@/lib/listings-store';
import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function EditListingPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const listing = await getListingById(id);

    if (!listing) {
        notFound();
    }

    async function editListing(formData: FormData) {
        'use server';

        const title = formData.get('title') as string;
        const price = formData.get('price') as string;
        const address = formData.get('address') as string;
        const description = formData.get('description') as string;
        const status = formData.get('status') as 'Active' | 'Inactive';

        await updateListing(id, {
            title,
            price,
            address,
            description,
            status,
        });

        revalidatePath('/landlord/listings');
        redirect('/landlord/listings');
    }

    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <form action={editListing}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Edit Listing</h1>
                        <p style={{ color: 'var(--secondary)' }}>Refine your property's marketplace presence.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href="/landlord/listings" className="btn" style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>Cancel</Link>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Details & Specs */}
                        <section className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Property Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Property Title</label>
                                    <input name="title" defaultValue={listing.title} required className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Monthly Rent ($)</label>
                                    <input name="price" defaultValue={listing.price} required className="input-field" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                                <textarea name="description" defaultValue={listing.description} placeholder="Tell potential renters what makes this place special..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '150px' }}></textarea>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Status</label>
                                <select name="status" defaultValue={listing.status} className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'white' }}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Location */}
                        <section className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Location</h3>
                            <div style={{ marginTop: '1rem' }}>
                                <input name="address" defaultValue={listing.address} required className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ marginTop: '1rem', height: '150px', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Map Preview</span>
                            </div>
                        </section>
                    </div>
                </div>
            </form>
        </main>
    );
}
