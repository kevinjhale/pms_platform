
export default function LandlordApplications() {
    const applications = [
        { id: 1, name: "John Doe", property: "Sunset Apartments #402", status: "Reviewing", date: "2023-10-25" },
        { id: 2, name: "Jane Smith", property: "Green Valley Lofts", status: "Pending Documents", date: "2023-10-24" },
        { id: 3, name: "Robert Brown", property: "Sunset Apartments #402", status: "Ready for Screening", date: "2023-10-23" },
    ];

    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 'bold' }}>Application Portal</h1>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem' }}>Applicant</th>
                            <th style={{ padding: '1rem' }}>Property</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Applied Date</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{app.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{app.property}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: app.status === 'Reviewing' ? '#eff6ff' : app.status === 'Ready for Screening' ? '#f0fdf4' : '#fff7ed',
                                        color: app.status === 'Reviewing' ? '#1d4ed8' : app.status === 'Ready for Screening' ? '#15803d' : '#9a3412',
                                    }}>
                                        {app.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{app.date}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', border: '1px solid var(--border)' }}>Review</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <section className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Document Vault</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '1rem' }}>Securely access encrypted tenant documents including IDs and proof of income.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                        <div style={{ fontSize: '1.5rem' }}>📄</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>W2_Jane_Smith.pdf</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Verified via Plaid Integration</div>
                        </div>
                        <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</button>
                    </div>
                </section>
            </div>
        </main>
    );
}
