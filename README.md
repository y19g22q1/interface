# IPHD: Intuition-Preserving Hybrid Design Pipeline

This repository contains the source code, prompts, and evaluation materials for the
Intuition-Preserving Hybrid Design (IPHD) framework: a two-stage AI-assisted UI
generation pipeline with an editable, human-reviewed intermediate design brief.

This repository is shared anonymously to support the verifiability and replicability
of the associated manuscript, currently under double-anonymous review. It will be
updated with author information upon acceptance.

## Overview

The IPHD pipeline converts a free-text app idea into a working mobile UI in two stages:

1. **Stage 1 — Prompt Rewriting.** A lightweight language model (Llama-3.1-8B-Instruct,
   accessed via OpenRouter) converts the designer's free-text idea into a structured
   design brief with six fields: `APP`, `GOAL`, `SCREENS`, `NAV`, `STYLE`, `COLORS`.
   The brief is shown to the designer for review and editing before continuing.
2. **Stage 2 — UI Code Generation.** A code-generation model
   (Qwen3-Coder-30B-A3B-Instruct, accessed via OpenRouter) converts the
   (possibly edited) brief into a complete, mobile-first HTML interface.

The tool exposes three interaction modes: **Prompt Reformat** (Stage 1 only),
**Generate Code** (Stage 2 only), and **Smart Generate** (the full two-stage pipeline
with the human checkpoint).

## Repository Structure

```
.
├── index.html          # Application entry point / UI shell
├── css/                 # Stylesheets
├── js/                   # Application logic, including:
│   ├── prompts/          # System prompts for Stage 1 (Llama) and Stage 2 (Qwen)
│   │   ├── stage1_system_prompt.txt
│   │   └── stage2_system_prompt.txt
│   ├── metrics.js         # Automated evaluation metrics: CC, TAS, SC
│   └── ...                 # Pipeline / OpenRouter communication logic
├── evaluation/
│   ├── automated_prompts.md      # The 5 natural-language prompts used in the
│   │                                automated evaluation (food delivery, medical
│   │                                appointment scheduling, e-commerce, social
│   │                                networking, productivity)
│   ├── automated_results_raw.csv  # Raw per-run CC / TAS / SC scores (5 runs × 3 modes)
│   └── maze_study/
│       ├── study_definition.pdf    # Screenshot/export of the Maze task and survey blocks
│       └── maze_export_summary.csv # Aggregated response distributions per item
└── README.md
```

> **Note to maintainers:** the exact paths above should be adjusted to match the
> actual file layout of this repository. Please move/rename files as needed so
> that this structure accurately reflects what is present, and remove this note
> once verified.

## Running the Tool

1. Clone this repository.
2. Serve the root directory with any static file server, e.g.:
   ```bash
   npx serve .
   ```
3. Open `index.html` in a browser.
4. Both pipeline stages call the OpenRouter API
   (`https://openrouter.ai/api/v1/chat/completions`). You will need your own
   OpenRouter API key to run the tool live; see `js/` for where the key is
   configured.

## System Prompts

The exact system prompts used to constrain Stage 1 (structured brief generation)
and Stage 2 (mobile-first HCI-constrained HTML generation) are provided verbatim
in `js/prompts/`. These are the prompts referenced in the Methodology section of
the associated manuscript and are required to reproduce the reported behavior.

## Automated Evaluation

- `evaluation/automated_prompts.md` lists the five natural-language prompts used
  across the three interaction modes (5 runs each, 15 runs total).
- `evaluation/automated_results_raw.csv` contains the raw Code Correctness (CC),
  Task Alignment Score (TAS), and Structural Consistency (SC) values per run,
  underlying the summary tables reported in the manuscript.
- `js/metrics.js` contains the exact implementation of all three metrics, so that
  scores can be independently recomputed from generated HTML output.

## Human Evaluation (Maze)

- `evaluation/maze_study/study_definition.pdf` documents the study flow: the
  live-website generation task, the task-completion check, the four perceptual
  rating items (UX Relevance, Color Appropriateness, Navigation Ease, Creativity),
  and the 10-item System Usability Scale (SUS), using Brooke's (1996) original
  item wording.
- `evaluation/maze_study/maze_export_summary.csv` contains the aggregated,
  anonymized response distributions exported from Maze for each survey item.
- The live Maze report is also available at:
  `https://app.maze.co/report/UI-AI-model-testing/355y7mu17dv0y/intro`

## License

[TO COMPLETE: add a license, e.g. MIT for code, CC-BY for prompts/data, once decided.]

## Citation

This repository accompanies a manuscript currently under double-anonymous review.
Citation details will be added upon acceptance.
