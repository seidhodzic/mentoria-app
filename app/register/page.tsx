import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <section className="auth-shell">
      <AuthForm mode="register" />
    </section>
  );
}
