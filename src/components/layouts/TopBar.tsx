export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
      <div>
        <p className="text-sm text-slate-500">NextShift OS</p>
        <h1 className="text-base font-semibold">Workspace</h1>
      </div>
      <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">MVP</div>
    </header>
  );
}
