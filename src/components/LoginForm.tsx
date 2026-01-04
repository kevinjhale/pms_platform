
'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password.");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (e) {
            setError("An unexpected error occurred.");
        }
    }

    const handleSocialLogin = (provider: string) => {
        signIn(provider, { callbackUrl: "/dashboard" });
    }

    return (
        <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Welcome Back</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => handleSocialLogin('google')} className="btn" style={{ width: '100%', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--surface-foreground)' }}>
                    Sign in with Google
                </button>

                <button onClick={() => handleSocialLogin('github')} className="btn" style={{ width: '100%', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--surface-foreground)' }}>
                    Sign in with GitHub
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                    <span style={{ padding: '0 0.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>or</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius)', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Email</label>
                        <input name="email" type="email" placeholder="example@email.com" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--surface-foreground)' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Password</label>
                        <input name="password" type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--surface-foreground)' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
                        Sign In
                    </button>
                    <button type="button" className="btn" style={{ width: '100%', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--primary)' }}>
                        Create an account
                    </button>
                </form>

                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Demo Credentials</p>
                    <div style={{ display: 'grid', gap: '0.5rem', color: 'var(--secondary)' }}>
                        <div>
                            <span style={{ fontWeight: '500' }}>Renter:</span> renter@demo.com / any
                        </div>
                        <div>
                            <span style={{ fontWeight: '500' }}>Landlord:</span> landlord@demo.com / any
                        </div>
                        <div>
                            <span style={{ fontWeight: '500' }}>Manager:</span> manager@demo.com / any
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
