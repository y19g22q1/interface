// ============================================================================
// UI HELPER UTILITIES
// Shared functions used across all tabs to eliminate duplication.
// ============================================================================

/**
 * Shorthand for document.getElementById — used everywhere.
 */
const $ = (id) => document.getElementById(id);

// ── Loading State ────────────────────────────────────────────────────────────

/**
 * Toggle the loading spinner and disable/enable the generate button.
 *
 * All tabs follow the same DOM convention:
 *   {prefix}-loading       → spinner wrapper
 *   {prefix}-loadingText   → loading label
 *   {prefix}-generateBtn   → primary action button
 *
 * @param {string}  prefix      — e.g. "tab1", "tab2", "tab3"
 * @param {boolean} active      — true = show spinner & disable button
 * @param {string}  [label]     — text to show while loading (e.g. "Generating...")
 */
function setLoading(prefix, active, label) {
  const loadingEl = $(`${prefix}-loading`);
  const loadingText = $(`${prefix}-loadingText`);
  const generateBtn = $(`${prefix}-generateBtn`);

  if (active) {
    loadingEl.classList.add("active");
    if (label) loadingText.textContent = label;
    generateBtn.disabled = true;
  } else {
    loadingEl.classList.remove("active");
    loadingText.textContent = label || "";
    generateBtn.disabled = false;
  }
}

// ── Error Display ────────────────────────────────────────────────────────────

/**
 * Replace the content of a container with an error message.
 *
 * @param {string} containerId — the element whose innerHTML will be replaced
 * @param {string} message     — the error text to display
 */
function showError(containerId, message) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <p style="color: #c33; font-size: 32px;">❌</p>
      <p style="color: #c33;">Error</p>
      <p style="font-size: 13px; color: #999;">${message}</p>
    </div>`;
}

// ── Text Output Helpers (Tab 1 style — plain text in a div) ─────────────────

/**
 * Prepare the text-output panel for streaming: hide empty state, show the
 * output div, add the blinking-cursor class, reveal the token footer.
 *
 * @param {string} prefix — e.g. "tab1"
 */
function showTextOutputStreaming(prefix) {
  $(`${prefix}-emptyState`).style.display = "none";
  $(`${prefix}-outputText`).style.display = "block";
  $(`${prefix}-outputText`).classList.add("streaming");
  $(`${prefix}-tokenFooter`).classList.add("visible");
}

/**
 * Finalise the text-output panel after streaming ends: remove cursor,
 * show the copy button, store the final content on the module.
 *
 * @param {string} prefix — e.g. "tab1"
 * @param {string} fullText — the complete streamed text
 */
function finalizeTextOutput(prefix, fullText) {
  $(`${prefix}-outputText`).classList.remove("streaming");
  $(`${prefix}-copyBtn`).style.display = "block";
}

/**
 * Reset the text-output panel to its blank initial state.
 *
 * @param {string} prefix — e.g. "tab1"
 */
function resetTextOutput(prefix) {
  $(`${prefix}-outputText`).textContent = "";
  $(`${prefix}-outputText`).style.display = "none";
  $(`${prefix}-outputText`).classList.remove("streaming");
  $(`${prefix}-emptyState`).style.display = "flex";
  $(`${prefix}-copyBtn`).style.display = "none";
  $(`${prefix}-tokenFooter`).classList.remove("visible");
  $(`${prefix}-tokenCount`).textContent = "0";
}

// ── Iframe Preview Helpers (Tab 2 & 3 style — rendered HTML) ────────────────

/**
 * Render HTML content inside an iframe inside the given container.
 *
 * @param {string} containerId — e.g. "tab2-previewContainer"
 * @param {string} iframeId     — e.g. "tab2-previewFrame"
 * @param {string} htmlContent  — the HTML string to render
 */
function renderIframePreview(containerId, iframeId, htmlContent) {
  // Inject script to prevent navigation from links and forms
  const preventNavScript = `
    <script>
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.hasAttribute('href')) {
          let href = link.getAttribute('href');
          // Allow anchor links that just scroll within the same page
          if (href !== null && href.startsWith('#') && href.length > 1) {
              return;
          }
          e.preventDefault();
          console.log('Navigation disabled in preview.');
        }
      });
      document.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submission disabled in preview.');
      });
    </script>
  `;

  // Append the script just before </body>, or at the end if no </body>
  const finalHtml = htmlContent.includes("</body>")
    ? htmlContent.replace("</body>", preventNavScript + "\n</body>")
    : htmlContent + preventNavScript;

  $(containerId).innerHTML =
    `<iframe class="preview-frame" id="${iframeId}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
  $(iframeId).srcdoc = finalHtml;
}

// ── Clipboard ────────────────────────────────────────────────────────────────

/**
 * Copy text to the clipboard and flash a "✅ Copied!" confirmation on the
 * given button, then revert after 2 seconds.
 *
 * @param {string} text   — the text to copy
 * @param {string} btnId  — the id of the button showing the feedback
 */
function copyToClipboard(text, btnId) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $(btnId);
    const orig = btn.textContent;
    btn.textContent = "✅ Copied!";
    setTimeout(() => (btn.textContent = orig), 2000);
  });
}

// ── File Download ─────────────────────────────────────────────────────────────

/**
 * Download a string as an HTML file.
 *
 * @param {string} htmlContent — the HTML string
 * @param {string} filename    — e.g. "generated-ui.html"
 */
function downloadHTMLFile(htmlContent, filename) {
  if (!htmlContent) return;
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Check that a prompt string is not empty; alert and return false if it is.
 *
 * @param  {string} text    — the value to check
 * @param  {string} [msg]   — custom alert message
 * @return {boolean} true when valid
 */
function validatePrompt(text, msg = "Please enter a prompt!") {
  if (!text.trim()) {
    alert(msg);
    return false;
  }
  return true;
}

// ── Keyboard Shortcuts ───────────────────────────────────────────────────────

/**
 * Bind Ctrl+Enter on a textarea to trigger a callback.
 *
 * @param {string}   elementId — the textarea id
 * @param {Function} callback  — function to call
 */
function bindCtrlEnter(elementId, callback) {
  const el = $(elementId);
  if (el)
    el.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") callback();
    });
}

// ── Field Syncing ─────────────────────────────────────────────────────────────

/**
 * Two-way sync the `.value` of two input/textarea elements.
 *
 * @param {string} idA — first element id
 * @param {string} idB — second element id
 */
function syncFields(idA, idB) {
  const a = $(idA);
  const b = $(idB);
  if (!a || !b) return;

  a.addEventListener("input", () => {
    b.value = a.value;
  });
  b.addEventListener("input", () => {
    a.value = b.value;
  });
}

/**
 * One-way sync a group of radio buttons to another group with matching values.
 *
 * @param {string} sourceName  — name attribute of the source radios
 * @param {string} targetName  — name attribute of the target radios
 */
function syncRadioGroup(sourceName, targetName) {
  document.querySelectorAll(`input[name="${sourceName}"]`).forEach((radio) => {
    radio.addEventListener("change", () => {
      const match = document.querySelector(
        `input[name="${targetName}"][value="${radio.value}"]`,
      );
      if (match) match.checked = true;
    });
  });
}

// ── Metrics Helpers ─────────────────────────────────────────────────────────

/**
 * Initialize the metrics panel for a tab.
 *
 * @param {string}   prefix          — e.g., "tab1", "tab2", "tab3"
 * @param {string}   userPromptId    — ID of the user prompt input/textarea
 * @param {Function} getOutputFn     — function returning the current output string
 * @param {boolean}  isCode          — whether the output is code (true for tab2/3, false for tab1)
 */
function initMetricsPanel(prefix, userPromptId, getOutputFn, isCode = true) {
  const promptInput = $(userPromptId);
  const tasTextarea = $(`${prefix}-metrics-tasKeywords`);
  const scTextarea = $(`${prefix}-metrics-scElements`);
  const recalcBtn = $(`${prefix}-recalcBtn`);

  if (!promptInput || !tasTextarea || !recalcBtn) return;

  // Auto-extract keywords when user types in the prompt box
  promptInput.addEventListener("input", () => {
    const promptVal = promptInput.value.trim();
    if (typeof Metrics !== "undefined") {
      const keywords = Metrics.extractKeywords(promptVal);
      tasTextarea.value = keywords.join(", ");
    }
  });

  // Wire up the recalculate button
  recalcBtn.addEventListener("click", () => {
    const output = getOutputFn();
    if (!output) {
      alert("No output generated yet to calculate metrics on!");
      return;
    }
    calculateAndRenderMetrics(prefix, promptInput.value, output, isCode);
  });
}

/**
 * Calculate the metrics and update the UI badges.
 *
 * @param {string} prefix      — e.g., "tab1", "tab2", "tab3"
 * @param {string} userPrompt  — original user prompt
 * @param {string} output      — the output code or text
 * @param {boolean} isCode     — whether the output is code
 */
function calculateAndRenderMetrics(prefix, userPrompt, output, isCode = true) {
  if (typeof Metrics === "undefined") {
    console.error("Metrics module is not loaded!");
    return;
  }

  const tasTextarea = $(`${prefix}-metrics-tasKeywords`);
  const scTextarea = $(`${prefix}-metrics-scElements`);
  const recalcBtn = $(`${prefix}-recalcBtn`);

  // 1. Code Correctness (CC)
  let ccScore = 0;
  if (isCode) {
    ccScore = Metrics.codeCorrectness(output);
  } else {
    // Tab 1: no code, but parse the text output (client requested to run CC as well)
    ccScore = Metrics.codeCorrectness(output);
  }

  // 2. Task Alignment Score (TAS)
  // Use words from the editable textbox if they exist, otherwise fallback to auto-extracted
  let keywords = [];
  const tasVal = tasTextarea.value.trim();
  if (tasVal) {
    keywords = tasVal.split(",").map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
  } else {
    keywords = Metrics.extractKeywords(userPrompt);
    tasTextarea.value = keywords.join(", ");
  }

  let tasScore = 0;
  if (keywords.length > 0) {
    const outputLower = output.toLowerCase();
    const match = keywords.reduce((sum, k) => sum + (outputLower.includes(k) ? 1 : 0), 0);
    tasScore = match / keywords.length;
  }

  // 3. Structural Consistency (SC)
  let elements = [];
  const scVal = scTextarea.value.trim();
  if (scVal) {
    elements = scVal.split(",").map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
  } else {
    elements = ["form", "input", "button", "div", "label"];
    scTextarea.value = elements.join(", ");
  }

  let scScore = 0;
  if (elements.length > 0) {
    const outputLower = output.toLowerCase();
    const match = elements.reduce((sum, e) => sum + (outputLower.includes(e) ? 1 : 0), 0);
    scScore = match / elements.length;
  }

  // 4. Update the badges
  updateMetricBadge(`${prefix}-metric-cc`, ccScore, true);
  updateMetricBadge(`${prefix}-metric-tas`, tasScore, false);
  updateMetricBadge(`${prefix}-metric-sc`, scScore, false);

  // Enable recalculate button
  if (recalcBtn) {
    recalcBtn.removeAttribute("disabled");
  }
}

/**
 * Helper to update a metric badge element with style and content.
 *
 * @param {string}  id       — element ID
 * @param {number}  score    — score value (0 to 1)
 * @param {boolean} isCc     — is this the CC metric?
 */
function updateMetricBadge(id, score, isCc) {
  const el = $(id);
  if (!el) return;

  // Reset classes
  el.className = "metric-badge";

  if (isCc) {
    el.textContent = score === 1 ? "1" : "0";
    el.classList.add(score === 1 ? "badge-success" : "badge-danger");
  } else {
    const pct = Math.round(score * 100);
    el.textContent = pct + "%";
    if (pct >= 80) {
      el.classList.add("badge-success");
    } else if (pct >= 50) {
      el.classList.add("badge-warning");
    } else {
      el.classList.add("badge-danger");
    }
  }
}

/**
 * Reset all metric badges to their neutral/empty state.
 *
 * @param {string} prefix - e.g. "tab1", "tab2", "tab3"
 */
function resetMetrics(prefix) {
  const ccEl = $(`${prefix}-metric-cc`);
  const tasEl = $(`${prefix}-metric-tas`);
  const scEl = $(`${prefix}-metric-sc`);
  const recalcBtn = $(`${prefix}-recalcBtn`);

  if (ccEl) {
    ccEl.className = "metric-badge badge-neutral";
    ccEl.textContent = "-";
  }
  if (tasEl) {
    tasEl.className = "metric-badge badge-neutral";
    tasEl.textContent = "-";
  }
  if (scEl) {
    scEl.className = "metric-badge badge-neutral";
    scEl.textContent = "-";
  }
  if (recalcBtn) {
    recalcBtn.setAttribute("disabled", "true");
  }
}


