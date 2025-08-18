import cinematicImage from "@/public/styles/cinematic.png";
import fantasyImage from "@/public/styles/fantasy.png";
import minimalImage from "@/public/styles/minimal.png";
import moodyImage from "@/public/styles/moody.png";
import popArtImage from "@/public/styles/pop-art.png";
import retroImage from "@/public/styles/retro.png";
import vibrantImage from "@/public/styles/vibrant.png";
import watercolorImage from "@/public/styles/watercolor.png";
import artDecoImage from "@/public/styles/art-deco.jpeg";
import cyberpunkImage from "@/public/styles/cyberpunk.jpeg";
import grafitiImage from "@/public/styles/grafiti.jpeg";
import surrealImage from "@/public/styles/surreal.jpeg";

export const IMAGE_STYLES = [
    {
        label: "Pop Art",
        value: "pop-art",
        image: popArtImage,
        prompt:
            "Create an image in the bold and vibrant style of classic pop art, using bright primary colors, thick outlines, and a playful comic book flair. Incorporate stylized, mass-produced imagery or dotted shading for added impact.",
    },
    {
        label: "Minimal",
        value: "minimal",
        image: minimalImage,
        prompt:
            "Generate a simple, clean composition with limited shapes and subtle color accents. Emphasize negative space and precise lines to achieve an elegant, understated look.",
    },
    {
        label: "Retro",
        value: "retro",
        image: retroImage,
        prompt:
            "Design a vintage-inspired scene with nostalgic color palettes, distressed textures, and bold mid-century typography. Capture the essence of old posters, ads, or signs for an authentic throwback vibe.",
    },
    {
        label: "Watercolor",
        value: "watercolor",
        image: watercolorImage,
        prompt:
            "Produce a delicate, painterly image emulating fluid watercolor strokes and soft gradients. Blend pastel hues and dreamy splashes to create a light, handcrafted feel.",
    },
    {
        label: "Fantasy",
        value: "fantasy",
        image: fantasyImage,
        prompt:
            "Illustrate a whimsical realm filled with magical creatures, enchanted forests, and otherworldly elements. Use vibrant colors and ornate detailing to evoke a sense of wonder and adventure.",
    },
    {
        label: "Moody",
        value: "moody",
        image: moodyImage,
        prompt:
            "Craft an atmospheric scene defined by dramatic lighting, deep shadows, and rich textures. Evoke emotion with subdued color tones and an underlying sense of tension.",
    },
    {
        label: "Vibrant",
        value: "vibrant",
        image: vibrantImage,
        prompt:
            "Generate an energetic, eye-popping design with bold, saturated hues and dynamic contrasts. Layer vivid gradients and striking shapes for a lively, high-impact result.",
    },
    {
        label: "Cinematic",
        value: "cinematic",
        image: cinematicImage,
        prompt:
            "Compose a visually stunning frame reminiscent of a movie still, complete with dramatic lighting and evocative color grading. Convey a strong sense of story through expressive angles and rich detail.",
    },
    {
        label: "Cyberpunk",
        value: "cyberpunk",
        image: cyberpunkImage,
        prompt:
            "Envision a futuristic, neon-lit cityscape infused with advanced technology and dystopian undertones. Layer towering skyscrapers, holographic signage, and edgy urban elements for a gritty, high-tech aesthetic.",
    },
    {
        label: "Surreal",
        value: "Surreal",
        image: surrealImage,
        prompt:
            "Construct a dreamlike world blending unexpected, fantastical elements in bizarre yet captivating ways. Use vivid colors and warped perspectives to create an otherworldly, mind-bending atmosphere.",
    },
    {
        label: "Art Deco",
        value: "art-deco",
        image: artDecoImage,
        prompt:
            "Design a scene characterized by bold geometric shapes, streamlined forms, and luxe metallic accents. Channel the sophistication of the 1920s and 1930s with glamorous patterns and elegant symmetry.",
    },
    {
        label: "Grafiti",
        value: "grafiti",
        image: grafitiImage,
        prompt:
            "Produce an urban-inspired piece rich with spray paint textures, edgy lettering, and vibrant color bursts. Layer paint drips, splatters, and bold typography for a raw, street-art aesthetic.",
    },
];

export const IMAGE_PROMPTS: Record<string, string> = IMAGE_STYLES.reduce(
    (acc, style) => ({
        ...acc,
        [style.value]: style.prompt,
    }),
    {},
);
