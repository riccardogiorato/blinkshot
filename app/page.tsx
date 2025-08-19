"use client";

import CheckIcon from "@/components/icons/check-icon";
import GithubIcon from "@/components/icons/github-icon";
import PictureIcon from "@/components/icons/picture-icon";
import XIcon from "@/components/icons/x-icon";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_PROMPTS, IMAGE_STYLES } from "@/lib/config";
import imagePlaceholder from "@/public/image-placeholder.png";
import { Banner } from "@/components/layout/banner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";


import * as RadioGroup from "@radix-ui/react-radio-group";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useEffect, useState } from "react";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [userAPIKey, setUserAPIKey] = useState(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      return localStorage.getItem("togetherApiKey") || "";
    }
    return "";
  });
  const [selectedStyleValue, setSelectedStyleValue] = useState("");
  const debouncedPrompt = useDebounce(prompt, 350);
  const [generations, setGenerations] = useState<
    { prompt: string; image: ImageResponse }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();

  const selectedStyle = IMAGE_STYLES.find((s) => s.value === selectedStyleValue);

  const { data: image, isFetching } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt + selectedStyleValue],
    queryFn: async () => {
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          style: IMAGE_PROMPTS[selectedStyleValue],
          userAPIKey,
          iterativeMode,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      return (await res.json()) as ImageResponse;
    },
    enabled: !!debouncedPrompt.trim(),
    staleTime: Infinity,
    retry: false,
  });

  let isDebouncing = prompt !== debouncedPrompt;

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => [...images, { prompt, image }]);
      setActiveIndex(generations.length);
    }
  }, [generations, image, prompt]);

  useEffect(() => {
    if (userAPIKey) {
      localStorage.setItem("togetherApiKey", userAPIKey);
    } else {
      localStorage.removeItem("togetherApiKey");
    }
  }, [userAPIKey]);


  let activeImage =
    activeIndex !== undefined ? generations[activeIndex].image : undefined;

  return (
    <div className="flex h-full flex-col">
      <Banner />
      <div className="relative mt-3 flex h-full flex-col px-5">
        <Header userAPIKey={userAPIKey} onAPIKeyChange={setUserAPIKey} />

        <div className="flex justify-center">
          <form className="mt-10 w-full max-w-lg">
            <fieldset>
              <div className="relative">
                <Textarea
                  rows={4}
                  spellCheck={false}
                  placeholder="Describe your image..."
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 px-4 text-base placeholder-gray-300"
                />
                <div
                  className={`${isFetching || isDebouncing ? "flex" : "hidden"} absolute bottom-3 right-3 items-center justify-center`}
                >
                  <Spinner className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-sm md:text-right">
                <div>
                  <label
                    title="Use earlier images as references"
                    className="inline-flex cursor-pointer items-center gap-2 rounded border-[0.5px] border-gray-350 bg-gray-500 px-2 py-1.5 shadow shadow-black"
                  >
                    <input
                      type="checkbox"
                      className="accent-white"
                      checked={iterativeMode}
                      onChange={() => {
                        setIterativeMode(!iterativeMode);
                      }}
                    />
                    Consistency Mode
                  </label>
                </div>
                <div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-sm border-[0.5px] border-gray-350 bg-gray-400 px-2 py-1.5 text-gray-200"
                      >
                        <PictureIcon className="size-[12px]" />
                        {selectedStyle
                          ? `Style: ${selectedStyle.label}`
                          : "Styles"}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="p-10">
                      <DialogHeader>
                        <DialogTitle>Select a style</DialogTitle>
                        <DialogDescription>
                          Select a style to instantly transform your shots and
                          bring out the best in your creative ideas.{" "}
                          <span className="text-gray-350">
                            Experiment, explore, and make it yours!
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <RadioGroup.Root
                        value={selectedStyleValue}
                        onValueChange={setSelectedStyleValue}
                        className="grid grid-cols-2 gap-2 md:grid-cols-4"
                      >
                        {IMAGE_STYLES.map((style) => (
                          <RadioGroup.Item
                            value={style.value}
                            className="group relative"
                            key={style.value}
                          >
                            <Image
                              src={style.image}
                              sizes="(max-width: 768px) 50vw, 150px"
                              alt={style.label}
                              className="aspect-square rounded transition group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:opacity-50"
                            />
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent p-2">
                              <p className="text-xs font-bold text-white">
                                {style.label}
                              </p>
                              <RadioGroup.Indicator className="inline-flex size-[14px] items-center justify-center rounded-full bg-white">
                                <CheckIcon />
                              </RadioGroup.Indicator>
                            </div>
                          </RadioGroup.Item>
                        ))}
                      </RadioGroup.Root>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
          {!activeImage || !prompt ? (
            <div className="max-w-xl md:max-w-4xl lg:max-w-3xl">
              <p className="text-xl font-semibold text-gray-200 md:text-3xl lg:text-4xl">
                Generate images in real-time
              </p>
              <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
                Enter a prompt and generate images in milliseconds as you type.
                Powered by Flux on Together AI.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex w-full max-w-4xl flex-col justify-center">
              <div>
                <Image
                  placeholder="blur"
                  blurDataURL={imagePlaceholder.blurDataURL}
                  width={1024}
                  height={768}
                  src={`data:image/png;base64,${activeImage.b64_json}`}
                  alt=""
                  className={`${isFetching ? "animate-pulse" : ""} max-w-full rounded-lg object-cover shadow-sm shadow-black`}
                />
              </div>

              <div className="mt-4 flex flex-row-reverse gap-4 overflow-x-scroll pb-4">
                {generations.map((generatedImage, i) => (
                  <button
                    key={i}
                    className="w-32 shrink-0 opacity-50 hover:opacity-100"
                    onClick={() => setActiveIndex(i)}
                  >
                    <Image
                      placeholder="blur"
                      blurDataURL={imagePlaceholder.blurDataURL}
                      width={1024}
                      height={768}
                      src={`data:image/png;base64,${generatedImage.image.b64_json}`}
                      alt=""
                      className="max-w-full rounded-lg object-cover shadow-sm shadow-black"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}