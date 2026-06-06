import { AuthLayout } from '@/components/layouts/AuthLayout';

export default function LoginPage() {
  return (
    <AuthLayout>
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <p className="text-sm font-medium text-primary">NextShift OS</p>
        <h1 className="mt-3 text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-slate-600">Authentication placeholder.</p>
      </section>
    </AuthLayout>
  );
}
