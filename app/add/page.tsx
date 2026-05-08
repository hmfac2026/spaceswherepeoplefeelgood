import { AddPlaceForm } from "@/components/add-place-form";

export const dynamic = "force-dynamic";

export default function AddPage() {
  return (
    <section className="flex flex-1 items-start px-6 py-16 sm:py-20">
      <AddPlaceForm />
    </section>
  );
}
