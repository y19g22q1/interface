// ============================================================================
// TAB 2 — GENERATE CODE
// ============================================================================

const Tab2GenerateCode = (() => {
  const PREFIX = "tab2";
  let generatedHTML = "";

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    $(`${PREFIX}-systemPrompt`).value = DEFAULT_SYSTEM_PROMPTS.coder;
    $(`${PREFIX}-generateBtn`).addEventListener("click", generate);
    $(`${PREFIX}-downloadBtn`).addEventListener("click", () =>
      downloadHTMLFile(generatedHTML, "generated-ui.html"),
    );
    $(`${PREFIX}-copyBtn`).addEventListener("click", () =>
      copyToClipboard(generatedHTML, `${PREFIX}-copyBtn`),
    );
    $(`${PREFIX}-mobileBtn`).addEventListener("click", () => {
      $(`${PREFIX}-previewContainer`).classList.toggle("mobile-view");
      $(`${PREFIX}-mobileBtn`).classList.toggle("active");
    });
    bindCtrlEnter(`${PREFIX}-userPrompt`, generate);

    // Initialize metrics panel
    initMetricsPanel(PREFIX, `${PREFIX}-userPrompt`, () => generatedHTML, true);

    // Pre-fill initial keywords
    const initialPrompt = $(`${PREFIX}-userPrompt`).value.trim();
    if (initialPrompt && typeof Metrics !== "undefined") {
      const keywords = Metrics.extractKeywords(initialPrompt);
      $(`${PREFIX}-metrics-tasKeywords`).value = keywords.join(", ");
    }
  }

  // ── Main Generate ─────────────────────────────────────────────────────────

  async function generate() {
    const userPrompt = $(`${PREFIX}-userPrompt`).value.trim();
    const systemPrompt = $(`${PREFIX}-systemPrompt`).value.trim();
    const pexelsApiKey = $(`${PREFIX}-pexelsApiKey`).value.trim();
    const maxTokens = parseInt($(`${PREFIX}-maxTokens`).value);
    const temperature = parseFloat($(`${PREFIX}-temperature`).value);
    const topP = parseFloat($(`${PREFIX}-topP`).value);
    const topK = parseInt($(`${PREFIX}-topK`).value);

    if (!validatePrompt(userPrompt, "Please enter a user prompt!")) return;

    // ── Reset UI ─────────────────────────────────────────────────────────
    setLoading(PREFIX, true, "Generating...");
    resetMetrics(PREFIX);
    $(`${PREFIX}-mobileBtn`).style.display = "none";
    $(`${PREFIX}-downloadBtn`).style.display = "none";
    $(`${PREFIX}-copyBtn`).style.display = "none";

    try {
      // ── Stream from coder model ───────────────────────────────────────
      const htmlCode = await AIService.generateUI({
        userPrompt,
        systemPrompt,
        pexelsApiKey,
        maxTokens,
        temperature,
        topP,
        topK,
        onToken(_fullText, tokenOrStatus) {
          if (typeof tokenOrStatus === "string") {
            setLoading(PREFIX, true, tokenOrStatus);
          } else {
            setLoading(PREFIX, true, `Generating... (${tokenOrStatus} tokens)`);
          }
        },
      });

      // ── Render preview ───────────────────────────────────────────────
      generatedHTML = htmlCode;
      renderIframePreview(
        `${PREFIX}-previewContainer`,
        `${PREFIX}-previewFrame`,
        htmlCode,
      );

      // Calculate and render metrics
      calculateAndRenderMetrics(PREFIX, userPrompt, htmlCode, true);

      $(`${PREFIX}-mobileBtn`).style.display = "block";
      $(`${PREFIX}-downloadBtn`).style.display = "block";
      $(`${PREFIX}-copyBtn`).style.display = "block";
    } catch (error) {
      console.error("Tab2 Error:", error);
      showError(`${PREFIX}-previewContainer`, error.message);
    } finally {
      setLoading(PREFIX, false, "Generating...");
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return { init, generate };
})();
