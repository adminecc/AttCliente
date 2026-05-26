import { PublicHeader } from "@/components/public/public-header";
import { NewClaimForm } from "@/components/public/new-claim-form";

export default function NewClaimPage() {
  return (
    <div className="min-h-screen bg-mist">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <NewClaimForm />
      </main>
    </div>
  );
}
