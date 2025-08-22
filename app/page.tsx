"use client";

import CheckIcon from "@/components/icons/check-icon";
import PictureIcon from "@/components/icons/picture-icon";
import Spinner from "@/components/spinner";
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
import GenerationStrip from "@/components/generation-strip";
import { timeAgo } from "@/lib/utils";

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
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const debounceDelay = wordCount <= 2 ? 900 : wordCount <= 5 ? 600 : 350;
  const debouncedPrompt = useDebounce(prompt, debounceDelay);
  const {
    sessions,
    currentSession,
    currentSessionId,
    addGeneration,
    deleteSession,
  } = useUserGenerations();
  const generations = currentSession?.generations ?? [];
  let [activeIndex, setActiveIndex] = useState<number>();

  const selectedStyle = IMAGE_STYLES.find(
    (s) => s.value === selectedStyleValue,
  );

  const isQueryEnabled = !!debouncedPrompt.trim() && !isRestoring;
  const { data: image, isFetching } = useQuery<ImageResponse | null>({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt + selectedStyleValue],
    queryFn: async ({ signal }) => {
      if (!prompt.trim()) return null;
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
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

  useEffect(() => {
    if (!image) return;
    if (!isQueryEnabled) return; // ignore placeholder/cached data when disabled
    if (isRestoring) return;
    if (!prompt.trim()) return;
    const last = generations[generations.length - 1];
    const isDuplicate =
      last && last.image && image && last.image.b64_json === image.b64_json;
    if (isDuplicate) return;
    const newIndex = generations.length;
    addGeneration({ prompt, image }, prompt);
    setActiveIndex(newIndex);
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
    if (!currentSession) {
      setActiveIndex(undefined);
      setPrompt("");
      setRestoredPrompt(null);
      setIsRestoring(false);
      return;
    }
    if (generations.length > 0) {
      setActiveIndex(generations.length - 1);
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
      <div className="relative flex h-full flex-col px-5">
        <Header userAPIKey={userAPIKey} onAPIKeyChange={setUserAPIKey} />

        <div className="flex justify-center">
          <form className="mt-5 w-full max-w-lg">
            <fieldset>
              <div className="relative">
                <Textarea
                  rows={2}
                  spellCheck={false}
                  placeholder="Describe your image..."
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 px-4 text-sm placeholder-gray-300"
                />
                <div
                  className={`${isFetching || isDebouncing ? "flex" : "hidden"} absolute bottom-3 right-3 items-center justify-center`}
                >
                  <Spinner className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-start gap-1.5 text-sm md:text-right">
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
              </div>
            </fieldset>
          </form>
        </div>

        <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-8 text-center">
          {!activeGeneration ? (
            <div className="max-w-xl md:max-w-4xl lg:max-w-3xl">
              <p className="text-xl font-semibold text-gray-200 md:text-3xl lg:text-4xl">
                Generate images in real-time
              </p>
              <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
                Enter a prompt and generate images in milliseconds as you type.
                Powered by Flux on Together AI.
              </p>
              {sessions && sessions.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-350">
                    Previous sessions
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {sessions
                      .filter((s) => (s.generations?.length ?? 0) > 0)
                      .reverse()
                      .map((s) => {
                        const lastGen = s.generations[s.generations.length - 1];
                        return (
                          <div key={s.sessionId} className="group relative">
                            <a
                              href={`/?session=${s.sessionId}`}
                              className="block overflow-hidden rounded-md"
                              title={lastGen?.prompt || "Open session"}
                            >
                              <Image
                                placeholder="blur"
                                blurDataURL={imagePlaceholder.blurDataURL}
                                width={256}
                                height={192}
                                src={`data:image/png;base64,${lastGen.image.b64_json}`}
                                alt="Session preview"
                                className="h-32 w-full rounded object-cover"
                              />
                            </a>
                            <div className="pointer-events-none absolute inset-0 rounded-md bg-black/30 transition group-hover:bg-black/50" />
                            <div className="pointer-events-none absolute inset-0 hidden items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white group-hover:flex">
                              <div className="pr-6">
                                <p className="line-clamp-2 font-semibold">
                                  {lastGen?.prompt || "Untitled"}
                                </p>
                                <p className="mt-1 text-[10px] opacity-80">
                                  {s.generations.length}{" "}
                                  {s.generations.length === 1
                                    ? "image"
                                    : "images"}
                                  {lastGen?.createdAt
                                    ? ` • ${timeAgo(lastGen.createdAt)}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteSession(s.sessionId);
                              }}
                              className="absolute right-2 top-2 inline-flex items-center justify-center rounded bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              aria-label="Delete session"
                              title="Delete session"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3 6h18M9 6V4h6v2m-8 0h10l-1 14H8L7 6z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
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
                  <img src="/download.svg" className="" alt="size-[16px]" />
                </button>
              </div>

              <GenerationStrip
                generations={generations}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
