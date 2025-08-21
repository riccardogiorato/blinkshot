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
import useUserGenerations from "@/hooks/useUserGenerations";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [restoredPrompt, setRestoredPrompt] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
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
  const { currentSession, currentSessionId, addGeneration } =
    useUserGenerations();
  const generations = currentSession?.generations ?? [];
  let [activeIndex, setActiveIndex] = useState<number>();

  const selectedStyle = IMAGE_STYLES.find(
    (s) => s.value === selectedStyleValue,
  );

  const isQueryEnabled = !!debouncedPrompt.trim() && !isRestoring;
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
    enabled: isQueryEnabled,
    staleTime: Infinity,
    retry: false,
  });

  let isDebouncing = prompt !== debouncedPrompt;

  // Debug: initial mount state
  useEffect(() => {
    try {
      console.log("[page] mount", {
        href: typeof window !== "undefined" ? window.location.href : "",
        search: typeof window !== "undefined" ? window.location.search : "",
      });
    } catch {}
  }, []);

  useEffect(() => {
    console.log("[page] useEffect(image)", {
      hasImage: !!image,
      generations: generations.length,
      prompt,
      isRestoring,
      isQueryEnabled,
    });
    if (!image) return;
    if (!isQueryEnabled) return; // ignore placeholder/cached data when disabled
    if (isRestoring) return;
    if (!prompt.trim()) return;
    const last = generations[generations.length - 1];
    const isDuplicate =
      last && last.image && last.image.b64_json === image.b64_json;
    if (isDuplicate) return;
    const newIndex = generations.length;
    addGeneration({ prompt, image }, prompt);
    setActiveIndex(newIndex);
    console.log("[page] addGeneration + setActiveIndex", newIndex);
  }, [
    generations.length,
    image,
    prompt,
    addGeneration,
    isRestoring,
    isQueryEnabled,
  ]);

  // Ensure an image is shown on refresh or when switching sessions
  useEffect(() => {
    console.log("[page] session change", {
      currentSessionId,
      gens: generations.length,
      hasSession: !!currentSession,
    });
    if (!currentSession) {
      setActiveIndex(undefined);
      setPrompt("");
      setRestoredPrompt(null);
      setIsRestoring(false);
      return;
    }
    if (generations.length > 0) {
      setActiveIndex(generations.length - 1);
      console.log("[page] setActiveIndex(last)", generations.length - 1);
      const lastPrompt = generations[generations.length - 1]?.prompt ?? "";
      setPrompt(lastPrompt);
      setRestoredPrompt(lastPrompt);
      setIsRestoring(true);
    } else {
      setActiveIndex(undefined);
      setRestoredPrompt(null);
      setIsRestoring(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, generations.length]);

  // When the user edits the prompt away from the restored value, enable querying
  useEffect(() => {
    if (restoredPrompt !== null && prompt !== restoredPrompt) {
      setIsRestoring(false);
    }
  }, [prompt, restoredPrompt]);

  useEffect(() => {
    if (userAPIKey) {
      localStorage.setItem("togetherApiKey", userAPIKey);
    } else {
      localStorage.removeItem("togetherApiKey");
    }
  }, [userAPIKey]);

  const activeGeneration =
    activeIndex !== undefined ? generations[activeIndex] : undefined;

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
          {!activeGeneration ? (
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
              <div className="relative">
                <Image
                  placeholder="blur"
                  blurDataURL={imagePlaceholder.blurDataURL}
                  width={1024}
                  height={768}
                  src={`data:image/png;base64,${activeGeneration.image.b64_json}`}
                  alt=""
                  className={`${isFetching ? "animate-pulse" : ""} max-w-full rounded-lg object-cover shadow-sm shadow-black`}
                />
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `data:image/png;base64,${activeGeneration.image.b64_json}`;
                    link.download = `blinkshot-${activeGeneration.prompt.replace(/\s+/g, "-").toLowerCase()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="backdrop-filter-blur-2px absolute right-2 top-2 rounded-lg border-2 border-solid border-transparent bg-white/30 p-2 backdrop-blur-sm transition hover:bg-white/50 focus:outline-none"
                  title="Download image"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M8 0C8.16321 0 8.31974 0.0648349 8.43514 0.180242C8.55055 0.295649 8.61539 0.452174 8.61539 0.615385V10.2072L11.2574 7.56513C11.3138 7.50467 11.3817 7.45617 11.4572 7.42254C11.5327 7.3889 11.6142 7.37082 11.6968 7.36936C11.7794 7.3679 11.8615 7.3831 11.9381 7.41405C12.0148 7.445 12.0844 7.49107 12.1428 7.54951C12.2012 7.60794 12.2473 7.67755 12.2783 7.75418C12.3092 7.8308 12.3244 7.91288 12.3229 7.99551C12.3215 8.07813 12.3034 8.15962 12.2698 8.23511C12.2361 8.31059 12.1876 8.37853 12.1272 8.43487L8.43487 12.1272C8.31949 12.2424 8.16308 12.3072 8 12.3072C7.83692 12.3072 7.68051 12.2424 7.56513 12.1272L3.87282 8.43487C3.81236 8.37853 3.76387 8.31059 3.73023 8.23511C3.6966 8.15962 3.67851 8.07813 3.67705 7.99551C3.6756 7.91288 3.69079 7.8308 3.72175 7.75418C3.7527 7.67755 3.79876 7.60794 3.8572 7.54951C3.91564 7.49107 3.98524 7.445 4.06187 7.41405C4.13849 7.3831 4.22057 7.3679 4.3032 7.36936C4.38583 7.37082 4.46731 7.3889 4.5428 7.42254C4.61829 7.45617 4.68623 7.50467 4.74256 7.56513L7.38462 10.2072V0.615385C7.38462 0.452174 7.44945 0.295649 7.56486 0.180242C7.68026 0.0648349 7.83679 0 8 0ZM0.615385 11.0769C0.778595 11.0769 0.93512 11.1418 1.05053 11.2572C1.16593 11.3726 1.23077 11.5291 1.23077 11.6923V13.5385C1.23077 13.8649 1.36044 14.1779 1.59125 14.4087C1.82207 14.6396 2.13512 14.7692 2.46154 14.7692H13.5385C13.8649 14.7692 14.1779 14.6396 14.4087 14.4087C14.6396 14.1779 14.7692 13.8649 14.7692 13.5385V11.6923C14.7692 11.5291 14.8341 11.3726 14.9495 11.2572C15.0649 11.1418 15.2214 11.0769 15.3846 11.0769C15.5478 11.0769 15.7044 11.1418 15.8198 11.2572C15.9352 11.3726 16 11.5291 16 11.6923V13.5385C16 14.1913 15.7407 14.8174 15.279 15.279C14.8174 15.7407 14.1913 16 13.5385 16H2.46154C1.8087 16 1.1826 15.7407 0.720968 15.279C0.25934 14.8174 0 14.1913 0 13.5385V11.6923C0 11.5291 0.0648349 11.3726 0.180242 11.2572C0.295649 11.1418 0.452174 11.0769 0.615385 11.0769Z"
                      fill="black"
                    />
                  </svg>
                </button>
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
