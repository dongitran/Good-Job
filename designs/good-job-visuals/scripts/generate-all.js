import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// Architecture context — deployment services only, no internal module names
// ─────────────────────────────────────────────────────────────────────────────

const ARCH_CONTEXT = `Good Job — Employee Recognition Platform infrastructure:
- GKE Cluster (Google Kubernetes Engine, asia-southeast1) with React SPA pod and NestJS API pod
- React SPA: served by nginx container
- NestJS API: REST backend (Node.js container)
- PostgreSQL 16: primary database
- Redis 7: cache and pub-sub
- Google Cloud Storage: file storage
- Gemini AI: semantic search
- Resend: transactional email
- NGINX Ingress + Let's Encrypt SSL: entry point (good-job.xyz / api.good-job.xyz)
- CI/CD: GitHub Actions → GCP Artifact Registry → Pulumi → GKE

CRITICAL — spell ALL labels EXACTLY as listed. Common AI mistakes to avoid:
- Write "React" — NEVER "Recat", "React.js", "Recat", "Reaxt"
- Write "NestJS" — NEVER "Nest JS", "NextJS", "NestJs", "Nestis", "Nestys"
- Write "PostgreSQL" — NEVER "PostgressQL", "PostpGGUL", "PoostGresSQL", "PosteSGnul", "PostSSGQL", "Postgrel", "PostSQL", "PosteSQL", "Postg reSQL", "PostgresSQL 16", "PostgreSQL16" — use exactly "PostgreSQL 16"
- Write "Redis" — NEVER "Reddis", "Redus", "Redes", "Redis7" — use exactly "Redis 7"
- Write "GitHub Actions" — NEVER "Github Actions", "Githup", "GitHup", "GitHub Actons"
- Write "GCP Artifact Registry" — NEVER "GPC Artifact", "GCP Artifect", "Artifact Regisery"
- Write "Gemini AI" — NEVER "Gemini Al", "Gemeni AI", "Genmini", "Genimi"
- Write "Pulumi" — NEVER "Pulumni", "Pulami", "Pulumu", "Puluml"
- Write "GKE Cluster" — NEVER "GKS Cluster", "GCE Cluster", "GKE Claster"
- Write "Resend" — NEVER "Resend1", "Resem1", "Resend!", "Resened"
- Write "NGINX Ingress" — NEVER "Nginx", "NGNIX", "Niginx", "NGiNX"
- Write "Google Cloud Storage" — NEVER "Google Clond Storage", "GCS Storage", "Google Coud"
- Write "React SPA" and "NestJS API" — short labels only, no extra description`;

// ─────────────────────────────────────────────────────────────────────────────
// 20 visual styles — same architecture, different aesthetics
// Each style runs VARIANTS_PER_STYLE times so you can pick the best
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS_PER_STYLE = 20;

const STYLES = [
  {
    name: '01-neon-cyberpunk',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in cyberpunk neon style.
${ARCH_CONTEXT}

Style: Deep black (#000000) background with subtle dark purple atmospheric glow. All service cards float as glowing hexagonal or rounded cards with intense neon cyan (#00ffff) and hot magenta (#ff00ff) border glow effects. The GKE cluster is a massive transparent container with a pulsing electric blue border. Thin neon lines with directional glow connect services. Title "Good Job" in large glowing neon text at the top. The CI/CD pipeline flows horizontally at the bottom as a glowing strip with neon arrow chain. Atmospheric neon light bleeds and lens flare effects. Very dark, very glowing, very cyberpunk. Professional and sleek.`,
  },
  {
    name: '02-clean-white-minimal',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in clean minimalist white style.
${ARCH_CONTEXT}

Style: Pure white (#ffffff) background with a very subtle light gray grid. Services shown as crisp rounded rectangle cards with soft gray drop shadows — no colors, just shadows and borders. Each card has a minimal flat icon and a short clean label. Thin gray connecting lines with small arrowheads. Title "Good Job" in large bold dark Poppins at top-left. The GKE cluster boundary is a thin dashed gray rounded rectangle. Extremely generous whitespace. No gradients, no decorations. Apple/Stripe minimalist aesthetic. Timeless and elegant.`,
  },
  {
    name: '03-isometric-3d',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in colorful isometric 3D style.
${ARCH_CONTEXT}

Style: Soft light-to-sky-blue gradient background. Every component is a colorful isometric 3D block:
React SPA = blue isometric box, NestJS API = purple isometric box, PostgreSQL = green isometric cylinder,
Redis = red cube, Google Cloud Storage = blue box, Gemini AI = orange angular block, Resend = teal block.
The GKE cluster is a large flat isometric platform that the service blocks sit on top of.
Worker pod labels float above each block. CI/CD pipeline is a colorful conveyor belt on the side.
Title "Good Job" in bold isometric 3D letters at the top.
Clean, colorful, playful depth. Like a Notion or Intercom marketing illustration.`,
  },
  {
    name: '04-blueprint-engineering',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in engineering blueprint style.
${ARCH_CONTEXT}

Style: Classic engineering blueprint — deep navy blue (#0d1b4b) background covered in a fine white dot grid. All elements drawn with precise white and pale blue technical line art. Component boxes use crisp right-angle corners with thin white borders. Connecting lines are dashed with sharp arrowheads. All labels in white monospace font. Title block in the upper-left corner: "GOOD JOB — System Architecture". The GKE cluster is a large dashed rectangle labeled "GKE / asia-southeast1". The overall feel is a real mechanical engineering drawing printed on blueprint paper. Precise, authoritative, technical.`,
  },
  {
    name: '05-gradient-saas',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in modern SaaS hero style.
${ARCH_CONTEXT}

Style: Rich mesh gradient background flowing from deep Amanotes purple (#7C3AED) to dark indigo to soft violet. Service components float as frosted glass cards — semi-transparent with blur backdrop, white icons, and glowing white border. Smooth curved arrows with gradient color connect services. Large "Good Job" title in bold white Poppins at the top with a subtle text glow. Soft gradient orbs of purple and indigo light float in the background as decoration. The GKE cluster is a large frosted glass panel grouping the two service pods. Premium SaaS landing page aesthetic — like Stripe, Linear, or Vercel hero sections.`,
  },
  {
    name: '06-dark-glassmorphism',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram using glassmorphism design.
${ARCH_CONTEXT}

Style: Dark background (#0a0a1a) with large soft blurred gradient blobs — deep purple, electric blue, and dark teal glowing behind everything. All service cards use true glassmorphism: frosted translucent glass panels with blur backdrop, thin glowing white border, and subtle inner glow. Service icons in clean white. Thin semi-transparent white connecting lines with soft glow. The GKE cluster is a large frosted glass panel. Title "Good Job" in a crisp glassmorphism header strip. Beautiful depth through layers of translucency. Modern, premium, 2025 UI design language.`,
  },
  {
    name: '07-retro-poster',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as a retro tech poster.
${ARCH_CONTEXT}

Style: Cream off-white background (#f5eed8) with subtle paper grain texture and halftone dot pattern. Warm retro color palette: burnt orange, muted teal, mustard yellow, warm red. Each service floats freely as a vintage circular badge or rubber stamp — no enclosing cluster frame, no outer border. Services are scattered organically across the canvas like vintage stickers. Connections are dotted lines with bold retro arrowheads. Bold title "GOOD JOB" at top in wide retro slab-serif. CI/CD shown as a small sequential badge chain at the bottom. 1960s–70s tech poster aesthetic — nostalgic, warm, open, breathing. No frames around groups of services.`,
  },
  {
    name: '08-terminal-hacker',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in terminal ASCII-art hacker style.
${ARCH_CONTEXT}

Style: Pure black (#000000) background. Everything rendered exclusively in bright green phosphor (#00ff41) monospace text. Service components are ASCII box-drawing characters (┌──┐ │ └──┘). Connection lines made of arrow characters (──▶ ──▼). The GKE cluster is a large outer ASCII box containing smaller service boxes. Title at the top as large ASCII art letters spelling "GOOD JOB". Very faint Matrix-style digit rain in the deep background. No other colors — only green on black. Raw, technical, iconic hacker terminal aesthetic.`,
  },
  {
    name: '09-flat-pastel',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in flat Scandinavian pastel style.
${ARCH_CONTEXT}

Style: Very soft lavender/lilac background (#f0eeff). Each service is a flat rounded rectangle with solid muted pastel fill — no shadows, no gradients whatsoever. Color coding: React SPA = pastel blue, NestJS API = soft purple, PostgreSQL = mint green, Redis = peach-pink, Google Cloud Storage = sky blue, Gemini AI = soft yellow, Resend = sage green. Thin solid colored lines as connectors. Clean short sans-serif labels. The GKE cluster is outlined with a simple thin dashed rounded border. Title "Good Job" in clean bold Poppins. Nordic calm — like a IKEA instruction diagram made beautiful.`,
  },
  {
    name: '10-material-design',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in Google Material Design 3 style.
${ARCH_CONTEXT}

Style: Clean light gray (#f5f5f5) background. Service components are Material Design cards with proper elevation shadows. Each card has a bold color header strip: React SPA = Material Blue, NestJS API = Deep Purple (#7C3AED), PostgreSQL = Teal, Redis = Material Red, GCS = Indigo, Gemini AI = Orange, Resend = Green. Material icons inside each card. Roboto-style sans-serif typography. Connection arrows in Material style — soft rounded colored lines. The GKE cluster is rendered as a Material Design "surface" card with low elevation. Title "Good Job" in a Material Design purple top app-bar. Clean, structured, Google's design language.`,
  },
  {
    name: '11-dark-mesh-gradient',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram with editorial dark mesh gradient.
${ARCH_CONTEXT}

Style: Dark background with a lush flowing mesh gradient — deep navy (#0a0a2e) blending into rich purple (#7C3AED) and dark teal. Service cards are semi-transparent dark glass panels with thin glowing colored borders. Small colorful gradient icon in each card, short white label. Smooth gradient-colored arrow lines for connections. Title "Good Job" in gradient text fading from cyan to purple. The GKE cluster boundary glows purple. Decorative mesh gradient orbs float in the background as atmosphere. Premium editorial feel — exactly like Stripe, Linear, or Vercel dark mode hero sections.`,
  },
  {
    name: '12-infographic-bold',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as a bold high-contrast infographic.
${ARCH_CONTEXT}

Style: Clean white background. Bold, high-contrast graphic design approach. Each service is a large colored circle or rounded square with a bold icon and a short label beneath — not inside. Color scheme: frontend = blue, backend = purple (#7C3AED), database = green, cache = red, external APIs = orange. Thick colored directional arrows show data flow clearly. The GKE cluster is a large colored band/zone grouping React SPA and NestJS API. Large bold "Good Job" title in black Poppins. CI/CD pipeline shown as a numbered horizontal process strip. Clear, impactful, designed for instant comprehension.`,
  },
  {
    name: '13-tech-noir',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in tech noir cinematic style.
${ARCH_CONTEXT}

Style: Near-black background (#080808) with dramatic single-source light from the top-left casting subtle volumetric shadows across the scene. Services appear as dark metallic panels — brushed dark steel surface with silver chrome edges catching the directional light. Single accent color: electric purple (#7C3AED) for all glowing highlights, connection lines, and subtle service card glow. Title "Good Job" in thin elegant silver metallic text. The GKE cluster is a large dark metallic frame with purple light seeping from inside. Connection lines are thin purple-lit threads. Cinematic, moody, premium. Like a cyberpunk tech noir film still.`,
  },
  {
    name: '14-geometric-abstract',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in Bauhaus geometric abstract style.
${ARCH_CONTEXT}

Style: Pure white background. Each service is represented as a bold geometric shape — circles, hexagons, diamonds, rectangles — each filled with a bold primary color. A minimal service icon sits inside each shape, with the service name below in bold geometric sans-serif. Connection lines are clean, rule-straight, intersecting at precise right angles. Abstract geometric patterns and overlapping shapes fill the negative space decoratively. Title "Good Job" in large bold geometric sans-serif. The GKE cluster zone is defined by overlapping geometric background shapes. Bauhaus-meets-Swiss-design aesthetic. Striking, graphic, museum-poster quality.`,
  },
  {
    name: '15-space-galaxy',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram with an epic space/galaxy theme.
${ARCH_CONTEXT}

Style: Deep space background — dense star field with dramatic nebula colors (rich purple, electric blue, pink) swirling behind everything. The GKE cluster is a massive orbiting space station in the center. React SPA is a sleek spacecraft. NestJS API is the command module at the hub. PostgreSQL, Redis, and GCS are planets/moons orbiting the cluster. Gemini AI is a distant glowing star. Resend is a communication satellite. NGINX Ingress is the entry dock. Connection lines are orbital paths, light beams, and tractor beams. CI/CD pipeline is a rocket launch trajectory arching across one side. Title "Good Job" in glowing space-age lettering. Epic, cosmic, awe-inspiring.`,
  },
  {
    name: '16-circuit-board',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in PCB circuit board style.
${ARCH_CONTEXT}

Style: Dark forest green PCB board background (#1a3320) with gold and copper trace patterns etched into the surface as background texture. Each service component is rendered as an IC chip — a flat dark package with the service name silkscreened in white on top and a small icon. Connections between chips are copper PCB traces — right-angle routed with solder-point circles at every junction. The GKE cluster boundary is etched as a large chip package outline. LED indicator dots glow amber and green near active components. Title "GOOD JOB" silkscreened in white at the board's top edge. Authentic hardware, technical, unique.`,
  },
  {
    name: '17-zen-japanese',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in Japanese Zen minimalist style.
${ARCH_CONTEXT}

Style: Off-white rice paper texture (#f5f0e8). Each service is represented as a simple enso ink circle or a clean brushed ink square with a minimal short label in thin elegant sans-serif below. Connection lines are thin ink brushstroke paths — slightly organic, not perfectly straight, with subtle brush texture at the ends. The GKE cluster boundary is a large imperfect ink-brushed rectangle. Enormous negative space — components are very sparse and well-distributed. Subtle ink wash gradient at the four edges. Title "Good Job" in thin elegant serif, positioned calmly at the top-left. A single small red hanko seal stamp in one corner. Meditative, refined, artful.`,
  },
  {
    name: '18-holographic-iridescent',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram with holographic/iridescent style.
${ARCH_CONTEXT}

Style: Very dark background. Every service card has an iridescent holographic foil surface — prismatic rainbow colors (violet → blue → cyan → green → gold) shifting smoothly across each card face, like a holographic trading card held in light. Thin prismatic border rings surround each card. Connecting lines have iridescent rainbow sheen that shimmers along their length. The GKE cluster has a large holographic panel border. Title "Good Job" in chrome metallic text with rainbow iridescent sheen. Soft prismatic light flares and lens effects radiate from major components. Futuristic, rare, premium collectible feeling.`,
  },
  {
    name: '19-watercolor-art',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in artistic watercolor style.
${ARCH_CONTEXT}

Style: White/cream watercolor paper background. Loose watercolor paint splashes in purple, teal, gold, and sage form organic color zones behind each service area. Service boxes are clean white cards with watercolor drop shadows in their zone color. Connecting lines are flowing watercolor brushstrokes — not perfectly straight, organic and painted. The GKE cluster boundary is a loose watercolor wash rectangle. Title "Good Job" in elegant serif typography with a purple watercolor underline stroke. The overall effect: a painted tech diagram, where the engineering precision and artistic brushwork coexist beautifully.`,
  },
  {
    name: '20-comic-pop-art',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in comic book pop art style.
${ARCH_CONTEXT}

Style: Bold black outlines (3px+) on every element. Ben-Day halftone dot pattern as background texture (yellow dots on white). Service boxes are comic panels with bright solid color fills — yellow for GKE zone, red for database, blue for frontend, purple for backend, green for external services. Connection arrows are thick comic-style arrows with speed lines radiating from them. Title "GOOD JOB!" at the top in explosive comic book lettering with a starburst burst behind it. One small speech bubble coming from NestJS API: "REST!". Bold, loud, fun, unmistakably comic. Like Roy Lichtenstein designed a cloud diagram.`,
  },

  // ── 13 NEW STYLES ──────────────────────────────────────────────────────────

  {
    name: '21-synthwave-80s',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in synthwave / retrowave style.
${ARCH_CONTEXT}

Style: Classic 80s synthwave aesthetic. Dark purple-to-black background sky. A glowing pink-to-purple grid floor in forced perspective recedes to the horizon. Large neon sun on the horizon split into horizontal stripes of hot pink and orange. Service components float above the grid as glowing neon-outlined cards — hot pink (#ff2d78) and electric purple (#bf5fff) borders with inner glow. Connecting lines are laser beams in vivid pink and cyan. Title "GOOD JOB" at the top in bold chrome retro-futuristic font with pink glow. Outrun, retro-future, nostalgic 80s sci-fi energy.`,
  },
  {
    name: '22-aurora-borealis',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram with aurora borealis theme.
${ARCH_CONTEXT}

Style: Deep dark navy (#050a1a) night sky background. Sweeping aurora borealis light curtains in vivid green (#00ff88), teal, violet, and pale blue ripple across the upper portion of the image. Service components appear as frosted dark glass cards floating beneath the aurora, their edges catching the aurora's shifting light. Connection lines are thin glowing strands of aurora color. The GKE cluster zone is defined by a large aurora light wash behind it. Title "Good Job" in cool white with aurora color reflection. Ethereal, cosmic, breathtaking natural beauty.`,
  },
  {
    name: '23-neural-ai-brain',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as an AI neural network visualization.
${ARCH_CONTEXT}

Style: Very dark background. The entire diagram is styled as a neural network / brain visualization. Each service is a large glowing neuron node — circular with pulsing concentric rings and a bright core. Connections are synaptic pathways: soft glowing curved lines of varying thickness (heavier connections = thicker lines). Gemini AI node is the largest central glowing brain-like hub. Color coding: purple nodes for core services, blue for storage, orange for external APIs. Particle effects and energy sparks travel along the synaptic paths. Title "Good Job" in elegant neural-style glowing text. Sophisticated, intelligent, futuristic AI aesthetic.`,
  },
  {
    name: '24-quantum-realm',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in quantum physics / subatomic style.
${ARCH_CONTEXT}

Style: Dark deep-space black background. Service components appear as atomic/molecular structures — spherical nodes with orbital rings and electron paths circling them. The GKE cluster is a large atom with two electron orbital shells containing the React SPA and NestJS API electrons. Connecting lines are quantum entanglement beams — thin electric lines with particle effects traveling along them. Ambient glow in electric blue and ultraviolet purple. Small floating particles and wave-interference patterns fill the background. Title "Good Job" in glowing quantum-field typography. Deeply scientific, mysterious, cutting-edge physics aesthetic.`,
  },
  {
    name: '25-futuristic-hud',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as a futuristic military HUD display.
${ARCH_CONTEXT}

Style: Dark transparent cockpit-glass background (#000a0a). The entire diagram is overlaid as a holographic HUD (Heads-Up Display) projection. Service components are HUD target-lock reticles — thin angular brackets around each component label, like crosshair targeting UI. Connection lines are scan-line data streams with dashed patterns. Tactical readout panels in corners show simulated system metrics. Color scheme: all in bright green (#00ff88) and amber (#ffb300) on near-black. Subtle scanline texture overlaid on everything. Grid lines at low opacity. Title "GOOD JOB" in HUD stencil military font. Like an F-35 cockpit display redesigned as an architecture diagram.`,
  },
  {
    name: '26-bioluminescent-ocean',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram with deep ocean bioluminescent theme.
${ARCH_CONTEXT}

Style: Deep ocean black-to-indigo background. Service components appear as glowing bioluminescent sea creatures or coral formations — organic, flowing shapes with soft cyan, blue-green, and violet inner glow. The GKE cluster zone is a glowing deep-sea reef structure. Connections are bioluminescent tendrils of light flowing between the organisms, like jellyfish trailing light. Tiny glowing particles drift slowly upward like ocean plankton. The NestJS API is the central bioluminescent jellyfish. Title "Good Job" in soft glowing ocean-script. Mysterious, ethereal, organic, beautiful deep-sea world.`,
  },
  {
    name: '27-neon-tokyo-night',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in neon Tokyo nightscape style.
${ARCH_CONTEXT}

Style: Dark urban night background. Japanese urban architecture silhouette cityscape at the bottom. Service components appear as glowing neon shop signs in Japanese neon-sign aesthetic — rectangular neon-tube-lit panels with kanji-inspired decorative borders and neon color fills (vivid pink, cyan, amber, green). Connection lines are neon tubes running between the signs like city electrical conduits. Rain streaks add depth to the dark sky. The GKE cluster zone is outlined like a glowing neon building. Title "GOOD JOB" as a giant rooftop neon sign. Blade Runner meets Tokyo Shinjuku — cyberpunk urban gorgeous.`,
  },
  {
    name: '28-ancient-starmap',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as an ancient celestial star map.
${ARCH_CONTEXT}

Style: Aged parchment / dark vellum background (#1a1200) with subtle texture. The entire diagram is drawn in the style of a 16th–17th century celestial atlas. Services are illustrated as constellation star patterns — each service is a named constellation, with stars connected by thin gold lines forming the shape. The GKE cluster is the largest central constellation. Decorative compass roses in the corners. Latin-style labels for each service. Illustrated border of classical astronomical motifs (sun, moon, celestial spheres). Connection paths are gold star-chart lines. Title "Good Job" in ornate classical cartographic lettering. Ancient wisdom meets modern cloud infrastructure.`,
  },
  {
    name: '29-solarpunk-nature',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in solarpunk style.
${ARCH_CONTEXT}

Style: Warm bright optimistic background blending golden sunlight and lush green. Service components are rendered as beautiful architectural structures overgrown with plants and greenery — each a small eco-tech building covered in hanging gardens, solar panels, and living walls. The GKE cluster is a green smart-city district. Connection lines are living vines and fiber-optic roots intertwined. Sun rays stream in from the upper left. Birds and butterflies accent the composition. The overall palette: warm gold, lush green (#2d8a4e), sky blue, terracotta. Title "Good Job" in handcrafted eco-typography with leaf accents. Hopeful, lush, utopian tech-nature fusion.`,
  },
  {
    name: '30-deep-galaxy',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram set inside a breathtaking galaxy.
${ARCH_CONTEXT}

Style: Photorealistic deep-space background — a massive spiral galaxy viewed from above, with glowing galactic core in warm white-gold, spiral arms in blue-purple nebula colors, and thousands of stars. Service components are distributed across the galaxy arms as glowing stellar objects: the NestJS API is the bright galactic core, React SPA is a large nearby star, PostgreSQL and Redis are twin binary stars, GCS is a gas giant, Gemini AI is a pulsar. Connection lines are light-travel paths between stars. The GKE cluster zone is marked by a constellation boundary line. Title "Good Job" in star-dust typography above the galaxy. Epic, cosmic scale, awe-inspiring.`,
  },
  {
    name: '31-crystal-prism',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram with crystal/prism light refraction style.
${ARCH_CONTEXT}

Style: Pure white or very light gray background. Service components appear as beautiful 3D crystal gemstone forms — each faceted differently (cube crystal, octahedron, prism shapes). Light refracts through each crystal casting rainbow spectral patterns on the background. Connection lines are light beams entering and exiting the crystals, splitting into rainbow spectrums. The GKE cluster is the largest central crystal prism that other crystals orbit. Color comes entirely from light refraction — the environment is otherwise clean white. Title "Good Job" in prismatic chrome typography that also refracts light. Elegant, pure, scientifically beautiful.`,
  },
  {
    name: '32-ai-future-minimal',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in clean futuristic AI minimal style.
${ARCH_CONTEXT}

Style: Near-white (#f8f8ff) background with very subtle blue tint. Extreme minimalism — thin single-weight lines only, no fills, no gradients, no decorations. Service components are minimal circle outlines with a single-word label. Connection lines are hairline thin with small directional arrows. The GKE cluster boundary is a thin dashed circle. A subtle AI-inspired motif: very faint neural network nodes in the deep background at 5% opacity. Small geometric accent shapes (circles, triangles) at connection intersections. Typography is ultra-thin futuristic sans-serif. Color: almost monochrome with one accent — electric blue (#0066ff) for the NestJS API node only. Calm, intelligent, like an Apple Vision Pro UI concept.`,
  },
  {
    name: '33-vaporwave',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in vaporwave aesthetic.
${ARCH_CONTEXT}

Style: Pastel gradient background fading from soft pink (#ffb3d9) to pale lavender (#d4b3ff) to light cyan (#b3f0ff). Classic vaporwave elements: Roman/Greek marble busts or columns used as decorative accents, mirrored chrome surfaces on service components, checkerboard floor pattern in pink and white at the bottom. Service components are smooth chrome-finish rounded rectangles with gradient fills (pink-to-purple). Connection lines are soft pastel gradient stripes. Japanese katakana characters float as decorative elements. Palm tree silhouettes. Title "GOOD JOB" in large chrome vaporwave typography with a soft pastel drop shadow. Dreamy, nostalgic, surreal — ａｅｓｔｈｅｔｉｃ.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Generation logic
// ─────────────────────────────────────────────────────────────────────────────

async function generateVariant(ai, style, variantIndex) {
  const num = String(variantIndex + 1).padStart(2, '0');
  const filename = `${style.name}-${num}.png`;
  console.log(`  🎨 [${num}/${VARIANTS_PER_STYLE}] ${filename}`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: style.prompt,
      config: {
        responseModalities: ['Text', 'Image'],
        imageConfig: { aspectRatio: '21:9' },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const outputDir = path.join(__dirname, '..', style.name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let saved = false;
    for (const part of parts) {
      if (part.text) console.log(`     📝 ${part.text.substring(0, 80)}`);
      if (part.inlineData) {
        fs.writeFileSync(
          path.join(outputDir, filename),
          Buffer.from(part.inlineData.data, 'base64')
        );
        console.log(`     ✅ Saved: ${style.name}/${filename}`);
        saved = true;
      }
    }

    if (!saved) console.log(`     ⚠️  No image returned`);
    return saved;
  } catch (error) {
    console.error(`     ❌ Error: ${error.message}`);
    return false;
  }
}

async function runStyle(ai, style) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📁 Style: ${style.name}  (${VARIANTS_PER_STYLE} variants)`);
  console.log('─'.repeat(60));

  let success = 0;
  for (let i = 0; i < VARIANTS_PER_STYLE; i++) {
    const ok = await generateVariant(ai, style, i);
    if (ok) success++;
    if (i < VARIANTS_PER_STYLE - 1) await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`  ✅ Done: ${success}/${VARIANTS_PER_STYLE} → ${style.name}/`);
  return success;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set.  export GEMINI_API_KEY=your_key');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const styleArg = args.find(a => a.startsWith('--style='))?.replace('--style=', '');

  const stylesToRun = styleArg
    ? STYLES.filter(s => s.name === styleArg)
    : STYLES;

  if (styleArg && stylesToRun.length === 0) {
    console.error(`❌ Unknown style: "${styleArg}"`);
    console.error(`   Available: ${STYLES.map(s => s.name).join(', ')}`);
    process.exit(1);
  }

  const total = stylesToRun.length * VARIANTS_PER_STYLE;

  console.log('🏆 Good Job — Architecture Diagram Generator');
  console.log('='.repeat(60));
  console.log(`Styles: ${stylesToRun.length}  ×  Variants: ${VARIANTS_PER_STYLE}  =  ${total} images`);
  console.log(`Aspect ratio: 21:9 ultra-wide`);
  console.log(`Output: designs/good-job-visuals/<style-name>/`);
  console.log('='.repeat(60));

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  let totalSuccess = 0;

  for (const style of stylesToRun) {
    totalSuccess += await runStyle(ai, style);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 All done!');
  console.log(`   ✅ Saved: ${totalSuccess} / ${total}`);
  console.log(`   📁 Pick the best → README.md`);
  console.log('='.repeat(60));
}

main();
