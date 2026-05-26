import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <section className="surface max-w-lg p-8 text-center">
        <p className="text-sm font-semibold text-rail">Plataforma OAC</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Página no encontrada</h1>
        <p className="mt-2 text-sm text-slate-600">La ruta solicitada no existe en este prototipo.</p>
        <Link className="focus-ring mt-5 inline-flex rounded-lg bg-rail px-4 py-2 text-sm font-semibold text-white" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
