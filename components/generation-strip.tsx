"use client";

import Image from "next/image";
import imagePlaceholder from "@/public/image-placeholder.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  return (
    <div className="relative mt-4 pb-4">
      <Carousel
        className="px-10"
        opts={{ dragFree: true, containScroll: "trimSnaps" }}
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
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
}
