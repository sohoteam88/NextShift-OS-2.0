import { AuthLayout } from '@/components/layouts/AuthLayout';

export default function RegisterPage() {
  return (
    <AuthLayout>
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <p className="text-sm font-medium text-primary">NextShift OS</p>
        <h1 className="mt-3 text-3xl font-semibold">Register</h1>
        <p className="mt-2 text-slate-600">Registration placeholder.</p>
      </section>
    </AuthLayout>
  );
}
