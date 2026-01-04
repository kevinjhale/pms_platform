
export default function BackgroundScreening() {
    return (
        <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 'bold' }}>Background Screening</h1>
                <p style={{ color: 'var(--secondary)', marginBottom: '3rem' }}>
                    Execute secure credit, criminal, and eviction checks powered by top-tier providers.
                </p>

                <div style={{ display: 'grid', gap: '2rem' }}>

                    <section className="card" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>TransUnion Standard Report</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Full credit report + criminal background + eviction history.</p>
                            <div style={{ marginTop: '1rem', fontWeight: '600', fontSize: '1.25rem' }}>$35.00 <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--secondary)' }}>/ applicant</span></div>
                        </div>
                        <button className="btn btn-primary">Start New Check</button>
                    </section>

                    <section className="card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Recent Screenings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { name: "John Doe", status: "Completed", score: "742", provider: "TransUnion" },
                                { name: "Jane Smith", status: "In Progress", score: "-", provider: "Experian" },
                            ].map((report, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{report.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Provider: {report.provider}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: report.status === 'Completed' ? 'var(--success)' : 'var(--warning)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {report.status.toUpperCase()}
                                        </div>
                                        {report.score !== '-' && <div style={{ fontSize: '1rem', fontWeight: '800' }}>{report.score} <span style={{ fontSize: '0.625rem', color: 'var(--secondary)', fontWeight: 'normal' }}>Credit Score</span></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛡️</div>
                            <h4 style={{ marginBottom: '0.5rem' }}>FCRA Compliant</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>All data handled according to federal security standards.</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
                            <h4 style={{ marginBottom: '0.5rem' }}>Instant Results</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>90% of reports are returned in less than 60 seconds.</p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
