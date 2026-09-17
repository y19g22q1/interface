// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_CONFIG = {
  // Model 1 — Prompt Rewriter (Llama 3.1 8B instruct)
  rewriter: {
    apiUrl: "https://openrouter.ai/api",
    model: "meta-llama/llama-3.1-8b-instruct",
  },
  // Model 2 — Code Generator (Qwen3 Coder 30B)
  coder: {
    apiUrl: "https://openrouter.ai/api",
    model: "qwen/qwen3-coder-30b-a3b-instruct",
  },
};

// ============================================================================
// DEFAULT SYSTEM PROMPTS
// ============================================================================

const DEFAULT_SYSTEM_PROMPTS = {
  rewriter: `You are a mobile UI strategist in a two-stage generation pipeline.

Turn the user’s idea into a compact mobile-first design brief for a downstream UI coding model.
Your job is to define only the stable, high-level decisions that help the coder build a strong interface.

Decide these items:
- app/category
- target user
- primary goal
- 3 to 5 core screens
- mobile navigation pattern
- visual tone
- content density
- a strict 3-color palette

Rules:
- Mobile only, designed for 375x812
- Keep the brief general, not overly specific
- Do not describe exact component placement
- Do not give implementation details
- Do not write copy, microcopy, or long explanations
- Do not use vague filler like “modern, clean, professional”
- Prefer concrete UX directions such as calm, compact, airy, bold, premium, minimal, data-heavy, playful, etc.
- The palette must be exactly 3 colors: background, text, and primary accent
- Let the coder model make the final layout and visual decisions
- Always add generate all the screens, like this:
SCREENS: home, cart, profile (generate all screens)


Output exactly 6 short labeled lines in this format:
APP:
GOAL:
SCREENS: (always add "generate all screens" after screens section)
NAV:
STYLE:
COLORS:

No bullets, no markdown, no preamble, no explanation.
Keep it under 90 words total.`,

  coder: `You are a senior mobile UI engineer specialized in designing real-world app interfaces.
Generate a complete, high-quality mobile app UI as a single HTML file using Tailwind CSS via CDN.

# OUTPUT RULES:
- Output ONLY HTML
- No explanations, no markdown
- Start with <!DOCTYPE html> and end with </html>
- No external libraries except Tailwind CSS CDN
<script src="https://cdn.tailwindcss.com"></script>

# JAVASCRIPT RULE:
- Use JavaScript ONLY for bottom navigation screen switching
- This is the ONLY permitted use of JavaScript in the entire file
- No JavaScript for anything else (no animations, no forms, no toggles, no counters)
- The navigation script must be minimal: show the active section, hide all others, update active nav icon color
- Place the script at the end of <body> as a single <script> tag

# PLATFORM:
- Mobile-first design (375x812)
- The UI must look like a real mobile app, not a webpage

# LAYOUT:
- Use a vertical mobile layout with clear sections
- Use proper spacing (padding, margins, gaps) — not fixed pixel positioning
- Maintain strong visual hierarchy (titles, subtitles, content)
- Use cards, lists, and sections naturally

# SCREENS:
- Always generate multiple screens (e.g., home, profile, settings, cart)
- Each screen is a <section> with a unique id (e.g., id="screen-home")
- Only the first screen is visible on load (others have class="hidden")
- Do NOT stack all screens in one scroll
- Each screen should feel like a standalone page

# NAVIGATION:
- Always include a bottom navigation bar
- Fixed at the bottom
- Evenly spaced items (3–4 items only)
- Each item must have:
  - A simple SVG icon (Heroicons stroke style)
  - A small text label underneath
- The active screen's nav item uses the primary color
- Inactive items use neutral gray
- Each nav button has a data-target="screen-id" attribute
- The JS script reads data-target to switch screens

# NAVIGATION SCRIPT TEMPLATE:
Use exactly this pattern at the end of <body>:
<script>
  const buttons = document.querySelectorAll('[data-target]');
  const screens = document.querySelectorAll('section[id]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      screens.forEach(s => s.classList.add('hidden'));
      document.getElementById(btn.dataset.target).classList.remove('hidden');
      buttons.forEach(b => b.classList.remove('text-primary'));
      buttons.forEach(b => b.classList.add('text-gray-500'));
      btn.classList.remove('text-gray-500');
      btn.classList.add('text-primary');
    });
  });
</script>

# ICONS:
- Use simple, clean SVG icons (Heroicons-style only)
- Stroke-based, no complex shapes
- Consistent size across all icons

# COLORS:
- Choose a simple palette:
  - 1 background color
  - 1 text color
  - 1 primary accent color
- Define them in tailwind.config at the top
- Use consistently across the entire UI

# IMAGES:
- Use <img> tags only (never background-image)
- Use Unsplash placeholder URLs
- Keep alt text very short (2–3 words)
- Use images only where they add real value
- Fit images properly using object-cover

# UX QUALITY:
- The UI must feel like a real app used on a phone
- Clean spacing and readable layout
- Touch-friendly tap targets
- Avoid clutter
- Make reasonable design decisions when the prompt is vague

# GOAL:
Produce a cohesive, realistic, and well-designed mobile UI that could pass as a production-ready screen, with fully working bottom navigation.
`,
};

// ============================================================================
// STREAMING HELPER
// ============================================================================

/**
 * Stream a chat completion from a vLLM endpoint.
 *
 * Returns a Promise that resolves with the full accumulated text when
 * the stream ends, or rejects on network / API errors.
 *
 * @param {Object}   opts
 * @param {string}   opts.apiUrl      — vLLM endpoint base URL
 * @param {string}   opts.model       — model identifier
 * @param {Array}    opts.messages     — [{ role, content }, ...]
 * @param {number}   opts.maxTokens
 * @param {number}   opts.temperature
 * @param {number}   [opts.topP=0.95]
 * @param {number}   [opts.topK=50]
 * @param {Function} [opts.onToken]   — called live with (fullText, tokenCount) on each token
 * @returns {Promise<string>}  — the full accumulated text
 */
// ============================================================================
// STREAMING HELPER
// ============================================================================

async function streamChatCompletion(opts) {
  const {
    apiUrl,
    model,
    messages,
    maxTokens,
    temperature,
    topP = 0.95,
    topK = 50,
    onToken = () => { },
  } = opts;

  let fullText = "";
  let tokenCount = 0;

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`, // 👈 added
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP,
      top_k: topK,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  // ── Read SSE stream ──────────────────────────────────────────────────
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete last line for next chunk

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;

      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          tokenCount++;
          onToken(fullText, tokenCount);
        }
      } catch (_) {
        // incomplete JSON chunk — safe to skip
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error("Model returned an empty response.");
  }

  return fullText;
}

// ============================================================================
// HTML CLEANUP UTILITIES
// ============================================================================

/**
 * Strip markdown code fences (```html ... ```) from model output.
 */
function cleanCodeFences(text) {
  let code = text.trim();
  if (code.startsWith("```html")) code = code.slice(7);
  else if (code.startsWith("```")) code = code.slice(3);
  if (code.endsWith("```")) code = code.slice(0, -3);
  return code.trim();
}

// ============================================================================
// PEXELS IMAGE INTEGRATION
// ============================================================================

/**
 * Fetch a single image URL from Pexels for the given query.
 */
async function fetchPexelsImage(query, apiKey) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=1`;
    const response = await fetch(url, { headers: { Authorization: apiKey } });
    if (!response.ok) return null;
    const data = await response.json();
    return data.photos?.length > 0 ? data.photos[0].src.large : null;
  } catch (error) {
    console.error("Pexels fetch error:", error);
    return null;
  }
}

/**
 * Replace placeholder images in HTML code with Pexels images.
 */
async function replaceImagesWithPexels(htmlCode, apiKey) {
  if (!apiKey) return htmlCode;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlCode, "text/html");
  const imgTags = doc.querySelectorAll("img");

  if (imgTags.length === 0) return htmlCode;

  const imagePromises = Array.from(imgTags).map(async (img) => {
    const altText = img.getAttribute("alt") || "";
    const originalSrc = img.getAttribute("src") || "";

    // Only replace placeholder / picsum URLs
    if (!originalSrc.includes("placeholder") && !originalSrc.includes("picsum"))
      return;
    if (!altText) return;

    const pexelsUrl = await fetchPexelsImage(altText, apiKey);
    if (pexelsUrl) img.setAttribute("src", pexelsUrl);
  });

  await Promise.all(imagePromises);
  return doc.documentElement.outerHTML;
}

// ============================================================================
// AI SERVICE INTERFACE
// ============================================================================



const AIService = {
  /**
   * Refines a short idea into a detailed UI/UX prompt.
   */
  async rewritePrompt({ userPrompt, systemPrompt, maxTokens, temperature, onToken }) {
    return streamChatCompletion({
      apiUrl: API_CONFIG.rewriter.apiUrl,
      model: API_CONFIG.rewriter.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens,
      temperature,
      onToken,
    });
  },

  /**
   * Generates UI code from a prompt and optionally fetches real images.
   */
  async generateUI({ userPrompt, systemPrompt, pexelsApiKey, maxTokens, temperature, topP, topK, onToken }) {
    const fullText = await streamChatCompletion({
      apiUrl: API_CONFIG.coder.apiUrl,
      model: API_CONFIG.coder.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens,
      temperature,
      topP,
      topK,
      onToken,
    });

    let htmlCode = cleanCodeFences(fullText);
    if (!htmlCode) throw new Error("Empty response from model");

    if (pexelsApiKey) {
      if (onToken) onToken(fullText, "Fetching real images..."); // Hacky way to update status, handled better contextually but we don't have tokenCount here.
      // Wait, let's let the caller handle the Pexels status, or we do it here without changing UI.
      // It's cleaner if AIService returns the final code. We'll handle Pexels here.
      htmlCode = await replaceImagesWithPexels(htmlCode, pexelsApiKey);
    }

    return htmlCode;
  }
};
