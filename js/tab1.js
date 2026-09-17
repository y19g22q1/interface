// ============================================================================
// TAB 1 — PROMPT REFORMAT
// ============================================================================

const Tab1PromptReformat = (() => {
  const PREFIX = "tab1";
  let outputContent = "";

  // ── Initialise ──────────────────────────────────────────────────────────

  function init() {
    $(`${PREFIX}-systemPrompt`).value = DEFAULT_SYSTEM_PROMPTS.rewriter;
    $(`${PREFIX}-generateBtn`).addEventListener("click", generate);
    $(`${PREFIX}-copyBtn`).addEventListener("click", () =>
      copyToClipboard(outputContent, `${PREFIX}-copyBtn`),
    );
    bindCtrlEnter(`${PREFIX}-userPrompt`, generate);

    // Initialize metrics panel
    initMetricsPanel(PREFIX, `${PREFIX}-userPrompt`, () => outputContent, false);

    // Pre-fill initial keywords
    const initialPrompt = $(`${PREFIX}-userPrompt`).value.trim();
    if (initialPrompt && typeof Metrics !== "undefined") {
      const keywords = Metrics.extractKeywords(initialPrompt);
      $(`${PREFIX}-metrics-tasKeywords`).value = keywords.join(", ");
    }
  }

  // ── Main Generation ─────────────────────────────────────────────────────

  async function generate() {
    const userPrompt = $(`${PREFIX}-userPrompt`).value.trim();
    const systemPrompt = $(`${PREFIX}-systemPrompt`).value.trim();
    const maxTokens = parseInt($(`${PREFIX}-maxTokens`).value);
    const temperature = parseFloat($(`${PREFIX}-temperature`).value);

    if (!validatePrompt(userPrompt, "Please enter an idea or prompt!")) return;

    // ── Reset UI ─────────────────────────────────────────────────────────
    resetTextOutput(PREFIX);
    resetMetrics(PREFIX);
    outputContent = "";
    setLoading(PREFIX, true, "Rewriting...");
    showTextOutputStreaming(PREFIX);

    try {
      const fullText = await AIService.rewritePrompt({
        systemPrompt,
        userPrompt,
        maxTokens,
        temperature,
        onToken(fullText, count) {
          outputContent = fullText;
          $(`${PREFIX}-outputText`).textContent = fullText;
          $(`${PREFIX}-tokenCount`).textContent = count;
          setLoading(PREFIX, true, `Rewriting... (${count} tokens)`);
          $(`${PREFIX}-outputText`).scrollTop = $(
            `${PREFIX}-outputText`,
          ).scrollHeight;
        },
      });

      outputContent = fullText;
      finalizeTextOutput(PREFIX, fullText);
      
      // Calculate and render metrics
      calculateAndRenderMetrics(PREFIX, userPrompt, outputContent, false);
    } catch (error) {
      showError(`${PREFIX}-previewContainer`, error.message);
      $(`${PREFIX}-outputText`).style.display = "none";
      console.error("Tab1 Error:", error);
    } finally {
      setLoading(PREFIX, false, "Rewriting...");
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return { init };
})();
