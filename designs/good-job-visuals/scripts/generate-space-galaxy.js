import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const VARIANTS_PER_PROMPT = 10;
const OUTPUT_DIR = 'space-galaxy';

const ARCH_CONTEXT = `Good Job — Employee Recognition Platform infrastructure:
- GKE Cluster (Google Kubernetes Engine, asia-southeast1) with React SPA pod and NestJS API pod
- React SPA: nginx container  |  NestJS API: Node.js container
- PostgreSQL 16: primary database
- Redis 7: cache and pub-sub
- Google Cloud Storage: file storage
- Gemini AI: semantic search
- Resend: transactional email
- NGINX Ingress + Let's Encrypt SSL: entry point (good-job.xyz / api.good-job.xyz)
- CI/CD: GitHub Actions → GCP Artifact Registry → Pulumi → GKE

CRITICAL — spell labels EXACTLY (AI commonly misspells these):
- "React SPA" — not "Recat", "React.js"
- "NestJS API" — not "Nest JS", "NextJS"
- "PostgreSQL 16" — not "PostgressQL", "PostpGGUL", "PosteSGnul", "PostSSGQL", "PostSQL"
- "Redis 7" — not "Reddis", "Redis7"
- "GitHub Actions" — not "Github Actions", "Githup"
- "GCP Artifact Registry" — not "GCP Artifect", "Artifact Regisery"
- "Gemini AI" — not "Gemini Al", "Gemeni", "Genimi"
- "Pulumi" — not "Pulumni", "Pulami"
- "GKE Cluster" — not "GKS Cluster", "GCE Cluster"
- "Resend" — not "Resend1", "Resem1"
- "NGINX Ingress" — not "Nginx", "NGNIX"
- "Google Cloud Storage" — not "Google Clond Storage"`;

// ─────────────────────────────────────────────────────────────────────────────
// 20 space-galaxy prompts — all space themed, each with a different variation
// ─────────────────────────────────────────────────────────────────────────────

const PROMPTS = [
  {
    name: '01-spiral-galaxy-overhead',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram styled as a photorealistic spiral galaxy viewed from above.
${ARCH_CONTEXT}

Space style: A breathtaking Milky Way-like spiral galaxy fills the entire image. The galactic core glows warm white-gold. Spiral arms of blue-purple nebula dust and thousands of stars extend outward. Each service component is a labeled stellar object embedded in the galaxy: NestJS API = the bright glowing galactic core, React SPA = a large blue-white star in the inner arm, PostgreSQL 16 = a twin binary star pair, Redis 7 = a red dwarf star, Google Cloud Storage = a gas giant with rings, Gemini AI = a brilliant pulsar, Resend = a communication satellite. NGINX Ingress is at the outer rim as the entry gate. CI/CD pipeline = a dotted rocket trajectory arching through the stars. Title "Good Job" in glowing stardust typography above the galaxy. Epic, cosmic scale.`,
  },
  {
    name: '02-nebula-cloud-formation',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram set inside a vivid interstellar nebula.
${ARCH_CONTEXT}

Space style: A vast colorful nebula fills the canvas — brilliant clouds of ionized gas in electric blue, violet, rose pink, and gold. The nebula glows with dramatic light and shadow. Service components are glowing nodes of condensed star-forming gas floating in the nebula clouds, each labeled. NestJS API is the brightest proto-star at the nebula core. React SPA is a newly formed bright star emerging from the gas cloud. Data service nodes (PostgreSQL 16, Redis 7, Google Cloud Storage) are smaller glowing stellar nursery objects. CI/CD pipeline is a stream of star particles flowing across the bottom. Title "Good Job" in luminous nebula typography. Awe-inspiring, painterly cosmic art.`,
  },
  {
    name: '03-space-station-orbital',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as an orbital space station network.
${ARCH_CONTEXT}

Space style: Deep black space with Earth visible in the background lower-left. The GKE Cluster is rendered as a large modular orbital space station (ISS-style) in the center with solar panels extending. React SPA and NestJS API are docked spacecraft/modules attached to the station. PostgreSQL 16, Redis 7, and Google Cloud Storage are orbital supply depots floating nearby. Gemini AI is a distant satellite. NGINX Ingress is the docking bay airlock. CI/CD pipeline is a supply rocket launch trajectory from Earth to the station. All labeled with clean white text. Realistic space engineering aesthetic. Title "Good Job" in mission-patch style.`,
  },
  {
    name: '04-black-hole-gravitational',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram centered on a black hole.
${ARCH_CONTEXT}

Space style: A dramatic black hole with a glowing accretion disk dominates the center — the disk spirals in vivid orange, gold, and white hot plasma with gravitational lensing bending light around it. The NestJS API is the black hole itself (the central gravitational hub everything connects to). React SPA orbits in the innermost stable orbit. PostgreSQL 16, Redis 7, and Google Cloud Storage are planets in wider orbits. Gemini AI and Resend are distant objects. The CI/CD pipeline is a particle jet shooting from the black hole poles. Data streams from all services curve toward the black hole along gravitational paths. Title "Good Job" in dramatic event-horizon typography. Cinematic and scientifically beautiful.`,
  },
  {
    name: '05-hubble-deep-field',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram in the style of a Hubble Deep Field telescope image.
${ARCH_CONTEXT}

Space style: The entire background is filled with thousands of distant galaxies of all shapes and sizes — spiral, elliptical, irregular — at varying depths, like the actual Hubble Deep Field photo. Each service component is one of these galaxies with a labeled pointer annotation (like an astronomy chart). NestJS API is the largest central galaxy. React SPA is a bright spiral galaxy. Database services are smaller elliptical galaxies. The GKE cluster region is outlined with a thin dashed discovery annotation box. Title "Good Job" in classic astronomical atlas typography. Red-shift colored distance indicators. Scientific, awe-inspiring, beautiful.`,
  },
  {
    name: '06-planetary-system',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as a solar system / planetary system.
${ARCH_CONTEXT}

Space style: A bright central star (the GKE Cluster) shines in the center with elliptical orbital paths radiating outward. Each service is a planet or moon orbiting the star: NestJS API = closest inner rocky planet, React SPA = second planet with a thin atmosphere glow, PostgreSQL 16 = a large gas giant with rings (like Saturn), Redis 7 = a red rocky planet (like Mars), Google Cloud Storage = an ice giant (blue-green), Gemini AI = an outer gas giant with storm systems, Resend = a distant dwarf planet. NGINX Ingress is the star's corona/solar wind boundary. CI/CD pipeline runs along the bottom like a comet trajectory. Title "Good Job" at top. Like a NASA solar system infographic.`,
  },
  {
    name: '07-star-cluster-globular',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram styled as a globular star cluster.
${ARCH_CONTEXT}

Space style: A densely packed spherical globular star cluster fills the center of the image — thousands of ancient gold and white stars tightly packed, gradually sparser at the edges. The GKE Cluster zone is the dense core. Service components are labeled bright stars within the cluster: NestJS API = the brightest central giant star, React SPA = a luminous blue star, PostgreSQL 16 = a stable yellow dwarf, Redis 7 = a red giant at the edge. Thin golden connection lines show star-to-star gravitational interactions. CI/CD pipeline is an arc of young blue stars across the bottom. Title "Good Job" in golden starlight lettering. Dense, beautiful, ancient-cosmic feel.`,
  },
  {
    name: '08-cosmic-web-dark-matter',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as the large-scale cosmic web structure.
${ARCH_CONTEXT}

Space style: The cosmic web — the large-scale filamentary structure of the universe made of dark matter and galaxy clusters. Thin glowing filaments of pale blue/white light connect bright galaxy cluster nodes. The entire image shows this vast web structure at cosmic scale. Service components are the bright galaxy cluster nodes at filament intersections: NestJS API = the largest brightest cluster (like Virgo Supercluster), React SPA = a second major cluster, database services = smaller nodes at filament crossings. Connection lines ARE the cosmic filaments themselves. Vast cosmic voids of deep black between filaments. Title "Good Job" in faint cosmic typography. Scientific, abstract, vast.`,
  },
  {
    name: '09-pulsar-neutron-star',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram around pulsars and neutron stars.
${ARCH_CONTEXT}

Space style: The NestJS API is a rapidly spinning pulsar/neutron star at the center, shooting two dramatic electromagnetic beams of blue-white energy from its poles. React SPA is another pulsar. The GKE Cluster zone is marked by the pulsar timing grid. Other services are labeled neutron stars, magnetars, and white dwarfs scattered across deep black space. The electromagnetic pulsar beams sweep across the image as connection paths. A pulsar timing array grid subtly marks precise positions. Dense neutron star matter visualization in the star interiors. Title "Good Job" in high-energy physics typography. Powerful, scientific, kinetic.`,
  },
  {
    name: '10-interstellar-journey',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as an interstellar space mission map.
${ARCH_CONTEXT}

Space style: A NASA-style mission map stretching across interstellar space. The sun is at the far left. A spacecraft (representing the CI/CD deployment pipeline) travels from left to right along a long trajectory arrow. Along the journey path, each labeled service is a waypoint milestone: NGINX Ingress = launch from Earth orbit, React SPA = inner solar system waypoint, NestJS API = asteroid belt transit hub, PostgreSQL 16 = Jupiter flyby, Redis 7 = Saturn encounter, Google Cloud Storage = Uranus system, Gemini AI = Neptune, Resend = Pluto/Kuiper Belt. GKE Cluster is the destination star system at the far right. Star field background. NASA mission design aesthetic with mission timestamps.`,
  },
  {
    name: '11-galactic-collision',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as two galaxies colliding and merging.
${ARCH_CONTEXT}

Space style: Two spiral galaxies in dramatic collision — one from the upper-left and one from the lower-right, their spiral arms interweaving and distorting. The collision zone in the center is ablaze with new star formation (pink nebula clouds, bright blue new stars). The GKE Cluster is the merging galactic core. React SPA and NestJS API are the two central black holes spiraling together. Data service objects (PostgreSQL 16, Redis 7, Google Cloud Storage) are star clusters being flung outward by tidal forces. Gemini AI is a quasar ignited by the merger. CI/CD pipeline is a tidal stream of stars. Title "Good Job" in dynamic merger typography. Dramatic, powerful, cosmic energy.`,
  },
  {
    name: '12-wormhole-portal',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram featuring wormholes and space portals.
${ARCH_CONTEXT}

Space style: Multiple glowing wormhole/Einstein-Rosen bridge portals float in deep space, connecting distant regions. Each major wormhole connects two service components: NGINX Ingress and NestJS API connected through a large central blue-swirling wormhole. The GKE Cluster zone surrounds the main wormhole cluster. Other services (PostgreSQL 16, Redis 7, Google Cloud Storage, Gemini AI, Resend) are at wormhole endpoints, labeled. Wormholes are rendered as glowing blue-purple spinning vortices with gravitational lensing rings. CI/CD pipeline is a wormhole transport route. The space background is dramatic with exotic matter energy glows. Title "Good Job" in interdimensional typography.`,
  },
  {
    name: '13-galaxy-neon-art',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram combining galaxy and neon art styles.
${ARCH_CONTEXT}

Space style: Deep space background with real galaxy photography — but all service components are neon-lit floating stations in space. The background is photorealistic stars and galaxy dust. Over this beautiful space background, each service floats as a neon-glowing rounded card (neon cyan, magenta, electric blue borders) with strong neon inner glow. Connection lines are neon laser beams of different colors crossing the space background. The GKE Cluster zone is outlined in electric blue neon. Title "Good Job" in huge neon chrome text at the top against the star field. Perfect fusion: photorealistic space background + neon cyberpunk UI overlay.`,
  },
  {
    name: '14-cosmic-ray-particle',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram visualizing cosmic ray particle physics.
${ARCH_CONTEXT}

Space style: Dark black space filled with cosmic ray particle shower trails — thin luminous tracks branching and cascading like a particle detector visualization. Service components are labeled detector nodes and particle interaction vertices. NestJS API is the primary collision vertex where the most particle tracks originate. React SPA is a secondary vertex. PostgreSQL 16 and Redis 7 are calorimeter detector sections. GKE Cluster is the large cylindrical particle detector shell. CI/CD pipeline is the particle beam accelerator tube running along the bottom. Particle tracks are white and colored (green for muons, red for hadrons, blue for electrons). Scientific detector aesthetic like CERN's ATLAS detector.`,
  },
  {
    name: '15-aurora-space-station',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram combining aurora and space station themes.
${ARCH_CONTEXT}

Space style: View from orbit — Earth's atmosphere curves at the bottom with brilliant green, teal, and violet aurora australis/borealis visible sweeping across the atmosphere. Above, in low Earth orbit, the GKE Cluster is a modular space station floating against the star field. React SPA and NestJS API are station modules. PostgreSQL 16, Redis 7, Google Cloud Storage are cargo/supply pods nearby. Gemini AI is a telescope satellite. The aurora light illuminates the station from below in green and violet hues. CI/CD pipeline is a Soyuz/Dragon capsule approaching for docking. Title "Good Job" in clean mission-control typography. Breathtakingly beautiful Earth+space view.`,
  },
  {
    name: '16-constellation-map',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as an artistic constellation star map.
${ARCH_CONTEXT}

Space style: Deep navy blue background covered in thousands of small white stars at varying brightness. Each service component is a labeled star, and the connections between services draw CONSTELLATION patterns — like Orion, Ursa Major, etc. but shaped by the architecture topology. NestJS API is the brightest star (like Polaris). Lines connecting stars are thin white, like classic star map constellation drawings. Each constellation grouping is named after its service (e.g., the "GKE Cluster" constellation containing React SPA and NestJS API stars). Decorative gold compass rose in one corner. Title "Good Job" in classical astronomical atlas script. Looks like a 19th century celestial atlas illustration.`,
  },
  {
    name: '17-supernova-explosion',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram centered on a spectacular supernova.
${ARCH_CONTEXT}

Space style: A dramatic supernova explosion is the central visual — brilliant white-hot core with shockwaves of glowing plasma (orange, red, purple) expanding outward in rings. The GKE Cluster is the exploding star system at the center. NestJS API is the neutron star remnant at the exact center. React SPA is in the inner shockwave ring. Data services (PostgreSQL 16, Redis 7, Google Cloud Storage) are swept outward in the expanding shockwave. Gemini AI is the pulsar formed from the explosion. CI/CD pipeline traces the initial explosion trajectory. Surrounding space has other stars illuminated by the supernova flash. Title "Good Job" in explosive energy typography. Dramatic, powerful, visually stunning.`,
  },
  {
    name: '18-quantum-entanglement-space',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as quantum entanglement across space.
${ARCH_CONTEXT}

Space style: Deep space backdrop with a visualization of quantum entanglement. Service pairs are shown as entangled particle systems — each service has a glowing quantum node, and paired services are connected by shimmering, instantaneous entanglement beams (thin iridescent lines that shimmer violet-blue). NestJS API and React SPA are the primary entangled pair at the center, their nodes showing correlated quantum states (matching waveform patterns). Entanglement connections are wiggly quantum probability wave lines (not straight). Background shows quantum field fluctuations as subtle texture. GKE Cluster zone has a quantum decoherence boundary. Title "Good Job" in quantum wavefunction typography. Abstract, scientific, mysterious.`,
  },
  {
    name: '19-dark-matter-halo',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram visualizing dark matter halos around galaxies.
${ARCH_CONTEXT}

Space style: A central galaxy (the GKE Cluster) floats in space surrounded by a massive, faintly glowing dark matter halo — visualized as a soft spherical blue-purple glow that extends far beyond the visible galaxy. Inside the galaxy: NestJS API as the galactic core, React SPA as a bright spiral arm star. The dark matter halo subtly glows at very low opacity (just barely visible), showing mass distribution. Other services are satellite galaxies within the halo. CI/CD pipeline is a tidal stream between galaxies. Connection lines follow dark matter filament paths. Scientific simulation aesthetic — like a cosmological N-body simulation visualization. Title "Good Job" in clean scientific typography.`,
  },
  {
    name: '20-future-megastructure',
    prompt: `Create a 21:9 ultra-wide infrastructure diagram as a futuristic space megastructure.
${ARCH_CONTEXT}

Space style: A vast Dyson Sphere / ringworld / space megastructure fills the image against a star field. The GKE Cluster is the entire megastructure — an enormous ring or sphere structure around a star. React SPA and NestJS API are distinct habitation/processing rings within the structure. PostgreSQL 16 is a massive data vault asteroid complex. Redis 7 is a high-speed relay station. Google Cloud Storage is an orbital storage ring. Gemini AI is the megastructure's AI core brain. CI/CD pipeline is a matter transfer stream between structures. The scale is immense — planetary scale engineering. Title "Good Job" in civilizational-scale typography. Inspiring, mind-blowing, ultimate sci-fi future.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Generation logic
// ─────────────────────────────────────────────────────────────────────────────

async function generateVariant(ai, prompt, variantIndex) {
  const num = String(variantIndex + 1).padStart(2, '0');
  const filename = `${prompt.name}-${num}.png`;
  console.log(`  🌌 [${num}/${VARIANTS_PER_PROMPT}] ${filename}`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt.prompt,
      config: {
        responseModalities: ['Text', 'Image'],
        imageConfig: { aspectRatio: '21:9' },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const outputDir = path.join(__dirname, '..', OUTPUT_DIR, prompt.name);
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
        console.log(`     ✅ Saved: ${OUTPUT_DIR}/${prompt.name}/${filename}`);
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

async function runPrompt(ai, prompt, index) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🌌 [${index + 1}/${PROMPTS.length}] ${prompt.name}  (${VARIANTS_PER_PROMPT} variants)`);
  console.log('─'.repeat(60));

  let success = 0;
  for (let i = 0; i < VARIANTS_PER_PROMPT; i++) {
    const ok = await generateVariant(ai, prompt, i);
    if (ok) success++;
    if (i < VARIANTS_PER_PROMPT - 1) await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`  ✅ Done: ${success}/${VARIANTS_PER_PROMPT} → ${OUTPUT_DIR}/${prompt.name}/`);
  return success;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set.');
    process.exit(1);
  }

  // --prompt=<name> to run only one prompt variation
  const args = process.argv.slice(2);
  const promptArg = args.find(a => a.startsWith('--prompt='))?.replace('--prompt=', '');

  const promptsToRun = promptArg
    ? PROMPTS.filter(p => p.name === promptArg)
    : PROMPTS;

  if (promptArg && promptsToRun.length === 0) {
    console.error(`❌ Unknown prompt: "${promptArg}"`);
    console.error(`   Available: ${PROMPTS.map(p => p.name).join(', ')}`);
    process.exit(1);
  }

  const total = promptsToRun.length * VARIANTS_PER_PROMPT;

  console.log('🌌 Good Job — Space Galaxy Diagram Generator');
  console.log('='.repeat(60));
  console.log(`Prompts: ${promptsToRun.length}  ×  Variants: ${VARIANTS_PER_PROMPT}  =  ${total} images`);
  console.log(`Output: designs/good-job-visuals/${OUTPUT_DIR}/<prompt-name>/`);
  console.log('='.repeat(60));

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  let totalSuccess = 0;

  for (let i = 0; i < promptsToRun.length; i++) {
    totalSuccess += await runPrompt(ai, promptsToRun[i], i);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 All done!');
  console.log(`   ✅ Saved: ${totalSuccess} / ${total}`);
  console.log(`   📁 designs/good-job-visuals/${OUTPUT_DIR}/`);
  console.log('='.repeat(60));
}

main();
