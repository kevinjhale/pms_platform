
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
    return (
        <main className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: '4rem', paddingBottom: '4rem' }}>
            <LoginForm />
        </main>
    );
}
