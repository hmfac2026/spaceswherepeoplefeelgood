import { PlaceMap } from "@/components/place-map";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { AddPlaceFab } from "@/components/add-place-fab";

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl md:text-6xl">
            Building a map of places with good energy
            <span className="text-ink-soft">
              {" "}
              — and a community of people who find them.
            </span>
          </h1>
        </div>
        <ScrollIndicator />
      </section>

      <section
        id="map"
        className="border-rule/60 relative h-[90vh] w-full border-y"
      >
        <PlaceMap />
      </section>

      <AddPlaceFab />
    </>
  );
}
