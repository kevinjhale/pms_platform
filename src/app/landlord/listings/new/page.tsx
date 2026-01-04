import { addListing } from '@/lib/listings-store';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default function NewListingPage() {
    async function createListing(formData: FormData) {
        'use server';

        const title = formData.get('title') as string;
        const price = formData.get('price') as string;
        const address = formData.get('address') as string;
        const description = formData.get('description') as string;

        await addListing({
            title,
            price,
            address,
            description,
            status: 'Active',
        });

        revalidatePath('/landlord/listings');
        redirect('/landlord/listings');
    }

    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <form action={createListing}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Listing Engine</h1>
                        <p style={{ color: 'var(--secondary)' }}>Create a high-conversion property listing.</p>
                    </div>
                    <button type="submit" className="btn btn-primary">Publish Listing</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Photos & Media - Purely UI for now */}
                        <section className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Photos & 3D Tours</h3>
                            <div
                                style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: 'var(--radius)',
                                    padding: '3rem',
                                    textAlign: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.02)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📸</div>
                                <p style={{ fontWeight: '500' }}>Drop photos here or click to upload</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Upload high-res images and 3D Matterport links</p>
                            </div>
                        </section>

                        {/* Details & Specs */}
                        <section className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Property Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Property Title</label>
                                    <input name="title" required className="input-field" placeholder="Modern Loft in Downtown" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Monthly Rent ($)</label>
                                    <input name="price" required className="input-field" type="number" placeholder="2500" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                                <textarea name="description" placeholder="Tell potential renters what makes this place special..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '150px' }}></textarea>
                            </div>
                        </section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Map Integration Placeholder */}
                        <section className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Location Services</h3>
                            <div style={{ height: '200px', backgroundColor: '#e2e8f0', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '1rem' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📍</div>
                                <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>In-App Map Integration</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Powered by Google Maps / Mapbox</p>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <input name="address" required className="input-field" placeholder="Enter street address" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                            </div>
                        </section>

                        {/* Integration Status */}
                        <section className="card" style={{ backgroundColor: 'var(--surface)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Marketplace Sync</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span>Zillow</span>
                                    <span style={{ color: 'var(--success)' }}>Connected</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span>Apartments.com</span>
                                    <span style={{ color: 'var(--success)' }}>Connected</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </form>
        </main>
    );
}
