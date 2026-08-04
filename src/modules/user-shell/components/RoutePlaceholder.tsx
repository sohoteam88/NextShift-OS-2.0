type RoutePlaceholderProps = {
  title: string;
  description: string;
};

export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-8 sm:px-6">
      <section className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold leading-snug text-[var(--color-text)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
      </section>
    </main>
  );
}
