// ============================================================================
// APP.JS — Tab Switching, Cross-tab Syncing, Bootstrapping
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ── Bootstrap tab modules ────────────────────────────────────────────────
  // Each module's init() binds its own buttons, defaults, and shortcuts.

  Tab1PromptReformat.init();
  Tab2GenerateCode.init();
  Tab3SmartGenerate.init();

  // ── Tab Switching ─────────────────────────────────────────────────────────

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");

      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabContents.forEach((c) => c.classList.remove("active"));
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  // ── Cross-tab Field Syncing ──────────────────────────────────────────────
  // Changes in one tab automatically mirror to the corresponding field in
  // another tab, so the Smart Generate tab always stays in sync.

  syncFields("tab1-userPrompt", "tab3-userPrompt"); // user idea
  syncFields("tab1-systemPrompt", "tab3-rewriterPrompt"); // rewriter prompt
  syncFields("tab2-systemPrompt", "tab3-coderPrompt"); // coder prompt
  syncFields("tab2-pexelsApiKey", "tab3-pexelsApiKey"); // pexels API key

  syncRadioGroup("tab2-ui_type", "tab3-ui_type"); // website / mobile
  syncRadioGroup("tab3-ui_type", "tab2-ui_type"); // bidirectional
});
