// ============================================================================
// TAB 3 — SMART GENERATE (Rewrite Prompt → Generate UI Code)
// ============================================================================

const Tab3SmartGenerate = (() => {
  const PREFIX = "tab3";
  let generatedHTML = "";

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    $(`${PREFIX}-rewriterPrompt`).value = DEFAULT_SYSTEM_PROMPTS.rewriter;
    $(`${PREFIX}-coderPrompt`).value = DEFAULT_SYSTEM_PROMPTS.coder;

    $(`${PREFIX}-generateBtn`).addEventListener("click", generate);
    $(`${PREFIX}-downloadBtn`).addEventListener("click", () =>
      downloadHTMLFile(generatedHTML, "smart-generated-ui.html"),
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

  // ── Reset UI ─────────────────────────────────────────────────────────────

  function resetUI() {
    $(`${PREFIX}-mobileBtn`).style.display = "none";
    $(`${PREFIX}-downloadBtn`).style.display = "none";
    $(`${PREFIX}-copyBtn`).style.display = "none";

    // Reset metrics
    resetMetrics(PREFIX);

    // Reset pipeline status
    $(`${PREFIX}-pipelineStatus`).classList.remove("visible");

    const step1 = $(`${PREFIX}-step1`);
    const step2 = $(`${PREFIX}-step2`);
    step1.className = "pipeline-step";
    step2.className = "pipeline-step";
    $(`${PREFIX}-step1Detail`).textContent = "Waiting...";
    $(`${PREFIX}-step2Detail`).textContent = "Waiting...";

    // Reset intermediate output
    $(`${PREFIX}-intermediate`).classList.remove("visible");
    $(`${PREFIX}-intermediateText`).textContent = "";

    // Reset preview container
    $(`${PREFIX}-previewContainer`).innerHTML = `
      <div class="empty-state" id="${PREFIX}-emptyState">
        <p style="font-size: 48px;">🚀</p>
        <p>Your smart-generated UI will appear here</p>
        <p style="font-size: 12px; margin-top: 10px;">Enter your idea and click Smart Generate</p>
      </div>`;

    generatedHTML = "";
  }

  // ── Main Smart Generate ──────────────────────────────────────────────────

  async function generate() {
    // ── Gather inputs ────────────────────────────────────────────────────
    const userPrompt = $(`${PREFIX}-userPrompt`).value.trim();
    const rewriterSystem = $(`${PREFIX}-rewriterPrompt`).value.trim();
    const coderSystem = $(`${PREFIX}-coderPrompt`).value.trim();
    const pexelsApiKey = $(`${PREFIX}-pexelsApiKey`)?.value?.trim() || "";
    const rewriterMaxTokens = parseInt($(`${PREFIX}-rewriterMaxTokens`).value);
    const rewriterTemp = parseFloat($(`${PREFIX}-rewriterTemperature`).value);
    const coderMaxTokens = parseInt($(`${PREFIX}-coderMaxTokens`).value);
    const coderTemp = parseFloat($(`${PREFIX}-coderTemperature`).value);

    if (!validatePrompt(userPrompt, "Please enter an idea!")) return;

    // ── Reset UI ─────────────────────────────────────────────────────────
    resetUI();

    const step1 = $(`${PREFIX}-step1`);
    const step2 = $(`${PREFIX}-step2`);
    const step1Detail = $(`${PREFIX}-step1Detail`);
    const step2Detail = $(`${PREFIX}-step2Detail`);
    const intermediate = $(`${PREFIX}-intermediate`);
    const intermediateText = $(`${PREFIX}-intermediateText`);

    setLoading(PREFIX, true, "Step 1/2: Rewriting prompt...");
    $(`${PREFIX}-pipelineStatus`).classList.add("visible");

    let rewrittenPrompt = "";

    try {
      // ──────────────────────────────────────────────────────────────────
      // STEP 1 — Rewrite the vague idea into a detailed prompt
      // ──────────────────────────────────────────────────────────────────
      step1.className = "pipeline-step active";
      step1Detail.textContent = "Rewriting...";

      let step1Tokens = 0;

      rewrittenPrompt = await AIService.rewritePrompt({
        systemPrompt: rewriterSystem,
        userPrompt,
        maxTokens: rewriterMaxTokens,
        temperature: rewriterTemp,

        onToken(fullText, tokenCount) {
          step1Tokens = tokenCount;
          step1Detail.textContent = `Rewriting... (${tokenCount} tokens)`;
          setLoading(
            PREFIX,
            true,
            `Step 1/2: Rewriting... (${tokenCount} tokens)`,
          );

          // Show intermediate output as it streams
          intermediate.classList.add("visible");
          intermediateText.value = fullText;
          intermediateText.scrollTop = intermediateText.scrollHeight;
        },
      });

      // Step 1 complete
      step1.className = "pipeline-step completed";
      step1Detail.textContent = `Done (${step1Tokens} tokens)`;

      // ──────────────────────────────────────────────────────────────────
      // STEP 2 — Feed rewritten prompt into the coder model
      // ──────────────────────────────────────────────────────────────────
      step2.className = "pipeline-step active";
      step2Detail.textContent = "Generating UI...";
      setLoading(PREFIX, true, "Step 2/2: Generating UI code...");

      const htmlCode = await AIService.generateUI({
        userPrompt: rewrittenPrompt,
        systemPrompt: coderSystem,
        pexelsApiKey,
        maxTokens: coderMaxTokens,
        temperature: coderTemp,

        onToken(fullText, tokenOrStatus) {
          if (typeof tokenOrStatus === "string") {
            step2Detail.textContent = tokenOrStatus;
            setLoading(PREFIX, true, `Step 2/2: ${tokenOrStatus}`);
          } else {
            step2Detail.textContent = `Generating... (${tokenOrStatus} tokens)`;
            setLoading(
              PREFIX,
              true,
              `Step 2/2: Generating UI... (${tokenOrStatus} tokens)`,
            );
          }
        },
      });

      // Step 2 complete
      step2.className = "pipeline-step completed";
      step2Detail.textContent = "Done";

      // ── Render preview ────────────────────────────────────────────────
      generatedHTML = htmlCode;
      renderIframePreview(
        `${PREFIX}-previewContainer`,
        `${PREFIX}-previewFrame`,
        htmlCode,
      );

      // Calculate and render metrics using original user prompt and generated html
      calculateAndRenderMetrics(PREFIX, userPrompt, htmlCode, true);

      $(`${PREFIX}-mobileBtn`).style.display = "block";
      $(`${PREFIX}-downloadBtn`).style.display = "block";
      $(`${PREFIX}-copyBtn`).style.display = "block";
    } catch (error) {
      console.error("Smart Generate error:", error);
      showError(`${PREFIX}-previewContainer`, error.message);

      // Mark the failed step
      if (step1.classList.contains("active"))
        step1Detail.textContent = "Failed";
      if (step2.classList.contains("active"))
        step2Detail.textContent = "Failed";
    } finally {
      setLoading(PREFIX, false, "Generating...");
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return { init, generate };
})();
