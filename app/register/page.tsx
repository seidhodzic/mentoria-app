import AuthForm from '@/components/AuthForm';
import AuthMarketingColumn from '@/components/auth/AuthMarketingColumn';
import AuthPortalShell from '@/components/auth/AuthPortalShell';

export default function RegisterPage() {
  return (
    <AuthPortalShell>
      <AuthMarketingColumn />
      <div className="relative z-[1] flex items-start justify-center px-[5%] pb-20 pt-10 max-lg:pb-16 lg:min-h-[calc(100vh-72px)] lg:pt-[52px]">
        <AuthForm />
      </div>
    </AuthPortalShell>
  );
}
