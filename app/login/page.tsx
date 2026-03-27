import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <section className="auth-shell">
      <AuthForm mode="login" />
    </section>
  );
}
