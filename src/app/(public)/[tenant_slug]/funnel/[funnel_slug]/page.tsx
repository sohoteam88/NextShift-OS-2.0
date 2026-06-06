type PublicFunnelPageProps = {
  params: {
    tenant_slug: string;
    funnel_slug: string;
  };
};

export default function PublicFunnelPage({ params }: PublicFunnelPageProps) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-primary">{params.tenant_slug}</p>
      <h1 className="mt-3 text-3xl font-semibold">Public Funnel</h1>
      <p className="mt-2 text-slate-600">Funnel placeholder: {params.funnel_slug}</p>
    </section>
  );
}
