import { PublicHeader } from "@/components/public/public-header";
import { TrackingForm } from "@/components/public/tracking-form";

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-mist">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <TrackingForm />
      </main>
    </div>
  );
}
