"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import imagePlaceholder from "@/public/image-placeholder.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

type Generation = {
  image: { b64_json: string };
  prompt?: string;
};

type GenerationStripProps = {
  generations: Generation[];
  activeIndex: number | undefined;
  onSelect: (index: number) => void;
};

export default function GenerationStrip({
  generations,
  activeIndex,
  onSelect,
}: GenerationStripProps) {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);
  const [currentSnap, setCurrentSnap] = useState(0);
  const [totalSnaps, setTotalSnaps] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setCurrentSnap(api.selectedScrollSnap());
      setTotalSnaps(api.scrollSnapList().length);
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  return (
    <div className="relative mt-4 pb-8">
      <Carousel
        className="px-10"
        opts={{ dragFree: true, containScroll: "trimSnaps" }}
        setApi={setApi}
      >
        <CarouselContent>
          {[...generations]
            .map((gen, idx) => ({ gen, idx }))
            .reverse()
            .map(({ gen, idx }) => (
              <CarouselItem key={idx} className="basis-32">
                <button
                  className={`${activeIndex === idx ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
                  onClick={() => onSelect(idx)}
                >
                  <Image
                    placeholder="blur"
                    blurDataURL={imagePlaceholder.blurDataURL}
                    width={1024}
                    height={768}
                    src={`data:image/png;base64,${gen.image.b64_json}`}
                    alt=""
                    className="max-w-full rounded-lg object-cover shadow-sm shadow-black"
                  />
                </button>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 h-7 w-7 md:h-8 md:w-8" />
        <CarouselNext className="right-0 h-7 w-7 md:h-8 md:w-8" />
      </Carousel>
      {totalSnaps > 0 ? (
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-gray-300 md:hidden">
          {`${Math.min(currentSnap + 1, totalSnaps)} of ${totalSnaps}`}
        </div>
      ) : null}
    </div>
  );
}
