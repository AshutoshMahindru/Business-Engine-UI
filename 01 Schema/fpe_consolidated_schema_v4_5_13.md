<!-- FPE CONSOLIDATED SCHEMA — v4.5.13 FINAL -->
<!-- Generated: 2026-04-12 -->
<!-- Source: 22 modular files — DI-65 resolved, all downstream artifacts merged -->
<!-- Open DIs: 0 | Deferred V5: 3 (DI-48, DI-49, DI-56) -->



================================================================================
<!-- MODULE: 00_header_rules.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.13 -->
<!-- File: 00_header_rules.md -->
<!-- Description: Global Rules, System Fields, Meta-Decisions (Rules 1-27) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 1–77 -->
<!-- Date: 2026-04-12 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# FPE Canonical v4 — Consolidated Schema

Date: 2026-04-12
Version: v4.5.13 — Phase 8 (S10) + Phase 9 (S70) + Phase 10 (S30) + Phase 11 (S20) + Phase 12 (S40) + Phase 13 (S50) + Phase 14 (S60) + Cross-cutting (D-CROSS-01: Research-First Defaults) + Phase 15 (S80 + S90) + Phase 16 (S100 + S110 + S120) + Phase 17 (S200) + Phase 18 (S300) + Phase 19 (Schema Amendments: DI-70, DI-71, DI-54, DI-56)
Supersedes: all prior versions (v3 91 tables, v4.0–v4.5.4 132 tables, v4.5.4–v4.5.7 +3 tables, v4.5.7–v4.5.8 +3 tables, v4.5.8–v4.5.9 D-CROSS-01 +53 columns, v4.5.9–v4.5.10 Phase 15 S80+S90 +6 tables +236 columns −2 absorbed)
Status: **LOCKED — single source of truth** (v4.5.13: Phase 19 schema amendments — DI-70 formula registry +2 tables, DI-71 lineage binding +2 columns, DI-54 resolved, DI-56 deferred V5)

---

## Global rules (apply to every table in this document)

### System fields on every table
| Field | Type | Rule |
|---|---|---|
| `[table]_id` | system | auto-generated primary key |
| `version` | system | app-wide, system-managed |
| `scenario` | system | scenario key |
| `effective_from` | system | validity start date |
| `effective_to` | system | validity end date |
| `row_status` | system | draft / active / inactive / deprecated / archived |

These six fields exist on every table below but are **not repeated** in column lists.

**Exception:** `00_table_registry` carries only `table_registry_id` and `row_status` (active / deprecated). It does NOT carry `version`, `scenario`, `effective_from`, or `effective_to` — the registry is deployment-managed schema metadata, not scenario-dependent business data. All other tables retain the full 6 system fields.

### Meta-decision rules
1. `version` — app-wide system field
2. `table_display_order` — central registry (`00_table_registry`), not row-level
3. Source metadata — lineage sidecar (`91_metric_lineage_log`), not per-column
4. Multi-select — bridge/map tables, never comma-separated list columns
5. All scores — outputs only
6. Operating intensity — rolls up from downstream namesake sections
7. Competitor count — rolls up from lower market hierarchy
8. Scores — recalculated at target grain, not averaged/summed
9. Dates and pause states — resolved in outputs
10. `row_status` — controlled values
11. Bridge/map row ordering — `priority_rank` / `sort_order` / `sequence_no`

### v4 additions — locked rules from critical audit
12. **Revenue computed ONCE** in S200. No other section projects revenue.
13. **Orders projected ONCE** in S60. Other sections consume from S60. **S60 grain: format × revenue_stream × channel × market.** S60 is SINGLE SOURCE of order volume at atomic format × stream × channel × market granularity (D14-02). S200 receives per-stream per-channel demand directly.
14. **Single ownership** — every contestable field has exactly one owner section (see Ownership Registry at end).
15. **Benchmarks vs assumptions** — external reference values are classified as `reference`, not `assumption`. They are for validation, not computation.
16. **Structure view max-dimension rule** — No structure output view joins more than 3 independent dimensions. If the resolved view requires more, split into layered views at 2–3 dimensions each. The UI renders progressive drill-down, not flat Cartesian products. Every driver/output table with format_id + market_id as keys renders with a mandatory format→market cascading filter. For S200 computation output tables, the cascading filter is: format → market → period range. Remaining dimensions (stream, channel) display as breakdown within the filtered view.
17. **Period dimension on forecast outputs** — Every S200 Finance Stack output table must include `period_id` as a key dimension, referencing `14_periods_master`. Base grain is monthly. Quarterly and annual aggregations are computed views that re-derive percentages from summed absolutes. Upstream sections (S10–S120) remain parameter-driven; S200 is the period-expansion engine. Cash flow requires sequential processing: period N's `opening_cash_inr` = period N−1's `closing_cash_inr`.
18. **S200 strict computation order** — S200 tables process in strict sequence: revenue → CM1 → CM2 → EBITDA → Net Profit → Cash Flow. When an upstream table has more key dimensions than its downstream consumer, the collapsing dimension is aggregated via SUM at the upstream grain before insertion. No S200 table may be computed before its upstream feeder is complete for the relevant period.
19. **Pricing waterfall (4-discount)** — (1) Channel markup on list price, capped by `price_markup_cap_inr` → `customer_price`. (2) Channel platform discount (e.g., Swiggy "50% off") — cost split per `channel_discount_brand_share_pct` (brand bears its share, channel absorbs rest). (3) Base discount (§S20→S60§). (4) Promo discount (co-funded per `promo_funding_share_pct`). (5) Campaign discount (S50). All discounts additive on customer price. `net_price` floor = ₹0. See `08b_channel_terms` for full 10-step waterfall.
20. **Temporal exclusivity for bridge/map tables** — No two rows with the same composite key (excluding `active_from`/`active_to`/`priority_rank`) may have overlapping `[active_from, active_to]` periods. Exception: draft rows may overlap active rows (staging). Tiebreaker for legacy data: lower `priority_rank` wins; if equal, later `active_from` wins.
21. **Share resolution NULL handling** — At each level of the mix hierarchy (format→collection→category→product): (a) use scenario override if present and non-NULL; (b) else use S00 bridge default; (c) else use equal split among active entities. After resolution, normalize to 100% with WARNING if sum ≠ 100%. Equal-split fallback ensures computation never encounters NULL shares.
22. **Scenario fallback** — When computing outputs for a non-base scenario: (a) use section data for that scenario if rows exist; (b) if no rows, fall back to the base scenario (`is_base_scenario_flag = true` in `15_scenarios_master`); (c) log every fallback in `91_metric_lineage_log` with `source_type = 'scenario_fallback'`. Partial scenarios are allowed — override only the sections being tested. Exactly one scenario may be the base at any time. Locked scenarios cannot have assumptions/decisions modified.
23. **Inclusion cascade hierarchy** — `include_in_evaluation_flag` cascades through the data flow. Gate sections block S200: S10 (format gate), S30 (market gate), **S60 (demand gate — D14-03, at format × stream × channel × market)**, §S20→S60§ (pricing gate). Contributor sections zero their cost + WARN: S50, S80, S90, S100, S110, S120. Soft-gate sections re-normalize if partially excluded, block if fully excluded: S40 (channels), S20 (streams). Pre-computation validation runs 7 checks before S200 starts.
24. **Evaluation control field definitions — AMENDED v4.5.10 (Audit A-05)** — Every `_inputs` table contains exactly 5 canonical input fields after keys, in canonical order: `evaluation_scope_level` (dropdown: directional/structured/validated/audited — metadata only, no computation impact), `planning_horizon_months` (integer, nullable — limits S200 period range; NULL = global default), `include_in_evaluation_flag` (boolean — per Rule 23 cascade; default true), `manual_review_required_flag` (boolean — UI governance badge, no computation impact; auto-set when scope=directional or confidence<0.5; default true for new rows), `notes` (free text). **Pattern #25 exception (D-CROSS-01, v4.5.9):** Sections with `_research` tables carry a 6th field: `auto_populate_research_flag` (boolean, default true). This is the ONLY permitted addition to `_inputs` tables.** No other additional columns are permitted.

25. **AI Research Layer (Pattern #22) — AMENDED v4.5.9 (D-CROSS-01)** — Every driver section (S10–S90, and future S100–S120 per DI-52) carries a `_research` table at the same grain as the section's `_inputs` table. Research tables capture AI-powered market intelligence: research mode (`manual` / `ai_assisted` / `ai_auto` / `hybrid`), prompt, status, confidence (0–1), summary, source references, field coverage, and staleness tracking. Field-level outcomes stored in `research_outcome_items` (S00). AI-sourced provenance tracked in `91_metric_lineage_log` with `source_type = 'ai_research'`. `09_input_sources_master` gains `ai_research` as a `source_capture_mode` value. **Research tables are the SOURCE PIPELINE for set_items and assumption auto-population (Pattern #25). When `auto_populate_research_flag = true` on the section's `_inputs` table, research completion triggers the population pipeline: outcome items → selection → write to set_items or assumptions → lineage entry. Research prompts MUST request ≥2 independent sources per parameter.**

26. **Research Outcome Landing Model (Pattern #23) — AMENDED v4.5.9 (D-CROSS-01)** — AI research produces field-level suggestions stored in `research_outcome_items` (S00 shared table). Each outcome item targets a specific field on a specific assumption/reference table. Multiple suggestions per field are allowed (e.g., top-down vs bottom-up TAM). All `_research` tables carry a system-generated `research_run_id` (unique across all research tables) for linkage to outcome items. **Research auto-populates set_items tables (Pattern #19 sections) and assumption tables (non-Pattern #19 sections) by default. Population occurs when research completes and `field_confidence ≥ 0.50`. Values with `field_confidence < 0.50` are stored in `research_outcome_items` but NOT auto-populated — the field is left NULL and the nullability guard forces human entry. Research-populated values are protected by `field_source_json` tracking: refresh cycles ONLY overwrite fields sourced as `'research'`; fields manually edited (`'manual'`) are protected. Human override at any layer (set edit, assumption, decision) takes precedence. S300 governance tracks research-source coverage per section.** **Multi-data-point rule:** Every researchable field MUST have ≥2 `research_outcome_items` rows from different `estimation_method` values before auto-population. Single-source fields are flagged `source_diversity = 'single'` and require S300 warning. Selection logic: (a) if ≥3 data points, prefer `triangulated` composite; (b) if 2, prefer highest `field_confidence`; (c) tiebreaker: most recent `data_vintage`. **Multi-data-point resolution:** Each field may have N competing outcome items. Exactly one is marked `is_selected_for_population = true` — this is the value that feeds the model. Others are preserved as alternatives. Selection is automatic (by confidence and method diversity) but can be overridden by human via `selection_override_flag`. When ≥3 data points exist with different estimation methods, a `triangulated` composite row is auto-generated using confidence-weighted averaging for numeric fields. **Triangulation formula:** `composite_value = Σ(value_i × confidence_i) / Σ(confidence_i)`. `diversity_bonus = 1.00 + 0.025 × (sources − 1)`. `field_confidence = MAX(individual confidences) × diversity_bonus`.

27. **Three-Level Wave Cascade (Pattern #24)** — Market expansion follows a hierarchical wave model at three independent levels: **micro** (neighborhoods within a city), **macro** (cities within a region), and **cluster** (regions). Each level runs its own wave sequence (Wave 1, 2, 3...). Wave advancement is **performance-triggered**: a source wave's metrics must meet defined thresholds before the target wave activates. Trigger types: (a) **same-level sequential** — micro Wave 1 performance → micro Wave 2 in same city; (b) **upward aggregate** — micro aggregate in a city → next macro wave (next city); (c) **upward aggregate** — macro aggregate in a region → next cluster wave (next region). Wave membership is format-specific (Cloud Kitchen wave plan ≠ Spoke wave plan). The S200 Finance Stack respects wave timing: a market's revenue computation begins only when its wave is active and its individual launch_date (three-tier cascade) is reached. `market_expansion_waves` is the planning layer; `market_expansion_outputs` is the resolved state consumed by S200.

### Rule 16 — Formal Governance: Multiplicity Placement Criteria

| Data Concern | Where It Belongs | Criteria | Example |
|---|---|---|---|
| **Entity identity** | Base master table (single-key) | One row per entity. No foreign keys to other masters. | `03_products_master`: one row per product |
| **Structural attributes** | Base master table | Attributes that don't vary by context (market, format, scenario). | `default_prep_time_min` on products_master |
| **Many-to-many membership** | Bridge / map table (2-key) | Relationship between two entities. Dated. May carry priority_rank, share_pct. | `05d_format_product_map`: which products are in which formats |
| **Context-dependent parameters** | Driver section assumption table (2–3 keys) | Values that vary by planning context (market, format, scenario). | `product_pricing_assumptions`: price varies by format × market |
| **Resolved denormalized membership** | Layered structure view (2–3 keys max) | Read-only computed views showing resolved relationships. Max 3 independent dimensions per view. | `02d_collection_category_view`: shows categories in each collection |
| **Cross-entity resolved state** | Section output table | Computed results from assumptions + decisions. Same grain as section inputs. | `product_economics_outputs`: resolved price, COGS, margin |

**Escalation test for structure views:**
- 2 independent dimensions → single flat view ✅ (e.g., format × market = 30 rows)
- 3 independent dimensions → single flat view with filter ✅ (e.g., channel × format × market = 150 rows)
- 4+ independent dimensions → MUST SPLIT into layered views ❌ → 🔀 progressive drill-down

---



================================================================================
<!-- MODULE: 01_S00_masters.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.13 -->
<!-- File: 01_S00_masters.md -->
<!-- Description: S00 Masters — 51 tables (bridges, maps, master data) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 78–1376 -->
<!-- Date: 2026-04-12 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S00 — MASTERS
# ═══════════════════════════════════════

## S00-01 `00_table_registry`
Purpose: Central registry for all tables — UI ordering, section grouping, and schema metadata.
Grain: table (one row per table in schema, including this table) | Rows: 151 (146 active + 5 deprecated)
System field exception: carries only `table_registry_id` + `row_status`. No version, scenario, effective_from, effective_to (see exception above).
| Column | Classification | Description |
|---|---|---|
| `table_registry_id` | system | Auto-generated surrogate PK (framework/ORM compatibility) |
| `section_name` | system | Section code. Dropdown: S00 / S10 / §S20→S60§ / S30 / S40 / S20 / S50 / S60 / S80 / S90 / S100 / S110 / S120 / S200 / S300. **Controlled values.** |
| `table_name` | system | Physical table name in the schema. **UNIQUE** — no two rows may share the same value. Natural key. |
| `table_display_name` | system | Human-readable label shown in UI navigation and tooltips |
| `table_display_order` | system | Sort position within the section for UI rendering (ascending). **UNIQUE within section_name.** |
| `table_type` | system | Table category. Dropdown: registry / master / bridge / terms / view / input / assumption / decision / output / output_map / governance |
| `table_description` | system | One-line purpose statement for this table. Used in UI tooltips and API documentation. NOT NULL. |
| `grain_description` | system | Short grain specification (e.g., "format × market × product"). Used for developer docs and validation. NOT NULL. |
| `row_status` | system | Lifecycle state: active / deprecated. Simplified from the full 5-value set — tables are either live or retired. |

Dropdowns:
- `section_name`: S00 / S10 / §S20→S60§ / S30 / S40 / S20 / S50 / S60 / S80 / S90 / S100 / S110 / S120 / S200 / S300
- `table_type`: registry / master / bridge / terms / view / input / assumption / decision / output / output_map / governance
- `row_status` (this table only): active / deprecated

Constraints:
- `table_name` UNIQUE across all rows
- (`section_name`, `table_display_order`) UNIQUE — no two tables in the same section with the same order
- `table_description` NOT NULL
- `grain_description` NOT NULL

v4.3.1 review: +`table_description`, +`grain_description`, +`table_registry_id` explicit. System field exception applied. Dropdowns and constraints formalized.

---

## S00-02 `01_collections_master`
Purpose: Collection-level master for product grouping.
Grain: collection (single-key) | Rows: ~4–8
| Column | Classification | Description |
|---|---|---|
| `collection_id` | master | Auto-generated PK — unique identifier for a product collection |
| `collection_code` | master | Short machine-readable code (e.g., 'PREM', 'EVDY'). **UNIQUE.** Uppercase alphanumeric, max 10 chars. |
| `collection_name` | master | Display name of the collection (e.g., 'Premium Pizzas'). **UNIQUE.** |
| `collection_description` | master | Detailed description of what this collection represents and its positioning. NOT NULL. |
| `sort_order` | master | Display ordering position (ascending). **UNIQUE.** |

Constraints: `collection_code` UNIQUE + uppercase alphanumeric max 10; `collection_name` UNIQUE; `sort_order` UNIQUE; `collection_description` NOT NULL.
Lifecycle: `row_status` on this master controls entity existence. `active_from`/`active_to` on bridge tables (01b, 01c, 05b) control context-specific activation. Archiving a master must close all bridge relationships.
v4.3.1 review: uniqueness constraints formalized, lifecycle interaction documented.

## S00-03 `01b_collection_format_map`
Purpose: Which product collections are available in which formats, and what share of format revenue each collection represents. **LEVEL 1 of the 3-level mix share chain** (collection → category → product). §S20→S60§-02a overrides per scenario. Rule 21 handles NULLs.
Grain: collection × format | Rows: ~12–20
| Column | Classification | Description |
|---|---|---|
| `collection_id` | key | FK to `01_collections_master`. Composite key part 1. |
| `format_id` | key | FK to `05_formats_master`. Composite key part 2. |
| `active_from` | map | Start date when this collection becomes available in this format. Per Rule 20: no overlapping periods for the same (collection, format) pair. |
| `active_to` | map | End date (NULL = open-ended). Must be > active_from when not NULL. |
| `default_collection_share_in_format_pct` | map | **LEVEL 1 of mix share chain.** Default % of this format’s revenue from this collection. Range: 0–100. Structural default — §S20→S60§-02a `planned_collection_share_in_format_pct` overrides per scenario. NULL → Rule 21 equal-split. **Shares must sum to ~100% per format** (±0.5%, WARN + auto-normalize). |
| `priority_rank` | map | Display/processing order within this format. **UNIQUE within format_id.** Lower = higher priority. Rule 20 tiebreaker. |

Constraints: (`collection_id`, `format_id`, `active_from`) temporal exclusivity (Rule 20). FK validation to both masters. `priority_rank` UNIQUE within format. `active_to` > `active_from`. Share range 0–100. Per-format share sum = 100% (±0.5%, WARN).
v4.3.1 review: grain, purpose, share chain level, Rule 20/21 refs, FK constraints, share sum validation formalized.

## S00-04 `01c_collection_category_map`
Purpose: Which categories belong to which collections, and what share of collection revenue each category represents. **LEVEL 2 of the mix share chain.** A category can belong to multiple collections (categories are independent entities). §S20→S60§-02a overrides per scenario.
Grain: collection × category | Rows: ~20–40
| Column | Classification | Description |
|---|---|---|
| `collection_id` | key | FK to `01_collections_master`. Composite key part 1. |
| `category_id` | key | FK to `02_categories_master`. Composite key part 2. |
| `active_from` | map | Start date. Per Rule 20: no overlapping periods for same (collection, category). |
| `active_to` | map | End date (NULL = open-ended). Must be > active_from when not NULL. |
| `default_category_share_in_collection_pct` | map | **LEVEL 2 of mix share chain.** Default % of this collection’s revenue from this category. Range: 0–100. §S20→S60§-02a `planned_category_share_in_collection_pct` overrides per scenario. NULL → Rule 21 equal-split. **Shares must sum to ~100% per collection** (±0.5%, WARN + auto-normalize). |
| `priority_rank` | map | Display order within this collection. **UNIQUE within collection_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within collection. Per-collection share sum = 100%.
v4.3.1 review: grain, purpose, share chain level, Rule 20/21 refs, constraints formalized.

---

## S00-05 `02_categories_master`
Purpose: Category-level product grouping entity. Independent of collections — membership managed via `01c_collection_category_map`. A category may belong to one or more collections.
Grain: category (single-key) | Rows: ~8–15
| Column | Classification | Description |
|---|---|---|
| `category_id` | master | Auto-generated PK — unique identifier for a product category |
| `category_code` | master | Short machine-readable code (e.g., 'GOURM', 'CLSC'). **UNIQUE.** Uppercase alphanumeric, max 10 chars. |
| `category_name` | master | Display name of the category (e.g., 'Gourmet Pizzas'). **UNIQUE.** |
| `category_description` | master | Detailed description of the category and its positioning. **NOT NULL.** |
| `sort_order` | master | Global default display position (ascending). **UNIQUE.** Context-specific ordering handled by `priority_rank` on bridge tables (01c, 02b). |

Constraints: `category_code` UNIQUE + uppercase alphanumeric max 10; `category_name` UNIQUE; `sort_order` UNIQUE; `category_description` NOT NULL.
Sort order interaction: `sort_order` here = global default (flat lists, search, admin). `priority_rank` on bridges (01c, 02b) = position within a specific collection or format context. UI uses bridge rank in context, master sort standalone.
Lifecycle: archiving this master must close all bridge rows (01c, 02b, 02c, 05c) referencing this category_id.
v5 candidate (deferred): `parent_category_id` for hierarchical sub-categories. Not needed at current catalog scale.
v4.3.1 review: purpose corrected (independent entity, not "within collections"), uniqueness constraints formalized, sort-order interaction documented.

## S00-06 `02b_category_format_map`
Purpose: Navigation convenience — which categories are available in which formats. **No share field** (removed v4.3 — derivable from `01b.collection_share × 01c.category_share`). The relationship itself is also derivable from 01c JOIN 01b, but this bridge avoids the 3-table join for direct category→format lookup. **Not used in computation.** Pure UI/API convenience.
Grain: category × format | Rows: ~25–50
| Column | Classification | Description |
|---|---|---|
| `category_id` | key | FK to `02_categories_master`. Composite key part 1. |
| `format_id` | key | FK to `05_formats_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity applies. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
v4.3: removed `default_category_share_in_format_pct` — derivable from 01b × 01c.
v4.3.1 review: purpose clarified (navigation only, not computation), constraints formalized.

## S00-07 `02c_category_product_map`
Purpose: Which products belong to which categories, and what share of category revenue each product represents. **LEVEL 3 (terminal) of the mix share chain.** Below this is individual product economics (§S20→S60§-04). §S20→S60§-02d overrides per scenario (if table exists; currently optional per Risk 6).
Grain: category × product | Rows: ~40–100
| Column | Classification | Description |
|---|---|---|
| `category_id` | key | FK to `02_categories_master`. Composite key part 1. |
| `product_id` | key | FK to `03_products_master`. Composite key part 2. Should reference `sellable_flag = true` products for revenue planning. Non-sellable products may exist for catalog completeness but must have share = NULL or 0. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity applies. |
| `active_to` | map | End date (NULL = open-ended). |
| `default_product_share_in_category_pct` | map | **LEVEL 3 (terminal) of mix share chain.** Default % of this category’s revenue from this product. Range: 0–100. §S20→S60§-02d overrides per scenario (optional table). NULL → Rule 21 equal-split among active sellable products. **Shares must sum to ~100% per category** (±0.5%, WARN + auto-normalize). |
| `priority_rank` | map | Display order within this category. **UNIQUE within category_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within category. Per-category share sum = 100%. Non-sellable products must have share = NULL or 0.

Complete mix share chain:
```
LEVEL 1: 01b collection_share_in_format (override: §S20→S60§-02a)
LEVEL 2: 01c category_share_in_collection (override: §S20→S60§-02a)
LEVEL 3: 02c product_share_in_category (override: §S20→S60§-02d if exists)
DERIVED: category_in_format = Σ(01b.share × 01c.share) across collections
DERIVED: product_in_format = category_in_format × 02c.share
CONSUMED BY: §S20→S60§-04, S60 (blended AOV), S200 (revenue)
```
v4.3.1 review: terminal share level documented, sellable_flag interaction, Rule 20/21 refs, full chain documented.

## S00-08 `02d_collection_category_view`
Purpose: layered view — categories within each collection (collection zoom level).
Grain: collection × category | Max rows: ~20 | UI: top-level collection page.
| Column | Classification | Description |
|---|---|---|
| `collection_id` | key | FK/PK — unique identifier for a product collection (e.g., Premium, Everyday) |
| `collection_name` | output | Display name of the collection (e.g., 'Premium Pizzas') |
| `category_id` | output | FK/PK — unique identifier for a product category within a collection (e.g., Gourmet, Classic) |
| `category_name` | output | Display name of the category (e.g., 'Gourmet Pizzas') |
| `default_category_share_in_collection_pct` | output | Default % of collection revenue attributed to this category (structural default, overridable by §S20→S60§-02a) |
| `product_count` | output | Computed count of active products in this grouping |
| `active_format_count` | output | Computed count of formats where this grouping is active |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

v4.2: replaces `02d_collection_structure_output`. Drill into category → `02e_category_product_view`.

## S00-08b `02e_category_product_view`
Purpose: Layered view — products within a category, scoped to collection context (category zoom level). Drill-down from 02d.
Grain: collection × category × product | Max rows: ~6 per category | UI: drill-down from 02d.
| Column | Classification | Description |
|---|---|---|
| `collection_id` | context | FK to `01_collections_master`. Collection context for this drill-down. |
| `category_id` | key | FK to `02_categories_master`. The category being viewed. |
| `category_name` | output | Display name of the category. |
| `product_id` | output | FK to `03_products_master`. |
| `product_name` | output | Display name of the product. |
| `dietary_type` | output | From `03_products_master`. veg / non_veg / egg / vegan. Enables menu composition analysis. |
| `default_product_share_in_category_pct` | output | Level 3 mix share from `02c`. Overridable by §S20→S60§-02d. |
| `variant_count` | output | Computed count of variant options (both category-scope and product-scope). |
| `sellable_flag` | output | From `03_products_master`. Non-sellable = internal component. |
| `active_from` | output | From `02c` bridge. |
| `active_to` | output | From `02c` bridge. |

Drill into product → `03c_product_variant_view` for variants, `03d_product_availability_view` for format×market availability.
v4.3.1 review: +`dietary_type` (DI-05). FK descriptions updated.

---

## S00-09 `03_products_master`
Purpose: Conceptual product identity — no price, no COGS, no share. Price → §S20→S60§-02b, COGS → §S20→S60§-02c, share → §S20→S60§-02a/02c.
Grain: product (single-key) | Rows: ~20–50
| Column | Classification | Description |
|---|---|---|
| `product_id` | master | Auto-generated PK — unique identifier for a conceptual product |
| `product_code` | master | Short machine-readable code (e.g., 'MARG-001'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `product_name` | master | Display name of the product (e.g., 'Margherita'). **UNIQUE.** |
| `product_description` | master | Detailed description including key ingredients and positioning. **NOT NULL.** |
| `default_prep_time_min` | master | Standard preparation time in minutes (base, before variant deltas from `04_variants_master.prep_time_delta_min`). **Computation source** — feeds S80 capacity as weighted-average prep time across product mix. Must be > 0. |
| `shelf_life_days` | master | Maximum days product remains sellable after preparation (decimal, e.g., 0.5 = 12 hours). **Computation source** — feeds S80 wastage computation: shorter shelf life → higher wastage %. Must be > 0. |
| `ingredient_count` | master | Number of distinct ingredients/components in this product. **Computation input** for complexity_score. Must be ≥ 1. |
| `skill_level_required` | master | Minimum skill band needed to prepare this product. Dropdown: entry / skilled / senior / specialist. **Computation input** for complexity_score. |
| `dietary_type` | master | Dietary classification. Dropdown: veg / non_veg / egg / vegan. Standard Indian food delivery categorization (green dot / red dot / brown dot). |
| `complexity_score` | derived | Computed score (0–10) indicating production complexity. **Formula:** weighted function of `default_prep_time_min` (×0.4 weight), `ingredient_count` (×0.35 weight), `skill_level_required` (×0.25 weight). Normalized to 0–10 scale. Auto-recomputed when inputs change. Consumed by S10 format_outputs.operational_feasibility_rollup and S80 capacity analysis. |
| `sellable_flag` | master | Whether this product is sold to customers (true) or is internal/component only (false). **Downstream enforcement:** only `sellable_flag = true` products may have §S20→S60§ pricing or flow into S200 revenue (see V8/V9). |
| `sort_order` | master | Global default display position (ascending). **UNIQUE.** Context-specific ordering via `priority_rank` on bridge tables (02c, 05d). |

Dropdowns:
- `skill_level_required`: entry / skilled / senior / specialist
- `dietary_type`: veg / non_veg / egg / vegan

Constraints:
- `product_code` UNIQUE, alphanumeric + hyphen, max 15 chars
- `product_name` UNIQUE
- `sort_order` UNIQUE
- `product_description` NOT NULL
- `default_prep_time_min` > 0
- `shelf_life_days` > 0
- `ingredient_count` ≥ 1
- `complexity_score` range 0–10, auto-computed (read-only)
- §S20→S60§ pricing/decisions may only reference products where `sellable_flag = true` (V8)
- S200 revenue must filter to `sellable_flag = true` only (V9)
- Archiving this master must close all bridge rows (02c, 05d, 05e, 07e) and §S20→S60§ rows (V10)

Complexity score computation:
```
normalized_prep = MIN(default_prep_time_min / 20.0, 1.0) × 10
normalized_ingredients = MIN(ingredient_count / 15.0, 1.0) × 10
normalized_skill = CASE skill_level_required
  WHEN 'entry' THEN 2.5  WHEN 'skilled' THEN 5.0
  WHEN 'senior' THEN 7.5  WHEN 'specialist' THEN 10.0
complexity_score = ROUND(normalized_prep × 0.40 + normalized_ingredients × 0.35 + normalized_skill × 0.25, 1)
```

S80 interaction (applied when S80 is reviewed):
- `default_prep_time_min` → S80 `prep_minutes_per_order` becomes derived: weighted avg of product prep times × product mix shares. S80 field becomes NULL-override (non-NULL = override, NULL = derive from products).
- `shelf_life_days` → S80 `wastage_pct` computation input: shorter shelf life = higher wastage. Formula defined in S80 computation spec.

v4.3.1 review: +`ingredient_count`, +`skill_level_required`, +`dietary_type`. `shelf_life_hours` → `shelf_life_days`. `complexity_score` reclassified master → derived with formula. `default_prep_time_min` promoted from reference to computation source. Sellable-flag enforcement added. Uniqueness constraints formalized.

## S00-10 `03b_product_hierarchy_view`
Purpose: Layered view — where each product sits in the catalog hierarchy (product zoom level). Shows collection and category membership.
Grain: product × collection × category | Max rows: ~100 | UI: product detail page, hierarchy tab.
| Column | Classification | Description |
|---|---|---|
| `product_id` | key | FK to `03_products_master`. The product being viewed. |
| `product_code` | output | From `03_products_master`. |
| `product_name` | output | From `03_products_master`. |
| `dietary_type` | output | From `03_products_master`. veg / non_veg / egg / vegan. |
| `complexity_score` | output | From `03_products_master`. Derived 0–10. |
| `collection_id` | output | FK to `01_collections_master`. |
| `collection_name` | output | From `01_collections_master`. |
| `category_id` | output | FK to `02_categories_master`. |
| `category_name` | output | From `02_categories_master`. |
| `active_from` | output | From bridge relationships. |
| `active_to` | output | From bridge relationships. |

v4.2: replaces `03b_product_structure_output`. One of 4 product-family views.
v4.3.1 review: +`dietary_type`, +`complexity_score`. FK descriptions updated.

## S00-10b `03c_product_variant_view`
Purpose: Layered view — all variant options available for a product, resolving BOTH inherited category-scope AND direct product-scope variants. Dual-scope resolution per `04_variants_master` architecture.
Grain: product × variant (merged from both scopes) | Max rows: ~6–10 per product | UI: product detail page, variants tab.
| Column | Classification | Description |
|---|---|---|
| `product_id` | key | FK to `03_products_master`. The product being viewed. |
| `product_name` | output | From `03_products_master`. |
| `variant_scope` | output | Where this variant was defined: category (inherited) or product (direct). From `04_variants_master.variant_scope`. |
| `source_category_id` | output | FK to `02_categories_master`. Non-NULL when scope=category (shows inheritance source). NULL when scope=product. |
| `variant_id` | output | FK to `04_variants_master`. |
| `variant_dimension_name` | output | The dimension (e.g., 'size', 'crust_type'). |
| `variant_option_name` | output | The specific option (e.g., 'Large', 'Thin Crust'). |
| `price_delta_inr` | output | Price adjustment in ₹. |
| `cogs_delta_inr` | output | COGS adjustment in ₹. |
| `default_option_flag` | output | Resolved per three-tier rule (flag → lowest sort_order → delta=0). |
| `is_overridden_flag` | output | true if a product-scope variant overrides a category-scope variant for this dimension+option. Shows where product deviates from category default. |

Dual-scope resolution logic:
```
1. Collect product-scope variants WHERE product_id = P
2. Collect category-scope variants WHERE category_id IN (categories containing P)
3. If same dimension+option at both scopes → product-scope OVERRIDES (is_overridden_flag = true)
4. Merged set = product-specific + inherited category (minus overridden)
```

v4.3.1 review: REWRITTEN for dual-scope variant resolution (DI-06). +`variant_scope`, +`source_category_id`, +`is_overridden_flag`. Resolution logic documented.

## S00-10c `03d_product_availability_view`
Purpose: layered view — where a product is available by format and market (product zoom level).
Grain: product × format × market | Max rows: ~30 per product | UI: product detail page, availability tab. Filter by format or market.
| Column | Classification | Description |
|---|---|---|
| `product_id` | key | FK/PK — unique identifier for a conceptual product (e.g., Margherita, Pepperoni) |
| `product_name` | output | Display name of the product |
| `format_id` | output | FK/PK — unique identifier for a business format (e.g., Cloud Kitchen, Spoke, Central Kitchen) |
| `format_name` | output | Display name of the format (e.g., 'Cloud Kitchen') |
| `market_id` | output | FK/PK — unique identifier for a geographic market (e.g., Mumbai, Bangalore, Pune) |
| `market_name` | output | Display name of the market |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

## S00-10d `03e_product_stream_view`
Purpose: layered view — which revenue streams sell this product (product zoom level).
Grain: product × revenue_stream | Max rows: ~3 per product | UI: product detail page, streams tab.
| Column | Classification | Description |
|---|---|---|
| `product_id` | key | FK/PK — unique identifier for a conceptual product (e.g., Margherita, Pepperoni) |
| `product_name` | output | Display name of the product |
| `revenue_stream_id` | output | FK/PK — unique identifier for a monetization stream (e.g., Product Sales, Catering, Subscription) |
| `revenue_stream_name` | output | Display name of the revenue stream |
| `revenue_stream_type` | output | Stream category: product_sales / product_sales_with_service / service_fee / subscription / catering / franchise / licensing / advertising / other |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

---

## S00-11 `04_variants_master`
Purpose: Variant options that modify price, COGS, prep, and capacity. Variants can apply at **category scope** (all products in a category inherit the variant) or **product scope** (one specific product only).
Grain: (category|product) × variant_dimension × variant_option | Rows: ~30–80
| Column | Classification | Description |
|---|---|---|
| `variant_id` | master | Auto-generated PK — unique identifier for a variant option |
| `variant_scope` | master | Scope of application. **Dropdown:** category / product. Determines which FK is required. |
| `category_id` | key | FK to `02_categories_master`. **Required when scope = category, NULL when scope = product.** When set, variant applies to ALL products in this category. |
| `product_id` | key | FK to `03_products_master`. **Required when scope = product, NULL when scope = category.** When set, variant applies to this specific product only. |
| `variant_dimension_name` | master | The dimension this variant modifies (e.g., 'size', 'crust_type', 'topping_addon'). **Extensible managed field** — UI presents existing values as autocomplete suggestions, accepts new entries. Case-insensitive matching prevents duplicates. Suggested seed values: size / crust_type / topping_addon / sauce / base. |
| `variant_option_name` | master | The specific option within the dimension (e.g., 'Large', 'Thin Crust', 'Extra Cheese'). **UNIQUE within (scope entity, variant_dimension_name).** |
| `price_delta_inr` | master | Price adjustment in ₹ when selected (positive = surcharge, negative = discount). Context-independent base delta — §S20→S60§ handles market-specific pricing. Default: 0. |
| `cogs_delta_inr` | master | COGS adjustment in ₹ when selected. Context-independent base delta. Default: 0. |
| `prep_time_delta_min` | master | Additional prep time in minutes. **Computation source** — added to `03_products_master.default_prep_time_min` for S80 weighted-average prep. Default: 0. |
| `capacity_time_delta_min` | master | Additional capacity/resource time in minutes. Feeds S80 capacity utilization when variant mix is modelled. Default: 0. |
| `default_option_flag` | master | Whether this is the default selection in its dimension. **Exactly one true per (scope entity, variant_dimension_name).** Three-tier resolution: (1) flag = true → use this variant’s delta; (2) no flag set → WARN + use lowest sort_order as implicit default; (3) zero options in dimension → delta = 0. |
| `sort_order` | master | Display position within the dimension (ascending). **UNIQUE within (scope entity, variant_dimension_name).** Also serves as implicit default tiebreaker when no default_option_flag is set. |

Dropdowns:
- `variant_scope`: category / product
- `variant_dimension_name`: extensible managed field. Seed values: size / crust_type / topping_addon / sauce / base. UI allows new entries via autocomplete.

Constraints:
- Exactly one of (`category_id`, `product_id`) must be non-NULL, determined by `variant_scope`
- (`category_id`, `variant_dimension_name`, `variant_option_name`) UNIQUE when scope = category
- (`product_id`, `variant_dimension_name`, `variant_option_name`) UNIQUE when scope = product
- Exactly ONE `default_option_flag = true` per (scope entity, `variant_dimension_name`). If zero → WARN + lowest sort_order used as implicit default.
- `sort_order` UNIQUE within (scope entity, `variant_dimension_name`)
- `product_id` FK to `03_products_master` (when non-NULL)
- `category_id` FK to `02_categories_master` (when non-NULL)
- All delta fields default to 0 if not specified
- `05e_format_variant_map` controls format availability — variant not mapped to a format must not be applied in computation for that format

Scope resolution for computation:
```
For product P in category C:
  1. Collect all product-scope variants WHERE product_id = P
  2. Collect all category-scope variants WHERE category_id = C
  3. If same dimension+option exists at both scopes, product-scope OVERRIDES category-scope
  4. Merged set = product-specific + inherited category (minus overridden)
  5. For each dimension in merged set: apply default variant delta (per three-tier rule above)
```

Default resolution (three-tier):
```
For a given (scope entity, variant_dimension_name):
  TIER 1: row with default_option_flag = true → use its delta values
  TIER 2: no flag set → WARN + use row with lowest sort_order as implicit default
  TIER 3: zero variant options in this dimension → delta = 0 (unmodified base product)
```

Dimension name management:
- `variant_dimension_name` is an extensible managed field, NOT a closed enum
- UI presents existing values via autocomplete; new entries accepted on save
- Case-insensitive deduplication: 'Size' and 'size' resolve to same dimension
- No separate lookup table needed — the distinct values in this column ARE the managed list

v4.3.1 review: +`variant_scope`, +`category_id`. `product_id` now nullable (scope-dependent). Category-scope variants eliminate duplication. Three-tier default resolution formalized. `variant_dimension_name` changed from closed dropdown to extensible managed field. Computation source promotion for `prep_time_delta_min`. Product-scope overrides category-scope when both exist for same dimension+option.

---

## S00-12 `05_formats_master`
Purpose: Business format identity — the operational model definition. A format’s structure (kitchen type, capacity profile, staffing model) is NOT a dropdown attribute — it is DEFINED by its infrastructure chain: which capacity resources (05f), CapEx assets (05g), roles (05h), and OpEx items (05i) are mapped to it. The master holds identity + launch defaults only.
Grain: format (single-key) | Rows: ~3–6
| Column | Classification | Description |
|---|---|---|
| `format_id` | master | Auto-generated PK — unique identifier for a business format |
| `format_code` | master | Short machine-readable code (e.g., 'CK', 'SPK', 'CTK'). **UNIQUE.** Uppercase alphanumeric, max 10 chars. |
| `format_name` | master | Display name (e.g., 'Cloud Kitchen'). **UNIQUE.** |
| `format_description` | master | Detailed description of the operational model and positioning. **NOT NULL.** |
| `default_launch_wave` | master | Default wave for phased rollout. **Dropdown:** wave_1 / wave_2 / wave_3 / pilot / not_planned. Overridable in S10 decisions. |
| `default_readiness_status` | master | Default readiness when created. **Dropdown:** concept / evaluating / approved / ready / launched / paused / retired. |
| `sort_order` | master | Display position (ascending). **UNIQUE.** |

Dropdowns:
- `default_launch_wave`: wave_1 / wave_2 / wave_3 / pilot / not_planned
- `default_readiness_status`: concept / evaluating / approved / ready / launched / paused / retired

Constraints: `format_code` UNIQUE, `format_name` UNIQUE, `sort_order` UNIQUE, `format_description` NOT NULL.
Lifecycle cascade: archiving this format must close all 8 format bridges (05b–05i) + all S10–S120 driver rows referencing this format_id.

Format structure = infrastructure chain (NOT a type dropdown):
- 05f_format_capacity_unit_map → what equipment/resources this format uses
- 05g_format_capacity_asset_map → what capital assets it requires
- 05h_format_role_map → what staff roles it needs
- 05i_format_opex_line_item_map → what recurring expenses it incurs
You know it’s a cloud kitchen because of its resource/asset/role/expense profile, not because of a label. The bridges ARE the definition.

v4.3.1 review: format_type column NOT added (structure derived from capacity chain per user directive). Dropdowns, constraints, lifecycle cascade formalized.

## S00-13 `05b_format_collection_map`
Purpose: Which collections this format carries. Reverse navigation of 01b (which holds the share). Membership only — no share field here. Share of each collection in the format is on 01b (Level 1 of mix chain).
Grain: format × collection | Rows: ~12–20
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `collection_id` | key | FK to `01_collections_master`. Composite key part 2. |
| `active_from` | map | Start date. Per Rule 20: no overlapping periods for same key pair. |
| `active_to` | map | End date (NULL = open-ended). Must be > active_from when not NULL. |
| `priority_rank` | map | Display order within this format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
Bidirectional with 01b: 01b = collection→format (with share). 05b = format→collection (membership).
v4.3.1 review: purpose, grain, FK refs, Rule 20, constraints formalized.

## S00-14 `05c_format_category_map`
Purpose: Which categories this format offers. Reverse navigation of 02b. No share — category share in format is derived from 01b × 01c.
Grain: format × category | Rows: ~25–50
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `category_id` | key | FK to `02_categories_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
v4.3.1 review: purpose, grain, FK refs, constraints formalized.

## S00-15 `05d_format_product_map`
Purpose: Which products this format sells. **§S20→S60§/S200 GATEKEEPER** — if a product is NOT mapped here for a format, it MUST NOT appear in §S20→S60§ pricing or S200 revenue for that format. Only `sellable_flag = true` products should appear for revenue-bearing formats.
Grain: format × product | Rows: ~60–150
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `product_id` | key | FK to `03_products_master`. Composite key part 2. Should reference `sellable_flag = true` products. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
Gatekeeper validation: §S20→S60§-02b `product_pricing_assumptions` may only reference (format_id, product_id) combinations that exist here with active status. Same for §S20→S60§-03 decisions.
v4.3.1 review: §S20→S60§/S200 gatekeeper role documented, sellable_flag interaction, constraints formalized.

## S00-16 `05e_format_variant_map`
Purpose: Which variant options are available in this format. A variant not mapped here must not be applied in §S20→S60§ computation for this format. Maps individual variant_ids regardless of variant scope (category or product).
Grain: format × variant | Rows: ~50–120
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `variant_id` | key | FK to `04_variants_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
Variant scope interaction: category-scope variants (variant_scope = 'category') apply to all products in that category BUT only in formats where the variant_id appears here. A format may carry the category but exclude specific variant options. Example: Cloud Kitchen has "Size: Large" mapped. Spoke Kitchen does NOT — too small. Both carry "Gourmet Pizzas" category.
v4.3.1 review: variant scope interaction documented, constraints formalized.

## S00-17 `05f_format_capacity_unit_map`
Purpose: Which capacity units this format requires. **FORMAT DEFINITION BRIDGE** — the units mapped here ARE the format’s operational identity. A format is defined by its infrastructure chain, not by a type label (Phase 2 directive). Cloud Kitchen = {Dark Kitchen + City Commissary}. Dine-In = {Restaurant + City Commissary + City Office}.
Grain: format × capacity_unit | Rows: ~10–20
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `capacity_unit_id` | key | FK to `10_capacity_units_master`. Composite key part 2. The units mapped here define what kind of format this is. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Infrastructure chain order (lower = primary unit). **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
Format identity: this bridge + `10b_capacity_unit_asset_map` together define the full infrastructure chain. The units here determine capacity model, cost structure, and scaling pattern.
v4.3.1 review: format-definition role prominently documented, stale description fixed (was 'capacity resource'), constraints formalized.

## S00-18 `05g_format_capacity_asset_map`
Purpose: Direct format→asset links for assets NOT housed in any specific capacity unit. Unit-specific assets are accessed via the 05f→10b chain. This bridge handles format-level assets that are unit-independent.
Grain: format × capacity_asset | Rows: ~5–15
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `capacity_asset_id` | key | FK to `11_capacity_assets_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
Two paths to format-level assets:
```
PATH 1 (unit-specific): format → 05f → capacity_unit → 10b → capacity_asset
  Example: Pizza Oven belongs to Dark Kitchen unit. Accessed through the unit.
PATH 2 (format-direct): format → 05g → capacity_asset
  Example: Brand Signage, Fleet GPS — format-level CapEx not tied to any unit.
Rule: unit-housed assets via PATH 1. Unit-independent assets via PATH 2.
  An asset should NOT appear in BOTH paths for the same format.
```
v4.3.1 review: two-path delineation documented, constraints formalized.

## S00-19 `05h_format_role_map`
Purpose: Which staffing roles this format requires. Defines the team structure. Consumed by S90 manpower strategy and `05m_format_roles_view`.
Grain: format × role | Rows: ~20–40
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `role_id` | key | FK to `12_roles_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
v4.3.1 review: purpose, grain, FK refs, constraints formalized.

## S00-20 `05i_format_opex_line_item_map`
Purpose: Which operating expense items this format incurs. Defines the cost structure. Consumed by S100 OpEx strategy and `05n_format_opex_view`.
Grain: format × opex_line_item | Rows: ~30–60
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `opex_line_item_id` | key | FK to `13_opex_line_items_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within format. **UNIQUE within format_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within format.
v4.3.1 review: purpose, grain, FK refs, constraints formalized.

## S00-20b `05j_format_market_map`
Purpose: Structural geographic intent — which markets each format targets. **GATEKEEPER for ALL format × market downstream tables** (S10 format_assumptions, S30 all tables, S40–S110 all format×market tables, S200 revenue computation). Completes the Phase 5 bridge pattern (identical to 05d/05f/05h/05i). Before Phase 8, Format → Market had no S00 bridge — only the S10 output map (format_output_market_map) existed, which is the RESOLVED subset, not the structural control.
Grain: format × market | Rows: ~15–30
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK to `07_markets_master`. Composite key part 2. |
| `active_from` | map | Start date. Per Rule 20: no overlapping periods for same (format_id, market_id). |
| `active_to` | map | End date (NULL = open-ended). Must be > active_from when not NULL. |
| `priority_rank` | map | Processing/display order within format. **UNIQUE within format_id.** Lower = higher priority. Rule 20 tiebreaker. NOT NULL. |

Constraints: UNIQUE(format_id, market_id, scenario, effective_from) — Rule 20 temporal exclusivity. FK validation to both masters. `priority_rank` NOT NULL, UNIQUE within format_id.

Gatekeeper scope: Any format × market pair appearing downstream in S10 format_assumptions, S30 (all tables), S40–S110 (format×market tables), or S200 revenue computation MUST exist on this bridge with active status. S10-06 format_output_market_map is the RESOLVED subset of this table after S10/S30 evaluation.

Bridge gap filled (Phase 8):
```
Before: Format → Market had no S00 bridge (only S10 output map — resolved, not structural)
After:  05j provides structural control, S10-06 is the RESOLVED subset
```
Phase 8 addition: Lock ID PHASE8-T0J-LOCK. v4.3.2.

---

## S00-21 `05o_format_menu_view`
Purpose: layered view — what this format sells (format zoom level, menu tab).
Grain: format × collection × category | Max rows: ~20 per format | UI: format detail page, menu tab. Drill into category for products.
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK/PK — unique identifier for a business format (e.g., Cloud Kitchen, Spoke, Central Kitchen) |
| `format_code` | output | Short machine-readable format code (e.g., 'CK', 'SPK', 'CTK') |
| `format_name` | output | Display name of the format (e.g., 'Cloud Kitchen') |
| `collection_id` | output | FK/PK — unique identifier for a product collection (e.g., Premium, Everyday) |
| `collection_name` | output | Display name of the collection (e.g., 'Premium Pizzas') |
| `category_id` | output | FK/PK — unique identifier for a product category within a collection (e.g., Gourmet, Classic) |
| `category_name` | output | Display name of the category (e.g., 'Gourmet Pizzas') |
| `product_count` | output | Computed count of active products in this grouping |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

v4.2: replaces `05j_format_structure_output` (renamed to 05o in v4.3.2 — 05j reassigned to format_market_map bridge). Product catalog and operational setup are now separate view families.

## S00-21b `05k_format_capacity_unit_view`
Purpose: Layered view — what capacity units this format requires (format zoom level, capacity tab). **This view IS the format operational definition** — the units shown here determine what kind of format it is (Phase 2 directive).
Grain: format × capacity_unit | Max rows: ~5 per format | UI: format detail page, capacity tab.
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. |
| `format_name` | output | From `05_formats_master`. |
| `capacity_unit_id` | output | FK to `10_capacity_units_master`. |
| `unit_name` | output | From `10_capacity_units_master` (e.g., 'Dark Kitchen', 'City Commissary'). |
| `unit_type` | output | production / commissary / storage / office / logistics_hub / retail_front / other. |
| `market_scope_level` | output | micro / macro / cluster / national. Determines cost allocation and scaling. |
| `dedicated_vs_shared` | output | dedicated / shared. |
| `estimated_daily_capacity` | derived | Computed from product→asset→unit chain: bottleneck asset’s capacity given current product mix. NULL if asset setup incomplete. Not stored on master — always computed. |
| `asset_count` | output | Count of distinct assets in this unit (from `10b_capacity_unit_asset_map`). |
| `active_from` | output | From `05f` bridge. |
| `active_to` | output | From `05f` bridge. |

v4.3.1 review: COMPLETE REWRITE. Old resource columns replaced with capacity unit columns (unit_type, market_scope_level, dedicated_vs_shared, asset_count). Format definition role documented.

## S00-21c `05l_format_capacity_asset_view`
Purpose: Layered view — what capacity assets this format needs (format zoom level, assets tab). Shows BOTH unit-housed assets (via 05f→10b) AND format-direct assets (via 05g), with throughput and cost data.
Grain: format × capacity_asset | Max rows: ~15 per format | UI: format detail page, assets tab.
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK to `05_formats_master`. |
| `format_name` | output | From `05_formats_master`. |
| `capacity_asset_id` | output | FK to `11_capacity_assets_master`. |
| `asset_name` | output | From `11_capacity_assets_master`. |
| `asset_category` | output | kitchen_equipment / site_development / furniture / technology / etc. |
| `source_path` | output | How this asset relates to the format: 'unit' (via 05f→10b chain) or 'direct' (via 05g). Per Phase 5 two-path delineation. |
| `capacity_unit_name` | output | Which unit this asset belongs to. NULL when source_path='direct'. From `10_capacity_units_master`. |
| `is_throughput_asset_flag` | output | From `11_capacity_assets_master`. Whether asset has production throughput. |

| `default_unit_cost_inr` | output | From `11_capacity_assets_master`. Reference purchase cost. |
| `useful_life_months` | output | From `11_capacity_assets_master`. |
| `active_from` | output | From bridge (05f→10b or 05g). |
| `active_to` | output | From bridge. |

v4.3.1 review: MAJOR UPDATE. +`source_path` (unit vs direct), +`capacity_unit_name`, +`is_throughput_asset_flag`, +`standard_throughput_per_hour`, +`default_unit_cost_inr`. Two-path asset access documented.

## S00-21d `05m_format_roles_view`
Purpose: layered view — what roles this format requires (format zoom level, team tab).
Grain: format × role | Max rows: ~8 per format | UI: format detail page, team tab.
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK/PK — unique identifier for a business format (e.g., Cloud Kitchen, Spoke, Central Kitchen) |
| `format_name` | output | Display name of the format (e.g., 'Cloud Kitchen') |
| `role_id` | output | FK/PK — unique identifier for a staffing role (e.g., Pizza Chef, Delivery Rider) |
| `role_name` | output | Display name of the role |
| `function_name` | output | Functional department (e.g., kitchen, delivery, support, management) |
| `skill_band` | output | Skill tier: entry / skilled / senior / specialist / management |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

## S00-21e `05n_format_opex_view`
Purpose: layered view — what expense line items this format has (format zoom level, expenses tab).
Grain: format × opex_line_item | Max rows: ~15 per format | UI: format detail page, expenses tab.
| Column | Classification | Description |
|---|---|---|
| `format_id` | key | FK/PK — unique identifier for a business format (e.g., Cloud Kitchen, Spoke, Central Kitchen) |
| `format_name` | output | Display name of the format (e.g., 'Cloud Kitchen') |
| `opex_line_item_id` | output | FK/PK — unique identifier for an operating expense line item |
| `expense_name` | output | Display name of the expense item (e.g., 'Kitchen Rent', 'Electricity') |
| `expense_category` | output | Expense grouping (e.g., rent, utilities, technology, insurance, marketing) |
| `cost_behavior` | output | How cost varies with volume: fixed / variable / semi_variable |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

---

## S00-22 `08_channels_master`
Purpose: Sales and distribution channel identity — the route through which customers discover, order, and receive products. Independent of revenue streams (a channel may serve multiple streams, a stream may flow through multiple channels — managed via `06b_revenue_stream_channel_map`).
Grain: channel (single-key) | Rows: ~5–8
| Column | Classification | Description |
|---|---|---|
| `channel_id` | master | Auto-generated PK — unique identifier for a sales/distribution channel |
| `channel_code` | master | Short machine-readable code (e.g., 'SWIG', 'OWNAPP', 'B2B'). **UNIQUE.** Uppercase alphanumeric, max 10 chars. |
| `channel_name` | master | Display name (e.g., 'Swiggy'). **UNIQUE.** |
| `channel_description` | master | How this channel operates and its role in the distribution strategy. **NOT NULL.** |
| `channel_type` | master | Channel category. **Dropdown:** aggregator / owned_digital / offline / dine_in / b2b / partner / other. Drives commission model expectations and S40 assumptions. |
| `owned_vs_external` | master | Ownership model. **Dropdown:** owned / third_party / hybrid. Affects control over pricing, data access, and customer relationship. |
| `primary_interface_type` | master | Primary customer interaction method. **Dropdown:** app / web / phone / whatsapp / pos / api / contract / none. Additional interfaces tracked in `08d_channel_interface_map`. |
| `sort_order` | master | Display position (ascending). **UNIQUE.** |

Dropdowns:
- `channel_type`: aggregator / owned_digital / offline / dine_in / b2b / partner / other
- `owned_vs_external`: owned / third_party / hybrid
- `primary_interface_type`: app / web / phone / whatsapp / pos / api / contract / none

Constraints: `channel_code` UNIQUE, `channel_name` UNIQUE, `sort_order` UNIQUE, `channel_description` NOT NULL.
Lifecycle cascade: archiving must close `08b_channel_terms`, `06b_revenue_stream_channel_map`, S40 and S50 driver rows.

v4.3.1 review: renamed `default_customer_interface_type` → `primary_interface_type`. Multi-interface support via new `08d_channel_interface_map` bridge (Rule 4). Purpose corrected. Constraints formalized.

## S00-22b `08d_channel_interface_map`
Purpose: Multi-select mapping of customer interaction interfaces to channels. A channel may support multiple interfaces simultaneously (e.g., Swiggy = app + web; Own Digital = app + web + whatsapp + phone). Per Rule 4: multi-select = bridge table.
Grain: channel × interface_type | Rows: ~15–25
| Column | Classification | Description |
|---|---|---|
| `channel_id` | key | FK to `08_channels_master`. |
| `interface_type` | key | Customer interaction type. **Dropdown:** app / web / phone / whatsapp / pos / api / contract / email / none. |
| `is_primary_flag` | map | Whether this is the primary interface (must match `08_channels_master.primary_interface_type`). |
| `sort_order` | map | Display ordering of interfaces for this channel. |

Constraints: (`channel_id`, `interface_type`) UNIQUE. Exactly one `is_primary_flag = true` per channel.
v4.3.1: new table. Replaces single-value `default_customer_interface_type` to support multi-interface channels.

## S00-23 `08b_channel_terms`
Purpose: Negotiated commercial and operational terms for each channel in each market×format context. **Primary source for Rule 19 pricing waterfall** (markup, channel discount, promo co-funding) **and S200 revenue computation** (commission, fees, settlement, visibility). Terms vary by market and format — Swiggy’s commission in Mumbai Cloud Kitchen may differ from Bangalore Spoke.
Grain: channel × market × format | Rows: ~45–100
| Column | Classification | Description |
|---|---|---|
| `channel_id` | key | FK to `08_channels_master`. Composite key part 1. |
| `market_id` | key | FK to `07_markets_master`. Composite key part 2. Terms vary by market. |
| `format_id` | key | FK to `05_formats_master`. Composite key part 3. Terms may vary by format. |
| `partner_name` | terms | Legal/business name of the channel partner for this market (e.g., 'Bundl Technologies Pvt Ltd' for Swiggy). |
| `commission_model` | terms | How commission is calculated. **Dropdown:** percentage / flat_fee / tiered / hybrid. |
| `commission_basis` | terms | What commission is calculated on. **Dropdown:** gmv / net_revenue / orders. Affects S200 `fees_inr`. |
| `commission_rate_pct` | terms | Commission %. **S200 source** — feeds `revenue_output.fees_inr` and `cm1_output.channel_commission_inr`. Range: 0–100. |
| `settlement_days` | terms | Days between order and payment settlement. Affects S200 `cash_flow_output` timing. Must be ≥ 0. |
| `payment_gateway_fee_pct` | terms | Payment processing fee %. Included in S200 `fees_inr`. Range: 0–10. |
| `delivery_fee_allowed_flag` | terms | Whether this channel permits charging a delivery fee. If true, S20 `delivery_fee_inr` applies. |
| `packaging_fee_allowed_flag` | terms | Whether this channel permits charging a packaging fee. If true, S20 `packaging_fee_inr` applies. |
| `price_markup_pct` | terms | Blanket % markup on §S20→S60§ base price. **Rule 19 step 2:** `customer_price = list_price × (1 + markup_pct)`, capped by `price_markup_cap_inr`. Range: 0–100. |
| `price_markup_cap_inr` | terms | Maximum absolute markup in ₹. **Rule 19 step 2:** `markup = MIN(list_price × markup_pct, markup_cap)`. NULL = no cap. |
| `channel_discount_participation_flag` | terms | Whether MyLoveTriangle participates in channel-run discount campaigns (e.g., Swiggy’s "50% off up to ₹100"). If false, platform discounts don’t apply to our listings. |
| `channel_discount_max_pct` | terms | Maximum % discount the channel can apply to our products. Caps the platform’s discount depth. Range: 0–100. NULL if not participating. |
| `channel_discount_brand_share_pct` | terms | % of the channel’s discount borne by MyLoveTriangle. Rest borne by channel. **Rule 19 step 4:** brand_cost = discount × brand_share. E.g., 40% = brand pays 40% of discount, channel absorbs 60%. Range: 0–100. |
| `promo_funding_share_pct` | terms | % of promotional discount **co-funded by the channel** (not the discount rate itself). If MyLoveTriangle runs a 20% promo and channel co-funds 50%, channel bears 10% and brand bears 10%. **Rule 19 step 6.** Range: 0–100. |
| `channel_visibility_fee_pct` | terms | Visibility/promotion fee as % of GMV for promoted listings/banners (e.g., Swiggy "Promoted Restaurant"). NULL if flat fee model. Range: 0–100. |
| `channel_visibility_fee_fixed_inr` | terms | Fixed monthly visibility/promotion fee in ₹. NULL if percentage model. Must be ≥ 0. |
| `min_order_value_inr` | terms | Minimum order value enforced by the channel in ₹. NULL = no minimum. Orders below MOV are rejected — affects conversion and effective demand. |
| `active_from` | terms | Start date. Per Rule 20: no overlapping periods for same (channel, market, format). |
| `active_to` | terms | End date (NULL = open-ended). |
| `priority_rank` | terms | Processing order. **UNIQUE within (channel_id, market_id, format_id).** Rule 20 tiebreaker. |

Dropdowns: `commission_model`: percentage / flat_fee / tiered / hybrid. `commission_basis`: gmv / net_revenue / orders.
Constraints: temporal exclusivity (Rule 20) on 3-key composite. `priority_rank` UNIQUE within key triple. FK validation. All percentage fields range 0–100. `settlement_days` ≥ 0.

Rule 19 pricing waterfall (4-discount, updated v4.3.1):
```
Step 1:  list_price_inr                                ← §S20→S60§
Step 2:  + channel_markup (capped)                     ← 08b price_markup_pct / cap
Step 3:  = customer_price_inr
Step 4:  - channel_discount                            ← 08b channel_discount (NEW)
         brand_cost = discount × brand_share_pct       (MyLoveTriangle’s portion)
         channel_cost = discount × (1 - brand_share)   (channel absorbs)
Step 5:  - base_discount                               ← §S20→S60§ base_discount_pct
Step 6:  - promo_discount (co-funded)                   ← 08b promo_funding_share_pct
Step 7:  - campaign_discount                            ← S50
Step 8:  = net_price_inr (floor ₹0)
Step 9:  net_revenue = orders × net_price
Step 10: fees = commission + gateway + visibility_fee
```

v4 additions: `price_markup_pct`, `price_markup_cap_inr`. v4.3.1 review: +`channel_discount_participation_flag`, +`channel_discount_max_pct`, +`channel_discount_brand_share_pct`, +`channel_visibility_fee_pct`, +`channel_visibility_fee_fixed_inr`, +`min_order_value_inr`, +`priority_rank`. Rule 19 updated to 4-discount waterfall. `promo_funding_share_pct` clarified (co-funding, not rate). S200 touchpoints documented.

## S00-24 `08c_channel_structure_output`
Purpose: Denormalized active channel structure and current commercial terms. Joins `08_channels_master` + `08b_channel_terms` for a flat UI display of channel economics per market×format.
Grain: channel × market × format | Max rows: ~45–100 | UI: channel overview page.
| Column | Classification | Description |
|---|---|---|
| `channel_id` | key | FK to `08_channels_master`. |
| `channel_code` | output | From `08_channels_master`. |
| `channel_name` | output | From `08_channels_master`. |
| `market_id` | output | FK to `07_markets_master`. |
| `market_name` | output | From `07_markets_master`. |
| `format_id` | output | FK to `05_formats_master`. |
| `format_name` | output | From `05_formats_master`. |
| `partner_name` | output | From `08b_channel_terms`. |
| `commission_model` | output | From `08b`. percentage / flat_fee / tiered / hybrid. |
| `commission_rate_pct` | output | From `08b`. |
| `settlement_days` | output | From `08b`. |
| `channel_discount_participation_flag` | output | From `08b`. Whether brand participates in channel platform discounts. |
| `channel_discount_brand_share_pct` | output | From `08b`. Brand's cost share of platform discounts. |
| `channel_visibility_fee_pct` | output | From `08b`. Promotion/listing fee %. |
| `active_from` | output | From `08b`. |
| `active_to` | output | From `08b`. |

v4.3.1 review: +`channel_discount_participation_flag`, +`channel_discount_brand_share_pct`, +`channel_visibility_fee_pct`. FK descriptions updated. Grain and purpose documented.

---

## S00-25 `06_revenue_streams_master`
Purpose: Monetization stream identity — how the business generates revenue. A format may run MULTIPLE streams simultaneously (e.g., Product Sales + Service Fee + Subscription). Each stream has ONE type. Streams connect to channels via `06b_revenue_stream_channel_map`.
Grain: revenue_stream (single-key) | Rows: ~3–6
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | master | Auto-generated PK — unique identifier for a monetization stream |
| `revenue_stream_code` | master | Short machine-readable code (e.g., 'PROD', 'CATR', 'SVCF'). **UNIQUE.** Uppercase alphanumeric, max 10 chars. |
| `revenue_stream_name` | master | Display name (e.g., 'Product Sales'). **UNIQUE.** |
| `revenue_stream_description` | master | Detailed description of the stream and its monetization model. **NOT NULL.** |
| `revenue_stream_type` | master | Stream category. **Dropdown:** product_sales / product_sales_with_service / service_fee / subscription / catering / franchise / licensing / advertising / other. **Critical S200 routing:** `product_sales` → pricing from §S20→S60§ product economics. All other types → pricing from S20 stream assumptions. `product_sales_with_service` → product component from §S20→S60§ + service component from S20. |
| `sort_order` | master | Display position (ascending). **UNIQUE.** |

Dropdown: `revenue_stream_type`: product_sales / product_sales_with_service / service_fee / subscription / catering / franchise / licensing / advertising / other

Constraints: `revenue_stream_code` UNIQUE, `revenue_stream_name` UNIQUE, `sort_order` UNIQUE, `revenue_stream_description` NOT NULL.
Lifecycle cascade: archiving must close bridges (06b–06e) and S20 driver rows.

S200 pricing switch (critical — the single most important routing decision in the finance stack):
```
IF revenue_stream_type = 'product_sales':
  → S200 revenue = §S20→S60§ product pricing × product mix × orders
IF revenue_stream_type = 'product_sales_with_service':
  → S200 revenue = §S20→S60§ product pricing (product component) + S20 service pricing (service component)
ELSE (service_fee, subscription, catering, franchise, etc.):
  → S200 revenue = S20 expected_gross_aov × discount × orders
```

product_sales vs service_fee: NOT mutually exclusive. Create separate streams for each revenue line.
- "Product Sales" (type: product_sales) — food revenue
- "Delivery Fee" (type: service_fee) — delivery charge to customer
- "Catering" (type: catering) — bundled food + event service, priced as a package
- "Dine-In Experience" (type: product_sales_with_service) — food (§S20→S60§ pricing) + table service (S20 pricing)

v4.3.1 review: +`product_sales_with_service` type for bundled streams. S200 routing switch documented. Constraints formalized.

## S00-26 `06b_revenue_stream_channel_map`
Purpose: Which channels deliver each revenue stream. A stream may flow through multiple channels (Product Sales via Swiggy + Own App + Zomato). Primary input — not derivable.
Grain: stream × channel | Rows: ~10–20
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK to `06_revenue_streams_master`. Composite key part 1. |
| `channel_id` | key | FK to `08_channels_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `primary_channel_flag` | map | Whether this is the primary channel for this stream. **Exactly one true per `revenue_stream_id`** among active rows. UI default + fallback. |
| `priority_rank` | map | Display order within stream. **UNIQUE within revenue_stream_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within stream. Exactly one `primary_channel_flag = true` per stream.
v4.3.1 review: purpose, grain, FK refs, primary_channel constraint, Rule 20 formalized.

## S00-27 `06c_revenue_stream_format_map`
Purpose: Which formats offer each revenue stream. Controls S20 activation at stream × format grain. A format may have multiple streams; a stream may exist in multiple formats. Primary input — not derivable.
Grain: stream × format | Rows: ~8–15
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK to `06_revenue_streams_master`. Composite key part 1. |
| `format_id` | key | FK to `05_formats_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within stream. **UNIQUE within revenue_stream_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within stream.
v4.3.1 review: purpose, grain, FK refs, constraints formalized.

## S00-28 `06d_revenue_stream_collection_map`
Purpose: Which product collections are sold through each revenue stream. Defines product scope for the stream — all categories and products within mapped collections are included via the collection→category→product hierarchy (01c→02c). Primary input. Product-level exclusions handled at §S20→S60§ pricing level (no pricing = no revenue), not here.
Grain: stream × collection | Rows: ~10–20
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK to `06_revenue_streams_master`. Composite key part 1. |
| `collection_id` | key | FK to `01_collections_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within stream. **UNIQUE within revenue_stream_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within stream.
Hierarchy cascade: mapping a collection here includes ALL categories (via 01c) and ALL products (via 02c) in that collection for this stream. No separate stream→product bridge needed.
v4.3.1 review: purpose clarified, hierarchy cascade documented. `06e_revenue_stream_product_map` REMOVED (derivable from 06d→01c→02c).

## S00-29 `06e_revenue_stream_product_map`
Purpose: Which products each revenue stream sells directly. **REINSTATED in v4.4.0** — Phase 9 requires per-stream product-level gatekeeper for §S20→S60§ product-keyed tables. While derivable from 06d→01c→02c, the direct bridge is needed as a gatekeeper for §S20→S60§ set-based tables to validate that a product belongs to the stream before allowing pricing/costing entries.
Grain: stream × product | Rows: ~40–100
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK to `06_revenue_streams_master`. Composite key part 1. |
| `product_id` | key | FK to `03_products_master`. Composite key part 2. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within stream. **UNIQUE within revenue_stream_id.** Rule 20 tiebreaker. |

Constraints: temporal exclusivity (Rule 20). FK validation. `priority_rank` UNIQUE within stream.
v4.3.1: REMOVED (derivable). v4.4.0: REINSTATED as §S20→S60§ product-keyed gatekeeper (DI-38). Derivation path (06d→01c→02c) still valid for population; bridge is maintained as resolved convenience + gatekeeper.

## S00-30 `06f_stream_channel_view`
Purpose: layered view — which channels deliver this revenue stream (stream zoom level, channels tab).
Grain: stream × channel | Max rows: ~5 per stream | UI: stream detail page, channels tab.
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK/PK — unique identifier for a monetization stream (e.g., Product Sales, Catering, Subscription) |
| `revenue_stream_name` | output | Display name of the revenue stream |
| `revenue_stream_type` | output | Stream category: product_sales / product_sales_with_service / service_fee / subscription / catering / franchise / licensing / advertising / other |
| `channel_id` | output | FK/PK — unique identifier for a sales/distribution channel (e.g., Swiggy, Zomato, Own App) |
| `channel_name` | output | Display name of the channel (e.g., 'Swiggy') |
| `primary_channel_flag` | output | Human decision: designate as the primary channel |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

v4.2: replaces `07f_revenue_stream_structure_output`.

## S00-30b `06g_stream_format_view`
Purpose: layered view — which formats offer this revenue stream (stream zoom level, formats tab).
Grain: stream × format | Max rows: ~3 per stream | UI: stream detail page, formats tab.
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK/PK — unique identifier for a monetization stream (e.g., Product Sales, Catering, Subscription) |
| `revenue_stream_name` | output | Display name of the revenue stream |
| `format_id` | output | FK/PK — unique identifier for a business format (e.g., Cloud Kitchen, Spoke, Central Kitchen) |
| `format_name` | output | Display name of the format (e.g., 'Cloud Kitchen') |
| `active_from` | output | Start date when this relationship/membership becomes effective |
| `active_to` | output | End date when this relationship/membership expires (NULL = open-ended) |

## S00-30c `06h_stream_product_view`
Purpose: Layered view — what products are sold through this revenue stream (stream zoom level, products tab). **Derived via hierarchy cascade:** 06d_stream_collection → 01c_collection_category → 02c_category_product. No direct stream→product bridge (06e removed v4.3.1).
Grain: stream × product | Max rows: ~50 per stream | UI: stream detail page, products tab. Can group by collection and category.
| Column | Classification | Description |
|---|---|---|
| `revenue_stream_id` | key | FK to `06_revenue_streams_master`. |
| `revenue_stream_name` | output | From `06_revenue_streams_master`. |
| `collection_id` | output | FK to `01_collections_master`. From 06d→hierarchy. |
| `collection_name` | output | From `01_collections_master`. |
| `category_id` | output | FK to `02_categories_master`. Intermediate hierarchy level from 01c. |
| `category_name` | output | From `02_categories_master`. |
| `product_id` | output | FK to `03_products_master`. Terminal level from 02c. |
| `product_name` | output | From `03_products_master`. |
| `active_from` | output | From bridge relationships. |
| `active_to` | output | From bridge relationships. |

Derivation path: `06d_revenue_stream_collection_map` → `01c_collection_category_map` → `02c_category_product_map`. Full hierarchy cascade — no direct stream→product bridge needed.
v4.3.1 review: source changed from 06e (removed) to 06d→01c→02c cascade. +`category_id`, +`category_name` (intermediate hierarchy level).

---

## S00-31 `07_markets_master`
Purpose: Geographic market hierarchy — linked cluster→macro→micro. All downstream sections (S30–S200) with a `market_id` key reference this table.
Grain: market (single-key) | Rows: ~10–30
| Column | Classification | Description |
|---|---|---|
| `market_id` | master | Auto-generated PK — unique identifier for a geographic market |
| `market_code` | master | Short machine-readable code (e.g., 'MUM-WS', 'BLR-KOR'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `market_name` | master | Display name (e.g., 'Mumbai Western Suburbs'). **UNIQUE.** |
| `market_description` | master | Geographic and competitive context. **NOT NULL.** |
| `market_level` | master | Hierarchy level. **Dropdown:** cluster / macro / micro. Determines parent_market_id rules. |
| `parent_market_id` | master | FK to parent market. **NULL for top-level clusters only.** This is the PRIMARY hierarchy relationship — all derived hierarchy FKs auto-populate from this. Cluster: must be NULL. Macro: must reference a cluster. Micro: must reference a macro. |
| `cluster_market_id` | derived | FK to cluster-level ancestor. **Auto-populated** from parent chain. NULL for cluster rows. Read-only. |
| `macro_market_id` | derived | FK to macro-level ancestor. **Auto-populated.** NULL for cluster rows. Self-referencing for macro rows. Read-only. |
| `micro_market_id` | derived | FK to self for micro rows. **Auto-populated.** NULL for cluster and macro rows. Read-only. |
| `market_tier` | master | Economic tier. **Dropdown:** tier_1 / tier_2 / tier_3. Indian city classification. |
| `sort_order` | master | Display position (ascending). **UNIQUE within `market_level`.** |

Dropdowns:
- `market_level`: cluster / macro / micro
- `market_tier`: tier_1 / tier_2 / tier_3

Constraints: `market_code` UNIQUE, `market_name` UNIQUE, `sort_order` UNIQUE within level, `market_description` NOT NULL. `parent_market_id` must reference valid parent at correct hierarchy level.
Lifecycle cascade: archiving must close all S30–S120, S200 rows referencing this market_id.

Hierarchy auto-population:
```
ON INSERT/UPDATE of parent_market_id:
  IF market_level = 'cluster': parent=NULL, cluster/macro/micro=NULL
  IF market_level = 'macro': parent=cluster, cluster_market_id=parent, macro/micro=NULL
  IF market_level = 'micro': parent=macro, macro_market_id=parent, cluster_market_id=parent.cluster_market_id, micro=NULL
```

v4.3.1 review: +`market_description`. 3 hierarchy FKs reclassified master→derived (auto-populated). `market_tier` dropdown formalized. Constraints and cascade documented.

---

## S00-32 `09_input_sources_master`
Purpose: Data input source registry — where each assumption and reference value originates. Feeds S300 governance (91_metric_lineage_log).
Grain: input_source (single-key) | Rows: ~15–30
| Column | Classification | Description |
|---|---|---|
| `input_source_id` | master | Auto-generated PK — unique identifier for a data input source |
| `input_source_code` | master | Short code (e.g., 'ZOM-AR25', 'GOV-CENSUS'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `input_source_name` | master | Display name (e.g., 'Zomato Annual Report 2025'). **UNIQUE.** |
| `input_source_description` | master | What this source covers and its reliability context. **NOT NULL.** |
| `input_source_category` | master | **Dropdown:** industry_report / government_data / internal_actuals / market_research / competitor_data / expert_estimate / analog_benchmark / user_input / other |
| `source_capture_mode` | master | **Dropdown:** manual / upload / api / scrape / calculated |
| `requires_upload_template_flag` | master | Whether this source requires a structured upload template |
| `upload_template_code` | master | Template reference. **NULL when flag = false.** |
| `research_engine_module_name` | master | System integration: which module processes this source. **Nullable.** Implementation field. |
| `default_confidence_method` | master | **Dropdown:** statistical / expert_judgment / triangulated / single_source / calculated / not_assessed |
| `owner` | master | Person/role responsible for maintaining this source. Free text. |
| `sort_order` | master | Display position. **UNIQUE.** |

Dropdowns: `input_source_category`: industry_report / government_data / internal_actuals / market_research / competitor_data / expert_estimate / analog_benchmark / user_input / other. `source_capture_mode`: manual / upload / api / scrape / calculated. `default_confidence_method`: statistical / expert_judgment / triangulated / single_source / calculated / not_assessed.
Constraints: `input_source_code` UNIQUE, `input_source_name` UNIQUE, `sort_order` UNIQUE, `input_source_description` NOT NULL.
v4.3.1 review: +`input_source_description`. 3 dropdowns formalized. Constraints applied.

---

## S00-33 `10_capacity_units_master`
Purpose: Operational facility/unit types that make up a format's infrastructure chain. One or more capacity units define a format's operational model. Units operate at a specific market hierarchy level and can be dedicated (1:1) or shared (1:many). A format IS its chain of capacity units (Phase 2 directive).
Grain: capacity_unit (single-key) | Rows: ~8–15
| Column | Classification | Description |
|---|---|---|
| `capacity_unit_id` | master | Auto-generated PK — unique identifier for a capacity unit type |
| `unit_code` | master | Short code (e.g., 'DK', 'COMM-CITY', 'COMM-NAT', 'OFC-CITY'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `unit_name` | master | Display name (e.g., 'Dark Kitchen', 'City Commissary'). **UNIQUE.** |
| `unit_description` | master | What this unit does in the infrastructure chain. **NOT NULL.** |
| `unit_type` | master | Facility category. **Dropdown:** production / commissary / storage / office / logistics_hub / retail_front / other |
| `market_scope_level` | master | Market hierarchy level at which this unit operates. **Dropdown:** micro / macro / cluster / national. Determines cost allocation and scaling: micro = one per micro market, macro = shared across micro markets in a city, etc. |
| `dedicated_vs_shared` | master | **Dropdown:** dedicated / shared. Dedicated = one unit per market at its scope level. Shared = one unit serves multiple markets at the level below. |
| `default_operating_hours_per_day` | master | Default daily operating hours. Legitimate primary input — not product-dependent. Seeds S80. Must be > 0. |
| `sort_order` | master | Display position. **UNIQUE.** |

Dropdowns: `unit_type`: production / commissary / storage / office / logistics_hub / retail_front / other. `market_scope_level`: micro / macro / cluster / national. `dedicated_vs_shared`: dedicated / shared.
Constraints: `unit_code` UNIQUE, `unit_name` UNIQUE, `sort_order` UNIQUE, `unit_description` NOT NULL, `default_operating_hours_per_day` > 0.
Lifecycle cascade: archiving must close `05f_format_capacity_unit_map`, `10b_capacity_unit_asset_map`, S80 rows (capacity_profile_set_items, capacity_decisions, capacity_outputs — all tables referencing capacity_unit_id), S90 rows (manpower_profile_set_items.linked_capacity_unit_id — nullify loose FK). **(Audit C-12: updated for v4.5.10 expanded S80/S90.)**

Market scope logic:
```
micro + dedicated:   1 unit per micro market (e.g., 1 Dark Kitchen per suburb)
macro + shared:      1 unit per macro market, costs split across its micro markets
cluster + shared:    1 unit per cluster, costs split across macro markets
national + shared:   1 unit for entire network, costs split across all markets
```

Capacity computation (no context-free capacity on this master — D1 principle):
```
Unit daily capacity is ALWAYS computed from the product→asset→unit chain:
  Step 1: Get product mix for format×market (from §S20→S60§ resolved shares)
  Step 2: For each throughput asset A in unit (via 10b):
    demand_minutes = Σ(product_orders × share × usage_minutes(P,A))  ← from 11b
    capacity_minutes = quantity(A) × 60 × operating_hours              ← from 10b + this master
  Step 3: Bottleneck = asset with highest utilization
  Step 4: Effective daily orders = bottleneck_capacity / weighted_avg_usage
No default_capacity_per_unit_per_day stored — derivable and product-mix-dependent.
```

v4.3.1 review: MAJOR REWORK. Replaces `10_capacity_resources_master`. New concept: capacity units = operational facilities with market scope and sharing model. Format structure = infrastructure chain of units.

## S00-33b `10b_capacity_unit_asset_map`
Purpose: Which capacity asset types make up each capacity unit type. A Dark Kitchen needs {oven, prep station, fridge, exhaust}. A City Commissary needs {cold storage, mixer, bulk prep line}.
Grain: capacity_unit × capacity_asset | Rows: ~40–80
| Column | Classification | Description |
|---|---|---|
| `capacity_unit_id` | key | FK to `10_capacity_units_master` |
| `capacity_asset_id` | key | FK to `11_capacity_assets_master` |
| `default_quantity_per_unit` | map | Default number of this asset per unit instance (e.g., 2 ovens per Dark Kitchen). Must be ≥ 1. |
| `is_essential_flag` | map | Whether this asset is mandatory for the unit to function (true) or optional/upgrade (false). |
| `active_from` | map | Effective start date |
| `active_to` | map | Effective end date |
| `priority_rank` | map | Ordering |

Constraints: (`capacity_unit_id`, `capacity_asset_id`) UNIQUE. `default_quantity_per_unit` ≥ 1.
v4.3.1: new bridge table. Links asset types to unit types.

## S00-34 `11_capacity_assets_master`
Purpose: Capital goods and services that make up a Capacity Unit. Assets are the atomic CapEx items — bought, installed, depreciated. They belong to unit types via `10b_capacity_unit_asset_map`. Throughput assets drive bottleneck analysis.
Grain: capacity_asset (single-key) | Rows: ~20–40
| Column | Classification | Description |
|---|---|---|
| `capacity_asset_id` | master | Auto-generated PK — unique identifier for a capacity asset type |
| `asset_code` | master | Short code (e.g., 'OVEN-COM', 'FRIDGE-IND', 'SITE-DEV'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `asset_name` | master | Display name (e.g., 'Commercial Pizza Oven'). **UNIQUE.** |
| `asset_description` | master | Specification and purpose. **NOT NULL.** |
| `asset_category` | master | **Dropdown:** kitchen_equipment / site_development / furniture / technology / vehicle / infrastructure / cold_chain / signage / other |
| `standard_unit` | master | Unit of measure. **Dropdown:** unit / sq_ft / set / lot / pair / linear_ft |
| `is_throughput_asset_flag` | master | Whether this asset processes production (true = oven, prep station; false = furniture, signage, site development). Throughput assets appear in `11b_product_asset_usage_map` and drive S80 bottleneck analysis. Asset throughput is NOT stored here — it’s product-dependent and computed from `11b` usage minutes (D1 principle). |
| `useful_life_months` | master | Expected economic life in months. Must be > 0. Structural default — S110 may override per format×market. |
| `depreciation_method` | master | **Dropdown:** straight_line / declining_balance / units_of_production |
| `default_unit_cost_inr` | master | Purchase cost per unit in ₹. Structural default — S110 overrides per format×market. |
| `default_installation_cost_inr` | master | One-time installation/setup cost in ₹. Default: 0. S110 overrides. |
| `default_salvage_value_pct` | master | Salvage value as % of purchase cost at end of useful life. Default: 0. Affects net depreciation. |
| `default_annual_maintenance_cost_inr` | master | Recurring annual maintenance cost in ₹. **Computation source** — feeds S100 OpEx. Default: 0. S100 overrides. |
| `sort_order` | master | Display position. **UNIQUE.** |

Dropdowns: `asset_category`: kitchen_equipment / site_development / furniture / technology / vehicle / infrastructure / cold_chain / signage / other. `standard_unit`: unit / sq_ft / set / lot / pair / linear_ft. `depreciation_method`: straight_line / declining_balance / units_of_production.
Constraints: `asset_code` UNIQUE, `asset_name` UNIQUE, `sort_order` UNIQUE, `asset_description` NOT NULL, `useful_life_months` > 0.
Throughput note: no `standard_throughput_per_hour` on this master (removed v4.3.1 — throughput is product-dependent, defined by `11b_product_asset_usage_map.default_usage_minutes_per_unit`). `is_throughput_asset_flag` determines which assets appear in 11b.
Lifecycle cascade: archiving must close `10b_capacity_unit_asset_map`, `11b_product_asset_usage_map`, `05g_format_capacity_asset_map`, S110 rows.

v4.3.1 review: MAJOR REWORK. Replaces old `capex_assets` concept. +`is_throughput_asset_flag`. +full cost model (unit_cost, installation, salvage, maintenance). Assets belong to units via 10b bridge. Throughput assets link to products via 11b bridge. `standard_throughput_per_hour` and `throughput_unit` REMOVED — throughput is product-dependent (D1 principle).

## S00-34b `11b_product_asset_usage_map`
Purpose: How much of each throughput asset's capacity one unit of a product consumes. Only throughput assets (is_throughput_asset_flag = true) appear here. Structural default — S80 may override per format×market.
Grain: product × capacity_asset | Rows: ~50–150
| Column | Classification | Description |
|---|---|---|
| `product_id` | key | FK to `03_products_master` |
| `capacity_asset_id` | key | FK to `11_capacity_assets_master`. Must be a throughput asset. |
| `default_usage_minutes_per_unit` | map | Minutes of this asset consumed per unit of this product. 0 = product doesn't use this asset. Must be ≥ 0. |
| `usage_type` | map | **Dropdown:** primary / secondary / shared. Primary = main processing asset. Secondary = used but not dominant. Shared = minimal common use (packaging). |
| `active_from` | map | Effective start date |
| `active_to` | map | Effective end date |
| `priority_rank` | map | Ordering |

Dropdown: `usage_type`: primary / secondary / shared.
Constraints: (`product_id`, `capacity_asset_id`) UNIQUE. `capacity_asset_id` must reference asset with `is_throughput_asset_flag = true`. `default_usage_minutes_per_unit` ≥ 0.

S80 bottleneck computation:
```
For each throughput asset A in unit U:
  demand_minutes = Σ across products P: (projected_orders(P) × product_share(P) × usage_minutes(P, A))
  capacity_minutes = asset_throughput(A) × 60 × quantity_in_unit(A) × operating_hours
  utilization(A) = demand_minutes / capacity_minutes
  
Bottleneck = asset with highest utilization. If utilization > target → expansion needed.
```

v4.3.1: new bridge table. Links products to throughput assets with per-unit consumption. Enables S80 bottleneck analysis.

## S00-35 `12_roles_master`
Purpose: Staffing role identity with structural operational defaults. Context-specific overrides in S90 manpower_assumptions at format × market × role grain. Default fields seed S90 — NULL in S90 = use master default.
Grain: role (single-key) | Rows: ~10–20
| Column | Classification | Description |
|---|---|---|
| `role_id` | master | Auto-generated PK — unique identifier for a staffing role |
| `role_code` | master | Short code (e.g., 'CHEF-PZ', 'RIDER', 'MGR-KIT'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `role_name` | master | Display name (e.g., 'Pizza Chef'). **UNIQUE.** |
| `role_description` | master | Responsibilities and scope. **NOT NULL.** |
| `function_name` | master | Functional department. **Dropdown:** kitchen / delivery / support / management / operations / quality |
| `skill_band` | master | Skill tier. **Dropdown:** entry / skilled / senior / specialist / management. Superset of `03_products_master.skill_level_required` (which excludes management). |
| `default_shift_type` | master | Default shift pattern. **Dropdown:** single / split / rotating / flexible |
| `default_monthly_ctc_inr` | master | Baseline monthly CTC in ₹. Structural default — S90 overrides per market (Mumbai CTC ≠ Jaipur). **Computation source.** |
| `default_variable_pay_pct` | master | Baseline variable/incentive pay as % of CTC. S90 overrides. |
| `default_attrition_rate_pct` | master | Baseline annual attrition %. S90 overrides per market (metros higher). |
| `default_hiring_sequence_rank` | master | Default priority: hire chef (rank 1) before rider (rank 2) before support (rank 3). S90 decisions override. |
| `default_first_hire_trigger_orders` | master | Default order volume that triggers first hire for this role. S90 overrides per market. |
| `default_headcount_increment_trigger_orders` | master | Default incremental orders that trigger each additional hire. S90 overrides. |
| `cost_nature` | master | How this role's cost behaves. **Dropdown:** fixed / variable / semi_variable. Fixed = salaried. Variable = per-delivery. Semi = base + volume bonus. |
| `sort_order` | master | Display position. **UNIQUE.** |

Dropdowns: `function_name`: kitchen / delivery / support / management / operations / quality. `skill_band`: entry / skilled / senior / specialist / management. `default_shift_type`: single / split / rotating / flexible. `cost_nature`: fixed / variable / semi_variable.
Constraints: `role_code` UNIQUE, `role_name` UNIQUE, `sort_order` UNIQUE, `role_description` NOT NULL, `default_monthly_ctc_inr` > 0, `default_variable_pay_pct` ≥ 0, `default_attrition_rate_pct` ≥ 0.
Lifecycle cascade: archiving must close `05h_format_role_map`, S90 rows.

S90 interaction: all `default_*` fields are computation sources that seed S90 assumptions. S90 uses master defaults as fallback (NULL in S90 = use master default). Non-NULL S90 values override. Same pattern as products → S80.
v4.3.1 review: +`role_code`, +`role_description`, +7 default operational fields (CTC, variable, attrition, sequence, triggers, cost_nature). Dropdowns formalized.

## S00-36 `13_opex_line_items_master`
Purpose: Operating expense line item identity with market scope and escalation defaults. Some expenses are micro-level (kitchen rent), others are shared across market hierarchy (city office rent, national G&A). `market_scope_level` determines allocation. Structural defaults seed S100 — NULL in S100 = use master default.
Grain: opex_line_item (single-key) | Rows: ~15–30
| Column | Classification | Description |
|---|---|---|
| `opex_line_item_id` | master | Auto-generated PK — unique identifier for an operating expense line item |
| `expense_code` | master | Short code (e.g., 'RENT-KIT', 'UTIL-ELEC', 'RENT-OFC'). **UNIQUE.** Alphanumeric + hyphen, max 15 chars. |
| `expense_name` | master | Display name (e.g., 'Kitchen Rent', 'City Office Rent'). **UNIQUE.** |
| `expense_description` | master | What this expense covers and any special terms. **NOT NULL.** |
| `expense_category` | master | **Dropdown:** rent / utilities / technology / insurance / marketing / logistics / packaging / maintenance / licenses / subscriptions / other |
| `cost_behavior` | master | How cost varies with volume. **Dropdown:** fixed / variable / semi_variable |
| `allocation_basis` | master | How shared costs are distributed. **Dropdown:** per_outlet / per_order / per_sqft / per_headcount / per_format / per_revenue / lumpsum. Used when `market_scope_level` > micro. |
| `market_scope_level` | master | Market hierarchy level at which this expense operates. **Dropdown:** micro / macro / cluster / national. Micro = assigned directly to micro market. Macro/cluster/national = shared, split across lower-level markets per `allocation_basis`. |
| `default_annual_escalation_pct` | master | Baseline annual cost escalation %. Structural default — S100 overrides per format×market. **Computation source.** |
| `default_escalation_trigger_metric` | master | Default metric causing step-change escalation. **Dropdown:** orders_per_day / headcount / revenue / none. S100 overrides. |
| `default_payment_terms_days` | master | Standard payment terms in days. S100 overrides. |
| `requires_security_deposit_flag` | master | Whether this expense typically requires an upfront deposit (e.g., rent). |
| `sort_order` | master | Display position. **UNIQUE.** |

Dropdowns: `expense_category`: rent / utilities / technology / insurance / marketing / logistics / packaging / maintenance / licenses / subscriptions / other. `cost_behavior`: fixed / variable / semi_variable. `allocation_basis`: per_outlet / per_order / per_sqft / per_headcount / per_format / per_revenue / lumpsum. `market_scope_level`: micro / macro / cluster / national. `default_escalation_trigger_metric`: orders_per_day / headcount / revenue / none.
Constraints: `expense_code` UNIQUE, `expense_name` UNIQUE, `sort_order` UNIQUE, `expense_description` NOT NULL, `default_annual_escalation_pct` ≥ 0.
Lifecycle cascade: archiving must close `05i_format_opex_line_item_map`, S100 rows.

Market scope allocation:
```
IF market_scope_level = 'micro':     cost assigned directly to micro market
IF market_scope_level = 'macro':     cost split across micro markets in that city per allocation_basis
IF market_scope_level = 'cluster':   cost split across macro markets in that cluster per allocation_basis
IF market_scope_level = 'national':  cost split across all markets per allocation_basis
```

S100 interaction: `default_annual_escalation_pct`, `default_escalation_trigger_metric`, `default_payment_terms_days` are computation sources seeding S100. NULL in S100 = use master default. Non-NULL S100 values override.
v5 candidate: `13b_allocation_rules` table if blended allocation methods emerge (e.g., 60% by revenue + 40% by headcount).
v4.3.1 review: +`expense_code`, +`expense_description`, +`market_scope_level`, +4 escalation/payment defaults. Dropdowns formalized. Market hierarchy sharing documented.

## S00-37 `14_periods_master`
Purpose: Canonical time periods for all time-series computation and financial reporting. Base grain is monthly. Quarterly/annual are computed views.
Grain: period (single-key) | Rows: ~51 for 36-month horizon (36 monthly + 12 quarterly + 3 annual)
| Column | Classification | Description |
|---|---|---|
| `period_id` | master | Auto-generated PK — unique identifier for a time period |
| `period_code` | master | Machine-readable code (e.g., '2026-M04', '2026-Q2', 'FY2027'). **UNIQUE.** |
| `period_type` | master | Granularity. **Dropdown:** monthly / quarterly / annual |
| `period_label` | master | Human-readable label (e.g., 'April 2026'). **UNIQUE.** |
| `period_start_date` | master | First calendar day. **UNIQUE.** The PRIMARY temporal field — all derived fields auto-populate from this + period_type. |
| `period_end_date` | master | Last calendar day. Must be > period_start_date. |
| `fiscal_year` | derived | Indian fiscal year (e.g., 'FY2027' for Apr 2026–Mar 2027). **Auto-populated** from period_start_date. Read-only. |
| `fiscal_quarter` | derived | Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar. **Auto-populated.** Read-only. |
| `fiscal_month` | derived | 1=April through 12=March. **Auto-populated.** Read-only. |
| `calendar_year` | derived | Calendar year (e.g., 2026). **Auto-populated.** Read-only. |
| `calendar_month` | derived | 1=January through 12=December. **Auto-populated.** Read-only. |
| `working_days` | master | Business days in this period. **Manually entered**, adjusted for Indian national holidays. Must be > 0. State-specific holidays are a v5 refinement. |
| `sort_order` | master | Chronological + type ordering. **UNIQUE.** |

Dropdown: `period_type`: monthly / quarterly / annual.
Fiscal year convention: April–March (India standard).
Constraints: `period_code` UNIQUE, `period_label` UNIQUE, `period_start_date` UNIQUE, `sort_order` UNIQUE, `working_days` > 0.
Base grain: monthly. Quarterly/annual are computed views (SUM absolutes, RECOMPUTE percentages — never average ratios).
Default planning horizon: 36 months.
v4.3: new table (Risk 1 fix). v4.3.1 review: 5 fields reclassified master→derived (auto-populated from period_start_date). Constraints formalized.

## S00-38 `15_scenarios_master`
Purpose: Registry and lifecycle management for planning scenarios. The `scenario` system field on every table is a FK to `scenario_code`. Rule 22 governs scenario fallback to base.
Grain: scenario (single-key) | Rows: ~3–10
| Column | Classification | Description |
|---|---|---|
| `scenario_id` | master | Auto-generated PK |
| `scenario_code` | master | Machine-readable ID (e.g., 'base', 'optimistic_q2'). **UNIQUE.** This is the FK target for the `scenario` system field on all other tables. |
| `scenario_name` | master | Human-readable name (e.g., 'Base Case'). **UNIQUE.** |
| `scenario_description` | master | What this scenario tests or represents. **NOT NULL.** |
| `scenario_type` | master | **Dropdown:** base / what_if / stress / budget / forecast / actuals |
| `is_base_scenario_flag` | master | Exactly one row = true. Used for Rule 22 fallback. |
| `parent_scenario_id` | master | FK to source scenario if cloned. NULL for originals. |
| `created_date` | master | Date created. Auto-populated on insert. |
| `locked_flag` | master | Whether assumptions/decisions are frozen. true = read-only. |
| `locked_date` | master | When locked. NULL if unlocked. |
| `locked_by` | master | Who locked it. Free text. |
| `sort_order` | master | Display position. **UNIQUE.** |

Dropdown: `scenario_type`: base / what_if / stress / budget / forecast / actuals.
Constraints: `scenario_code` UNIQUE, `scenario_name` UNIQUE, `sort_order` UNIQUE, `scenario_description` NOT NULL. Exactly ONE `is_base_scenario_flag = true`.
Lifecycle: CREATE → CLONE → EDIT → LOCK → ARCHIVE. Cloning copies all assumption/decision rows independently. Locked scenarios cannot have assumption/decision rows modified.
v4.3: new table (Risk 10 fix). See Rule 22. v4.3.1 review: uniqueness + NOT NULL constraints formalized.

---

## S00-39 `context_set_master`
Purpose: Named groupings of format × stream × market combinations. **Shared infrastructure for ALL driver sections §S20→S60§–S120.** A context set defines a "business deployment archetype" — a reusable selection of where and how the business operates. Defined once, deployed everywhere via assignment tables. Pattern #19 foundation.
Grain: context_set (single-key) | Rows: ~5–20
| Column | Classification | Description |
|---|---|---|
| `context_set_id` | master | Auto-generated PK — unique identifier for a context set |
| `context_set_code` | master | Short machine-readable code (e.g., 'METRO-CK-DEL', 'T2-SPK-ALL'). **UNIQUE.** Alphanumeric + hyphen, max 20 chars. |
| `context_set_name` | master | Display name (e.g., 'Metro Cloud Kitchen Delivery'). **UNIQUE.** |
| `context_set_description` | master | What this archetype represents and when to use it. **NOT NULL.** |
| `sort_order` | master | Display position (ascending). **UNIQUE.** |

Constraints: `context_set_code` UNIQUE, `context_set_name` UNIQUE, `sort_order` UNIQUE, `context_set_description` NOT NULL.
Lifecycle: Scenario-independent. Strict archive blocking — active assignments prevent archive.
Phase 9 addition: Pattern #19 (universal set + context set + assignment). v4.4.0.

## S00-40 `context_set_members`
Purpose: Membership detail — which format × stream × market combinations belong to each context set. `revenue_stream_id` is NULLABLE per Pattern #20: NULL = stream-agnostic (applies to S30–S120 where stream is not a key dimension), non-NULL = stream-specific (applies to §S20→S60§, S20 where revenue_stream_id is a key).
Grain: context_set × format × stream (nullable) × market | Rows: ~30–100
| Column | Classification | Description |
|---|---|---|
| `context_set_id` | key | FK to `context_set_master`. Composite key part 1. |
| `format_id` | key | FK to `05_formats_master`. Composite key part 2. |
| `revenue_stream_id` | key | FK to `06_revenue_streams_master`. Composite key part 3. **NULLABLE** — NULL = stream-agnostic (Pattern #20). When non-NULL, 06c gatekeeper applies. |
| `market_id` | key | FK to `07_markets_master`. Composite key part 4. |
| `active_from` | map | Start date. Rule 20 temporal exclusivity. |
| `active_to` | map | End date (NULL = open-ended). |
| `priority_rank` | map | Display order within context set. **UNIQUE within context_set_id.** Rule 20 tiebreaker. |

Constraints: UNIQUE(context_set_id, format_id, revenue_stream_id, market_id, scenario, effective_from) — Rule 20. FK validation. 05j gatekeeper (format × market). 06c gatekeeper when revenue_stream_id is non-NULL.
Overlapping membership: A format×stream×market may belong to MULTIPLE context sets. Overlapping assignment coverage is BLOCKED (validated at assignment level, not membership level).
Phase 9 addition: Pattern #19 + #20. v4.4.0.

---

## S00-41 `research_outcome_items`
Purpose: Field-level AI research suggestions. **Shared infrastructure** across all driver sections (S10–S70). Each row is one AI-suggested value for one field on one target assumption table. Supports multiple competing estimates per field (e.g., top-down vs bottom-up TAM). Pattern #23, Rule 26.
Grain: research_run × target_table × target_field (one row per suggestion) | Rows: ~200–2000
| Column | Classification | Type | Description |
|---|---|---|---|
| `outcome_item_id` | system | INTEGER | Auto-generated PK. |
| `research_run_id` | key | INTEGER | FK to the originating `_research` table row's `research_run_id`. Universal across all research tables (shared sequence). |
| `source_research_table` | key | VARCHAR | Which research table produced this outcome. **Managed values:** format_research / revenue_stream_research / market_research / channel_research / marketing_research / demand_research / product_economics_research / capacity_research / manpower_research / opex_research / capex_research / working_capital_research. |
| `target_table_name` | key | VARCHAR | Which assumption/reference table this suggestion targets (e.g., 'market_assumptions', 'demand_assumptions'). Must be a valid table_name in `00_table_registry`. |
| `target_field_name` | key | VARCHAR | Which column on the target table (e.g., 'population', 'tam_value', 'base_orders_per_day_benchmark'). |
| `suggested_value_text` | outcome | TEXT | The AI-suggested value as text (universal serialization). For all data types. NOT NULL. |
| `suggested_value_numeric` | outcome | DECIMAL(15,4) | Numeric representation when applicable. NULL for non-numeric fields (e.g., dropdowns, text). Enables range validation and comparison. |
| `field_confidence` | outcome | DECIMAL(3,2) | AI confidence for THIS specific field (0.00–1.00). May differ from the overall research_confidence on the parent _research row. |
| `estimation_method` | outcome | VARCHAR | How this value was derived. **Dropdown:** top_down_industry / top_down_government / bottom_up_model / bottom_up_population / analog_benchmark / statistical_regression / expert_estimate / triangulated / direct_observation / api_pull. |
| `source_detail` | outcome | TEXT | Specific citation for THIS field (e.g., 'Zomato Annual Report 2025, p.47, Table 3.2'). NOT NULL. |
| `data_vintage` | outcome | DATE | When the source data was published/collected. Critical for staleness assessment. NULLABLE. |
| `acceptance_status` | workflow | VARCHAR | **Dropdown:** pending / accepted / rejected / overridden. Default: pending. See Rule 26 workflow. |
| `accepted_at` | workflow | TIMESTAMP | When human accepted/rejected/overrode. NULL while pending. |
| `accepted_by` | workflow | VARCHAR | User/role who made the acceptance decision. NULL while pending. |
| `accepted_value_text` | workflow | TEXT | When `overridden`: the value the human chose instead. NULL when accepted as-is or rejected. |
| `rejection_reason` | workflow | TEXT | When `rejected` or `overridden`: why. NULL when accepted. |
| `promoted_to_row_id` | workflow | INTEGER | System-generated ID of the assumption table row that received this value upon acceptance. NULL until promoted. Enables reverse tracing: assumption row → outcome item → research run. |
| **`value_type`** | **outcome** | **VARCHAR NOT NULL DEFAULT 'direct'** | **v4.5.9 (D-CROSS-01, Pattern #25).** Classification of this data point. **Dropdown:** direct / proxy / triangulated / composite. `direct` = observed data point from primary source. `proxy` = analogous/estimated from similar domain. `triangulated` = confidence-weighted composite of ≥3 data points (auto-generated). `composite` = manually constructed blend. |
| **`is_selected_for_population`** | **workflow** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** Marks which data point was selected to feed the model for this field. Exactly one row per (`research_run_id`, `target_table_name`, `target_field_name`) should be `true`. Selection is automatic but can be overridden via `selection_override_flag`. |
| **`selection_method`** | **workflow** | **VARCHAR NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** How this row was selected for population. **Dropdown:** highest_confidence / latest_vintage / triangulated / user_selected / only_available. NULL when `is_selected_for_population = false`. |
| **`selection_override_flag`** | **workflow** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = human manually selected this data point over the auto-selected one. Enables audit trail of human intervention in the selection process. |
| **`population_target_set_id`** | **workflow** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `set_master` table where this value was populated (Pattern #19 sections only). NULL for non-Pattern #19 sections (value goes to assumptions table directly). Enables reverse tracing: set_items row → outcome item → research run. |

Dropdowns:
- `source_research_table`: format_research / revenue_stream_research / market_research / channel_research / marketing_research / demand_research / product_economics_research / capacity_research / manpower_research / opex_research / capex_research / working_capital_research
- `estimation_method`: top_down_industry / top_down_government / bottom_up_model / bottom_up_population / analog_benchmark / statistical_regression / expert_estimate / triangulated / direct_observation / api_pull
- `acceptance_status`: pending / accepted / rejected / overridden
- `value_type`: direct / proxy / triangulated / composite **(v4.5.9)**
- `selection_method`: highest_confidence / latest_vintage / triangulated / user_selected / only_available **(v4.5.9)**

Constraints:
- `research_run_id` FK to any `_research` table's `research_run_id` (polymorphic, resolved via `source_research_table`)
- `target_table_name` must exist in `00_table_registry`
- `suggested_value_text` NOT NULL
- `source_detail` NOT NULL
- Multiple rows allowed for same (research_run_id, target_table_name, target_field_name) — competing estimates
- `acceptance_status` default 'pending'
- **v4.5.9 (D-CROSS-01):** `value_type` NOT NULL DEFAULT 'direct'. Managed dropdown.
- **v4.5.9 (D-CROSS-01):** Exactly one row per (`research_run_id`, `target_table_name`, `target_field_name`) may have `is_selected_for_population = true`. APP-LAYER validation.
- **v4.5.9 (D-CROSS-01):** `selection_method` must be non-NULL when `is_selected_for_population = true`.
- **v4.5.9 (D-CROSS-01):** `population_target_set_id` FK to relevant `*_set_master` table (polymorphic). NULL for non-Pattern #19 target sections.

Row_status workflow (Rule 26 — **AMENDED v4.5.9, D-CROSS-01, Pattern #25**):
```
STEP 1: AI research completes → _research row: research_status = 'completed'
STEP 2: AI writes field-level results → research_outcome_items (multiple rows per field for multi-data-point mandate)
STEP 3: Selection pipeline (automatic):
  (a) Per (research_run_id, target_table_name, target_field_name):
      - Count data points with different estimation_method values
      - If ≥3 data points: auto-generate 'triangulated' composite row
        composite_value = Σ(value_i × confidence_i) / Σ(confidence_i)
        field_confidence = MAX(individual confidences) × diversity_bonus
        diversity_bonus = 1.00 + 0.025 × (sources − 1)
      - If ≥3: select triangulated row → is_selected_for_population = true, selection_method = 'triangulated'
      - If 2: select highest field_confidence → selection_method = 'highest_confidence'
      - If 1: select it → selection_method = 'only_available', flag source_diversity = 'single' → S300 warning
      - Tiebreaker: most recent data_vintage
  (b) Mark exactly one row is_selected_for_population = true per field
STEP 4: Auto-population (when auto_populate_research_flag = true on _inputs):
  (a) For selected rows with field_confidence ≥ 0.50:
      - Pattern #19 sections: write to set_items table. If no set exists, auto-create set_master row
        with research_populated_flag = true, auto_created_flag = true. Auto-assign to context.
      - Non-Pattern #19 sections: write to assumptions table directly.
      - Set field_source_json on target row: {"field_name": "research"}
      - Set research_confidence_json on target row: {"field_name": confidence_score}
      - Set source_research_run_id on target row
      - Create 91_metric_lineage_log entry (source_type = 'ai_research_auto_populated')
  (b) For selected rows with field_confidence < 0.50:
      - DO NOT auto-populate. Leave field NULL.
      - Nullability guard forces human entry.
      - S300 warning: low-confidence research available but not populated.
STEP 5: Human review (override mode — replaces old gatekeeper mode):
  - Human sees auto-populated values in UI with research provenance badges
  - Per field, human may:
    (a) KEEP AS-IS → no action needed (research value stands)
    (b) EDIT → field_source_json updated to {"field_name": "manual"}, research value preserved in outcome items
    (c) SELECT ALTERNATIVE → selection_override_flag = true on chosen row, re-populate
    (d) REJECT ALL → clear field, field_source_json = {"field_name": "manual"}, enter manual value
STEP 6: Refresh safety:
  - Research refresh ONLY overwrites fields where field_source_json shows 'research'
  - Fields tagged 'manual' are PROTECTED — never overwritten by refresh
  - Fields tagged 'hybrid' are flagged for human review on refresh
```

v4.5.1: New table. Pattern #23. Rule 26.
v4.5.9: +5 columns (D-CROSS-01, Pattern #25): `value_type`, `is_selected_for_population`, `selection_method`, `selection_override_flag`, `population_target_set_id`. Rule 26 amended. Workflow changed from human-gated to AI-first with human override. Multi-data-point mandate enforced.

---

## S00-42 `91_metric_lineage_log`
Purpose: Universal provenance sidecar for the FPE schema (Rule 3). Every computed output, manual entry, API import, or AI-populated field produces a lineage entry. Answers WHO, WHEN, HOW, FROM WHERE, TO WHERE, WHICH FORMULA, and AT WHAT CONFIDENCE for every data write event. **DI-65 RESOLVED: full column-level specification.**
Grain: target_table × target_field × target_row_id × created_at (append-only) | Rows: ~10,000–100,000+

### System Fields (Rule 00)
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `metric_lineage_log_id` | system | SERIAL (INTEGER) | No | AUTO | Auto-generated surrogate PK. |
| `version` | system | INTEGER | No | 1 | App-wide schema version (Rule 1). |
| `scenario` | system | INTEGER | No | 1 | Scenario key. |
| `effective_from` | system | DATE | No | CURRENT_DATE | Validity start date. |
| `effective_to` | system | DATE | Yes | NULL | Validity end date. |
| `row_status` | system | VARCHAR(20) | No | 'draft' | Lifecycle: draft / active / inactive / deprecated / archived. |

### Source Columns
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `source_type` | lineage | VARCHAR(30) NOT NULL | No | — | How this value was generated. **Dropdown:** manual / upload / api / calculated / scenario_fallback / ai_research / ai_research_auto_populated. |
| `source_section` | lineage | VARCHAR(10) | Yes | NULL | Which section produced this value. NULL for manual entries. |
| `source_table` | lineage | VARCHAR(100) | Yes | NULL | Source table name. NULL for manual entries. |
| `source_field` | lineage | VARCHAR(100) | Yes | NULL | Source field name. NULL for manual entries. |

### Target Columns
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `target_table` | lineage | VARCHAR(100) NOT NULL | No | — | Destination table. |
| `target_field` | lineage | VARCHAR(100) NOT NULL | No | — | Destination column. |
| `target_row_id` | lineage | INTEGER | Yes | NULL | Row ID of the target record. NULL for batch operations. |

### Value Columns
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `value_text` | lineage | TEXT | Yes | NULL | Text representation of the value written. |
| `value_numeric` | lineage | DECIMAL(15,4) | Yes | NULL | Numeric representation when applicable. |

### Research Provenance Columns (Rule 25/26)
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `research_run_id` | lineage | INTEGER | Yes | NULL | FK to originating research run. NULL for non-research entries. |
| `confidence_at_population` | lineage | DECIMAL(3,2) | Yes | NULL | AI confidence at time of population (0.00–1.00). NULL for non-AI entries. |
| `estimation_method` | lineage | VARCHAR(30) | Yes | NULL | How value was derived. **Dropdown:** top_down_industry / top_down_government / bottom_up_model / bottom_up_population / analog_benchmark / statistical_regression / expert_estimate / triangulated / direct_observation / api_pull. NULL for non-research entries. |

### Formula Provenance Columns (DI-71, v4.5.13)
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `formula_id` | lineage | VARCHAR(20) | Yes | NULL | FK to `s300_formula_registry.formula_id`. Which formula produced this output. NULL for non-formula outputs. |
| `formula_version` | lineage | INTEGER | Yes | NULL | FK to `s300_formula_registry.formula_version`. Which version of the formula was used. NULL when `formula_id` is NULL. |

### Audit Columns
| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `created_at` | audit | TIMESTAMP WITH TIME ZONE | No | NOW() | When this lineage entry was created. |
| `created_by` | audit | VARCHAR(100) | Yes | NULL | User/system that produced this entry. |

**Column count:** 22 (6 system + 4 source + 3 target + 2 value + 3 research + 2 formula + 2 audit)

Dropdowns:
- `source_type`: manual / upload / api / calculated / scenario_fallback / ai_research / ai_research_auto_populated
- `estimation_method`: top_down_industry / top_down_government / bottom_up_model / bottom_up_population / analog_benchmark / statistical_regression / expert_estimate / triangulated / direct_observation / api_pull
- `row_status`: draft / active / inactive / deprecated / archived

Constraints:
- `source_type` NOT NULL
- `target_table` NOT NULL, `target_field` NOT NULL
- `created_at` NOT NULL DEFAULT NOW()
- FK: `(formula_id, formula_version)` → `s300_formula_registry(formula_id, formula_version)` WHERE `formula_id IS NOT NULL`
- CHECK: `(formula_id IS NULL AND formula_version IS NULL) OR (formula_id IS NOT NULL AND formula_version IS NOT NULL)` — paired nullability (DI-71)

Indexes:
- `idx_91_source_type` ON (source_type)
- `idx_91_target` ON (target_table, target_field)
- `idx_91_research_run` ON (research_run_id)
- `idx_91_formula` ON (formula_id, formula_version)
- `idx_91_created_at` ON (created_at)

Consumer interaction:
- **S200 Engine:** writes lineage for every computed output (113 cols). `source_type = 'calculated'`.
- **S300 Governance:** reads lineage for formula binding check (G-FORMULA-02) and confidence dashboard.
- **Research Engine:** writes lineage for auto-populated fields. `source_type = 'ai_research_auto_populated'`.
- **Rule 22:** writes scenario fallback entries. `source_type = 'scenario_fallback'`.
- **UI/API:** reads lineage for provenance badges and field history.

DI-65: RESOLVED. Full 22-column spec. v4.5.13.

---

v4.5.13 change notes:
- DI-65: `91_metric_lineage_log` full 22-column table specification formally defined (was documentation debt).
- DI-71: +2 columns (`formula_id`, `formula_version`) — formula-to-output traceability.
- DI-54 residual: +5 `source_research_table` dropdown values on `research_outcome_items`.
- `00_table_registry` row count: 149 (144+5) → 151 (146+5) — 2 new S300 tables registered.


================================================================================
<!-- MODULE: 02_S10_format.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 02_S10_format.md -->
<!-- Description: S10 Format Strategy — 6 tables (Phase 8 LOCKED) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 1377–1559 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S10 — FORMAT STRATEGY (Phase 8: LOCKED)
# ═══════════════════════════════════════

## S10-01 `format_inputs`
Purpose: Lean evaluation controls for format-level strategy. **S10 = FORMAT GATE** per Rule 23 — if `include_in_evaluation_flag = false`, all downstream computation for this format is skipped.
Grain: format (single-key) | Rows: ~3–6
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Single key. |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only — no computation impact. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project for this entity. NULL = global default from `14_periods_master`. CHECK(planning_horizon_months BETWEEN 1 AND 120). See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN | Whether computation engine processes this entity. false = skipped per Rule 23 cascade. Default: true. |
| `manual_review_required_flag` | input | BOOLEAN | Governance flag: outputs need human review. No computation impact — UI badge only. Auto-set trigger: `scope = directional OR S300 confidence < 0.5`. Default: true for new rows. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |

Constraints: UNIQUE(format_id, scenario, effective_from) — Rule 20. FK to `05_formats_master`. CHECK(planning_horizon_months BETWEEN 1 AND 120).
Gate annotation: S10 = gate section per Rule 23.
Lifecycle cascade: master archive → inputs archive.
Phase 8 review: +explicit data types, +FK constraint, +auto-set trigger, +UNIQUE Rule 20, +CHECK, +gate annotation, +lifecycle cascade. Lock ID: PHASE8-T01-LOCK. v4.3.2.


## S10-01b `format_research`
Purpose: AI-enabled market research context for Format Strategy. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
Grain: format (single-key) | Rows: ~3–6
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Single key. |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(format_id, scenario, effective_from) — Rule 20. Same gatekeeper as parent `_inputs` table.
AI Research Scope: Kitchen model benchmarks, operational cost ranges, format viability, industry reports, franchise databases
v4.5.0: New table. Pattern #22. Rule 25.
Outcome linkage: Field-level research results are stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. This table captures the research CONTEXT; outcome items capture the structured VALUES.
v4.5.1: +research_run_id. Outcome items linkage documented. Pattern #23. Rule 26.

## S10-02 `format_assumptions`
Purpose: Format lifecycle assumptions with direct S200 period-boundary impact. **Lean & Pure** — financial planning engine, not CRM/strategy scorecard (Phase 8 Decision 1: Option A).
Grain: format × market | Rows: ~15–30
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 2. 05j gatekeeper applies. |
| `pause_allowed_flag` | assumption | BOOLEAN | Whether the format can be temporarily paused in this market. Feeds S200 period-boundary logic. |
| `pause_trigger_assumption` | assumption | TEXT | Condition that would trigger a pause (e.g., 'orders < 20/day for 30 consecutive days'). App-level governance — captured for documentation, not computation. |
| `model_planned_end_date` | assumption | DATE | Assumed end date for this format in this market (NULL = indefinite). App-level validation: must be ≥ S30 market_assumptions.model_launch_date. |

Constraints: UNIQUE(format_id, market_id, scenario, effective_from) — Rule 20. FK to `05_formats_master`, `07_markets_master`. 05j gatekeeper: format × market pair must exist on `05j_format_market_map`.
Lifecycle cascade: master archive → assumptions archive.

Phase 8 restructure (Option A — Lean & Pure): 16 assumption columns → 3 columns.
| Action | Fields | Rationale |
|---|---|---|
| **Moved to S30** (DI-26) | tam_value, tam_unit, tam_basis, sam_value, sam_unit, sam_basis, som_value, som_unit, som_basis (9 fields) | TAM/SAM/SOM is market opportunity sizing — S30 is the natural owner. Rule 14 corrected. |
| **Killed — Rule 14 dup** | model_planned_start_date (1) | Duplicate of S30 market_assumptions.model_launch_date at same grain. |
| **Killed — zero S200 utility** | channel_fit_assumption, brand_fit_assumption, scalability_assumption (3) | Fed governance scores only. No S200 computation path. Strategic reasoning captured in format_inputs.notes. |
| **Retained** | pause_allowed_flag, pause_trigger_assumption, model_planned_end_date (3) | Lifecycle assumptions with direct S200 period-boundary impact. |

Lock ID: PHASE8-T02-LOCK. v4.3.2.

## S10-03 `format_decisions`
Purpose: Explicit human strategy commitments at format level. Contains CEO blanket-override power for launch dates via three-tier cascade (Phase 8 Decision 2: Option X).
Grain: format (single-key) | Rows: ~3–6
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Single key. |
| `manual_priority_override_rank` | decision | INTEGER | Human-assigned priority rank overriding computed scores. NULLABLE. |
| `selection_status_override` | decision | VARCHAR | Human override of computed selection status. **Managed dropdown:** selected / rejected / under_review / deferred. NULLABLE. |
| `launch_wave` | decision | VARCHAR | Phased rollout wave assignment. **Extensible managed dropdown:** wave_1 / wave_2 / wave_3 / pilot. NULLABLE. |
| `go_live_decision_date` | decision | DATE | Date when go-live was formally decided. Audit/governance date — no computation impact. NULLABLE. |
| `planned_start_date_override` | decision | DATE | **Format-level directive** overriding all S30 market launch dates. Three-tier cascade: S30 assumption → S10 directive → S30 exception (Tier 2). NULLABLE. |
| `pause_start_date_override` | decision | DATE | Human override: when to start a pause. App-level check: end ≥ start. NULLABLE. |
| `pause_end_date_override` | decision | DATE | Human override: when to end a pause. App-level check: end ≥ start. NULLABLE. |
| `planned_end_date_override` | decision | DATE | Human override of model_planned_end_date. NULLABLE. |
| `pause_decision_flag` | decision | BOOLEAN | Explicit human decision to pause this format. NOT NULL, default false. |
| `decision_notes` | decision | TEXT | Free-form notes explaining the decision rationale. NULLABLE. |

Dropdowns:
- `selection_status_override`: selected / rejected / under_review / deferred (managed)
- `launch_wave`: wave_1 / wave_2 / wave_3 / pilot (extensible managed)

Constraints: UNIQUE(format_id, scenario, effective_from) — Rule 20. FK to `05_formats_master`.

Three-Tier Start Date Cascade (Phase 8 architectural pattern):
```
TIER 1: S30 market_assumptions.model_launch_date        [market × format — assumption]
TIER 2: S10 format_decisions.planned_start_date_override [format — blanket directive]
TIER 3: S30 market_decisions.launch_date_override        [market × format — exception]

Resolution: Tier 3 > Tier 2 > Tier 1
S30 market_outputs.launch_date = resolved per market
S10 format_outputs.planned_start_date = MIN(all resolved market dates)
```

Lock ID: PHASE8-T03-LOCK. v4.3.2.

## S10-04 `format_outputs`
Purpose: Computed scores, rollups, and resolved lifecycle for format-level strategy. System-generated, not user-editable.
Grain: format (single-key) | Rows: ~3–6
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Single key. |
| `attractiveness_score` | output | DECIMAL(5,2) | Computed composite score (0–100) for market/format attractiveness. Sources: S30 cross-section consumption. |
| `whitespace_score` | output | DECIMAL(5,2) | Computed score indicating unmet demand opportunity. Sources: S30 cross-section consumption. |
| `feasibility_score` | output | DECIMAL(5,2) | Computed score for operational feasibility. **v4.5.10a (Audit B-06):** Inputs = S80 `projected_utilization_pct`, `lost_sales_pct`, `bottleneck_flag` (aggregated across streams/resources per format×market); S90 `productivity_utilization_pct`, `understaffed_flag`; S100/S110 rollups (when available). Formula: weighted composite, weights TBD Phase 16. |
| `operational_feasibility_rollup` | output | DECIMAL(5,2) | **v4.5.10a (Audit B-06):** Aggregated from S80: `AVG(projected_utilization_pct)` and `MAX(lost_sales_pct)` across all resources in all streams for this format. Higher utilization + higher lost sales = lower feasibility. Replaces undefined v3 `capacity_intensity_index` dependency (removed D15-09). |
| `capex_intensity_rollup` | output | DECIMAL(15,2) | Aggregated CapEx burden from S110 |
| `opex_intensity_rollup` | output | DECIMAL(15,2) | Aggregated OpEx burden from S100 |
| `manpower_complexity_rollup` | output | DECIMAL(5,2) | **v4.5.10a (Audit B-07):** Aggregated from S90: weighted function of `AVG(productivity_utilization_pct)`, count of roles with `understaffed_flag = TRUE`, `AVG(attrition_rate_annual_pct)` across all roles/streams for this format. Replaces undefined v3 `manpower_complexity_index` dependency (removed in Phase 15). |
| `competitor_count_rollup` | output | INTEGER | Count of competitors rolled up from lower market hierarchy |
| `tam_sam_som_consistency_flag` | output | BOOLEAN | Whether TAM ≥ SAM ≥ SOM holds (true/false). Sources: S30 cross-section consumption. |
| `projected_market_volume` | output | DECIMAL(15,2) | Computed total market volume from TAM/SAM/SOM analysis. Sources: S30 cross-section consumption. |
| `projected_market_value` | output | DECIMAL(15,2) | Computed total market value in ₹. Sources: S30 cross-section consumption. |
| `projected_orders_per_day` | output | DECIMAL(10,2) | SUM of S60 demand_outputs across active markets/streams/channels. S60 is SINGLE SOURCE (Rule 13) at format × stream × channel × market grain (D14-02). |
| `planned_start_date` | output | DATE | MIN(S30 market_outputs.launch_date) across all active markets for this format. Overridden by S10 planned_start_date_override via three-tier cascade. |
| `pause_start_date` | output | DATE | Resolved pause start date |
| `pause_end_date` | output | DATE | Resolved pause end date |
| `planned_end_date` | output | DATE | Resolved end date |
| `is_paused_flag` | output | BOOLEAN | Whether format is currently in paused state |
| `selection_status` | output | VARCHAR | Resolved selection: selected / rejected / under_review / deferred |
| `launch_wave` | output | VARCHAR | Phased rollout wave assignment |
| `selected_market_count` | output | INTEGER | Materialized convenience: COUNT of format_output_market_map rows for this format. |

Column count: 21 (was 22 in v4.3.1 — `strategic_fit_score` removed).

Phase 8 changes:
- **REMOVED: `strategic_fit_score`** — input sources (channel_fit, brand_fit) eliminated in Option A. Score with no inputs = dead weight.
- **REMOVED: `selected_collection_count`** — superseded by output map row count.
- `feasibility_score` KEPT — inputs narrowed to operational rollups (S80/S90/S100/S110).
- TAM/SAM/SOM fields: descriptions updated to reference S30 as source (cross-section consumption).
- `attractiveness_score`, `whitespace_score`: descriptions updated to reference S30.
- `projected_orders_per_day`: corrected to "SUM of S60 demand_outputs across active markets/streams/channels" (S60 is SINGLE SOURCE at format×stream×channel×market grain, D14-02).
- `planned_start_date`: resolution updated to three-tier cascade.
- `selected_market_count`: documented as materialized convenience.
- +Data types (DECIMAL, BOOLEAN, DATE, VARCHAR, INTEGER), +FK, +Rule 20 UNIQUE.

Constraints: UNIQUE(format_id, scenario, effective_from) — Rule 20. FK to `05_formats_master`.
Lock ID: PHASE8-T04-LOCK. v4.3.2.

## S10-05 `format_output_collection_map`
Purpose: Resolved collection assignments for each format. Output map per Rule 11 (outputs use sequence_no).
Grain: format × collection | Rows: ~12–20
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 1. |
| `collection_id` | key | FK (INTEGER) | FK to `01_collections_master.collection_id`. Composite key part 2. |
| `active_from` | output | DATE | Start date when this relationship becomes effective |
| `active_to` | output | DATE | End date (NULL = open-ended) |
| `sequence_no` | output | INTEGER | Sequential ordering for output map rows. Rule 11: outputs use sequence_no, bridges use priority_rank. |

Constraints: UNIQUE(format_id, collection_id, scenario, effective_from) — Rule 20. FK to `05_formats_master`, `01_collections_master`.
Lock ID: PHASE8-T05-LOCK. v4.3.2.

## S10-06 `format_output_market_map`
Purpose: Resolved market assignments for each format — the RESOLVED subset of `05j_format_market_map` after S10/S30 evaluation. Only format × market pairs active on 05j that passed evaluation appear here.
Grain: format × market | Rows: ~10–20
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 2. |
| `active_from` | output | DATE | Start date when this resolved relationship becomes effective |
| `active_to` | output | DATE | End date (NULL = open-ended) |
| `sequence_no` | output | INTEGER | Sequential ordering for output map rows. Rule 11: outputs use sequence_no. |

Constraints: UNIQUE(format_id, market_id, scenario, effective_from) — Rule 20. FK to `05_formats_master`, `07_markets_master`.
Gatekeeper note: Only format × market pairs active on `05j_format_market_map` that passed S10/S30 evaluation appear here.
Lock ID: PHASE8-T06-LOCK. v4.3.2.

---



================================================================================
<!-- MODULE: 03_S20_revenue_stream.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 03_S20_revenue_stream.md -->
<!-- Description: S20 Revenue Stream Strategy — 5 tables (Phase 11 LOCKED) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 1560–1710 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S20 — REVENUE STREAM STRATEGY (v4.5.0: moved from S50 | Phase 11: LOCKED)
# ═══════════════════════════════════════

## S20-01 `revenue_stream_inputs` — Lock ID: PHASE11-T01-LOCK 🔒
Grain: stream × format × market
| Column | Classification | Type | Description |
|---|---|---|---|
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only — no computation impact. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project for this entity. NULL = global default from 14_periods_master. CHECK(BETWEEN 1 AND 120). See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN NOT NULL DEFAULT true | Whether computation engine processes this entity. false = skipped per Rule 23 cascade. |
| `manual_review_required_flag` | input | BOOLEAN NOT NULL DEFAULT true | Governance flag: outputs need human review. No computation impact — UI badge only. Auto-set when scope=directional OR S300 confidence < 0.5. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions |

Constraints: UNIQUE(revenue_stream_id, format_id, market_id, scenario, effective_from) — Rule 20.
FK validation: All FKs must reference active master rows.
**05j gatekeeper:** format_id × market_id pair MUST exist on `05j_format_market_map` with overlapping validity window (DI-31 resolved for S20).
**06c gatekeeper:** stream × format pair MUST exist on `06c_revenue_stream_format_map`.
**Soft-gate annotation (Rule 23, D11-03):** S20 = SOFT-GATE. Partial stream exclusion → remaining streams re-normalize `expected_revenue_share_pct` to sum to 100%. Full exclusion → BLOCK S200. Warning to S300.
Lifecycle cascade: `06_revenue_streams_master` archive → `revenue_stream_inputs` archive. `05j_format_market_map` deactivation → matching rows deactivated.
v4.3.1: +`planning_horizon_months`. See Rule 24.
v4.5.5 (Phase 11): +data types, +FK constraints, +05j/06c gatekeepers (DI-31), +Rule 20 UNIQUE, +soft-gate annotation (D11-03), +lifecycle cascade. F11-01→F11-09.


## S20-01b `revenue_stream_research` — Lock ID: PHASE11-T01B-LOCK 🔒
Purpose: AI-enabled market research context for Revenue Stream Strategy. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
Grain: stream × format × market | Rows: ~10–30
| Column | Classification | Type | Description |
|---|---|---|---|
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(revenue_stream_id, format_id, market_id, scenario, effective_from) — Rule 20.
**05j gatekeeper + 06c gatekeeper** (DI-31 resolved for S20). Same as parent `_inputs` table.
AI Research Scope: Revenue model benchmarks, stream pricing trends, delivery fee market rates, platform take rate comparisons, subscription pricing studies, food delivery monetization reports (Zomato AR, Swiggy, RedSeer)
v4.5.0: New table. Pattern #22. Rule 25.
Outcome linkage: Field-level research results are stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. This table captures the research CONTEXT; outcome items capture the structured VALUES.
v4.5.1: +research_run_id. Outcome items linkage documented. Pattern #23. Rule 26.

## S20-02 `revenue_stream_assumptions` — Lock ID: PHASE11-T02-LOCK 🔒
Grain: stream × format × market | Purpose: stream-level economics for ALL streams; S70 owns per-product detail for product_sales (D11-02).
Pattern #19: NOT applicable (D11-01) — ~15–30 rows, unique per context. Flat assumptions table retained.
| Column | Classification | Type | Description |
|---|---|---|---|
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `expected_revenue_share_pct` | conditional | DECIMAL(5,2) | **RECLASSIFIED (F11-18):** assumption for non-product-sales streams (primary input); governance/reference for product_sales streams (actual share derivable from S70 product mix × pricing × S60 demand). S200 does NOT use this field for product_sales computation. |
| `expected_gross_aov_inr` | assumption | DECIMAL(10,2) | Expected gross AOV in ₹. **Primary pricing for non-product-sales streams.** NULL for product_sales streams (S70 derives). CHECK(> 0) when non-NULL. |
| `expected_discount_pct` | assumption | DECIMAL(5,2) | Expected discount %. **For non-product-sales/service component.** NULL for product_sales (S70 owns). CHECK(BETWEEN 0 AND 100). |
| `delivery_fee_inr` | assumption | DECIMAL(10,2) | Delivery fee charged per order in ₹. Ancillary income, ALL streams. CHECK(≥ 0). |
| `packaging_fee_inr` | assumption | DECIMAL(10,2) | Packaging fee charged per order in ₹. Ancillary income, ALL streams. CHECK(≥ 0). |
| `other_income_inr` | assumption | DECIMAL(10,2) | Other ancillary income per order in ₹. ALL streams. |
| `take_rate_pct` | assumption | DECIMAL(5,2) | Platform take rate %. Marketplace/franchise streams only. CHECK(BETWEEN 0 AND 100). |
| `model_active_from` | assumption | DATE | Assumed activation date for this **stream** in this context. |
| `model_active_to` | assumption | DATE | Assumed deactivation date (NULL = indefinite). |

| **`field_source_json`** | **assumptions** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **assumptions** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **assumptions** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: assumptions row → research run → outcome items. |
Constraints: UNIQUE(revenue_stream_id, format_id, market_id, scenario, effective_from) — Rule 20.
**05j gatekeeper + 06c gatekeeper** (DI-31 resolved for S20).
**S20/S70 Boundary (D11-02):** S20 owns stream-level economics. S70 owns per-product economics. Both exist for ALL streams, but S200 uses different pricing sources depending on stream type.
**Field scoping by stream type (F11-22):**

| Field | product_sales | product_sales_with_service | service_fee / subscription / catering / franchise / other |
|---|---|---|---|
| `expected_revenue_share_pct` | governance (derivable from S70) | governance | **assumption** (primary input) |
| `expected_gross_aov_inr` | NULL (S70 derives) | **assumption** (service component) | **assumption** (primary pricing) |
| `expected_discount_pct` | NULL (S70 owns) | **assumption** (service discount) | **assumption** (stream discount) |
| `delivery_fee_inr` | **assumption** (ancillary) | **assumption** (ancillary) | **assumption** (ancillary) |
| `packaging_fee_inr` | **assumption** (ancillary) | **assumption** (ancillary) | **assumption** (ancillary) |
| `other_income_inr` | **assumption** (ancillary) | **assumption** (ancillary) | **assumption** (ancillary) |
| `take_rate_pct` | NULL (not applicable) | NULL (not applicable) | **assumption** (marketplace/franchise only) |

**S200 routing (D11-02):**
- `product_sales` → revenue = Σ(S70 resolved_net_price × product_mix_share × S60 orders); ancillary = S20 fees per order
- `product_sales_with_service` → product = S70; service = S20 expected_gross_aov_inr × (1 − discount); ancillary = S20 fees
- Other streams → revenue = S20 expected_gross_aov_inr × (1 − discount) × S60 orders; ancillary = S20 fees

Lifecycle cascade: master archive → assumptions archive. 05j deactivation → deactivate matching rows.
v4.3.1 D2: removed `expected_net_aov_inr` → moved to S20-04 outputs as `resolved_net_aov_inr`.
v4 removed: `expected_growth_rate_pct` (→ S30 owns market growth).
v4.5.5 (Phase 11): +data types, +FK, +05j/06c gatekeepers, +Rule 20, +DI-36 RESOLVED (S20/S70 boundary D11-02), +field reclassification (F11-18), +scoping rules (F11-22), +validation rules (F11-24). F11-13→F11-24.

## S20-03 `revenue_stream_decisions` — Lock ID: PHASE11-T03-LOCK 🔒
Grain: stream × format × market
| Column | Classification | Type | Description |
|---|---|---|---|
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `selected_for_activation_flag` | decision | BOOLEAN NOT NULL DEFAULT true | Human decision: activate this **stream**. false = excluded from S200, triggers Rule 23 soft-gate cascade (D11-03). |
| `stream_priority_rank` | decision | INTEGER NULLABLE | Human-assigned priority among streams. UNIQUE within (format_id, market_id) among active streams. |
| `primary_stream_flag` | decision | BOOLEAN NOT NULL DEFAULT false | Exactly one true per format × market among active streams (`selected_for_activation_flag = true`). APP-LAYER validation. |
| `active_from_override` | decision | DATE NULLABLE | Human override of activation date. NULL = use assumption `model_active_from`. |
| `active_to_override` | decision | DATE NULLABLE | Human override of deactivation date. NULL = use assumption `model_active_to`. |
| `decision_notes` | decision | TEXT NULLABLE | Free-form notes explaining the decision rationale. |

Constraints: UNIQUE(revenue_stream_id, format_id, market_id, scenario, effective_from) — Rule 20.
**05j + 06c gatekeepers** (DI-31).
Lifecycle cascade: master archive → decisions archive. Inputs exclusion → decisions flagged for review.
v4.5.5 (Phase 11): +data types, +FK, +05j/06c gatekeepers, +Rule 20, +managed dropdowns, +override NULLABLE semantics, +lifecycle cascade. F11-25→F11-33.

## S20-04 `revenue_stream_outputs` — Lock ID: PHASE11-T04-LOCK 🔒
Grain: stream × format × market | Column count: 11 (was 8, +3 in Phase 11)
| Column | Classification | Type | Description |
|---|---|---|---|
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `projected_revenue_share_pct` | output | DECIMAL(5,2) | Resolved % of revenue from this stream. |
| `activation_status` | output | VARCHAR | Resolved state: active / inactive / pending. |
| `active_from` | output | DATE | Resolved start date (decision override > assumption). |
| `active_to` | output | DATE NULLABLE | Resolved end date (decision override > assumption). NULL = open-ended. |
| `resolved_net_aov_inr` | output | DECIMAL(10,2) | = expected_gross_aov_inr × (1 − expected_discount_pct). For non-product-sales streams only. v4.3.1 D2: moved from S20-02 assumptions. |
| **`resolved_delivery_fee_inr`** | **output** | **DECIMAL(10,2)** | **Resolved delivery fee (from assumption or decision override). Consumed by S200 for ancillary revenue per order. (F11-37)** |
| **`resolved_packaging_fee_inr`** | **output** | **DECIMAL(10,2)** | **Resolved packaging fee. Consumed by S200 for ancillary revenue per order. (F11-37b)** |
| **`pricing_source_section`** | **output** | **VARCHAR** | **Which section provides revenue pricing for this stream. Computed: 'S70' when revenue_stream_type = product_sales, 'S20' for non-product-sales, 'S70+S20' for product_sales_with_service. Traceability for S200 routing. (F11-37c)** |

Constraints: UNIQUE(revenue_stream_id, format_id, market_id, scenario, effective_from) — Rule 20.
**S200 consumption from S20 outputs:**
```
resolved_net_aov_inr         → S200 revenue_output (non-product-sales streams)
resolved_delivery_fee_inr     → S200 revenue_output (ancillary, ALL streams)
resolved_packaging_fee_inr    → S200 revenue_output (ancillary, ALL streams)
projected_revenue_share_pct   → S200 (governance check, not computation for product_sales)
activation_status             → S200 (skip inactive streams)
pricing_source_section        → S200 (routing: 'S70' vs 'S20')
```
v4 removed: projected_gross_revenue_inr, projected_net_revenue_inr, projected_orders_per_day, net_realization_per_order_inr (→ S70/S200 own).
v4.3.1 D2: +`resolved_net_aov_inr` (moved from S20-02).
v4.5.5 (Phase 11): +data types, +FK, +Rule 20, +`resolved_delivery_fee_inr`, +`resolved_packaging_fee_inr`, +`pricing_source_section`, +S200 consumption map. F11-34→F11-38.

---



================================================================================
<!-- MODULE: 04_S30_market.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 04_S30_market.md -->
<!-- Description: S30 Market Strategy — 11 tables (Phase 10 LOCKED + Waves) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 1711–2412 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S30 — MARKET STRATEGY (Phase 10: LOCKED + v4.5.2 Wave Expansion Engine)
# ═══════════════════════════════════════

## S30-01 `market_inputs`
Purpose: Evaluation controls for market strategy. **S30 = MARKET GATE** per Rule 23 — if `include_in_evaluation_flag = false`, all downstream computation for this format × market is skipped.
Grain: market × format | Rows: ~15–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 2. 05j gatekeeper: pair must exist on `05j_format_market_map`. |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only — no computation impact. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project. NULL = global default from `14_periods_master`. CHECK(BETWEEN 1 AND 120). See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN | Whether computation engine processes this entity. false = skipped per Rule 23 cascade. Default: true. |
| `manual_review_required_flag` | input | BOOLEAN | Governance flag. Auto-set trigger: `scope = directional OR S300 confidence < 0.5`. Default: true for new rows. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions |

Constraints: UNIQUE(market_id, format_id, scenario, effective_from) — Rule 20. FK to `07_markets_master`, `05_formats_master`. 05j gatekeeper: format × market pair must exist on `05j_format_market_map`. CHECK(planning_horizon_months BETWEEN 1 AND 120).
Gate annotation: S30 = MARKET GATE per Rule 23.
S200 wave-aware computation (Rule 27 + Rule 23):
```
PRE-CHECK: Is the market's wave active? (market_expansion_waves.wave_status = 'active')
  NO  → market NOT YET in computation. S200 skips entirely.
  YES → proceed to S30 gate check
  
S30 GATE: include_in_evaluation_flag = true?
  NO  → market EXCLUDED. S200 skips.
  YES → proceed to three-tier launch date check
  
LAUNCH DATE: Has the resolved launch_date been reached?
  NO  → market NOT YET launched. S200 skips for this period.
  YES → compute revenue for this market × format × period.
```


Lifecycle cascade: master archive → inputs archive.
Lock ID: PHASE10-T01-LOCK. v4.4.1.


## S30-01b `market_research`
Purpose: AI-enabled market research context for Market Strategy. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
Grain: market × format | Rows: ~15–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. 05j gatekeeper. |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(market_id, format_id, scenario, effective_from) — Rule 20. Same gatekeeper as parent `_inputs` table.
AI Research Scope: Population, GDP, food delivery penetration, competitor count, rent benchmarks, TAM/SAM/SOM — Census, RBI, RedSeer, Zomato city reports
v4.5.0: New table. Pattern #22. Rule 25.
Outcome linkage: Field-level research results are stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. This table captures the research CONTEXT; outcome items capture the structured VALUES.
v4.5.1: +research_run_id. Outcome items linkage documented. Pattern #23. Rule 26.

## S30-02 `market_assumptions`
Purpose: Market demographics, economics, competitive landscape, and opportunity sizing. **S30 OWNS market growth, competitive pressure, whitespace, demand density, AND TAM/SAM/SOM** (Rule 14 — ownership corrected from S10 in Phase 8, fields landed in Phase 10 per DI-26).
Grain: market × format | Rows: ~15–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 2. 05j gatekeeper. |
| `population` | assumption | INTEGER | Total population in this market. Market-level fact (same for all formats in a market — app-level consistency enforced). |
| `households` | assumption | INTEGER | Total number of households. Market-level fact. |
| `gdp_per_capita_inr` | assumption | DECIMAL(12,2) | GDP per capita in ₹ — economic indicator. Market-level fact. |
| `food_delivery_penetration_pct` | assumption | DECIMAL(5,2) | % of population/households using food delivery services. Market-level fact. Range: 0–100. |
| `benchmark_aov_inr` | reference | DECIMAL(10,2) | External reference AOV in ₹ for this market. Validation only, not computation — Rule 15. |
| `benchmark_rent_per_sqft_inr` | reference | DECIMAL(10,2) | External reference rent per sq ft in ₹. Validation only — Rule 15. |
| `labor_availability_index` | assumption | DECIMAL(3,2) | Index (0.00–1.00) indicating ease of hiring. Market-level fact. CHECK(BETWEEN 0 AND 1). |
| `market_growth_rate_pct` | assumption | DECIMAL(5,2) | Expected annual market growth rate %. **S30 OWNS this (Rule 14).** Format × market specific. |
| `competitive_pressure_assumption` | assumption | VARCHAR | Qualitative competitive intensity. **Dropdown:** low / medium / high / intense. Format × market specific. |
| `whitespace_evidence_strength` | assumption | VARCHAR | Strength of evidence for unmet demand. **Dropdown:** weak / moderate / strong. |
| `demand_density_assumption` | assumption | VARCHAR | Expected order density per sq km. **Dropdown:** low / medium / high. |
| `infrastructure_readiness_assumption` | assumption | VARCHAR | Readiness of delivery/kitchen infrastructure. **Dropdown:** poor / adequate / good / excellent. |
| `tam_value` | assumption | DECIMAL(15,2) | **Total Addressable Market** value for this format × market. DI-26 landed. S30 OWNS (Rule 14). |
| `tam_unit` | assumption | VARCHAR | Unit for TAM. **Dropdown:** inr_cr_annual / inr_lakh_annual / inr_annual / orders_annual / orders_monthly / units_annual. |
| `tam_basis` | assumption | VARCHAR | Methodology for TAM. **Dropdown:** top_down_industry_report / top_down_gov_data / bottom_up_outlet_model / bottom_up_population_model / bottom_up_order_model / analog_benchmark / internal_actuals / expert_estimate / blended. |
| `sam_value` | assumption | DECIMAL(15,2) | **Serviceable Addressable Market** value. |
| `sam_unit` | assumption | VARCHAR | Unit for SAM (same dropdown as tam_unit). |
| `sam_basis` | assumption | VARCHAR | Methodology for SAM (same dropdown as tam_basis). |
| `som_value` | assumption | DECIMAL(15,2) | **Serviceable Obtainable Market** value — the realistic capture target. |
| `som_unit` | assumption | VARCHAR | Unit for SOM (same dropdown as tam_unit). |
| `som_basis` | assumption | VARCHAR | Methodology for SOM (same dropdown as tam_basis). |
| `model_launch_date` | assumption | DATE | **TIER 1 of three-tier start date cascade.** Assumed launch date for this format in this market. S10 `planned_start_date_override` (Tier 2) can blanket-override all markets. S30 `launch_date_override` (Tier 3) is the market-specific exception. Resolution: Tier 3 > Tier 2 > Tier 1. |
| **`field_source_json`** | **assumptions** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **assumptions** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **assumptions** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: assumptions row → research run → outcome items. |

Dropdowns:
- `competitive_pressure_assumption`: low / medium / high / intense
- `whitespace_evidence_strength`: weak / moderate / strong
- `demand_density_assumption`: low / medium / high
- `infrastructure_readiness_assumption`: poor / adequate / good / excellent
- TAM/SAM/SOM `*_basis`: top_down_industry_report / top_down_gov_data / bottom_up_outlet_model / bottom_up_population_model / bottom_up_order_model / analog_benchmark / internal_actuals / expert_estimate / blended
- TAM/SAM/SOM `*_unit`: inr_cr_annual / inr_lakh_annual / inr_annual / orders_annual / orders_monthly / units_annual

Constraints: UNIQUE(market_id, format_id, scenario, effective_from) — Rule 20. FK validation. 05j gatekeeper. labor_availability_index BETWEEN 0 AND 1. food_delivery_penetration_pct BETWEEN 0 AND 100.
Lifecycle cascade: master archive → assumptions archive.

Grain note (D10-02): Demographics (population, households, GDP, food_delivery_penetration, benchmark_aov, benchmark_rent, labor_availability) are market-level facts identical across formats. App enforces consistency. Split to market-only grain deferred to v5 (DI-49).

Column count: 23 (was 14 in v4.4.0 — +9 TAM/SAM/SOM from DI-26).
v4 history: TAM/SAM/SOM moved to S10 (v4.0), moved back to S30 (v4.3.2 Phase 8 Rule 14 correction), landed Phase 10 (v4.4.1). ramp_months_assumption → S70 (v4.0, correct).
Lock ID: PHASE10-T02-LOCK. v4.4.1.

## S30-03 `market_decisions`
Purpose: Explicit human strategy commitments at market × format grain. Contains Tier 3 of the three-tier start date cascade (market-specific exception).
Grain: market × format | Rows: ~15–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 2. 05j gatekeeper. |
| `selection_status_override` | decision | VARCHAR | Human override of computed market selection status. **Managed dropdown:** selected / rejected / under_review / deferred. NULLABLE. Same name as S10 field — table context provides disambiguation (D10-03). |
| `launch_wave` | decision | VARCHAR | Phased rollout wave assignment. **Extensible managed dropdown:** wave_1 / wave_2 / wave_3 / pilot. NULLABLE. |
| `launch_priority_rank` | decision | INTEGER | Human-assigned launch priority across markets for this format. NULLABLE. |
| `launch_date_override` | decision | DATE | **TIER 3 of three-tier start date cascade.** Market-specific exception — overrides both Tier 1 (S30 model_launch_date) and Tier 2 (S10 planned_start_date_override) for this market. NULLABLE. |
| `outlets_planned` | decision | INTEGER | Human decision: number of outlets planned for this market. Must be ≥ 1 when set. NULLABLE. |
| `gate_1_trigger_name` | decision | VARCHAR | First launch gate metric. **Managed dropdown:** brand_awareness_pct / pilot_orders_per_day / competitor_density / infrastructure_score / min_population / custom. NULLABLE. |
| `gate_1_trigger_value` | decision | DECIMAL(10,2) | Threshold value that gate 1 must reach before launch proceeds. NULLABLE. |
| `gate_2_trigger_name` | decision | VARCHAR | Second launch gate metric. Same dropdown as gate_1. NULLABLE. |
| `gate_2_trigger_value` | decision | DECIMAL(10,2) | Threshold value for gate 2. NULLABLE. |
| `decision_notes` | decision | TEXT | Free-form notes explaining the decision rationale. NULLABLE. |

Dropdowns:
- `selection_status_override`: selected / rejected / under_review / deferred (managed)
- `launch_wave`: wave_1 / wave_2 / wave_3 / pilot (extensible managed)
- `gate_*_trigger_name`: brand_awareness_pct / pilot_orders_per_day / competitor_density / infrastructure_score / min_population / custom (managed)

Constraints: UNIQUE(market_id, format_id, scenario, effective_from) — Rule 20. FK validation. 05j gatekeeper. outlets_planned ≥ 1 when non-NULL. All decision fields NULLABLE except keys.
Lifecycle cascade: master archive → decisions archive.

Three-tier start date cascade context:
```
This table holds TIER 3 (launch_date_override):
  Tier 3 > Tier 2 > Tier 1
  market exception > format directive > market assumption
```

v4 removed: ramp_months_override (→ S70 owns). v4.1 added: 4 gate trigger columns.
Lock ID: PHASE10-T03-LOCK. v4.4.1.

## S30-04 `market_outputs`
Purpose: Market attractiveness scores, TAM/SAM/SOM consistency, and selection status. System-generated, not user-editable. **S10 format_outputs consumes these via cross-section rollup** (SUM/MIN/AND across markets).
Grain: market × format | Rows: ~15–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 2. 05j gatekeeper. |
| `attractiveness_score` | output | DECIMAL(5,2) | Computed composite score (0–100) for market/format attractiveness. Consumed by S10 format_outputs (rollup). |
| `whitespace_score` | output | DECIMAL(5,2) | Computed score indicating unmet demand opportunity. Consumed by S10 format_outputs (rollup). |
| `strategic_fit_score` | output | DECIMAL(5,2) | Computed score for alignment with company strategy. Inputs: competitive_pressure, whitespace, demand_density, infrastructure_readiness from S30 assumptions. VALID (unlike S10 which lost its inputs in Phase 8). |
| `feasibility_score` | output | DECIMAL(5,2) | Computed score for operational feasibility. |
| `competitor_count_rollup` | output | INTEGER | Count of competitors rolled up from lower market hierarchy. |
| `tam_sam_som_consistency_flag` | output | BOOLEAN | Whether TAM ≥ SAM ≥ SOM holds (true/false). **S30 now owns TAM/SAM/SOM** — consistency check computed here. S10 format_outputs consumes via AND across markets (all markets consistent → format consistent). |
| `projected_market_volume` | output | DECIMAL(15,2) | Computed market volume from TAM/SAM/SOM at market × format grain. S10 format_outputs.projected_market_volume = SUM across markets. |
| `projected_market_value_inr` | output | DECIMAL(15,2) | Computed market value in ₹ at market × format grain. S10 format_outputs.projected_market_value = SUM across markets. |
| `launch_date` | output | DATE | Resolved per three-tier cascade: Tier 3 (S30 launch_date_override) > Tier 2 (S10 planned_start_date_override) > Tier 1 (S30 model_launch_date). S10 format_outputs.planned_start_date = MIN(all S30 market launch_dates). |
| `outlets_resolved` | output | INTEGER | Final outlet count (from planned or computed). |
| `selection_status` | output | VARCHAR | Resolved selection: selected / rejected / under_review / deferred. |
| `launch_wave` | output | VARCHAR | Resolved rollout wave. |
| `market_rank` | output | INTEGER | Computed priority rank among all markets for this format. |

Column count: 15 (was 12 in v4.4.0 — +tam_sam_som_consistency_flag, +projected_market_volume, +projected_market_value_inr).

Constraints: UNIQUE(market_id, format_id, scenario, effective_from) — Rule 20. FK validation. 05j gatekeeper.
Lifecycle cascade: master archive → outputs archive.

S10 cross-section consumption map:
```
S30 market_outputs.attractiveness_score     → S10 format_outputs.attractiveness_score (rollup)
S30 market_outputs.whitespace_score         → S10 format_outputs.whitespace_score (rollup)
S30 market_outputs.tam_sam_som_consistency   → S10 format_outputs.tam_sam_som_consistency (AND)
S30 market_outputs.projected_market_volume  → S10 format_outputs.projected_market_volume (SUM)
S30 market_outputs.projected_market_value   → S10 format_outputs.projected_market_value (SUM)
S30 market_outputs.launch_date              → S10 format_outputs.planned_start_date (MIN)
```

v4 removed: projected_monthly_orders, projected_monthly_revenue_inr, projected_steady_state_orders (→ S70/S200 own).
v4.4.1: +tam_sam_som_consistency_flag, +projected_market_volume, +projected_market_value_inr (TAM/SAM/SOM ownership landed per DI-26).
Lock ID: PHASE10-T04-LOCK. v4.4.1.

---


---

### S30 Market Expansion Engine (v4.5.2 — Pattern #24, Rule 27)

The market expansion engine models how a business grows geographically through performance-gated waves at three hierarchy levels. This is the DYNAMIC SEQUENCING layer on top of the static market evaluation (S30-01 through S30-04).

```
THREE INDEPENDENT CASCADES RUNNING SIMULTANEOUSLY:

CLUSTER LEVEL (regions):
  Cluster Wave 1: South India ──[performance]──▶ Cluster Wave 2: West India ──▶ ...

MACRO LEVEL (cities within each active cluster):
  Macro Wave 1: Bangalore ──[performance]──▶ Macro Wave 2: Chennai ──▶ Macro Wave 3: Hyderabad

MICRO LEVEL (neighborhoods within each active city):
  Micro Wave 1: Koramangala ──[performance]──▶ Micro Wave 2: Indiranagar, HSR ──▶ Micro Wave 3: Whitefield, EC

TRIGGER FLOWS:
  ① Same-level: micro W1 perf → micro W2 (within same city)
  ② Upward:     city micro aggregate → next macro wave (next city)
  ③ Upward:     region macro aggregate → next cluster wave (next region)
```

## S30-05 `expansion_trigger_criteria_master`
Purpose: Standardized metric definitions for wave expansion triggers. **Single source of truth** for what can be measured, where each metric lives in the schema, how it's computed, and how it behaves at each market hierarchy level. Every trigger metric is an FK to this master — no ad-hoc strings. Extensible (new criteria added as the business evolves).
Grain: criterion (single-key) | Rows: ~15–30
| Column | Classification | Type | Description |
|---|---|---|---|
| `criterion_id` | master | INTEGER | Auto-generated PK. |
| `criterion_code` | master | VARCHAR(20) | Short code (e.g., 'ORD_PER_DAY', 'CM1_PCT'). **UNIQUE.** Uppercase + underscore. |
| `criterion_name` | master | VARCHAR | Display name (e.g., 'Orders Per Day'). **UNIQUE.** |
| `criterion_description` | master | TEXT | What this metric measures, how it's computed, and when to use it. **NOT NULL.** |
| `source_section` | master | VARCHAR | Which section provides this metric. **Dropdown:** S10 / S20 / S30 / S40 / S50 / S60 / S70 / S80 / S200. |
| `source_table` | master | VARCHAR | Output table name (e.g., 'demand_outputs'). Must exist in `00_table_registry`. |
| `source_field` | master | VARCHAR | Column on source table (e.g., 'projected_orders_per_day'). |
| `computation_formula` | master | TEXT | How the raw metric is derived from the source field, including any transformations. NULLABLE — NULL means direct read from source_field. Example: 'SUM(revenue_output.net_revenue_inr) / COUNT(DISTINCT period_id) for daily average'. |
| `metric_unit` | master | VARCHAR | **Dropdown:** count / count_per_day / percentage / inr / inr_per_day / inr_per_month / ratio / index / days / months. |
| `metric_direction` | master | VARCHAR | **Dropdown:** higher_is_better / lower_is_better. Drives default operator (gte vs lte) and UI color coding (green=good, red=bad). |
| `default_threshold_type` | master | VARCHAR | Default way to evaluate this metric. **Dropdown:** absolute / growth_rate_pct / trend_direction / sustained_minimum. See threshold type definitions. Overridable per trigger metric. |
| `default_operator` | master | VARCHAR | Default comparison. **Dropdown:** gte (≥) / lte (≤) / eq (=) / between / gt (>) / lt (<). Auto-derived from metric_direction if not set: higher_is_better → gte, lower_is_better → lte. |
| `default_aggregation_micro` | master | VARCHAR | How to aggregate at micro level (within a macro market). **Dropdown:** per_market_avg / per_market_min / per_market_max / per_market_median / wave_total / pct_of_markets_above. |
| `default_aggregation_macro` | master | VARCHAR | How to aggregate at macro level (across micro markets within a cluster). Dropdown same as above. May differ from micro (e.g., micro=avg, macro=sum). |
| `default_aggregation_cluster` | master | VARCHAR | How to aggregate at cluster level (across macro markets). Dropdown same as above. |
| `default_sustain_days` | master | INTEGER | Default consecutive days the condition must hold. Prevents trigger on spikes. Default: 14. |
| `default_evaluation_window_days` | master | INTEGER | Default lookback period for computing the metric (rolling average/growth rate). Default: 30. NULL = use latest snapshot only. |
| `valid_range_min` | master | DECIMAL(15,4) | Minimum valid threshold value. NULL = no floor. |
| `valid_range_max` | master | DECIMAL(15,4) | Maximum valid threshold value. NULL = no ceiling. |
| `sort_order` | master | INTEGER | Display position. **UNIQUE.** |

Dropdowns:
- `source_section`: S10 / S20 / S30 / S40 / S50 / S60 / S70 / S80 / S200
- `metric_unit`: count / count_per_day / percentage / inr / inr_per_day / inr_per_month / ratio / index / days / months
- `metric_direction`: higher_is_better / lower_is_better
- `default_threshold_type`: absolute / growth_rate_pct / trend_direction / sustained_minimum
- `default_operator`: gte / lte / eq / between / gt / lt
- `default_aggregation_*`: per_market_avg / per_market_min / per_market_max / per_market_median / wave_total / pct_of_markets_above

Threshold type definitions:
```
absolute:           Compare current (aggregated) value against threshold.
                    "orders_per_day ≥ 80"

growth_rate_pct:    Compare period-over-period % change against threshold.
                    "orders_per_day growing ≥ 5% week-over-week"
                    Uses evaluation_window_days to define the comparison period.

trend_direction:    Is the metric trending up/down/flat over the evaluation window?
                    threshold_value encodes direction: +1 = upward, -1 = downward, 0 = flat.
                    "CM1% trending upward over 30 days"

sustained_minimum:  Value must stay ABOVE threshold for EVERY DAY in the sustain period.
                    Stricter than absolute (which allows the average to meet threshold).
                    "orders_per_day ≥ 50 EVERY DAY for 14 consecutive days"
```

Constraints: `criterion_code` UNIQUE, `criterion_name` UNIQUE, `sort_order` UNIQUE, `criterion_description` NOT NULL. `source_table` must exist in `00_table_registry`. `default_aggregation_micro/macro/cluster` NOT NULL.

Seed criteria (15 records):

| # | Code | Name | Source | Table | Field | Unit | Direction | Threshold Type | Agg (micro) | Agg (macro) | Agg (cluster) | Sustain | Window |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ORD_PER_DAY | Orders Per Day | S60 | demand_outputs | projected_orders_per_day | count_per_day | higher_is_better | absolute | per_market_avg | wave_total | wave_total | 14 | 30 |
| 2 | NET_ORD_PER_DAY | Net Orders Per Day | S60 | demand_outputs | projected_net_orders_per_day | count_per_day | higher_is_better | sustained_minimum | per_market_avg | wave_total | wave_total | 14 | 30 |
| 3 | CM1_PCT | CM1 Margin % | S70 | product_economics_outputs | unit_contribution_margin_pct | percentage | higher_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 14 | 30 |
| 4 | UNIT_CONTRIB_INR | Unit Contribution ₹ | S70 | product_economics_outputs | unit_contribution_inr | inr | higher_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 14 | 30 |
| 5 | REPEAT_RATE_PCT | Repeat Purchase Rate % | S50 | marketing_outputs | ltv_to_cac_ratio | percentage | higher_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 14 | 30 |
| 6 | CAC_INR | Customer Acquisition Cost ₹ | S50 | marketing_outputs | blended_cac_inr | inr | lower_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 14 | 30 |
| 7 | LTV_CAC_RATIO | LTV:CAC Ratio | S50 | marketing_outputs | ltv_to_cac_ratio | ratio | higher_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 14 | 30 |
| 8 | REV_PER_DAY_INR | Revenue Per Day ₹ | S200 | revenue_output | net_revenue_inr | inr_per_day | higher_is_better | absolute | per_market_avg | wave_total | wave_total | 14 | 30 |
| 9 | REV_GROWTH_PCT | Revenue Growth % WoW | S200 | revenue_output | net_revenue_inr | percentage | higher_is_better | growth_rate_pct | per_market_avg | per_market_avg | per_market_avg | 7 | 14 |
| 10 | DEMAND_RAMP_PCT | Demand Ramp Completion % | S60 | demand_outputs | demand_ramp_month | percentage | higher_is_better | absolute | per_market_min | pct_of_markets_above | pct_of_markets_above | 0 | NULL |
| 11 | ATTRACT_SCORE | Market Attractiveness Score | S30 | market_outputs | attractiveness_score | index | higher_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 0 | NULL |
| 12 | WHITESPACE_SCORE | Whitespace Score | S30 | market_outputs | whitespace_score | index | higher_is_better | absolute | per_market_avg | per_market_avg | per_market_avg | 0 | NULL |
| 13 | GRAD_RATE_PCT | Wave Graduation Rate % | S30 | market_expansion_outputs | graduation_rate_pct | percentage | higher_is_better | absolute | wave_total | wave_total | wave_total | 0 | NULL |
| 14 | CM1_TREND | CM1 Margin Trend | S70 | product_economics_outputs | unit_contribution_margin_pct | index | higher_is_better | trend_direction | per_market_avg | per_market_avg | per_market_avg | 0 | 30 |
| 15 | DAYS_SINCE_LAUNCH | Days Since Wave Launch | S30 | market_expansion_waves | activated_at | days | higher_is_better | absolute | wave_total | wave_total | wave_total | 0 | NULL |

v4.5.4: Enhanced from v4.5.3. +computation_formula, +metric_direction, +default_threshold_type, +default_operator, +level-specific aggregation (micro/macro/cluster), +default_evaluation_window_days. 15 seed criteria (was 12).



## S30-06 `market_expansion_waves`
Purpose: Wave definitions at all three hierarchy levels. A wave is a planned batch of market launches at a specific level. Waves are format-specific (Cloud Kitchen expansion plan ≠ Spoke expansion plan). Pattern #24, Rule 27.
Grain: format × parent_market × market_level × wave_number (one row per wave) | Rows: ~20–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `wave_id` | system | INTEGER | Auto-generated PK — unique identifier for this expansion wave. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Waves are format-specific. |
| `parent_market_id` | key | FK (INTEGER) | FK to `07_markets_master`. The containing market: cluster for macro waves, macro for micro waves. **NULL for cluster-level waves** (top of hierarchy). |
| `market_level` | key | VARCHAR | Which hierarchy level this wave operates at. **Dropdown:** cluster / macro / micro. Must match `07_markets_master.market_level` of assigned members. |
| `wave_number` | key | INTEGER | Sequential wave number within this format × parent × level (1, 2, 3...). Wave 1 is always the pilot/seed. |
| `wave_name` | detail | VARCHAR | Human-readable label (e.g., 'BLR Micro Wave 2 — Inner Ring Road'). |
| `wave_description` | detail | TEXT | Strategic rationale for this wave composition. |
| `planned_market_count` | detail | INTEGER | Target number of markets in this wave. Must be ≥ 1. |
| `min_markets_to_proceed` | detail | INTEGER | Minimum markets that must be ready before wave activates. Default: 1. Prevents partial launches below critical mass. |
| `planned_start_date` | detail | DATE | Earliest planned activation date. Actual start depends on trigger conditions being met. |
| `max_wave_duration_months` | detail | INTEGER | Maximum months for this wave to run before escalation review. NULL = no limit. |
| `ranking_method` | detail | VARCHAR | How markets are ranked for wave assignment. **Dropdown:** attractiveness / whitespace / composite / manual. `composite` uses weights below. `manual` = human assigns without scoring. Default: composite. |
| `attractiveness_weight` | detail | DECIMAL(3,2) | Weight for attractiveness_score in composite ranking. Default: 0.50. Only used when ranking_method = 'composite'. Must sum with whitespace_weight to 1.00. |
| `whitespace_weight` | detail | DECIMAL(3,2) | Weight for whitespace_score in composite ranking. Default: 0.50. Only used when ranking_method = 'composite'. |
| `score_threshold_min` | detail | DECIMAL(5,2) | Minimum composite score to be eligible for this wave. Markets below this score are auto-deferred. NULL = no minimum. |
| `wave_status` | detail | VARCHAR | **Dropdown:** planned / trigger_pending / active / completed / paused / cancelled. See Rule 27 lifecycle. |
| `activated_at` | detail | DATE | When wave actually activated (all triggers met + human approval). NULL until active. |
| `completed_at` | detail | DATE | When all markets in wave reached steady state or were evaluated. NULL until completed. |

Dropdowns:
- `market_level`: cluster / macro / micro
- `wave_status`: planned / trigger_pending / active / completed / paused / cancelled

Constraints: UNIQUE(format_id, parent_market_id, market_level, wave_number, scenario, effective_from) — Rule 20. `wave_number` sequential within group (no gaps). `planned_market_count` ≥ 1. FK to `05_formats_master`, `07_markets_master`.

Wave lifecycle:
```
planned → trigger_pending (triggers defined) → active (all triggers met) → completed (all markets evaluated)
                                                  ↓                              ↓
                                               paused ◀──────────────────── cancelled
```

v4.5.2: New table. Pattern #24. Rule 27.
AND/OR condition group logic (v4.5.3):
```
EXAMPLE TRIGGER with 2 groups:
  Group 1: ORD_PER_DAY ≥ 80 (avg, 14d)  AND  CM1_PCT ≥ 35% (avg, 14d)
  Group 2: REV_PER_DAY ≥ ₹50,000 (sum, 14d)

  Resolution: Group 1 satisfied OR Group 2 satisfied → trigger fires
  
  Within each group: ALL metrics must be met (AND)
  Across groups: ANY group fully met is sufficient (OR)
  
  This allows: "either prove unit economics OR prove raw revenue scale"
```

v4.5.3: metric_name → criterion_id FK. +condition_group (AND/OR logic).

---

### Worked Examples: Trigger Configurations at All Three Levels

#### EXAMPLE A: Micro Wave Advancement (Koramangala → Indiranagar + HSR)

**Trigger:** BLR Micro W1 → BLR Micro W2
**Direction:** same_level_sequential | **Logic:** and_or_groups | **Human Approval:** true
**Min Source Wave Age:** 60 days | **Pct Graduated Markets:** 100% (pilot must graduate)

| Group | Label | Criterion | Operator | Threshold | Aggregation | Sustain | Window | Reads As |
|---|---|---|---|---|---|---|---|---|
| 1 | Unit Economics Path | ORD_PER_DAY | gte | 80 | per_market_avg | 14d | 30d | Avg orders ≥ 80/day for 14 consecutive days |
| 1 | | CM1_PCT | gte | 35.0 | per_market_avg | 14d | 30d | AND avg CM1 ≥ 35% for 14 days |
| 1 | | REPEAT_RATE_PCT | gte | 30.0 | per_market_avg | 14d | 30d | AND repeat rate ≥ 30% for 14 days |
| 2 | Revenue Scale Path | REV_PER_DAY_INR | gte | 60000 | wave_total | 14d | 30d | OR total revenue ≥ ₹60K/day for 14 days |
| 2 | | NET_ORD_PER_DAY | gte | 70 | per_market_avg | 14d | 30d | AND net orders ≥ 70/day for 14 days |

**Evaluation:** `(Group 1 all met) OR (Group 2 all met)` → trigger fires → human reviews → approves → Micro W2 activates

```
Scenario: Koramangala pilot (Week 1–12)
  Week 4:  orders=45, cm1=28% → Group 1: ✗, Group 2: ✗
  Week 8:  orders=72, cm1=33%, revenue=₹48K → Group 1: ✗, Group 2: ✗
  Week 10: orders=85, cm1=36%, repeat=32%, sustained 14d → Group 1: ✓ ALL MET
  → Trigger fires. Human approves. Micro W2 (Indiranagar + HSR) activates.
```

#### EXAMPLE B: Macro Wave Advancement (Bangalore → Chennai)

**Trigger:** BLR Micro aggregate → South India Macro W2 (opens Chennai)
**Direction:** upward_aggregate | **Logic:** and_or_groups | **Human Approval:** true
**Min Source Wave Age:** 90 days | **Pct Graduated Markets:** 70% (≥70% of BLR micros graduated)

| Group | Label | Criterion | Operator | Threshold | Aggregation | Sustain | Window | Reads As |
|---|---|---|---|---|---|---|---|---|
| 1 | City Maturity | GRAD_RATE_PCT | gte | 70.0 | wave_total | 0 | NULL | ≥70% of BLR micro markets graduated |
| 1 | | ORD_PER_DAY | gte | 300 | wave_total | 30d | 30d | AND total BLR orders ≥ 300/day for 30 days |
| 1 | | CM1_PCT | gte | 30.0 | per_market_avg | 30d | 30d | AND avg CM1 across BLR micros ≥ 30% for 30 days |
| 1 | | LTV_CAC_RATIO | gte | 2.5 | per_market_avg | 14d | 30d | AND avg LTV:CAC ≥ 2.5 |
| 1 | | DAYS_SINCE_LAUNCH | gte | 90 | wave_total | 0 | NULL | AND at least 90 days since BLR Micro W1 launched |

**Evaluation:** All Group 1 metrics met (single AND group) → trigger fires → human reviews → approves → Chennai Macro W2 activates → Chennai Micro W1 auto-creates

```
Scenario: Bangalore expansion (Month 1–10)
  Month 4:  Micro W2 active. 3/3 micros launched. grad_rate=33%, orders=180 → ✗
  Month 7:  Micro W3 active. 5/7 micros graduated (71%). orders=280, cm1=31% → ✗ (orders)
  Month 9:  6/7 graduated (86%). orders=340, cm1=33%, ltv:cac=2.8, 270d since launch → ✓ ALL MET
  → Chennai opens. Anna Nagar pilot assigned to Chennai Micro W1.
```

#### EXAMPLE C: Cluster Wave Advancement (South India → West India)

**Trigger:** South India Macro aggregate → Cluster W2 (opens West India)
**Direction:** upward_aggregate | **Logic:** and_or_groups | **Human Approval:** true
**Min Source Wave Age:** 180 days | **Min Graduated Markets:** 2 (at least 2 macro markets graduated)

| Group | Label | Criterion | Operator | Threshold | Aggregation | Sustain | Window | Reads As |
|---|---|---|---|---|---|---|---|---|
| 1 | Region Maturity | GRAD_RATE_PCT | gte | 60.0 | wave_total | 0 | NULL | ≥60% of South India macro markets graduated |
| 1 | | REV_PER_DAY_INR | gte | 500000 | wave_total | 30d | 30d | AND total South India revenue ≥ ₹5L/day for 30 days |
| 1 | | LTV_CAC_RATIO | gte | 3.0 | per_market_avg | 30d | 30d | AND avg LTV:CAC ≥ 3.0 across South India macros |
| 1 | | CM1_TREND | gte | 1 | per_market_avg | 0 | 60d | AND CM1 trending upward over 60 days |
| 2 | Scale Override | REV_PER_DAY_INR | gte | 1000000 | wave_total | 30d | 30d | OR if total revenue ≥ ₹10L/day (scale alone justifies) |
| 2 | | CM1_PCT | gte | 25.0 | per_market_avg | 14d | 30d | AND CM1 at least ≥ 25% (minimum viable) |

**Evaluation:** `(Group 1: region maturity) OR (Group 2: scale override)` → West India cluster opens

```
Scenario: South India expansion (Month 1–18)
  Month 12: BLR graduated, CHN at Micro W2, HYD at Micro W1.
            2/3 macros graduated (67%). Revenue ₹4.2L/day, LTV:CAC 2.8 → Group 1: ✗ (LTV:CAC)
  Month 15: 2/3 macros graduated. Revenue ₹6.8L/day, LTV:CAC 3.2, CM1 trending up → Group 1: ✓
  → West India opens. Mumbai Andheri assigned to West India → Mumbai Macro W1 → Micro W1.
  
  Alternative path:
  Month 14: Revenue hits ₹10.5L/day, CM1=27% → Group 2: ✓ (scale justifies expansion)
  → West India opens via scale override, even though LTV:CAC not yet at 3.0.
```

### AND/OR Evaluation Algorithm (Formal Specification)

```python
def evaluate_trigger(trigger):
    """
    Returns True if trigger conditions are met.
    Groups evaluated as: within-group AND, between-group OR.
    """
    metrics = get_trigger_metrics(trigger.trigger_id)
    groups = group_by(metrics, key='condition_group')
    
    for group_id, group_metrics in groups.items():
        group_satisfied = True
        for metric in group_metrics:
            criterion = get_criterion(metric.criterion_id)
            
            # 1. Compute current value
            raw_value = read_source(criterion.source_table, criterion.source_field,
                                     scope=trigger.source_wave_id)
            
            # 2. Aggregate across markets in source wave
            agg_scope = metric.aggregation_scope or get_default_agg(criterion, trigger.market_level)
            current = aggregate(raw_value, agg_scope, metric.evaluation_window_days)
            
            # 3. Apply threshold type
            threshold_type = metric.threshold_type or criterion.default_threshold_type
            if threshold_type == 'absolute':
                met = compare(current, metric.threshold_operator, metric.threshold_value)
            elif threshold_type == 'growth_rate_pct':
                growth = compute_growth_rate(raw_value, metric.evaluation_window_days)
                met = compare(growth, metric.threshold_operator, metric.threshold_value)
            elif threshold_type == 'trend_direction':
                trend = compute_trend(raw_value, metric.evaluation_window_days)
                met = (trend == metric.threshold_value)  # +1=up, -1=down, 0=flat
            elif threshold_type == 'sustained_minimum':
                met = all_days_above(raw_value, metric.threshold_value, metric.sustain_days)
            
            # 4. Check sustain period (for absolute/growth_rate)
            if threshold_type in ('absolute', 'growth_rate_pct') and metric.sustain_days > 0:
                met = sustained_for(met, metric.sustain_days)
            
            if not met:
                group_satisfied = False
                break  # AND: one failure kills the group
        
        if group_satisfied:
            return True  # OR: one group passing is sufficient
    
    return False  # No group fully satisfied
```


v4.5.4: +threshold_type override, +evaluation_window_days, +group_label. Full examples and algorithm spec.

## S30-07 `market_expansion_wave_assignments`
Purpose: Which specific markets are assigned to which waves. A market appears in exactly ONE wave per format. This is the deployment roster.
Grain: wave × market | Rows: ~30–100
| Column | Classification | Type | Description |
|---|---|---|---|
| `wave_id` | key | FK (INTEGER) | FK to `market_expansion_waves.wave_id`. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Must match wave's market_level. 05j gatekeeper (format from parent wave). |
| `sequence_in_wave` | detail | INTEGER | Launch order within this wave. Lower = launches first. **UNIQUE within wave_id.** |
| `attractiveness_score_at_assignment` | detail | DECIMAL(5,2) | Snapshot of S30 market_outputs.attractiveness_score at the time of wave assignment. Audit trail — scores may change over time. |
| `whitespace_score_at_assignment` | detail | DECIMAL(5,2) | Snapshot of S30 market_outputs.whitespace_score at assignment time. |
| `composite_expansion_score` | derived | DECIMAL(5,2) | = (attractiveness × weight) + (whitespace × weight). Computed from wave master's ranking_method + weights. This score determined the market's wave placement. |
| `score_rank` | derived | INTEGER | Rank among all eligible markets for this format × parent × level, by descending composite_expansion_score. Rank 1 = highest score = first to launch. |
| `assignment_method` | detail | VARCHAR | **Dropdown:** score_computed / manual_override / manual_initial. `score_computed` = system assigned based on ranking. `manual_override` = human moved from computed wave. `manual_initial` = wave plan built manually. |
| `is_pilot_flag` | detail | BOOLEAN | Whether this market is the pilot/seed for this wave. Typically true for score_rank = 1 in Wave 1. |
| `member_status` | detail | VARCHAR | **Dropdown:** assigned / ready / launched / performing / graduated / failed / deferred. |
| `launched_at` | detail | DATE | Actual launch date for this market in this wave. NULL until launched. |
| `graduated_at` | detail | DATE | When this market met steady-state performance criteria. NULL until graduated. |
| `graduation_metric_snapshot` | detail | TEXT | Key metrics at graduation (e.g., 'orders_per_day=85, cm1_pct=42, repeat_rate=38'). Audit trail. |

Dropdowns:
- `member_status`: assigned / ready / launched / performing / graduated / failed / deferred

Constraints: UNIQUE(wave_id, market_id). `sequence_in_wave` UNIQUE within wave. Market's `market_level` must match wave's `market_level`. 05j gatekeeper applies.

Member lifecycle:
```
assigned → ready (prerequisites met) → launched (go-live) → performing (tracking) → graduated (criteria met)
                                            ↓                                           ↓
                                         failed ◀─────────────────────────────── deferred (moved to later wave)
```

v4.5.2: New table. Pattern #24. Rule 27.
Score-driven wave assignment (v4.5.3):
```
STEP 1: S30 market_outputs computes attractiveness_score + whitespace_score per market × format
STEP 2: Wave master defines ranking_method + weights
STEP 3: System computes composite_expansion_score per market:
         composite = (attractiveness × weight) + (whitespace × weight)
STEP 4: Markets ranked by descending composite score within each format × parent × level
STEP 5: Top N markets (by planned_market_count) assigned to Wave 1
         Next M to Wave 2, etc.
STEP 6: Markets below score_threshold_min auto-deferred
STEP 7: Human reviews assignments, can override (assignment_method = 'manual_override')

AT MACRO LEVEL: attractiveness + whitespace are AGGREGATED across micro markets
AT CLUSTER LEVEL: aggregated across macro markets
```

v4.5.3: +score fields, +assignment_method, +composite_expansion_score. Score-driven assignment.
AND/OR condition group logic (v4.5.3):
```
EXAMPLE TRIGGER with 2 groups:
  Group 1: ORD_PER_DAY ≥ 80 (avg, 14d)  AND  CM1_PCT ≥ 35% (avg, 14d)
  Group 2: REV_PER_DAY ≥ ₹50,000 (sum, 14d)

  Resolution: Group 1 satisfied OR Group 2 satisfied → trigger fires
  
  Within each group: ALL metrics must be met (AND)
  Across groups: ANY group fully met is sufficient (OR)
  
  This allows: "either prove unit economics OR prove raw revenue scale"
```

v4.5.3: metric_name → criterion_id FK. +condition_group (AND/OR logic).

## S30-08 `market_expansion_triggers`
Purpose: Performance conditions that advance from one wave to the next. Triggers connect a SOURCE wave (being monitored) to a TARGET wave (to be activated). Supports same-level sequential triggers AND cross-level upward triggers.
Grain: source_wave × target_wave (one row per trigger relationship) | Rows: ~15–40
| Column | Classification | Type | Description |
|---|---|---|---|
| `trigger_id` | system | INTEGER | Auto-generated PK. |
| `source_wave_id` | key | FK (INTEGER) | FK to `market_expansion_waves.wave_id`. The wave being monitored for performance. |
| `target_wave_id` | key | FK (INTEGER) | FK to `market_expansion_waves.wave_id`. The wave to activate when conditions are met. |
| `trigger_direction` | detail | VARCHAR | **Dropdown:** same_level_sequential / upward_aggregate. `same_level_sequential`: micro W1 → micro W2 (same city). `upward_aggregate`: micro aggregate → macro (next city), or macro aggregate → cluster (next region). |
| `trigger_logic` | detail | VARCHAR | **Dropdown:** and_or_groups / weighted_composite. `and_or_groups`: metrics grouped by `condition_group` on trigger_metrics — within-group AND, between-group OR. Trigger fires when ANY group is fully satisfied. `weighted_composite`: all metrics scored by weight, composite ≥ threshold. Default: and_or_groups. |
| `require_human_approval` | detail | BOOLEAN | Whether trigger activation requires human sign-off. Default: true. Even when all metrics are met, a human must click "proceed" unless this is false. |
| `min_source_wave_age_days` | detail | INTEGER | Minimum days the source wave must be active before trigger can fire. Prevents premature expansion. Default: 30. |
| `min_graduated_markets` | detail | INTEGER | Minimum markets in source wave that must have graduated. NULL = use pct_graduated_markets instead. |
| `pct_graduated_markets` | detail | DECIMAL(5,2) | Minimum % of source wave markets that must have graduated. NULL = use min_graduated_markets instead. At least one of these must be non-NULL. |
| `trigger_status` | detail | VARCHAR | **Dropdown:** pending / conditions_met / approved / activated / expired / overridden. |
| `conditions_met_at` | detail | TIMESTAMP | When all metric + graduation conditions were first met. NULL until met. |
| `approved_at` | detail | TIMESTAMP | When human approved (if required). NULL until approved. |
| `activated_at` | detail | TIMESTAMP | When target wave was actually activated. NULL until activated. |
| `override_notes` | detail | TEXT | Explanation when manually overridden (activated early or blocked). |

Dropdowns:
- `trigger_direction`: same_level_sequential / upward_aggregate
- `trigger_logic`: all_metrics_met / any_metric_met / weighted_composite
- `trigger_status`: pending / conditions_met / approved / activated / expired / overridden

Constraints: UNIQUE(source_wave_id, target_wave_id). Source and target must belong to same format_id. At least one of (min_graduated_markets, pct_graduated_markets) must be non-NULL.

Trigger direction rules:
```
same_level_sequential:
  source.market_level = target.market_level
  source.parent_market_id = target.parent_market_id
  source.wave_number + 1 = target.wave_number
  Example: BLR Micro W1 → BLR Micro W2

upward_aggregate:
  source.market_level = child level of target.market_level
  source.parent_market_id = one of target's assigned markets
  Example: BLR micro aggregate → South India Macro W2 (opens Chennai)
```

v4.5.2: New table. Pattern #24. Rule 27.
AND/OR condition group logic (v4.5.3):
```
EXAMPLE TRIGGER with 2 groups:
  Group 1: ORD_PER_DAY ≥ 80 (avg, 14d)  AND  CM1_PCT ≥ 35% (avg, 14d)
  Group 2: REV_PER_DAY ≥ ₹50,000 (sum, 14d)

  Resolution: Group 1 satisfied OR Group 2 satisfied → trigger fires
  
  Within each group: ALL metrics must be met (AND)
  Across groups: ANY group fully met is sufficient (OR)
  
  This allows: "either prove unit economics OR prove raw revenue scale"
```

v4.5.3: metric_name → criterion_id FK. +condition_group (AND/OR logic).

## S30-09 `market_expansion_trigger_metrics`
Purpose: Specific performance metrics monitored for each trigger. A trigger may require MULTIPLE metrics to be satisfied (e.g., orders/day ≥ 50 AND CM1% ≥ 35%). This table defines what to measure and the threshold.
Grain: trigger × metric | Rows: ~30–80
| Column | Classification | Type | Description |
|---|---|---|---|
| `trigger_id` | key | FK (INTEGER) | FK to `market_expansion_triggers.trigger_id`. |
| `criterion_id` | key | FK (INTEGER) | FK to `expansion_trigger_criteria_master.criterion_id`. What to measure. Replaces ad-hoc metric_name — all metrics are standardized. |
| `condition_group` | detail | INTEGER | Group number for AND/OR logic. Metrics in the SAME group are AND'd. Different groups are OR'd. Trigger fires when ANY group is fully satisfied. Default: 1 (single AND group). |
| `group_label` | detail | VARCHAR | Human-readable label for this condition group (e.g., 'Unit Economics Path', 'Revenue Scale Path'). NULLABLE — for UI display. |
| `aggregation_scope` | detail | VARCHAR | How to aggregate across markets in source wave. **Dropdown:** per_market_min / per_market_avg / per_market_median / wave_total / pct_of_markets_above. Overrides `expansion_trigger_criteria_master.default_aggregation` when non-NULL. |
| `threshold_type` | detail | VARCHAR | How to evaluate this metric. **Dropdown:** absolute / growth_rate_pct / trend_direction / sustained_minimum. Overrides `expansion_trigger_criteria_master.default_threshold_type`. NULL = use master default. |
| `threshold_operator` | detail | VARCHAR | **Dropdown:** gte (≥) / lte (≤) / between / eq / gt (>) / lt (<). Overrides master default_operator. NULL = use master default (derived from metric_direction). |
| `evaluation_window_days` | detail | INTEGER | Lookback period for rolling average / growth rate calculation. Overrides master default. NULL = use master default. |
| `threshold_value` | detail | DECIMAL(15,2) | Primary threshold. For `between`, this is the lower bound. |
| `threshold_upper` | detail | DECIMAL(15,2) | Upper bound for `between` operator. NULL for other operators. |
| `sustain_days` | detail | INTEGER | How many consecutive days the condition must hold. Prevents trigger on a spike. Default: 14 (2 weeks). |
| `weight` | detail | DECIMAL(3,2) | Weight for `weighted_composite` trigger_logic. Must sum to 1.0 across metrics per trigger. NULL for non-composite. |
| `current_value` | output | DECIMAL(15,2) | System-computed current metric value. Updated on each evaluation cycle. |
| `condition_met_flag` | output | BOOLEAN | Whether this specific metric currently meets its threshold (incl. sustain period). |
| `condition_met_since` | output | DATE | When this metric first started meeting its threshold in the current streak. NULL if not met. |

Dropdowns:
- `criterion_id`: FK to `expansion_trigger_criteria_master` (replaces ad-hoc metric_name)
- `condition_group`: INTEGER (1, 2, 3...). Same group = AND. Different groups = OR.
- `aggregation_scope`: per_market_min / per_market_avg / per_market_median / wave_total / pct_of_markets_above
- `threshold_operator`: gte / lte / between / eq

Constraints: UNIQUE(trigger_id, criterion_id). Weights must sum to 1.0 per trigger when trigger_logic = 'weighted_composite'. `sustain_days` ≥ 1.

v4.5.2: New table. Pattern #24. Rule 27.
AND/OR condition group logic (v4.5.3):
```
EXAMPLE TRIGGER with 2 groups:
  Group 1: ORD_PER_DAY ≥ 80 (avg, 14d)  AND  CM1_PCT ≥ 35% (avg, 14d)
  Group 2: REV_PER_DAY ≥ ₹50,000 (sum, 14d)

  Resolution: Group 1 satisfied OR Group 2 satisfied → trigger fires
  
  Within each group: ALL metrics must be met (AND)
  Across groups: ANY group fully met is sufficient (OR)
  
  This allows: "either prove unit economics OR prove raw revenue scale"
```

v4.5.3: metric_name → criterion_id FK. +condition_group (AND/OR logic).

## S30-10 `market_expansion_outputs`
Purpose: Resolved wave state, trigger progress, and projected expansion timeline. System-generated. Consumed by S200 for revenue timing and S10 for format-level expansion progress.
Grain: wave (with optional market-level breakdown) | Rows: ~30–100
| Column | Classification | Type | Description |
|---|---|---|---|
| `wave_id` | key | FK (INTEGER) | FK to `market_expansion_waves.wave_id`. |
| `resolved_wave_status` | output | VARCHAR | Current computed status (may differ from planned status if triggers override). |
| `markets_assigned_count` | output | INTEGER | Total markets assigned to this wave. |
| `markets_launched_count` | output | INTEGER | Markets currently launched. |
| `markets_performing_count` | output | INTEGER | Markets that have passed initial ramp. |
| `markets_graduated_count` | output | INTEGER | Markets that met steady-state criteria. |
| `markets_failed_count` | output | INTEGER | Markets that failed to meet criteria. |
| `graduation_rate_pct` | output | DECIMAL(5,2) | = graduated / (graduated + failed) × 100. Key health metric. |
| `avg_days_to_graduation` | output | DECIMAL(8,2) | Average days from launch to graduation across graduated markets. |
| `trigger_progress_pct` | output | DECIMAL(5,2) | How close the OUTBOUND trigger (this wave → next wave) is to being met. 0–100%. Composite of all trigger metrics. |
| `projected_trigger_date` | output | DATE | Estimated date when outbound trigger conditions will be met, based on current trajectory. NULL if insufficient data. |
| `next_wave_id` | output | FK (INTEGER) | FK to the target wave that will activate when this wave's trigger fires. NULL if no outbound trigger defined. |
| `wave_revenue_contribution_pct` | output | DECIMAL(5,2) | This wave's markets as % of total format revenue. Shows expansion impact on financials. |
| `cumulative_markets_active` | output | INTEGER | Total markets active across all waves at this level for this format × parent (running count). |

Constraints: UNIQUE(wave_id, scenario, effective_from) — Rule 20.

S200 interaction: S200 only computes revenue for a market when:
```
(a) market's wave is active (wave_status = 'active')
(b) market's member_status IN ('launched', 'performing', 'graduated')
(c) market's individual launch_date (three-tier cascade) has been reached
(d) market's S30 include_in_evaluation_flag = true (gate)
ALL FOUR conditions must be true. Wave timing is the FIRST check.
```

v4.5.2: New table. Pattern #24. Rule 27.
AND/OR condition group logic (v4.5.3):
```
EXAMPLE TRIGGER with 2 groups:
  Group 1: ORD_PER_DAY ≥ 80 (avg, 14d)  AND  CM1_PCT ≥ 35% (avg, 14d)
  Group 2: REV_PER_DAY ≥ ₹50,000 (sum, 14d)

  Resolution: Group 1 satisfied OR Group 2 satisfied → trigger fires
  
  Within each group: ALL metrics must be met (AND)
  Across groups: ANY group fully met is sufficient (OR)
  
  This allows: "either prove unit economics OR prove raw revenue scale"
```

v4.5.3: metric_name → criterion_id FK. +condition_group (AND/OR logic).




================================================================================
<!-- MODULE: 05_S40_channel.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 05_S40_channel.md -->
<!-- Description: S40 Channel Strategy — 5 tables (Phase 12 LOCKED) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 2413–2581 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S40 — CHANNEL STRATEGY (v4: REVISED | Phase 12: LOCKED)
# ═══════════════════════════════════════

## S40-01 `channel_inputs` — Lock ID: PHASE12-T01-LOCK 🔒
Grain: channel × format × market
| Column | Classification | Type | Description |
|---|---|---|---|
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project. NULL = global default. CHECK(BETWEEN 1 AND 120). See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN NOT NULL DEFAULT true | Whether computation engine processes this entity. false = skipped per Rule 23 cascade. |
| `manual_review_required_flag` | input | BOOLEAN NOT NULL DEFAULT true | Governance flag. Auto-set when scope=directional OR S300 confidence < 0.5. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions. |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |
| **`auto_populate_research_flag`** | **input** | **BOOLEAN NOT NULL DEFAULT true** | **v4.5.9 (D-CROSS-01, Pattern #25).** When `true`, research completion auto-populates downstream set_items (Pattern #19 sections) or assumption tables (non-Pattern #19 sections) for this section context. `false` = manual-only (opt out of Research-First for this specific context). |

Constraints: UNIQUE(channel_id, format_id, market_id, scenario, effective_from) — Rule 20.
FK validation: All FKs must reference active master rows.
**05j gatekeeper:** format_id × market_id pair MUST exist on `05j_format_market_map` (DI-31 resolved for S40). S40 uses 05j ONLY — no stream dimension, so no 06c/06b gate.
**Soft-gate annotation (Rule 23, D12-03):** S40 = SOFT-GATE. Partial channel exclusion → remaining channels re-normalize `expected_order_share_pct` to sum to 100%. Full exclusion → BLOCK S200. Warning to S300.
Lifecycle cascade: `08_channels_master` archive → `channel_inputs` archive. `05j_format_market_map` deactivation → matching rows deactivated.
v4.3.1: +`planning_horizon_months`. See Rule 24.
v4.5.6 (Phase 12): +data types, +FK, +05j gatekeeper (DI-31), +Rule 20 UNIQUE, +soft-gate annotation (D12-03), +lifecycle cascade. F12-01→F12-08.


## S40-01b `channel_research` — Lock ID: PHASE12-T01B-LOCK 🔒
Purpose: AI-enabled market research context for Channel Strategy. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
Grain: channel × format × market | Rows: ~20–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(channel_id, format_id, market_id, scenario, effective_from) — Rule 20.
**05j gatekeeper** (DI-31 resolved for S40). Same as parent `_inputs` table.
AI Research Scope: Channel performance benchmarks, aggregator commission trends by market (Swiggy, Zomato, Dunzo), own-app conversion rate studies, B2B channel penetration reports, food delivery channel share data (RedSeer, Inc42), cancellation/return rate benchmarks by channel type, customer acquisition cost per channel, channel-specific AOV benchmarks, platform fee trend analysis
v4.5.0: New table. Pattern #22. Rule 25.
Outcome linkage: Field-level research results are stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. This table captures the research CONTEXT; outcome items capture the structured VALUES.
v4.5.1: +research_run_id. Outcome items linkage documented. Pattern #23. Rule 26.

## S40-02 `channel_assumptions` — Lock ID: PHASE12-T02-LOCK 🔒
Grain: channel × format × market | Purpose: strategic planning assumptions. **S40 OWNS cancel/return rates per channel.** Pattern #19: NOT applicable (D12-01) — flat table retained.
**Ownership boundary (D12-02):** S40 OWNS strategic planning (order share, conversion, cancel, return, fit, activation). 08b OWNS negotiated commercial terms. Reference fields (`benchmark_*`) are Rule 15 external validation only.
| Column | Classification | Type | Description |
|---|---|---|---|
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `expected_order_share_pct` | assumption | DECIMAL(5,2) NOT NULL | Assumed % of total orders through this channel. **BETWEEN 0.00 AND 100.00.** Sum-to-100 across channels per (format, market) — APP-LAYER validation. Soft-gate re-normalization recalculates shares among active channels (D12-03). |
| `benchmark_aov_inr` | reference | DECIMAL(10,2) | External reference AOV in ₹ (validation only, not computation — Rule 15). CHECK(> 0) when non-NULL. |
| `expected_conversion_rate_pct` | assumption | DECIMAL(5,2) NOT NULL DEFAULT 0.00 | Visitor-to-order conversion rate. **BETWEEN 0.00 AND 100.00. NOT NULL (F12-48).** DEFAULT 0.00 = conservative (zero conversion). Governance: if 0.00, S300 warns "likely unset." CVR=0.00 means S50 funnel produces zero orders for this channel. |
| `expected_cancellation_rate_pct` | assumption | DECIMAL(5,2) NOT NULL DEFAULT 0.00 | S40 OWNS per-channel cancellation rate. **BETWEEN 0.00 AND 100.00. NOT NULL (F12-48).** DEFAULT 0.00 = conservative (no cancellations). Governance: if 0.00, S300 warns "likely unset." |
| `expected_return_rate_pct` | assumption | DECIMAL(5,2) NOT NULL DEFAULT 0.00 | S40 OWNS per-channel return/refund rate. **BETWEEN 0.00 AND 100.00. NOT NULL (F12-48).** DEFAULT 0.00 = conservative (no returns). Governance: if 0.00, S300 warns "likely unset." |
| `benchmark_cac_inr` | reference | DECIMAL(10,2) | Expected CAC in ₹ (S50 OWNS detailed CAC — Rule 15 reference only). CHECK(> 0) when non-NULL. |
| `benchmark_repeat_rate_pct` | reference | DECIMAL(5,2) | External repeat rate (Rule 15 reference). CHECK(BETWEEN 0.00 AND 100.00) when non-NULL. |
| `channel_fit_assumption` | assumption | VARCHAR | Qualitative fit assessment. **Dropdown:** strong_fit / moderate_fit / weak_fit / untested / not_applicable. |
| `model_active_from` | assumption | DATE | Assumed activation date for this **channel** in this context. |
| `model_active_to` | assumption | DATE | Assumed deactivation date (NULL = indefinite). |
| **`field_source_json`** | **assumptions** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **assumptions** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **assumptions** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: assumptions row → research run → outcome items. |

Constraints: UNIQUE(channel_id, format_id, market_id, scenario, effective_from) — Rule 20.
**05j gatekeeper** (DI-31 resolved for S40). Only 05j — no 06c (S40 has no stream dimension).
**Cancel/return field note (F12-24):** Unlike S20's `expected_revenue_share_pct` (conditional by stream type), S40's cancel/return rates are ALWAYS genuine assumptions for ALL channel types. No scoping rule needed.
**Reference field annotation (Rule 15, F12-26):** `benchmark_aov_inr`, `benchmark_cac_inr`, `benchmark_repeat_rate_pct` are EXTERNAL REFERENCES for validation. S200 does NOT read these. S70/S20 own pricing. S50 owns detailed CAC. S60 owns repeat/retention.
Lifecycle cascade: master archive → assumptions archive. 05j deactivation → deactivate matching rows.
v4 renames: expected_aov_inr → benchmark_aov_inr, customer_acquisition_cost_inr → benchmark_cac_inr, repeat_rate_pct → benchmark_repeat_rate_pct.
v4.5.6 (Phase 12): +data types, +FK, +05j gatekeeper, +Rule 20, +ownership boundary (D12-02), +sum-to-100, +dropdown, +validation rules, +lifecycle. F12-14→F12-26.
v4.5.6 (Phase 12 Addendum F12-48): +NOT NULL DEFAULT 0.00 on expected_cancellation_rate_pct, expected_return_rate_pct, expected_conversion_rate_pct. Prevents NULL propagation to S50/S60/S200.

## S40-03 `channel_decisions` — Lock ID: PHASE12-T03-LOCK 🔒
Grain: channel × format × market
| Column | Classification | Type | Description |
|---|---|---|---|
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `selected_for_activation_flag` | decision | BOOLEAN NOT NULL DEFAULT true | Human decision: activate this **channel**. false = excluded from S200, triggers Rule 23 soft-gate cascade (D12-03) — order share re-normalization among remaining active channels. |
| `channel_priority_rank` | decision | INTEGER NULLABLE | Human-assigned priority among channels. UNIQUE within (format_id, market_id, scenario, effective_from) among active channels. NULL = unranked. |
| `primary_channel_flag` | decision | BOOLEAN NOT NULL DEFAULT false | Exactly ONE channel must have this = true per (format_id, market_id) among active channels. APP-LAYER validation. Used by S200 for tiebreaking and S300 governance. |
| `active_from_override` | decision | DATE NULLABLE | Human override of activation date. NULL = use assumption `model_active_from`. |
| `active_to_override` | decision | DATE NULLABLE | Human override of deactivation date. NULL = use assumption `model_active_to`. |
| `decision_notes` | decision | TEXT NULLABLE | Free-form notes explaining the decision rationale. |

Constraints: UNIQUE(channel_id, format_id, market_id, scenario, effective_from) — Rule 20.
**05j gatekeeper** (DI-31).
Lifecycle cascade: master archive → decisions archive. Inputs exclusion → decisions flagged for review.
v4.5.6 (Phase 12): +data types, +FK, +05j gatekeeper, +Rule 20, +managed dropdowns, +override NULLABLE semantics, +lifecycle. F12-27→F12-35.

## S40-04 `channel_outputs` — Lock ID: PHASE12-T04-LOCK 🔒
Grain: channel × format × market | Purpose: resolved channel profile (merges S40 strategy + 08b terms). Column count: 13 (was 10, +3 in Phase 12).
| Column | Classification | Type | Description |
|---|---|---|---|
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 1. |
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `projected_order_share_pct` | output | DECIMAL(5,2) | Resolved % of orders through this channel. POST-RENORMALIZATION shares (D12-03). Excluded channels have NO output row. |
| `resolved_commission_rate_pct` | output | DECIMAL(5,2) | Resolved commission rate from `08b_channel_terms` (latest active, Rule 20). Not overridable in S40. |
| `resolved_settlement_days` | output | INTEGER | Resolved settlement period from `08b_channel_terms`. Not overridable in S40. |
| `resolved_price_markup_pct` | output | DECIMAL(5,2) | Resolved channel markup from `08b_channel_terms`. Not overridable in S40. |
| **`resolved_cancellation_rate_pct`** | **output** | **DECIMAL(5,2) NOT NULL** | **Resolved per-channel cancellation rate. Source: channel_assumptions (NOT NULL, F12-48). Consumed by S60 for blended cancel rate. (F12-39)** |
| **`resolved_return_rate_pct`** | **output** | **DECIMAL(5,2) NOT NULL** | **Resolved per-channel return/refund rate. Source: channel_assumptions (NOT NULL, F12-48). Consumed by S60 + S200 for net order adjustment. (F12-40)** |
| **`resolved_conversion_rate_pct`** | **output** | **DECIMAL(5,2) NOT NULL** | **Resolved visitor-to-order conversion rate. Source: channel_assumptions (NOT NULL, F12-48). Consumed by S50 marketing funnel. If 0.00, S50 projected_orders = 0. (F12-41)** |
| `activation_status` | output | VARCHAR | Resolved state: active / inactive / pending. `selected_for_activation_flag = false` → 'inactive'. No 08b row → 'pending'. Both present + active → 'active'. |
| `active_from` | output | DATE | Resolved start date (active_from_override > model_active_from). |
| `active_to` | output | DATE NULLABLE | Resolved end date (active_to_override > model_active_to). NULL = open-ended. |

Constraints: UNIQUE(channel_id, format_id, market_id, scenario, effective_from) — Rule 20.
**08b resolution logic (F12-42):** For commercial terms, read from `08b_channel_terms` WHERE channel_id AND format_id AND market_id match AND active window overlaps. Rule 20 guarantees at most one match. No match → NULL, status = 'pending', warn S300.

**Resolution precedence (F12-43):**

| Output Field | Source | Precedence |
|---|---|---|
| `projected_order_share_pct` | S40 assumptions → soft-gate re-normalize (D12-03) | If channels excluded → re-normalize. Else → assumption. |
| `resolved_commission_rate_pct` | 08b_channel_terms | Latest active 08b row (Rule 20). Not overridable. |
| `resolved_settlement_days` | 08b_channel_terms | Latest active 08b row. Not overridable. |
| `resolved_price_markup_pct` | 08b_channel_terms | Latest active 08b row. Not overridable. |
| `resolved_cancellation_rate_pct` | S40 assumptions | Assumption is authoritative (no decision override). |
| `resolved_return_rate_pct` | S40 assumptions | Assumption is authoritative (no decision override). |
| `resolved_conversion_rate_pct` | S40 assumptions | Assumption is authoritative (no decision override). |
| `activation_status` | Decisions + 08b presence | `selected_for_activation_flag = false` → 'inactive'. No 08b → 'pending'. Both → 'active'. |
| `active_from` / `active_to` | Decision override > Assumption | Non-NULL override takes precedence. |

**S200 consumption from S40 outputs:**
```
projected_order_share_pct        → S200 revenue_output (split S60 demand into per-channel orders)
resolved_commission_rate_pct      → S200 revenue_output (channel commission fees)
resolved_settlement_days          → S200 cash_flow_output (payment timing)
resolved_price_markup_pct         → S200 revenue_output (Rule 19 pricing waterfall — Step 3)
resolved_cancellation_rate_pct    → S60 demand_outputs (per-channel cancel rate — no blending at S60 expanded grain, D14-02)
resolved_return_rate_pct          → S60 demand_outputs (per-channel return rate — direct consumption at format×stream×channel×market) + S200 (net order adjustment)
resolved_conversion_rate_pct      → S50 marketing_outputs (channel funnel CVR)
activation_status                 → S200 (skip inactive channels), S60 (S40 activation gate — D14-02)
active_from / active_to           → S200 (period-based activation gating)
Note: S200 reads 08b_channel_terms DIRECTLY for secondary fields not surfaced in S40 outputs.
```
v4 removed: projected_orders_per_day, projected_aov_inr, projected_revenue_inr, net_realization_per_order_inr, blended_cac_inr, channel_roi_pct (→ S70/S200/S60 own).
v4.5.6 (Phase 12): +data types, +FK, +Rule 20, +`resolved_cancellation_rate_pct`, +`resolved_return_rate_pct`, +`resolved_conversion_rate_pct`, +08b resolution logic, +full precedence table, +S200 consumption map. F12-36→F12-47.
v4.5.6 (Phase 12 Addendum F12-48): +NOT NULL annotation on 3 resolved rate fields (inherits NOT NULL from assumptions).

**S40 Gatekeeper Summary:**
| Bridge | Applies to S40? | Reason |
|---|---|---|
| **05j_format_market_map** | ✅ YES — all 5 tables | S40 grain includes format × market |
| 06c_revenue_stream_format_map | ❌ NO | S40 has no stream dimension |
| 06b_revenue_stream_channel_map | ❌ NO | S40 has no stream dimension. S200 handles stream×channel at computation time. |
| 08_channels_master | ✅ FK validation | channel_id must reference active master row |

---



================================================================================
<!-- MODULE: 06_S50_marketing.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 06_S50_marketing.md -->
<!-- Description: S50 Marketing Strategy — 8 tables (Phase 13 LOCKED, Pattern #19) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 2582–2789 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S50 — MARKETING STRATEGY (v4.5.0: moved from S60 | Phase 13: LOCKED — Pattern #19 ADOPTED)
# ═══════════════════════════════════════

## S50-01 `marketing_inputs` — Lock ID: PHASE13-T01-LOCK 🔒
**Grain: format × market × channel** (v4: revenue_stream_id removed from grain)
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project. NULL = global default. CHECK(BETWEEN 1 AND 120). See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN NOT NULL DEFAULT true | Whether computation engine processes this entity. false = skipped per Rule 23 cascade. |
| `manual_review_required_flag` | input | BOOLEAN NOT NULL DEFAULT true | Governance flag. Auto-set when scope=directional OR S300 confidence < 0.5. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions. |

Constraints: UNIQUE(format_id, market_id, channel_id, scenario, effective_from) — Rule 20.
**05j gatekeeper** (DI-31 resolved for S50). S50 uses 05j ONLY.
**S40 activation gate (F13-04):** channel must be 'active' in S40 `channel_outputs`. No S50 rows for pending/inactive channels.
**Contributor annotation (Rule 23, D13-03):** S50 = CONTRIBUTOR. Exclusion → zero marketing costs + WARN. No block, no re-normalization.
Lifecycle cascade: master archive → inputs archive. S40 exclusion → flag S50 rows.
v4.5.7 (Phase 13): +data types, +FK, +05j gatekeeper, +S40 activation gate, +Rule 20, +contributor annotation, +lifecycle cascade. F13-01→F13-08.


## S50-01b `marketing_research` — Lock ID: PHASE13-T01B-LOCK 🔒
Purpose: AI-enabled market research context for Marketing Strategy. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
Grain: format × market × channel | Rows: ~30–90
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(format_id, market_id, channel_id, scenario, effective_from) — Rule 20.
**05j gatekeeper** (DI-31 resolved for S50). Same as parent `_inputs` table.
AI Research Scope: Digital marketing benchmarks, aggregator visibility costs, CAC by tier, LTV models, seasonal spend patterns, food delivery marketing data
v4.5.0: New table. Pattern #22. Rule 25.
Outcome linkage: Field-level research results are stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. This table captures the research CONTEXT; outcome items capture the structured VALUES.
v4.5.1: +research_run_id. Outcome items linkage documented. Pattern #23. Rule 26.


## S50-05 `marketing_spend_set_master` — Lock ID: PHASE13-T05-LOCK 🔒 🆕
Purpose: Profile definitions for reusable marketing spend templates. **Pattern #19 Layer 1.** Scenario-independent.
Grain: set (single-key) | Rows: ~5–15
| Column | Classification | Type | Description |
|---|---|---|---|
| `set_id` | PK | INTEGER | Auto-generated. |
| `set_code` | master | VARCHAR UNIQUE | Max 30 chars, uppercase alphanumeric + underscore. |
| `set_name` | master | VARCHAR UNIQUE | Display name. |
| `set_description` | master | TEXT NOT NULL | Profile purpose and usage guidance. |
| `lifecycle_stage` | master | VARCHAR NOT NULL | **Dropdown:** pre_launch / seed / growth / maturity / sustain. Categorization, not constraint. |
| `budget_driver_mode` | master | VARCHAR NOT NULL | **Dropdown:** absolute / pct_of_revenue / min_of_both. Set-level budget philosophy. |
| `sort_order` | master | INTEGER UNIQUE | Display position. |
| **`research_populated_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was created and/or populated by the research pipeline. `false` = manually created. Enables filtering research-sourced vs manual sets. |
| **`auto_created_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was auto-created by the research pipeline (not user-defined). User can rename, edit, or delete. Auto-created sets are assigned to contexts automatically via D-CROSS-01a. |

System field exception: carries `set_id` + `row_status` only. No version/scenario/effective_from/to (scenario-independent — same pattern as S70 set masters).
v4.5.7 (Phase 13): NEW TABLE. Pattern #19 adopted for S50 (D13-01). F13-14→F13-20.

---

## S50-06 `marketing_spend_set_items` — Lock ID: PHASE13-T06-LOCK 🔒 🆕
Purpose: Multi-campaign templates within a marketing spend profile. **Pattern #19 Layer 2.**
Grain: set × item_sequence | Rows: ~30–100
| Column | Classification | Type | Description |
|---|---|---|---|
| `set_id` | key | FK (INTEGER) | FK to `marketing_spend_set_master`. |
| `item_sequence` | key | INTEGER | UNIQUE within set. Processing/display order. |
| `campaign_type` | set_item | VARCHAR NOT NULL | **Dropdown:** awareness / acquisition / retention / reactivation / seasonal / launch. |
| `marketing_channel` | set_item | VARCHAR NOT NULL | **Dropdown:** social_media / search / display / influencer / offline / referral. |
| `objective` | set_item | VARCHAR NOT NULL | **Dropdown:** brand_awareness / app_installs / first_orders / repeat_orders / aov_increase. |
| `benchmark_cpm_inr` | set_item | DECIMAL(10,2) NOT NULL | Cost per 1,000 impressions. CHECK(> 0). |
| `benchmark_ctr_pct` | set_item | DECIMAL(5,2) NOT NULL | Expected click-through rate. CHECK(BETWEEN 0.01 AND 100.00). |
| `benchmark_cvr_pct` | set_item | DECIMAL(5,2) NOT NULL | Expected click-to-order conversion rate. CHECK(BETWEEN 0.01 AND 100.00). **D13-02: S50 CVR ≠ S40 CVR** (different scope — paid vs all traffic). S300 warns if S50 CVR < S40 CVR. |
| `benchmark_cac_inr` | set_item | DECIMAL(10,2) NULLABLE | Expected CAC. Nullable (not all campaigns target acquisition). CHECK(> 0) when non-NULL. |
| `repeat_rate_pct` | set_item | DECIMAL(5,2) NULLABLE | Expected repeat rate. Nullable (retention campaigns only). CHECK(BETWEEN 0 AND 100). |
| `ltv_to_cac_ratio_target` | set_item | DECIMAL(5,2) NULLABLE | Governance target. Nullable. CHECK(> 0). |
| `monthly_budget_inr` | set_item | DECIMAL(12,2) NOT NULL | Monthly budget for this campaign. CHECK(> 0). |
| `budget_share_pct` | set_item | DECIMAL(5,2) NOT NULL | Share of total set budget. CHECK(BETWEEN 0 AND 100). **Sum-to-100 across items in set (APP-LAYER).** |
| `promo_intensity` | set_item | VARCHAR | **Dropdown:** none / light / moderate / heavy / aggressive. Default: 'moderate'. |
| `seasonality_adjustment_factor` | set_item | DECIMAL(4,2) NOT NULL DEFAULT 1.00 | Multiplier for seasonal variation. CHECK(BETWEEN 0.10 AND 5.00). |
| `model_campaign_start_date` | set_item | DATE NULLABLE | Campaign start (NULL = aligned with context activation). |
| `model_campaign_end_date` | set_item | DATE NULLABLE | Campaign end (NULL = ongoing). |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

System fields: standard 6 (version, scenario, effective_from/to, row_status + set_items_id).
v4.5.7 (Phase 13): NEW TABLE. Pattern #19 Layer 2. F13-21→F13-29.

---

## S50-07 `marketing_spend_set_assignment` — Lock ID: PHASE13-T07-LOCK 🔒 🆕
Purpose: DIRECT assignment of marketing spend profiles to format × market × channel contexts. **Pattern #19 Layer 3.** Uses direct assignment (NOT S00 context_set_master) because context_set_members lacks channel dimension (DI-56).
Grain: format × market × channel × set | Rows: ~30–150
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `set_id` | key | FK (INTEGER) | FK to `marketing_spend_set_master`. Which profile to apply. |
| `priority_rank` | assignment | INTEGER | UNIQUE within (format, market, channel). Tiebreaker. |

Constraints: UNIQUE(format_id, market_id, channel_id, scenario, effective_from) — Rule 20.
**05j gatekeeper + S40 activation gate.** Channel must be active in S40 outputs.
v4.5.7 (Phase 13): NEW TABLE. Pattern #19 Layer 3. Direct assignment due to DI-56 (channel dimension). F13-30→F13-35.

---

## S50-02 `marketing_assumptions` — Lock ID: PHASE13-T02-LOCK 🔒
Grain: format × market × channel | Purpose: context-specific overrides for Pattern #19 sets. **S50 OWNS CAC and repeat rate.**
Pattern #19: ADOPTED (D13-01). **All 20 fields → NULLABLE.** NULL = "use set value." Non-NULL = override (Layer 2).
**Resolution stack (Pattern #21):** Set (Layer 1) → Flat Override (non-NULL, Layer 2) → Decision Override (Layer 3) → Fallback (no set — all fields must be non-NULL).
**Nullability guard (F13-48):** If no set assigned AND any field is NULL → BLOCK computation with error.
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `campaign_type` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** awareness / acquisition / retention / reactivation / seasonal / launch. NULL = use set. |
| `marketing_channel` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** social_media / search / display / influencer / offline / referral. NULL = use set. |
| `objective` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** brand_awareness / app_installs / first_orders / repeat_orders / aov_increase. NULL = use set. |
| `benchmark_cpm_inr` | assumption | DECIMAL(10,2) NULLABLE | Override CPM. CHECK(> 0) when non-NULL. NULL = use set. (S50 OWNS marketing benchmarks) |
| `benchmark_ctr_pct` | assumption | DECIMAL(5,2) NULLABLE | Override CTR. CHECK(BETWEEN 0.01 AND 100) when non-NULL. NULL = use set. |
| `benchmark_cvr_pct` | assumption | DECIMAL(5,2) NULLABLE | Override CVR. CHECK(BETWEEN 0.01 AND 100) when non-NULL. **D13-02: S50 CVR ≠ S40 CVR.** S300 warns if S50 < S40. NULL = use set. |
| `benchmark_cac_inr` | assumption | DECIMAL(10,2) NULLABLE | Override CAC. CHECK(> 0) when non-NULL. S50 OWNS detailed CAC (Rule 14). NULL = use set. |
| `repeat_rate_pct` | assumption | DECIMAL(5,2) NULLABLE | Override repeat rate. CHECK(BETWEEN 0 AND 100) when non-NULL. S50 OWNS (Rule 14). NULL = use set. |
| `lifecycle_stage` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** pre_launch / seed / growth / maturity / sustain. NULL = use set. |
| `ltv_to_cac_ratio_assumption` | assumption | DECIMAL(5,2) NULLABLE | Override LTV:CAC target. NULL = use set. |
| `budget_driver_mode` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** absolute / pct_of_revenue / min_of_both. NULL = use set. Circular dependency: min_of_both breaks cycle (F13-45). |
| `monthly_budget_inr` | assumption | DECIMAL(12,2) NULLABLE | Override budget. CHECK(> 0) when non-NULL. NULL = use set. |
| `budget_share_of_revenue_pct` | assumption | DECIMAL(5,2) NULLABLE | Override budget %. CHECK(BETWEEN 0 AND 100) when non-NULL. NULL = use set. |
| `promo_intensity_assumption` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** none / light / moderate / heavy / aggressive. NULL = use set. |
| `seasonality_adjustment_factor` | assumption | DECIMAL(4,2) NULLABLE | Override multiplier. CHECK(BETWEEN 0.10 AND 5.00) when non-NULL. NULL = use set. |
| `model_campaign_start_date` | assumption | DATE NULLABLE | Override start date. NULL = use set or context activation. |
| `model_campaign_end_date` | assumption | DATE NULLABLE | Override end date. NULL = use set or ongoing. |

Constraints: UNIQUE(format_id, market_id, channel_id, scenario, effective_from) — Rule 20.
**05j gatekeeper + S40 activation gate** (DI-31).
**Ownership (F13-42):** S50 EXCLUSIVELY OWNS benchmark_cac_inr (detailed) and repeat_rate_pct. S40 benchmark fields are Rule 15 references.
**CVR boundary (D13-02, F13-46):** S50 CVR = marketing-specific (paid traffic). S40 CVR = overall channel (all traffic). S300 warns if S50 < S40.
Lifecycle cascade: master archive → assumptions archive. S40 exclusion → flag rows.
v4.1 added: lifecycle_stage.
v4.5.7 (Phase 13): All 20 fields → NULLABLE for Pattern #19 override layer (D13-01). +data types, +FK, +05j+S40 gates, +Rule 20, +resolution stack, +validation, +nullability guard, +dropdown constraints. F13-36→F13-49.

## S50-03 `marketing_decisions` — Lock ID: PHASE13-T03-LOCK 🔒
Grain: format × market × channel
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `selected_for_activation_flag` | decision | BOOLEAN NOT NULL DEFAULT true | Human decision: activate this marketing plan. false = contributor exclusion (D13-03) — zero-spend rows, no block. |
| `campaign_priority_rank` | decision | INTEGER NULLABLE | Human-assigned priority among campaigns. UNIQUE within context. |
| `budget_override_inr` | decision | DECIMAL(12,2) NULLABLE | Pattern #21 Layer 4: overrides BOTH set AND flat budget values. NULL = use resolved budget. |
| `campaign_start_date_override` | decision | DATE NULLABLE | Human override of campaign start. NULL = use resolved date. |
| `campaign_end_date_override` | decision | DATE NULLABLE | Human override of campaign end. NULL = use resolved date. |
| `decision_notes` | decision | TEXT NULLABLE | Free-form notes explaining the decision rationale. |

Constraints: UNIQUE(format_id, market_id, channel_id, scenario, effective_from) — Rule 20.
**05j + S40 gates.**
Override fields NULLABLE: NULL = use set/flat resolved value.
Lifecycle cascade: master archive → decisions archive.
v4.5.7 (Phase 13): +data types, +FK, +05j+S40 gates, +Rule 20, +contributor activation (D13-03), +Pattern #21 Layer 4 budget override, +lifecycle. F13-50→F13-57.

## S50-04 `marketing_outputs` — Lock ID: PHASE13-T04-LOCK 🔒
Grain: format × market × channel | Column count: 15 (was 13, +2 in Phase 13)
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `projected_impressions` | output | BIGINT | Computed total impressions from budget ÷ CPM. BIGINT for scale. |
| `projected_clicks` | output | BIGINT | Computed clicks from impressions × CTR. BIGINT for scale. |
| `projected_orders` | output | INTEGER | Computed orders from clicks × CVR. |
| `projected_spend_inr` | output | DECIMAL(14,2) | Resolved marketing spend in ₹. |
| `blended_cac_inr` | output | DECIMAL(10,2) | Computed blended CAC = total spend ÷ new customers acquired. |
| `marketing_roi_pct` | output | DECIMAL(7,2) | Computed marketing ROI = (incremental revenue − spend) ÷ spend × 100. |
| `ltv_to_cac_ratio` | output | DECIMAL(5,2) | Computed LTV:CAC ratio. S300 warns if < 1.0 or > 10.0. S30 wave trigger: market expansion metric. |
| `campaign_start_date` | output | DATE | Resolved campaign start date (decision override > flat > set). |
| `campaign_end_date` | output | DATE NULLABLE | Resolved campaign end date. NULL = ongoing. |
| `activation_status` | output | VARCHAR | Resolved state: active / inactive / pending. Inactive → zero-spend rows (not omitted — contributor pattern, D13-03). |
| **`order_estimation_gap_pct`** | **output** | **DECIMAL(7,2)** | **(S50 funnel orders − S40 share × S60 orders) / (S40 share × S60 orders) × 100. S300 warns if |gap| > 30%. Planning signal — not error. (D13-04, F13-60)** |
| **`set_id_used`** | **output** | **FK INTEGER NULLABLE** | **Traceability: which marketing_spend_set_master produced these outputs. NULL = flat assumptions (no set assigned). FK to marketing_spend_set_master. (F13-61)** |

Constraints: UNIQUE(format_id, market_id, channel_id, scenario, effective_from) — Rule 20.
**Funnel computation chain (F13-62):** budget → impressions (÷CPM) → clicks (×CTR) → orders (×CVR) → CAC (spend÷customers) → ROI → LTV:CAC.
**4-layer resolution (F13-63):** Set (Layer 1) → Flat Override non-NULL (Layer 2) → Decision Override (Layer 3) → Fallback (Layer 4).
**S200 CM2 consumption (F13-64):** `projected_spend_inr` → S200 `cm2_output.marketing_inr`.
**S60 awareness feed (DI-57):** S50 marketing output contributes to S60 `awareness_stock` via adstock model (D14-01). Governance spec pending Phase 17. S50 exclusion → zero awareness contribution → S60 awareness modifier defaults to 1.0.
**S30 wave trigger (F13-65):** `ltv_to_cac_ratio` → `market_expansion_trigger_metrics`. S300 warns if < 1.0 or > 10.0.
v4 removed: incremental_revenue_inr (→ S200 owns revenue). revenue_stream_id removed from all grains.
v4.5.7 (Phase 13): +data types (BIGINT for impressions/clicks), +FK, +Rule 20, +`order_estimation_gap_pct` (D13-04), +`set_id_used` (traceability), +funnel chain, +4-layer resolution, +S200/S30 consumption maps, +contributor output annotation. F13-58→F13-67.

---



================================================================================
<!-- MODULE: 07_S60_demand.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 07_S60_demand.md -->
<!-- Description: S60 Demand Strategy — 8 tables (Phase 14 LOCKED, Pattern #19, 7-factor) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 2790–3145 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S60 — DEMAND STRATEGY (v4.5.0: moved from S70, v4.5.8: 7-factor decomposition + Pattern #19)
# ═══════════════════════════════════════

## S60-01 `demand_inputs` — Lock ID: PHASE14-T01-LOCK 🔒
Purpose: Evaluation controls for demand strategy. **S60 = DEMAND GATE** per Rule 23 (D14-03) — if `include_in_evaluation_flag = false`, S200 is **BLOCKED** for that format × stream × channel × market combination.
**Grain: format × revenue_stream × channel × market** (v4.5.8: expanded from 2 keys to 4 keys — D14-02) | Rows: ~100–675
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 1. **05j gatekeeper** (DI-31). |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master.revenue_stream_id`. Composite key part 2. **06c gatekeeper** (D14-02). |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master.channel_id`. Composite key part 3. **S40 activation gate** (D14-02). |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 4. 05j gatekeeper (format × market). |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only — no computation impact. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project. NULL = global default from `14_periods_master`. CHECK(BETWEEN 1 AND 120) when non-NULL. See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN NOT NULL DEFAULT true | Whether computation engine processes this entity. false = **BLOCKED** per Rule 23 cascade (D14-03). |
| `manual_review_required_flag` | input | BOOLEAN NOT NULL DEFAULT true | Governance flag. Auto-set when scope='directional' OR confidence < 0.5. No computation impact — UI badge only. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, scenario, effective_from) — Rule 20.
**Three gatekeepers (D14-02):**
- **05j_format_market_map:** format_id × market_id pair MUST exist with active status (DI-31).
- **06c_revenue_stream_format_map:** revenue_stream_id × format_id pair MUST exist (NEW for S60).
- **S40 activation gate:** channel_id must be 'active' in `channel_outputs` for this format × market (NEW for S60).
- 06b_revenue_stream_channel_map: advisory (stream × channel validated at app layer).

**Gate annotation (Rule 23, D14-03):** S60 = GATE. Exclusion BLOCKS S200 for that format × stream × channel × market. No re-normalization — demand is independent per context. Partial exclusion → excluded combinations produce no output row. Full exclusion → S200 BLOCKED entirely for format × market. Critical warning to S300.

Auto-set trigger: `manual_review_required_flag` true when scope='directional' OR confidence < 0.5.
Lifecycle cascade: master archive → inputs archive. 05j/06c deactivation → matching rows deactivated. S40 channel deactivation → flag S60 rows for review.
v4: grain reduced from 5 keys to 2 keys. v4.5.8 (Phase 14): grain expanded to 4 keys (D14-02). +data types, +FK, +06c/S40 gates, +Rule 20 UNIQUE, +gate annotation (D14-03), +lifecycle cascade. F14-01→F14-10.

---

## S60-01b `demand_research` — Lock ID: PHASE14-T01B-LOCK 🔒
Purpose: AI-enabled market research context for Demand Strategy. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
**Grain: format × revenue_stream × channel × market** (v4.5.8: expanded from 2 keys — D14-02) | Rows: ~50–200
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. 05j gatekeeper. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. 06c gatekeeper. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. S40 activation gate. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 4. 05j gatekeeper (format × market). |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, scenario, effective_from) — Rule 20. Same 3 gatekeepers as parent `_inputs` table (05j + 06c + S40).
AI Research Scope: Food delivery demand density by micro-market cluster, Indian QSR OPD benchmarks (Domino's India, Rebel Foods, cloud kitchen baselines), penetration curve calibration data, demand ramp profiles by city tier and format type, seasonal demand patterns, day-of-week and hourly ordering distributions, price elasticity by category, addressable market sizing, customer retention/cohort data, **industry demand indices by geography and category**, **competitive position benchmarking**, **brand awareness measurement proxies** (search volume, app rankings, unaided recall surveys), weather/festival/event demand variation.
v4.5.0: New table. Pattern #22. Rule 25. v4.5.8 (Phase 14): grain expanded to 4 keys, +06c/S40 gates, +expanded research scope (industry indices, competitive benchmarking, awareness proxies). F14-11→F14-16.
Outcome linkage: Field-level research results stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. Pattern #23.

---

## S60-05 `demand_profile_set_master` — Lock ID: PHASE14-T05-LOCK 🔒 🆕
Purpose: Profile definitions for reusable demand methodology templates. **Pattern #19 Layer 1.** Scenario-independent. Each profile defines a demand generation archetype (e.g., "Metro Cloud Kitchen Delivery Fast Ramp" or "Tier-1 Spoke Dine-In Medium Ramp").
Grain: set (single-key) | Rows: ~5–15
| Column | Classification | Type | Description |
|---|---|---|---|
| `set_id` | PK | INTEGER | Auto-generated. |
| `set_code` | master | VARCHAR UNIQUE | Max 30 chars, uppercase alphanumeric + underscore. E.g., `METRO_CK_DEL_FAST`, `T1_SPOKE_DIN_MED`. |
| `set_name` | master | VARCHAR UNIQUE | Display name. |
| `set_description` | master | TEXT NOT NULL | Profile purpose and usage guidance. |
| `lifecycle_stage` | master | VARCHAR NOT NULL | **Dropdown:** pre_launch / seed / growth / maturity / sustain. Categorization of demand phase. |
| `demand_driver_mode` | master | VARCHAR NOT NULL | **Dropdown:** penetration_curve / flat_opd / manual. `penetration_curve` = full D14-01 7-factor equation. `flat_opd` = base_orders × growth only. `manual` = hard-override only. |
| `sort_order` | master | INTEGER UNIQUE | Display position. |
| **`research_populated_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was created and/or populated by the research pipeline. `false` = manually created. Enables filtering research-sourced vs manual sets. |
| **`auto_created_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was auto-created by the research pipeline (not user-defined). User can rename, edit, or delete. Auto-created sets are assigned to contexts automatically via D-CROSS-01a. |

System field exception: carries `set_id` + `row_status` only. No version/scenario/effective_from/to (scenario-independent — same pattern as S70/S50 set masters).
v4.5.8 (Phase 14): NEW TABLE. Pattern #19 adopted for S60 (D14-01). F14-17→F14-23.

---

## S60-06 `demand_profile_set_items` — Lock ID: PHASE14-T06-LOCK 🔒 🆕
Purpose: Full 7-factor demand methodology parameters within a demand profile. **Pattern #19 Layer 2.** Carries the complete D14-01 penetration-driven decomposition specification. This is the most methodology-rich set_items table in the FPE schema.
Grain: set × item_sequence | Rows: ~15–60
| Column | Classification | Type | Description |
|---|---|---|---|
| **Keys** | | | |
| `set_id` | key | FK (INTEGER) | FK to `demand_profile_set_master`. |
| `item_sequence` | key | INTEGER | UNIQUE within set. Processing/display order. Multi-item profiles support phased demand trajectories. |
| **Factor 1 — Addressable Base** | | | |
| `launch_orders_per_day_anchor` | set_item | DECIMAL(10,2) NOT NULL | Seed/launch daily orders. CHECK(> 0). |
| `mature_orders_per_day_anchor` | set_item | DECIMAL(10,2) NOT NULL | Steady-state target daily orders. CHECK(> launch_orders_per_day_anchor). |
| `capture_rate_assumption_pct` | set_item | DECIMAL(5,2) NOT NULL DEFAULT 100.00 | % of addressable demand captured. CHECK(BETWEEN 0.00 AND 100.00). `AddressableBase = mature_anchor × capture_rate / 100`. |
| **Factor 2 — Penetration Curve** | | | |
| `penetration_curve_family` | set_item | VARCHAR NOT NULL | **Dropdown:** hybrid_logistic / logistic_time_only / logistic_cum_only / linear / step / custom. Default: `hybrid_logistic`. |
| `alpha_cum` | set_item | DECIMAL(6,4) NOT NULL | Cumulative logistic steepness. CHECK(> 0). Used in `PENETRATION(alpha_cum, C_eff, C_mid_cum)`. |
| `C_mid_cum` | set_item | INTEGER NOT NULL | Cumulative midpoint (total order count at 50% adoption). CHECK(> 0). |
| `alpha_time` | set_item | DECIMAL(6,4) NOT NULL | Time logistic steepness. CHECK(> 0). |
| `t_mid_time` | set_item | INTEGER NOT NULL | Time midpoint (month at 50% time-based adoption). CHECK(BETWEEN 1 AND 120). |
| `lambda_max` | set_item | DECIMAL(3,2) NOT NULL DEFAULT 0.85 | Adaptive lambda ceiling (early-phase cumulative weight). CHECK(BETWEEN 0.00 AND 1.00). |
| `lambda_min` | set_item | DECIMAL(3,2) NOT NULL DEFAULT 0.55 | Adaptive lambda floor (saturation-phase time weight). CHECK(BETWEEN 0.00 AND lambda_max). |
| `penetration_cap_pct` | set_item | DECIMAL(5,2) NOT NULL DEFAULT 100.00 | Max penetration %. CHECK(BETWEEN 1.00 AND 100.00). |
| `launch_penetration_pct` | set_item | DECIMAL(5,2) NOT NULL DEFAULT 5.00 | Penetration level at t=0. |
| `maturity_penetration_pct` | set_item | DECIMAL(5,2) NOT NULL DEFAULT 85.00 | Steady-state penetration level. |
| `structural_growth_rate_monthly_pct` | set_item | DECIMAL(5,3) NOT NULL DEFAULT 0.000 | Post-maturity organic growth. CHECK(BETWEEN −5.000 AND 10.000). |
| **Factor 2 modifier — Competitive Density** | | | |
| `competitive_density_factor` | set_item | DECIMAL(4,3) DEFAULT 0.000 | Scaling coefficient (0–1). `C_mid_adj = C_mid × (1 - density_factor × share/100)`. CHECK(BETWEEN 0.000 AND 1.000). |
| `competitor_share_pct` | set_item | DECIMAL(5,2) DEFAULT 0.00 | Competitor market share %. CHECK(BETWEEN 0.00 AND 100.00). |
| **Tier override** | | | |
| `market_tier` | set_item | VARCHAR NULLABLE | **Dropdown:** metro / tier_1 / tier_2 / tier_3. NULLABLE — if set, parameters apply only to this tier. Multi-item profiles can have tier-specific rows. |
| **Factor 3 — Industry Index** | | | |
| `industry_demand_index` | set_item | DECIMAL(5,3) NOT NULL DEFAULT 1.000 | Category health multiplier. 1.000 = baseline. CHECK(BETWEEN 0.100 AND 5.000). >1 = growing above trend. <1 = contracting. |
| `industry_index_source` | set_item | VARCHAR NULLABLE | Source lineage: 'RedSeer Q4 2026', 'Internal estimate', etc. |
| **Factor 4 — Relative Business Index** | | | |
| `relative_business_index` | set_item | DECIMAL(5,3) NOT NULL DEFAULT 1.000 | Competitive position composite multiplier. 1.000 = parity. CHECK(BETWEEN 0.100 AND 5.000). |
| `relative_product_sub_index` | set_item | DECIMAL(4,3) NULLABLE | Product competitiveness. Optional decomposition. |
| `relative_price_sub_index` | set_item | DECIMAL(4,3) NULLABLE | Price competitiveness. Optional decomposition. |
| `relative_promo_sub_index` | set_item | DECIMAL(4,3) NULLABLE | Promotion effectiveness. Optional decomposition. |
| `relative_performance_sub_index` | set_item | DECIMAL(4,3) NULLABLE | Operational performance. Optional decomposition. |
| `relative_availability_sub_index` | set_item | DECIMAL(4,3) NULLABLE | Service availability. Optional decomposition. |
| `relative_trust_sub_index` | set_item | DECIMAL(4,3) NULLABLE | Brand trust / rating. Optional decomposition. |
| **Factor 5 — Awareness Modifier** | | | |
| `awareness_stock_base` | set_item | DECIMAL(10,2) NULLABLE | Baseline awareness stock for normalization. NULL = awareness modifier disabled (=1.0). |
| `awareness_decay_rate` | set_item | DECIMAL(4,3) NULLABLE | Monthly awareness decay (0.000–1.000). E.g., 0.150 = 15% decay/month. |
| `awareness_demand_elasticity` | set_item | DECIMAL(4,3) NULLABLE | Awareness-to-demand power coefficient. 0 = no effect. |
| `awareness_initial_stock` | set_item | DECIMAL(10,2) NULLABLE | Starting awareness stock at t=0. |
| **Factor 6 — Elasticity** | | | |
| `price_elasticity_coefficient` | set_item | DECIMAL(4,2) NOT NULL DEFAULT −1.00 | Constant elasticity epsilon. CHECK(BETWEEN −5.00 AND 0.00). Typical: Pizzas −0.8, Sides −1.2, Beverages −0.5, Desserts −0.9. |
| `reference_price_inr` | set_item | DECIMAL(10,2) NOT NULL | S60-safe price reference for elasticity computation. CHECK(> 0). NOT from S70 (D14-04). |
| `promotion_elasticity_coefficient` | set_item | DECIMAL(4,2) DEFAULT 0.00 | Promo demand response. CHECK(BETWEEN 0.00 AND 5.00). |
| **Factor 7 — Seasonality** | | | |
| `month_state_multipliers_json` | set_item | TEXT NULLABLE | JSON: 12 monthly multipliers. Redistributive normalization applied by engine. NULL = uniform (all 1.0). |
| `daytype_multipliers_json` | set_item | TEXT NULLABLE | JSON: day-type multipliers (weekday, weekend, holiday). NULL = uniform. |
| `hourstate_multipliers_json` | set_item | TEXT NULLABLE | JSON: hour-state multipliers (peak, shoulder, off-peak). NULL = uniform. |
| `seasonality_mode` | set_item | VARCHAR NOT NULL DEFAULT 'redistributive' | **Dropdown:** redistributive / structural / hybrid. Redistributive = annual total preserved. |
| **Other** | | | |
| `penetration_calibration_source` | set_item | VARCHAR NULLABLE | Benchmark source for lineage (e.g., 'Domino's India 2024 ramp data'). |
| `model_phase_start_date` | set_item | DATE NULLABLE | Phase start for multi-item profiles. |
| `model_phase_end_date` | set_item | DATE NULLABLE | Phase end for multi-item profiles. |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

System fields: standard 6 (version, scenario, effective_from/to, row_status + set_items_id).
**D14-01 demand equation (exact):**
```
D*_t(f,s,c,m) = AddressableBase(f,s,c,m) × PenetrationCurve(f,s,c,m,t) × IndustryIndex(m,t) × RelativeBusinessIndex(f,m,t) × AwarenessModifier(f,c,m,t) × ElasticityModifier(f,s,c,m,t) × SeasonalityMultiplier(t)
```
**Penetration function:** `PENETRATION(alpha, C_eff, C_mid) = 1 / (1 + EXP(-alpha × (C_eff - C_mid)))`
**Adaptive lambda:** `lambda_t = lambda_max - (lambda_max - lambda_min) × (t / t_max)`
**Competitive density:** `C_mid_adj = C_mid × (1 - DensityFactor × CompetitorShare)`
**Constant elasticity:** `ElasticityModifier = (Price_actual / Price_base) ^ epsilon`
**Awareness adstock:** `AwarenessStock(t) = AwarenessStock(t-1) × (1 - decay_rate) + S50_contribution(t)`
**Redistributive seasonality:** `MonthMult(t) = RawMonthMult(MonthState(t)) / NormFactor_Month`
v4.5.8 (Phase 14): NEW TABLE. Pattern #19 Layer 2. Full D14-01 7-factor methodology. F14-24→F14-46.

---

## S60-07 `demand_profile_set_assignment` — Lock ID: PHASE14-T07-LOCK 🔒 🆕
Purpose: DIRECT assignment of demand profiles to format × revenue_stream × channel × market contexts. **Pattern #19 Layer 3.** Uses direct assignment (NOT S00 context_set_master) because context_set_members lacks channel dimension (DI-56). Same pattern as S50-07.
**Grain: format × revenue_stream × channel × market × set** | Rows: ~100–675
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 4. |
| `set_id` | key | FK (INTEGER) | FK to `demand_profile_set_master`. Which profile to apply. |
| `priority_rank` | assignment | INTEGER | UNIQUE within (format, stream, channel, market). Tiebreaker when multiple sets assigned. |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, scenario, effective_from) — Rule 20.
**05j gatekeeper + 06c gatekeeper + S40 activation gate.** Channel must be active in S40 outputs.
v4.5.8 (Phase 14): NEW TABLE. Pattern #19 Layer 3. Direct assignment at format × stream × channel × market grain due to DI-56 (channel dimension). F14-47→F14-53.

---

## S60-02 `demand_assumptions` — Lock ID: PHASE14-T02-LOCK 🔒
**Grain: format × revenue_stream × channel × market** (v4.5.8: expanded from 2 keys — D14-02) | Purpose: Context-specific overrides for Pattern #19 sets. **S60 OWNS demand volume, ramp, penetration, elasticity, seasonality, decomposition.**
Pattern #19: ADOPTED (D14-01). **All non-key fields → NULLABLE.** NULL = "use set value." Non-NULL = override (Layer 2).
**Resolution stack (Pattern #21):** Set (Layer 1) → Flat Override (non-NULL, Layer 2) → Decision Override (Layer 3) → Fallback (no set — all mandatory fields must be non-NULL).
**Nullability guard:** If no set assigned AND any mandatory decomposition field is NULL → BLOCK computation with error.
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. 05j gatekeeper. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. 06c gatekeeper. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. S40 activation gate. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 4. 05j gatekeeper (format × market). |
| **Factor 1 — Addressable Base overrides** | | | |
| `launch_orders_per_day_anchor` | assumption | DECIMAL(10,2) NULLABLE | Override set value. CHECK(> 0) when non-NULL. |
| `mature_orders_per_day_anchor` | assumption | DECIMAL(10,2) NULLABLE | Override set value. CHECK(> launch anchor) when non-NULL. |
| `capture_rate_assumption_pct` | assumption | DECIMAL(5,2) NULLABLE | Override set value. CHECK(BETWEEN 0.00 AND 100.00) when non-NULL. |
| **Factor 2 — Penetration Curve overrides** | | | |
| `penetration_curve_family` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** hybrid_logistic / logistic_time_only / logistic_cum_only / linear / step / custom. |
| `alpha_cum` | assumption | DECIMAL(6,4) NULLABLE | Override. CHECK(> 0) when non-NULL. |
| `C_mid_cum` | assumption | INTEGER NULLABLE | Override. CHECK(> 0) when non-NULL. |
| `alpha_time` | assumption | DECIMAL(6,4) NULLABLE | Override. CHECK(> 0) when non-NULL. |
| `t_mid_time` | assumption | INTEGER NULLABLE | Override. CHECK(BETWEEN 1 AND 120) when non-NULL. |
| `lambda_max` | assumption | DECIMAL(3,2) NULLABLE | Override. CHECK(BETWEEN 0.00 AND 1.00) when non-NULL. |
| `lambda_min` | assumption | DECIMAL(3,2) NULLABLE | Override. CHECK(BETWEEN 0.00 AND lambda_max) when non-NULL. |
| `penetration_cap_pct` | assumption | DECIMAL(5,2) NULLABLE | Override. CHECK(BETWEEN 1.00 AND 100.00) when non-NULL. |
| `launch_penetration_pct` | assumption | DECIMAL(5,2) NULLABLE | Override. |
| `maturity_penetration_pct` | assumption | DECIMAL(5,2) NULLABLE | Override. |
| `structural_growth_rate_monthly_pct` | assumption | DECIMAL(5,3) NULLABLE | Override. CHECK(BETWEEN −5.000 AND 10.000) when non-NULL. |
| **Factor 2 modifier overrides** | | | |
| `competitive_density_factor` | assumption | DECIMAL(4,3) NULLABLE | Override. CHECK(BETWEEN 0.000 AND 1.000) when non-NULL. |
| `competitor_share_pct` | assumption | DECIMAL(5,2) NULLABLE | Override. CHECK(BETWEEN 0.00 AND 100.00) when non-NULL. |
| **Factor 3 overrides** | | | |
| `industry_demand_index` | assumption | DECIMAL(5,3) NULLABLE | Override. CHECK(BETWEEN 0.100 AND 5.000) when non-NULL. |
| `industry_index_source` | assumption | VARCHAR NULLABLE | Override source annotation. |
| **Factor 4 overrides** | | | |
| `relative_business_index` | assumption | DECIMAL(5,3) NULLABLE | Override. CHECK(BETWEEN 0.100 AND 5.000) when non-NULL. |
| `relative_product_sub_index` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `relative_price_sub_index` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `relative_promo_sub_index` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `relative_performance_sub_index` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `relative_availability_sub_index` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `relative_trust_sub_index` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| **Factor 5 overrides** | | | |
| `awareness_stock_base` | assumption | DECIMAL(10,2) NULLABLE | Override. |
| `awareness_decay_rate` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `awareness_demand_elasticity` | assumption | DECIMAL(4,3) NULLABLE | Override. |
| `awareness_initial_stock` | assumption | DECIMAL(10,2) NULLABLE | Override. |
| **Factor 6 overrides** | | | |
| `price_elasticity_coefficient` | assumption | DECIMAL(4,2) NULLABLE | Override. CHECK(BETWEEN −5.00 AND 0.00) when non-NULL. |
| `reference_price_inr` | assumption | DECIMAL(10,2) NULLABLE | Override S60-safe reference. CHECK(> 0) when non-NULL. NOT from S70 (D14-04). |
| `promotion_elasticity_coefficient` | assumption | DECIMAL(4,2) NULLABLE | Override. CHECK(BETWEEN 0.00 AND 5.00) when non-NULL. |
| **Factor 7 overrides** | | | |
| `month_state_multipliers_json` | assumption | TEXT NULLABLE | Override. JSON 12 monthly multipliers. |
| `daytype_multipliers_json` | assumption | TEXT NULLABLE | Override. JSON day-type multipliers. |
| `hourstate_multipliers_json` | assumption | TEXT NULLABLE | Override. JSON hour-state multipliers. |
| `seasonality_mode` | assumption | VARCHAR NULLABLE | Override. **Dropdown:** redistributive / structural / hybrid. |
| **Reference / Other** | | | |
| `external_aov_benchmark_inr` | reference | DECIMAL(10,2) NULLABLE | Rule 15 reference — NOT for computation. For governance cross-check vs S70 resolved price post-computation (D14-04). |
| `avg_items_per_order` | assumption | DECIMAL(4,2) NULLABLE | Override. |
| `model_demand_start_date` | assumption | DATE NULLABLE | Override demand start date for this context. |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, scenario, effective_from) — Rule 20.
**05j + 06c + S40 gatekeepers.** Three gatekeepers same as inputs.
**Fields REMOVED from v4.5.7** (replaced by decomposition equivalents):
- ~~`ramp_curve_type`~~ → `penetration_curve_family`
- ~~`ramp_months`~~ → midpoint + steepness parameters
- ~~`weekday_index`~~ → `daytype_multipliers_json`
- ~~`weekend_index`~~ → `daytype_multipliers_json`
- ~~`seasonality_index`~~ → `month_state_multipliers_json`
- ~~`peak_hour_share_pct`~~ → `hourstate_multipliers_json`

v4: grain reduced from 5 keys to 2 keys. Removed cancellation_rate_pct, return_rate_pct (→ S40 owns per-channel). Renamed base_aov_inr_benchmark → external_aov_benchmark_inr.
v4.5.8 (Phase 14): grain expanded to 4 keys (D14-02). −6 fields (replaced by decomposition). All non-key → NULLABLE (Pattern #19, D14-01). +penetration/industry/relative/awareness/elasticity/seasonality overrides. +nullability guard. F14-54→F14-75.

---

## S60-03 `demand_decisions` — Lock ID: PHASE14-T03-LOCK 🔒
**Grain: format × revenue_stream × channel × market** (v4.5.8: expanded from 2 keys — D14-02) | Purpose: CEO-level human overrides for demand.
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. 05j gatekeeper. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. 06c gatekeeper. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master`. Composite key part 3. S40 activation gate. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 4. 05j gatekeeper (format × market). |
| `selected_for_evaluation_flag` | decision | BOOLEAN NOT NULL DEFAULT true | Human decision: include this context in demand computation. false = **GATE exclusion** (D14-03) — S200 BLOCKED. |
| `target_orders_per_day_override` | decision | DECIMAL(10,2) NULLABLE | Hard-override of entire decomposition output. If non-NULL, replaces computed D*_t. |
| `launch_orders_per_day_override` | decision | DECIMAL(10,2) NULLABLE | Override launch anchor. CHECK(> 0) when non-NULL. |
| `mature_orders_per_day_override` | decision | DECIMAL(10,2) NULLABLE | Override mature anchor. CHECK(> launch override) when non-NULL. |
| `launch_penetration_override_pct` | decision | DECIMAL(5,2) NULLABLE | Override penetration at t=0. |
| `maturity_penetration_override_pct` | decision | DECIMAL(5,2) NULLABLE | Override steady-state penetration. |
| `industry_demand_index_override` | decision | DECIMAL(5,3) NULLABLE | Override Factor 3 value. CHECK(BETWEEN 0.100 AND 5.000) when non-NULL. |
| `relative_business_index_override` | decision | DECIMAL(5,3) NULLABLE | Override Factor 4 value. CHECK(BETWEEN 0.100 AND 5.000) when non-NULL. |
| `awareness_modifier_override` | decision | DECIMAL(5,3) NULLABLE | Hard-set awareness multiplier (bypasses adstock calculation). CHECK(BETWEEN 0.000 AND 10.000) when non-NULL. |
| `demand_profile_set_override_id` | decision | FK INTEGER NULLABLE | Reassign profile set at decision level. FK to `demand_profile_set_master`. |
| `demand_start_date_override` | decision | DATE NULLABLE | Override demand start date. |
| `target_aov_override_inr` | decision | DECIMAL(10,2) NULLABLE | Override AOV for governance. Rule 15 reference only. |
| `decision_notes` | decision | TEXT | Free-form notes explaining the decision rationale. |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, scenario, effective_from) — Rule 20.
**05j + 06c + S40 gatekeepers.**
Override fields NULLABLE: NULL = use set/flat resolved value.
Lifecycle cascade: master archive → decisions archive.
v4.5.8 (Phase 14): grain expanded to 4 keys (D14-02). +`selected_for_evaluation_flag` GATE decision (D14-03), +penetration anchor overrides, +decomposition factor overrides (industry, relative, awareness), +`demand_profile_set_override_id`. F14-76→F14-86.

---

## S60-04 `demand_outputs` — Lock ID: PHASE14-T04-LOCK 🔒
**Grain: format × revenue_stream × channel × market** (v4.5.8: expanded from 2 keys — D14-02) | Purpose: Projected demand volume with full 7-factor decomposition audit trail. **S60 is the SINGLE SOURCE of order volume (Rule 13) at atomic format × stream × channel × market granularity.**
Column count: 31 (was 10 in v4.5.7, +18 decomposition audit fields, +3 new core fields)
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | Key 1. |
| `revenue_stream_id` | key | FK (INTEGER) | Key 2. |
| `channel_id` | key | FK (INTEGER) | Key 3. |
| `market_id` | key | FK (INTEGER) | Key 4. |
| **Core demand outputs** | | | |
| `projected_orders_per_day` | output | DECIMAL(10,2) | Resolved daily gross orders — post all 7 factors. S60 SINGLE SOURCE (Rule 13). **= D*_t × seasonality** |
| `projected_items_per_order` | output | DECIMAL(4,2) | Resolved average items per order. |
| `derived_blended_aov_inr` | output | DECIMAL(10,2) | Blended AOV from S20 pricing × product mix shares. |
| `projected_cancellation_rate_pct` | output | DECIMAL(5,2) | From S40: channel-specific cancel rate. **At expanded grain, read directly per-channel — no blending needed (F12-48 NOT NULL guarantee).** |
| `projected_return_rate_pct` | output | DECIMAL(5,2) | From S40: channel-specific return rate. Directly consumed per-channel. |
| `projected_net_orders_per_day` | output | DECIMAL(10,2) | = gross × (1 − cancel/100) × (1 − return/100). |
| `demand_ramp_month` | output | INTEGER | Current month in penetration sequence. |
| `demand_start_date` | output | DATE | Resolved demand start date. |
| `steady_state_flag` | output | BOOLEAN | true when penetration ≥ maturity level. |
| **Factor 1 audit** | | | |
| `gross_addressable_orders_per_day` | output | DECIMAL(10,2) | = mature_anchor × capture_rate / 100. Factor 1 output. |
| **Factor 2 audit** | | | |
| `resolved_penetration_pct` | output | DECIMAL(5,2) | Blended hybrid penetration at month t. Factor 2 output. |
| `resolved_lambda_t` | output | DECIMAL(3,2) | Adaptive lambda value at t. |
| `cum_component_penetration_pct` | output | DECIMAL(5,2) | P_cum(t) — cumulative logistic value. |
| `time_component_penetration_pct` | output | DECIMAL(5,2) | P_time(t) — time logistic value. |
| `resolved_C_mid_adj` | output | INTEGER | Competitive-density-adjusted C_mid. |
| **Factor 3 audit** | | | |
| `resolved_industry_index` | output | DECIMAL(5,3) | Factor 3 value used. 1.000 = baseline. |
| **Factor 4 audit** | | | |
| `resolved_relative_business_index` | output | DECIMAL(5,3) | Factor 4 value used. 1.000 = parity. |
| **Factor 5 audit** | | | |
| `resolved_awareness_multiplier` | output | DECIMAL(5,4) | Factor 5 value. 1.0000 = no awareness effect. |
| `resolved_awareness_stock` | output | DECIMAL(10,2) | Current awareness stock level. |
| **Factor 6 audit** | | | |
| `resolved_elasticity_multiplier` | output | DECIMAL(5,4) | Factor 6 value. 1.0000 = no elasticity effect. |
| **Factor 7 audit** | | | |
| `resolved_month_seasonality_multiplier` | output | DECIMAL(5,4) | Factor 7 MonthMult value. |
| **Derived summary outputs** | | | |
| `resolved_gross_orders_pre_seasonality` | output | DECIMAL(10,2) | Orders after Factors 1–6, before Factor 7. |
| `seasonalized_orders_per_day` | output | DECIMAL(10,2) | Final seasonalized daily demand. |
| `seasonalized_orders_per_month` | output | DECIMAL(12,2) | = seasonalized_orders_per_day × days_in_month. |
| **Traceability** | | | |
| `resolved_penetration_curve_family` | output | VARCHAR | Which curve type used. |
| `resolved_hourstate_profile_code` | output | VARCHAR | For S80 capacity hourly consumption. |
| `set_id_used` | output | FK INTEGER NULLABLE | Which demand_profile_set_master produced these outputs. NULL = flat assumptions (no set assigned). |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, scenario, effective_from) — Rule 20.
**4-layer resolution traced (Pattern #21, F14-91):** Set (Layer 1) → Flat Override (Layer 2) → Decision Override (Layer 3) → Fallback (Layer 4).

**S200/S80/S30/S300 consumption map:**
```
S60.seasonalized_orders_per_day         → S80 capacity (hourly sizing)
S60.seasonalized_orders_per_month       → S200 revenue (per stream × channel volume)
S60.projected_net_orders_per_day        → S200 revenue (net of cancel + return)
S60.projected_items_per_order           → S200 (basket decomposition)
S60.resolved_hourstate_profile_code     → S80 (hourly distribution)
S60.steady_state_flag                   → S30 wave triggers
S60.demand_ramp_month                   → S30 wave triggers
S60.resolved_penetration_pct            → S300 governance
S60.resolved_awareness_multiplier       → S300 governance (awareness feedback health)
S60.resolved_industry_index             → S300 governance (industry vs business attribution)

Note: With expanded grain, S200 receives per-stream per-channel demand directly.
No blending/aggregation needed at S200 level — S60 provides atomic demand.
S40 cancel/return rates are consumed per-channel directly (not blended).
DI-57: S50→S60 awareness feedback governance spec pending (Phase 17).
```

v4: removed projected_aov_inr (→ derived_blended_aov_inr), projected_gross_revenue_per_day_inr, projected_net_revenue_per_day_inr (→ S200 owns). projected_cancellation_rate_pct derived from S40 per-channel rates.
v4.5.8 (Phase 14): grain expanded to 4 keys (D14-02). +18 decomposition audit fields (all 7 factors traceable). +`projected_return_rate_pct` (per-channel direct), +`gross_addressable_orders_per_day`, +`seasonalized_orders_per_day/month`, +`set_id_used`. Consumption map upgraded to atomic grain. F14-87→F14-91.

---



================================================================================
<!-- MODULE: 08_S70_product_economics.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 08_S70_product_economics.md -->
<!-- Description: S70 Product Economics — 17 active tables (set-based architecture) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 3146–3476 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S70 — PRODUCT ECONOMICS (v4.5.0: moved from S20, set-based architecture)
# ═══════════════════════════════════════

## S70-01 `product_economics_inputs`
Purpose: Evaluation controls for product economics. **S70 = PRICING GATE** per Rule 23 at format × stream × market grain (upgraded from format × market in Phase 9, Option A).
Grain: format × revenue_stream × market | Rows: ~20–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. Composite key part 1. 05j gatekeeper. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master.revenue_stream_id`. Composite key part 2. 06c gatekeeper (stream × format). |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. Composite key part 3. 05j gatekeeper (format × market). |
| `evaluation_scope_level` | input | VARCHAR | Analysis depth. **Dropdown:** directional / structured / validated / audited. Metadata only — no computation impact. See Rule 24. |
| `planning_horizon_months` | input | INTEGER | How many monthly periods to project. NULL = global default. CHECK(BETWEEN 1 AND 120). See Rule 24. |
| `include_in_evaluation_flag` | input | BOOLEAN | Whether computation engine processes this entity. false = skipped per Rule 23 cascade. Default: true. |
| `manual_review_required_flag` | input | BOOLEAN | Governance flag. Auto-set when scope=directional or confidence<0.5. Default: true for new rows. |
| `notes` | input | TEXT | Free-form text for context, reasoning, or instructions |

Constraints: UNIQUE(format_id, revenue_stream_id, market_id, scenario, effective_from) — Rule 20. Rule 24 compliant (5 input fields after 3 keys). Gatekeepers: 05j (format × market), 06c (stream × format).
Phase 9 change: +revenue_stream_id key (Option A). Grain upgraded to format × stream × market.
Lock ID: PHASE9-T01-LOCK. v4.4.0.


## S70-01b `product_economics_research`
Purpose: AI-enabled market research context for Product Economics. Captures research queries, AI-generated summaries, confidence scores, and source references. Research SUGGESTS assumption values; humans ACCEPT or override. Pattern #22, Rule 25.
Grain: format × revenue_stream × market | Rows: ~20–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `research_run_id` | system | INTEGER | System-generated unique ID across ALL research tables (shared sequence). FK target for `research_outcome_items.research_run_id`. |
| `research_mode` | research | VARCHAR | How assumptions should be sourced. **Dropdown:** manual / ai_assisted / ai_auto / hybrid. |
| `research_prompt` | research | TEXT | Context/query for AI research engine — what data to find, which assumptions to estimate. |
| `research_status` | research | VARCHAR | **Dropdown:** pending / in_progress / completed / stale / failed. |
| `research_completed_at` | research | TIMESTAMP | When AI research last completed. NULL if never run. |
| `research_confidence` | research | DECIMAL(3,2) | AI confidence (0.00–1.00). Feeds `manual_review_required_flag` auto-set: < 0.5 → flag = true. |
| `research_summary` | research | TEXT | AI-generated brief — key findings, data points, methodology. |
| `source_references` | research | TEXT | Citations: report names, URLs, data sources. Semicolon-delimited. Feeds `91_metric_lineage_log`. |
| `fields_covered` | research | TEXT | Comma-separated assumption field names this research covers. |
| `stale_after_days` | research | INTEGER | Days until stale (refresh needed). Default: 90. |
| `auto_refresh_enabled_flag` | research | BOOLEAN | Auto re-run when stale. Default: false. |

Constraints: UNIQUE(format_id, revenue_stream_id, market_id, scenario, effective_from) — Rule 20. Same gatekeeper as parent `_inputs` table.
AI Research Scope: Ingredient costs, packaging costs, pricing benchmarks, competitor menus, commodity prices
v4.5.0: New table. Pattern #22. Rule 25.
Outcome linkage: Field-level research results are stored in `research_outcome_items` (S00 shared), linked via `research_run_id`. This table captures the research CONTEXT; outcome items capture the structured VALUES.
v4.5.1: +research_run_id. Outcome items linkage documented. Pattern #23. Rule 26.

## ~~S70-02a `product_mix_share_assumptions`~~ — DEPRECATED v4.4.0
Replaced by mix set family (product_mix_set_master, product_mix_set_collection_items, product_mix_set_category_items, product_mix_set_product_items, product_mix_set_assignment, product_mix_set_component_options). row_status → deprecated in `00_table_registry`.

## ~~S70-02b `product_pricing_assumptions`~~ — DEPRECATED v4.4.0
Replaced by price set family (product_price_set_master, product_price_set_items). row_status → deprecated in `00_table_registry`.

## ~~S70-02c `product_costing_assumptions`~~ — DEPRECATED v4.4.0
Replaced by cost set family (product_cost_set_master, product_cost_set_items). row_status → deprecated in `00_table_registry`.

---

### S70 Set-Based Architecture (Phase 9 — 5 Architectural Breakthroughs)

**Breakthrough 1: Option A** — revenue_stream_id on ALL S70 tables. Business hierarchy respected: Format → Revenue Stream → Markets. S70/S50 boundary: S70 = per-product per-stream economics, S50 = stream-aggregate where no product granularity.

**Breakthrough 2: Mix Set Pattern (4-Level Hierarchy)** — Reusable, scenario-independent mix templates with 4-level hierarchy: Collection (L1) → Category (L2) → Product (L3) → Variant Distribution (L4). Sum-to-100% validation per level.

**Breakthrough 3: Option Z** — Independent Price + Cost Sets. 3 independent dimensions: mix (what + shares), price (what to charge), cost (what it costs). Cross-set validation: every mix product must exist in both price and cost sets.

**Breakthrough 4: Context Sets** — Named format × stream × market groupings shared across ALL sections S70–S120. Assignment = single-key (context_set_id). Pattern #19 + #20.

**Breakthrough 5: 4-Layer Resolution Stack (Pattern #21)**:
```
Layer 1: Set Base (template value, scenario-independent)
Layer 2: Context Multiplier (uniform factor on assignment: price_adjustment_factor, cost_adjustment_factor)
Layer 2.5: Variant Delta (weighted-average from Level 4 component_options)
Layer 3: Adjustment Deltas (per-product context tuning, sparse) — product_economics_adjustments
Layer 4: Decision Override (CEO nuclear, replaces everything) — product_economics_decisions
Order of operations: percentage adjustments first, then absolute
Modifier rules (attribute-based) deferred to V5 (DI-48)
```

---

## S70-02 `product_mix_set_master`
Purpose: Section-specific master for mix set templates. A mix set defines WHAT products are in the mix and their relative shares. Scenario-independent (the template itself doesn't change; assignment controls which template is used in which scenario).
Grain: mix_set (single-key) | Rows: ~3–10
| Column | Classification | Type | Description |
|---|---|---|---|
| `mix_set_id` | master | INTEGER | Auto-generated PK — unique identifier for a mix set template. |
| `mix_set_code` | master | VARCHAR | Short code (e.g., 'STD-MIX-01', 'PREM-MIX'). **UNIQUE.** |
| `mix_set_name` | master | VARCHAR | Display name (e.g., 'Standard Product Mix'). **UNIQUE.** |
| `mix_set_description` | master | TEXT | What this mix represents. **NOT NULL.** |
| `completeness_type` | master | VARCHAR | **Dropdown:** complete / partial. Complete = self-validating (shares must sum to 100%). Partial = bridge fallback per Rule 21 for missing entries. |
| `sort_order` | master | INTEGER | Display position. **UNIQUE.** |
| **`research_populated_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was created and/or populated by the research pipeline. `false` = manually created. Enables filtering research-sourced vs manual sets. |
| **`auto_created_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was auto-created by the research pipeline (not user-defined). User can rename, edit, or delete. Auto-created sets are assigned to contexts automatically via D-CROSS-01a. |

Constraints: `mix_set_code` UNIQUE, `mix_set_name` UNIQUE, `sort_order` UNIQUE, `mix_set_description` NOT NULL.
Lifecycle: Scenario-independent. Strict archive blocking — active assignments prevent archive.
Lock ID: PHASE9-T02-LOCK. v4.4.0.

## S70-02a `product_mix_set_collection_items`
Purpose: Level 1 detail — collection shares within this mix set template.
Grain: mix_set × collection | Rows: ~10–30
| Column | Classification | Type | Description |
|---|---|---|---|
| `mix_set_id` | key | FK (INTEGER) | FK to `product_mix_set_master`. Composite key part 1. |
| `collection_id` | key | FK (INTEGER) | FK to `01_collections_master`. Composite key part 2. |
| `collection_share_pct` | detail | DECIMAL(5,2) | % of mix allocated to this collection. Range: 0–100. Completeness-conditional sum-to-100% validation (sum required when parent mix_set completeness_type = complete). |
| `sort_order` | detail | INTEGER | Display order within mix set. |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

Constraints: UNIQUE(mix_set_id, collection_id). FK validation. No denormalization (true grain = table grain). Per-mix_set share sum = 100% when completeness_type = complete; ≤100% when partial.
Lock ID: PHASE9-T03-LOCK. v4.4.0.

## S70-02b `product_mix_set_category_items`
Purpose: Level 2 detail — category shares within each collection in this mix set. Sandwich position: upward parent check (collection must exist in L1) + downward child protection.
Grain: mix_set × collection × category | Rows: ~20–60
| Column | Classification | Type | Description |
|---|---|---|---|
| `mix_set_id` | key | FK (INTEGER) | FK to `product_mix_set_master`. Composite key part 1. |
| `collection_id` | key | FK (INTEGER) | FK to `01_collections_master`. Composite key part 2. Upward check: must exist in L1 (product_mix_set_collection_items). |
| `category_id` | key | FK (INTEGER) | FK to `02_categories_master`. Composite key part 3. 01c membership gatekeeper (category belongs to collection). |
| `category_share_in_collection_pct` | detail | DECIMAL(5,2) | % of collection allocated to this category. Range: 0–100. |
| `sort_order` | detail | INTEGER | Display order within collection. |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

Constraints: UNIQUE(mix_set_id, collection_id, category_id). Upward parent check + downward child protection. 01c gatekeeper. Per-collection share sum validation.
Lock ID: PHASE9-T04-LOCK. v4.4.0.

## S70-02c `product_mix_set_product_items`
Purpose: Level 3 detail — product shares within each category in this mix set. Terminal share level.
Grain: mix_set × category × product (NO collection_id — D9-25) | Rows: ~40–120
| Column | Classification | Type | Description |
|---|---|---|---|
| `mix_set_id` | key | FK (INTEGER) | FK to `product_mix_set_master`. Composite key part 1. |
| `category_id` | key | FK (INTEGER) | FK to `02_categories_master`. Composite key part 2. Upward check: "exists for ANY collection" (loose parent). |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 3. DI-03 enforcement: `sellable_flag = true`. |
| `product_share_in_category_pct` | detail | DECIMAL(5,2) | % of category allocated to this product. Range: 0–100. |
| `sort_order` | detail | INTEGER | Display order within category. |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

Constraints: UNIQUE(mix_set_id, category_id, product_id). `sellable_flag = true` enforcement. Per-category share sum validation.
Override chain (4-tier): decision override → mix set L3 → bridge default (02c) → equal split.
Lock ID: PHASE9-T05-LOCK. v4.4.0.

## S70-02d `product_mix_set_assignment`
Purpose: Assigns mix, price, and cost set templates to context sets. **The ONLY set table with scenario variation** — pointer-swap for what-if analysis. Single-key grain (context_set_id) per Pattern #19.
Grain: context_set | Rows: ~5–20
| Column | Classification | Type | Description |
|---|---|---|---|
| `context_set_id` | key | FK (INTEGER) | FK to `context_set_master`. Single key. Stream specificity is in context set membership, not here. |
| `mix_set_id` | assignment | FK (INTEGER) | FK to `product_mix_set_master`. **NOT NULL** — mandatory for S200. |
| `price_set_id` | assignment | FK (INTEGER) | FK to `product_price_set_master`. **NOT NULL** — mandatory for S200. |
| `cost_set_id` | assignment | FK (INTEGER) | FK to `product_cost_set_master`. **NOT NULL** — mandatory for S200. |
| `price_adjustment_factor` | assignment | DECIMAL(5,4) | Uniform price multiplier for this context. Default: 1.0000. Layer 2 of resolution stack. |
| `cost_adjustment_factor` | assignment | DECIMAL(5,4) | Uniform cost multiplier for this context. Default: 1.0000. Layer 2 of resolution stack. |

Constraints: UNIQUE(context_set_id, scenario, effective_from) — Rule 20. All 3 set FKs NOT NULL. Cross-set validation: every product in mix_set must exist in both price_set and cost_set.
Lock ID: PHASE9-T06-LOCK (+ amendments T06-A, T06-B). v4.4.0.

## S70-02e `product_mix_set_component_options`
Purpose: Level 4 detail — variant option distribution within products. Defines how variant options (e.g., size, crust) are distributed for weighted-average pricing/costing computation.
Grain: mix_set × product × variant | Rows: ~50–200
| Column | Classification | Type | Description |
|---|---|---|---|
| `mix_set_id` | key | FK (INTEGER) | FK to `product_mix_set_master`. Composite key part 1. |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 2. |
| `variant_id` | key | FK (INTEGER) | FK to `04_variants_master`. Composite key part 3. |
| `distribution_pct` | detail | DECIMAL(5,2) | % of this product's orders that select this variant option. Range: 0–100. Sum-to-100% PER DIMENSION (requires join to `04_variants_master` for dimension grouping). |
| `sort_order` | detail | INTEGER | Display order. |

Constraints: UNIQUE(mix_set_id, product_id, variant_id). Sum-to-100% per dimension per product. Variant scope resolution: product-scope overrides category-scope. `05e_format_variant_map` filtering at resolution time (not data entry).
Lock ID: PHASE9-T07-LOCK. v4.4.0.

---

## S70-03 `product_price_set_master`
Purpose: Pricing profile identity. Template for base prices per product. Scenario-independent.
Grain: price_set (single-key) | Rows: ~3–10
| Column | Classification | Type | Description |
|---|---|---|---|
| `price_set_id` | master | INTEGER | Auto-generated PK. |
| `price_set_code` | master | VARCHAR | Short code. **UNIQUE.** |
| `price_set_name` | master | VARCHAR | Display name. **UNIQUE.** |
| `price_set_description` | master | TEXT | What pricing profile this represents. **NOT NULL.** |
| `sort_order` | master | INTEGER | Display position. **UNIQUE.** |
| **`research_populated_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was created and/or populated by the research pipeline. `false` = manually created. Enables filtering research-sourced vs manual sets. |
| **`auto_created_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was auto-created by the research pipeline (not user-defined). User can rename, edit, or delete. Auto-created sets are assigned to contexts automatically via D-CROSS-01a. |

Constraints: `price_set_code` UNIQUE, `price_set_name` UNIQUE, `sort_order` UNIQUE, `price_set_description` NOT NULL. No completeness_type (coverage validated cross-set at assignment).
Lock ID: PHASE9-T10-LOCK. v4.4.0.

## S70-03a `product_price_set_items`
Purpose: Base prices per product in a price set template. Flat structure (no hierarchy — prices are per product directly).
Grain: price_set × product (flat) | Rows: ~40–120
| Column | Classification | Type | Description |
|---|---|---|---|
| `price_set_id` | key | FK (INTEGER) | FK to `product_price_set_master`. Composite key part 1. |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 2. |
| `base_list_price_inr` | detail | DECIMAL(10,2) | Menu list price in ₹ before any markup or discount. Must be > 0. |
| `base_discount_pct` | detail | DECIMAL(5,2) | Everyday discount %. NOT NULL, default 0. Range: 0–100. |
| `target_margin_pct` | detail | DECIMAL(5,2) | Target gross margin %. NULLABLE — goal, not used in computation directly. |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

Constraints: UNIQUE(price_set_id, product_id). `base_list_price_inr` > 0. `base_discount_pct` NOT NULL default 0.
Lock ID: PHASE9-T11-LOCK. v4.4.0.

## S70-04 `product_cost_set_master`
Purpose: Costing profile identity. Template for direct costs per product. Structural twin of `product_price_set_master`. Scenario-independent.
Grain: cost_set (single-key) | Rows: ~3–10
| Column | Classification | Type | Description |
|---|---|---|---|
| `cost_set_id` | master | INTEGER | Auto-generated PK. |
| `cost_set_code` | master | VARCHAR | Short code. **UNIQUE.** |
| `cost_set_name` | master | VARCHAR | Display name. **UNIQUE.** |
| `cost_set_description` | master | TEXT | What costing profile this represents. **NOT NULL.** |
| `sort_order` | master | INTEGER | Display position. **UNIQUE.** |
| **`research_populated_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was created and/or populated by the research pipeline. `false` = manually created. Enables filtering research-sourced vs manual sets. |
| **`auto_created_flag`** | **master** | **BOOLEAN NOT NULL DEFAULT false** | **v4.5.9 (D-CROSS-01, Pattern #25).** `true` = this set was auto-created by the research pipeline (not user-defined). User can rename, edit, or delete. Auto-created sets are assigned to contexts automatically via D-CROSS-01a. |

Constraints: `cost_set_code` UNIQUE, `cost_set_name` UNIQUE, `sort_order` UNIQUE, `cost_set_description` NOT NULL.
Lock ID: PHASE9-T12-LOCK. v4.4.0.

## S70-04a `product_cost_set_items`
Purpose: 3-component COGS per product in a cost set template. Flat structure.
Grain: cost_set × product (flat) | Rows: ~40–120
| Column | Classification | Type | Description |
|---|---|---|---|
| `cost_set_id` | key | FK (INTEGER) | FK to `product_cost_set_master`. Composite key part 1. |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 2. |
| `food_cogs_inr` | detail | DECIMAL(10,2) | Direct food ingredient cost per unit in ₹. Must be > 0. |
| `packaging_cogs_inr` | detail | DECIMAL(10,2) | Packaging material cost per unit in ₹. Must be ≥ 0. |
| `other_direct_cost_inr` | detail | DECIMAL(10,2) | Other direct costs per unit in ₹. Must be ≥ 0. |
| **`field_source_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping each field name to its source. E.g., `{"benchmark_cpm_inr":"research","monthly_budget_inr":"manual"}`. NULL = all fields manually entered (pre-Research-First rows). Research refresh skips fields marked `manual`. Values: `research` / `manual` / `hybrid`. |
| **`research_confidence_json`** | **set_item** | **TEXT NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** JSON mapping field names to their population confidence at time of auto-population. E.g., `{"benchmark_cpm_inr":0.87,"benchmark_ctr_pct":0.74}`. NULL = all manual. |
| **`source_research_run_id`** | **set_item** | **INTEGER NULLABLE** | **v4.5.9 (D-CROSS-01, Pattern #25).** FK to the `research_run_id` that populated this row. NULL = manually created. Enables tracing: set_item row → research run → outcome items. |

Constraints: UNIQUE(cost_set_id, product_id). `food_cogs_inr` > 0, `packaging_cogs_inr` ≥ 0, `other_direct_cost_inr` ≥ 0.
Lock ID: PHASE9-T13-LOCK. v4.4.0.

---

## S70-05 `product_economics_adjustments`
Purpose: Per-product context tuning — Layer 3 of the 4-layer resolution stack. Sparse table (only rows where specific products need context-specific price/cost adjustments beyond the set + multiplier).
Grain: format × revenue_stream × market × product (individual, NOT context_set) | Rows: ~20–80
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 4. |
| `price_delta_inr` | adjustment | DECIMAL(10,2) | Absolute price adjustment in ₹. NULLABLE. Applied after percentage adjustments. |
| `price_delta_pct` | adjustment | DECIMAL(5,2) | Percentage price adjustment. NULLABLE. Applied first (before absolute). |
| `cost_delta_pct` | adjustment | DECIMAL(5,2) | Percentage cost adjustment. NULLABLE. |
| `discount_delta_pct` | adjustment | DECIMAL(5,2) | Percentage discount adjustment. NULLABLE. |

Constraints: UNIQUE(format_id, revenue_stream_id, market_id, product_id, scenario, effective_from) — Rule 20. All adjustment fields NULLABLE (sparse). Order of operations: pct first, absolute second.
Lock ID: PHASE9-T18-LOCK. v4.4.0.

## S70-06 `product_economics_decisions`
Purpose: Human overrides on product economics — Layer 4 (CEO nuclear override) of the 4-layer resolution stack. Sparse table (rows only for overrides).
Grain: format × revenue_stream × market × product | Rows: ~10–50
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 4. |
| `selected_for_assortment_flag` | decision | BOOLEAN | Human decision: include this product in the assortment. NOT NULL, default true. |
| `hero_product_override_flag` | decision | BOOLEAN | Human decision: designate as hero/flagship product. NOT NULL, default false. |
| `launch_priority_rank` | decision | INTEGER | Human-assigned launch priority. NULLABLE. |
| `price_override_inr` | decision | DECIMAL(10,2) | Human override of resolved price. NULLABLE — replaces everything when set. |
| `discount_override_pct` | decision | DECIMAL(5,2) | Human override of base discount %. NULLABLE. |
| `product_share_override_pct` | decision | DECIMAL(5,2) | Human override of product share. NULLABLE. 4-tier chain: decision → mix set L3 → bridge → equal split. |
| `active_from_override` | decision | DATE | Human override of activation date. NULLABLE. |
| `active_to_override` | decision | DATE | Human override of deactivation date. NULLABLE. |
| `decision_notes` | decision | TEXT | Free-form notes explaining the decision rationale. NULLABLE. |

Constraints: UNIQUE(format_id, revenue_stream_id, market_id, product_id, scenario, effective_from) — Rule 20. Boolean flags NOT NULL with defaults. All override fields NULLABLE. No COGS override (D9-45 confirmed — cost management via cost sets, not decisions).
Phase 9 change: +revenue_stream_id key (Option A). All override fields made explicitly NULLABLE.
Lock ID: PHASE9-T14-LOCK. v4.4.0.

## S70-07 `product_economics_outputs`
Purpose: Resolved unit economics — system-generated, not user-editable. **THE input to S200 revenue and CM1.** Contains traceability pointers, resolved pricing/costing, unit economics, mix shares, and governance.
Grain: format × revenue_stream × market × product | Rows: ~100–500
| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master`. Composite key part 1. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master`. Composite key part 2. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master`. Composite key part 3. |
| `product_id` | key | FK (INTEGER) | FK to `03_products_master`. Composite key part 4. |
| `resolved_context_set_id` | output | FK (INTEGER) | Which context set was resolved for this combination. Traceability pointer. |
| `resolved_mix_set_id` | output | FK (INTEGER) | Which mix set was used. Traceability pointer. |
| `resolved_price_set_id` | output | FK (INTEGER) | Which price set was used. Traceability pointer. |
| `resolved_cost_set_id` | output | FK (INTEGER) | Which cost set was used. Traceability pointer. |
| `resolved_list_price_inr` | output | DECIMAL(10,2) | Final list price after 4-layer resolution. |
| `resolved_base_discount_pct` | output | DECIMAL(5,2) | Final base discount % after resolution. |
| `resolved_net_price_inr` | output | DECIMAL(10,2) | = resolved_list_price × (1 − resolved_base_discount_pct). |
| `resolved_food_cogs_inr` | output | DECIMAL(10,2) | Final food COGS after variant delta and adjustments. |
| `resolved_packaging_cogs_inr` | output | DECIMAL(10,2) | Final packaging COGS. |
| `resolved_other_direct_cost_inr` | output | DECIMAL(10,2) | Final other direct costs. |
| `resolved_total_cogs_inr` | output | DECIMAL(10,2) | = food + packaging + other + variant deltas. |
| `unit_contribution_inr` | output | DECIMAL(10,2) | = resolved_net_price − resolved_total_cogs. |
| `unit_contribution_margin_pct` | output | DECIMAL(5,2) | = unit_contribution / resolved_net_price × 100. |
| `target_margin_met_flag` | output | BOOLEAN | Whether unit_contribution_margin_pct ≥ target. |
| `resolved_product_share_pct` | output | DECIMAL(5,2) | Final product share (4-tier resolution). |
| `resolved_category_share_pct` | output | DECIMAL(5,2) | Final category share in collection. |
| `resolved_collection_share_pct` | output | DECIMAL(5,2) | Final collection share in format. |
| `price_source_layer` | output | VARCHAR | Which layer determined final price: set_base / context_multiplier / variant_delta / adjustment / decision_override. |
| `cost_source_layer` | output | VARCHAR | Which layer determined final cost. |
| `active_from` | output | DATE | Resolved activation date. |
| `active_to` | output | DATE | Resolved deactivation date. |
| `assortment_status` | output | VARCHAR | Resolved assortment state: included / excluded / pending_review. |

Column count: 28 (4 keys + 24 output fields).
Constraints: UNIQUE(format_id, revenue_stream_id, market_id, product_id, scenario, effective_from) — Rule 20.
Phase 9 change: +revenue_stream_id key (Option A). +traceability pointers (context_set, mix_set, price_set, cost_set). +resolved_other_direct_cost_inr. +price_source_layer, +cost_source_layer.
Lock ID: PHASE9-T15-LOCK. v4.4.0.

---




================================================================================
<!-- MODULE: 09_S80_capacity.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 09_S80_capacity.md -->
<!-- Description: S80 Capacity Strategy — 7 tables, 119 cols (Phase 15 LOCKED, Pattern #19) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 3477–3885 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S80 — CAPACITY STRATEGY (v4.5.10: Phase 15 LOCKED — Pattern #19 ADOPTED)
# ═══════════════════════════════════════

**Phase 15 upgrade:** v3 stub (4 tables, ~30 columns) → v4.5.10 full spec (7 tables, 119 columns).
**Pattern #19 ADOPTED** (Set + Context Set + Assignment). **Pattern #22** (AI Research Layer). **Pattern #25** (Research-First Defaults).
**Grain:** format × revenue_stream × market (section). format × revenue_stream × market × capacity_unit_id (decisions/outputs).
**Gates:** Dual — 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format).
**Rule 23 classification:** Contributor — if excluded, costs zeroed + S300 warning. Does NOT block S200.
**Decisions locked (Phase 15):** D15-01, D15-03, D15-05 through D15-11. All ✅ LOCKED.
**DI resolutions:** DI-31 (S80) ✅, DI-46 ✅ CLOSED, DI-50 ✅ CLOSED, DI-52 (S80) ✅, DI-56 NON-APPLICABLE, DI-58 (S80) ✅.
**Absorbed:** ~~S80-02 `capacity_assumptions`~~ → absorbed into `capacity_profile_set_items` (Pattern #19).

### Upstream → S80

| Source | Field(s) Consumed | Purpose |
|---|---|---|
| S60 demand_outputs | `seasonalized_orders_per_day` | Demand volume — SUM across channels per format×stream×market |
| S60 demand_outputs | `resolved_hourstate_profile_code` | Hourly demand distribution for peak analysis |
| S60 demand_outputs | `derived_blended_aov_inr` | Revenue per order — for lost_sales_revenue calculation |
| S70 product_mix_set_items | product mix shares | Weighted avg prep time calculation (DI-46) |
| S00 03_products_master | `default_prep_time_min` | Base product prep times |
| S00 04_variants_master | `prep_time_delta_min` | Variant-level prep time adjustments |
| S10 format_assumptions | pause state | Market pause status (DI-50) |
| S00 05j_format_market_map | active pairs | Format×market gate (DI-31) |
| S00 06c_revenue_stream_format_map | active pairs | Format×stream gate (D15-10) |

### S80 → Downstream

| Consumer | Field(s) Consumed | Purpose |
|---|---|---|
| S10 format_outputs | `projected_utilization_pct`, `bottleneck_flag`, `lost_sales_pct` | Operational feasibility rollup |
| S90 manpower | `resolved_resource_count` | Capacity-linked headcount (D15-12) |
| S100 (OpEx) | `resolved_resource_count`, `resolved_operating_hours_per_day` | Resource operating costs |
| S110 (CapEx) | `recommended_expansion_mode`, `recommended_expansion_quantity`, `expansion_exhausted_flag` | CapEx planning and timing |
| S200 (via S100/S110) | Indirect — costs flow through OpEx and CapEx | CM2, EBITDA |
| S300 Governance | bottleneck, lost sales, expansion, pause, shared allocation | Warnings G-CAP-01 through G-CAP-08 |

### Key Concepts

| Concept | Description |
|---|---|
| **throughput_mode** (D15-05) | `fixed` / `prep_time_driven` / `hybrid`. Controls whether product mix affects capacity. hybrid = MIN(flat rate, prep-time-derived rate). |
| **Capacity ladder** | K_nom (nominal) → K_eff (after utilization target + wastage) → K_alloc (after shared allocation). |
| **Hourly peak modeling** (D15-06) | S60 hourstate profile distributes daily demand into hour-states. Lost sales = Σ MAX(0, hourly_demand − hourly_capacity). Peak ≠ daily average. |
| **Dual-level expansion** (D15-07) | `asset_add` / `asset_upgrade` / `unit_replicate`. `max_resource_count_per_unit` ceiling → forces unit_replicate when asset expansion exhausted. |
| **Shared resources** (D15-08) | `shared_resource_flag` + `shared_resource_allocation_pct`. One resource serving multiple streams. S300 validates sum = 100%. |
| **Lost sales revenue** (D15-11) | `lost_sales_revenue_inr_per_day` = lost orders × S60 blended AOV. Revenue impact of capacity constraints. |

### Market Pause State Derivation (DI-61 — resolved in audit)

See S90 section for the full derivation algorithm. S80 applies the same `market_pause_status` logic. When paused: utilization = 0, demand = 0, lost_sales = 0, resource_count PRESERVED.


### Computation Algorithms (11)

0. **S70 product mix set resolution (Audit B-04):** Determine which S70 product_mix_set is active for this format×stream×market context. Resolution path: S70-02d `product_mix_set_assignment` → match on format_id (via context_set) → select set with lowest priority_rank. If no assignment found, use format-level default set. The resolved mix shares feed Step 2 (weighted avg prep time).
1. **Demand aggregation** (S60→S80): SUM(seasonalized_orders_per_day) across channels per format×stream×market.
2. **Weighted avg prep time** (DI-46): Σ(product_prep × mix_share) from S70/S00.
3. **Effective throughput**: Per throughput_mode — fixed / prep_time_derived / MIN(fixed, prep_time_derived).
4. **Capacity ladder**: K_nom → K_eff → K_alloc (4 steps).
5. **Hourly peak/trough**: Distribute daily into hour-states → compute hourly lost sales → aggregate.
6. **Product mix factor**: base_prep / weighted_avg_prep. >1 = simpler mix, <1 = complex.
7. **Expansion/contraction logic**: Trigger-based with dual-level (asset → unit_replicate).
8. **Bottleneck ID**: Resource with MAX(utilization) per format×stream×market.
9. **Market pause** (DI-50): Zero demand/utilization, preserve resource count.
10. **D4 override**: daily_order_capacity (if NOT NULL) overrides ALL derivation.
11. **Monthly rollup**: daily × days_in_period. **(Audit C-09):** `days_in_period` sourced from `14_periods_master` for the current computation period. Pre-S200, uses 30.0 as default. S200 period expansion provides exact days per month.

---

### 6.1 S80-01 `capacity_inputs`

**Purpose:** Section-level evaluation controls for capacity strategy.
**Grain:** format × revenue_stream × market
**Gates:** 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format)
**Lock ID:** PHASE15-T01-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `evaluation_scope_level` | VARCHAR | input | NOT NULL | 'directional' | directional / structured / validated / audited |
| 5 | `planning_horizon_months` | INTEGER | input | NULLABLE | NULL | NULL = global default from 14_periods_master |
| 6 | `include_in_evaluation_flag` | BOOLEAN | input | NOT NULL | true | Rule 23 cascade. Contributor: zero costs + WARN if false. |
| 7 | `manual_review_required_flag` | BOOLEAN | input | NOT NULL | false | Auto-set true if scope = 'directional'. |
| 8 | `notes` | TEXT | input | NULLABLE | NULL | Free-form. |
| 9 | `auto_populate_research_flag` | BOOLEAN | input | NOT NULL | true | **Pattern #25 (D-CROSS-01).** When true, research completion auto-populates capacity_profile_set_items. |

**Business rules:**
- BR-80-01a: Composite key (format_id, revenue_stream_id, market_id) UNIQUE per scenario.
- BR-80-01b: format_id × market_id MUST exist in 05j_format_market_map with active status (DI-31).
- BR-80-01c: format_id × revenue_stream_id MUST exist in 06c_revenue_stream_format_map with active status (D15-10).
- BR-80-01d: If evaluation_scope_level = 'directional', manual_review_required_flag auto-set to true.

---

### 6.2 S80-01b `capacity_research`

**Purpose:** AI research intelligence layer for capacity benchmarks and parameters.
**Grain:** format × revenue_stream × market
**Pattern:** #22 (AI Research Layer)
**Lock ID:** PHASE15-T01B-LOCK 🔒
**Column count:** 14 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `research_run_id` | INTEGER | system | NOT NULL | auto | Shared sequence across ALL _research tables. |
| 5 | `research_mode` | VARCHAR | research | NOT NULL | 'ai_auto' | manual / ai_assisted / ai_auto / hybrid |
| 6 | `research_prompt` | TEXT | research | NULLABLE | NULL | Context/query for AI research engine. |
| 7 | `research_status` | VARCHAR | research | NOT NULL | 'pending' | pending / in_progress / completed / stale / failed |
| 8 | `research_completed_at` | TIMESTAMP | research | NULLABLE | NULL | When AI research last completed. |
| 9 | `research_confidence` | DECIMAL(3,2) | research | NULLABLE | NULL | Overall AI confidence (0.00–1.00). |
| 10 | `research_summary` | TEXT | research | NULLABLE | NULL | AI-generated brief. |
| 11 | `source_references` | TEXT | research | NULLABLE | NULL | Citations: report names, URLs, data sources. |
| 12 | `fields_covered` | TEXT | research | NULLABLE | NULL | Comma-separated set_item field names this research covers. |
| 13 | `stale_after_days` | INTEGER | research | NOT NULL | 90 | Days until stale. Triggers G-RF-02 warning. |
| 14 | `auto_refresh_enabled_flag` | BOOLEAN | research | NOT NULL | false | Auto re-run when stale. |

**Business rules:**
- BR-80-01b-a: Standard Pattern #22 template. Identical structure to S10-01b, S50-01b, S60-01b.
- BR-80-01b-b: research_run_id used as FK target by capacity_profile_set_items.source_research_run_id (loose FK — Pattern #25 design).
- BR-80-01b-c: When research_status transitions to 'completed' AND capacity_inputs.auto_populate_research_flag = true, triggers Pattern #25 auto-population pipeline.

---

### 6.3 S80-05 `capacity_profile_set_master`

**Purpose:** Named, reusable capacity profiles. Each profile defines a complete resource configuration.
**Grain:** set-level (no FK keys)
**Patterns:** #19 (Set + Context Set + Assignment) + #25 (Research-First Defaults)
**Lock ID:** PHASE15-T05-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `set_id` | PK (INTEGER) | key | NOT NULL | auto | Auto-generated primary key. |
| 2 | `set_code` | VARCHAR | master | NOT NULL | — | UNIQUE. Machine-readable (e.g., `CAP_STD_CLOUD_DELIVERY`). |
| 3 | `set_name` | VARCHAR | master | NOT NULL | — | UNIQUE. Display name (e.g., "Standard Cloud Kitchen — Delivery Stream"). |
| 4 | `set_description` | TEXT | master | NULLABLE | NULL | Detailed positioning. |
| 5 | `lifecycle_stage` | VARCHAR | master | NOT NULL | 'launch' | launch / growth / mature / decline. |
| 6 | `capacity_driver_mode` | VARCHAR | master | NOT NULL | 'demand_driven' | manual / demand_driven / hybrid. Controls how engine uses demand data. |
| 7 | `sort_order` | INTEGER | master | NULLABLE | NULL | Display/processing order. |
| 8 | `research_populated_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** True if research created or populated this set's items. |
| 9 | `auto_created_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** True if auto-created by research pipeline (D-CROSS-01a). |

**Business rules:**
- BR-80-05a: set_code and set_name are UNIQUE within S80 capacity_profile_set_master. **(Audit C-06):** "Globally UNIQUE" means unique within this set_master table (not cross-section). S50/S60/S80/S90 each have independent set_code namespaces. Naming convention uses section prefix to avoid confusion (e.g., CAP_ for S80, MP_ for S90, MKT_ for S50, DEM_ for S60).
- BR-80-05b: When auto_created_flag = true, research_populated_flag MUST also be true.
- BR-80-05c: A set with lifecycle_stage = 'decline' triggers S300 governance review.

**Example sets (ILLUSTRATIVE ONLY — not schema-required seed data):**

| set_code | set_name | lifecycle_stage | capacity_driver_mode |
|---|---|---|---|
| `CAP_STD_CK_DELIVERY` | Standard Cloud Kitchen — Delivery | growth | demand_driven |
| `CAP_STD_CK_DINEIN` | Standard Cloud Kitchen — Dine-in | launch | hybrid |
| `CAP_HUB_DELIVERY` | Hub Kitchen — High Volume Delivery | mature | demand_driven |
| `CAP_SPOKE_DELIVERY` | Spoke Kitchen — Satellite Delivery | launch | demand_driven |
| `CAP_MOBILE_BAKE` | Mobile Baking Unit — On-the-Go | launch | manual |
| `CAP_CATERING_BULK` | Bulk Catering Kitchen | growth | hybrid |

---

### 6.4 S80-06 `capacity_profile_set_items`

**Purpose:** Per-resource-type capacity parameters within a profile. Absorbs old capacity_assumptions. Each row = one capacity resource type within the profile.
**Grain:** set_id × item_sequence
**Patterns:** #19 + #25
**Lock ID:** PHASE15-T06-LOCK 🔒
**Column count:** 27 (excl. 6 system fields) — 24 domain + 3 Pattern #25

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → capacity_profile_set_master.set_id |
| 2 | `item_sequence` | INTEGER | key | NOT NULL | — | Order within set. 1 = primary binding resource. |
| | | | **— RESOURCE IDENTITY —** | | | |
| 3 | `capacity_unit_id` | FK (INTEGER) | set_item | NOT NULL | — | FK → 10_capacity_units_master. Which facility/resource type. |
| | | | **— THROUGHPUT —** | | | |
| 4 | `throughput_mode` | VARCHAR | set_item | NOT NULL | 'hybrid' | **D15-05.** `fixed` / `prep_time_driven` / `hybrid`. Controls how effective_orders_per_hour is derived. |
| 5 | `operating_hours_per_day` | DECIMAL(4,1) | set_item | NOT NULL | — | Daily active hours for this resource. (e.g., 12.0, 16.0, 24.0) |
| 6 | `orders_per_hour_capacity` | DECIMAL(6,1) | set_item | NOT NULL | — | Base throughput per hour per unit. Used when throughput_mode ∈ {fixed, hybrid}. Ignored when prep_time_driven. |
| 7 | `daily_order_capacity` | DECIMAL(8,1) | set_item | NULLABLE | NULL | **D4 NULL-override.** If NOT NULL → overrides ALL derivation regardless of throughput_mode. If NULL → derived from components (Section 5.3–5.4). |
| 8 | `base_prep_minutes_per_order` | DECIMAL(5,1) | set_item | NOT NULL | — | Theoretical base prep time for this resource type. Used as reference; actual throughput may use weighted_avg from S70/S00 per throughput_mode. |
| 9 | `resource_count` | INTEGER | set_item | NOT NULL | — | Number of units of this resource in the profile. |
| 10 | `concurrent_orders_per_unit` | INTEGER | set_item | NOT NULL | 1 | Orders one unit can process simultaneously. E.g., conveyor oven = 4–6, single deck = 1, prep station = 2–3. |
| | | | **— UTILIZATION BANDS —** | | | |
| 11 | `target_utilization_pct` | DECIMAL(5,2) | set_item | NOT NULL | — | Target capacity utilization. E.g., 80.00 = 20% buffer. |
| 12 | `max_utilization_pct` | DECIMAL(5,2) | set_item | NOT NULL | 100.00 | Absolute ceiling. Orders beyond this per hour-state = lost sales. |
| 13 | `wastage_pct` | DECIMAL(5,2) | set_item | NOT NULL | 0.00 | Expected wastage/loss %. Reduces effective capacity. |
| | | | **— TRIGGERS —** | | | |
| 14 | `expansion_trigger_utilization_pct` | DECIMAL(5,2) | set_item | NOT NULL | — | Utilization % that triggers expansion discussion. |
| 15 | `contraction_trigger_utilization_pct` | DECIMAL(5,2) | set_item | NULLABLE | NULL | Utilization % below which contraction flagged. **NULL = no contraction monitoring.** |
| | | | **— EXPANSION MODEL —** | | | |
| 16 | `expansion_mode` | VARCHAR | set_item | NOT NULL | 'asset_add' | **D15-07.** How this resource expands: `asset_add` (buy more of same) / `asset_upgrade` (replace with higher-capacity) / `unit_replicate` (new facility) / `none`. |
| 17 | `expansion_lead_time_days` | INTEGER | set_item | NULLABLE | NULL | Days from trigger to operational. Feeds S110 timing. NULL = unknown. **(Audit C-07):** Informational/planning — no S200 computation path in v4. Consumed by S110 when available. |
| 18 | `expansion_increment_units` | INTEGER | set_item | NOT NULL | 1 | How many additional units per expansion event. |
| 19 | `max_resource_count_per_unit` | INTEGER | set_item | NULLABLE | NULL | Physical ceiling per facility (space/power constraint). **NULL = no limit.** When resource_count ≥ this AND expansion needed → forces unit_replicate. |
| | | | **— SHARED RESOURCE —** | | | |
| 20 | `shared_resource_flag` | BOOLEAN | set_item | NOT NULL | false | **D15-08.** True if this resource serves multiple streams within same format×market. |
| 21 | `shared_resource_allocation_pct` | DECIMAL(5,2) | set_item | NULLABLE | NULL | This stream's % share of the resource. **Required if shared_resource_flag = true.** NULL or omitted = 100% (exclusive use). S300 validates: SUM(allocation) across streams for same resource in same format×market MUST = 100%. |
| | | | **— HOURLY SENSITIVITY —** | | | |
| 22 | `hourstate_sensitivity_flag` | BOOLEAN | set_item | NOT NULL | true | Whether this resource is sensitive to hourly demand distribution. If true, engine applies S60 hourstate profile for peak analysis. If false, only daily aggregate used. |
| | | | **— LIFECYCLE —** | | | |
| 23 | `model_capacity_start_date` | DATE | set_item | NOT NULL | — | When this resource becomes operational. |
| 24 | `model_capacity_end_date` | DATE | set_item | NULLABLE | NULL | Planned retirement/decommission. NULL = indefinite. **(Audit C-08):** Engine MUST check: if `current_period.end_date > model_capacity_end_date`, resource is decommissioned — resolved_resource_count = 0 for that period. Distinct from pause (pause preserves count; end-of-life zeroes it). |
| | | | **— PATTERN #25 (Research-First) —** | | | |
| 25 | `field_source_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: `{"orders_per_hour_capacity": "research", "resource_count": "manual", ...}`. Research refresh only overwrites `"research"` fields; `"manual"` protected. |
| 26 | `research_confidence_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: `{"orders_per_hour_capacity": 0.82, "target_utilization_pct": 0.75, ...}`. Confidence at population time. |
| 27 | `source_research_run_id` | FK (INTEGER) | Pattern #25 | NULLABLE | NULL | FK → capacity_research.research_run_id (loose FK — set_items may reference research from any format×stream×market context). |

**Business rules:**
- BR-80-06a: Composite key (set_id, item_sequence) UNIQUE.
- BR-80-06b: capacity_unit_id UNIQUE within a set (one entry per resource type per profile).
- BR-80-06c: If shared_resource_flag = true, shared_resource_allocation_pct MUST NOT be NULL and MUST be > 0 and ≤ 100.
- BR-80-06d: If shared_resource_flag = false, shared_resource_allocation_pct is ignored (treated as 100%).
- BR-80-06j **(Audit B-01):** **Cross-stream shared resource validation.** For each format×market×capacity_unit_id where shared_resource_flag = true across ANY assigned set: `SUM(resolved_shared_allocation_pct) across ALL streams with active assignments for that resource MUST = 100.00 (±0.5%).` Validation runs after all set assignments are resolved. Triggered by S300 G-CAP-06. Algorithm: `SELECT capacity_unit_id, format_id, market_id, SUM(resolved_shared_allocation_pct) AS total FROM S80_capacity_outputs WHERE shared_resource_flag = true GROUP BY capacity_unit_id, format_id, market_id HAVING ABS(total - 100.0) > 0.5`.
- BR-80-06e: D4 semantics: if daily_order_capacity IS NOT NULL, it overrides ALL throughput derivation. orders_per_hour_capacity and throughput_mode are ignored.
- BR-80-06f: If throughput_mode = 'prep_time_driven', orders_per_hour_capacity is stored for reference but NOT used in computation. Engine derives from weighted_avg_prep_time_min (S70/S00).
- BR-80-06g: If throughput_mode = 'hybrid', engine uses MIN(orders_per_hour_capacity, prep_time_derived_rate).
- BR-80-06h: expansion_mode = 'none' means this resource cannot expand. Engine will not recommend expansion even if trigger is reached. S300 warning issued instead.
- BR-80-06i: Pattern #25 confidence gate: fields with confidence < 0.50 are NOT auto-populated (left NULL for human entry).

**Example set items (Set: CAP_STD_CK_DELIVERY):**

| seq | capacity_unit | throughput_mode | hrs/day | orders/hr | resource_count | concurrent | target_util | expansion_mode | shared | alloc% |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Conveyor Oven | hybrid | 14.0 | 15.0 | 1 | 5 | 80.00 | asset_add | true | 70.00 |
| 2 | Dough Prep Station | prep_time_driven | 14.0 | 20.0 | 2 | 2 | 85.00 | asset_add | true | 60.00 |
| 3 | Packaging Station | fixed | 14.0 | 25.0 | 1 | 1 | 90.00 | asset_add | false | NULL |
| 4 | Cold Storage | fixed | 24.0 | 999.0 | 1 | 999 | 95.00 | asset_upgrade | true | 50.00 |

---

### 6.5 S80-07 `capacity_profile_set_assignment`

**Purpose:** Maps capacity profiles to format × stream × market contexts.
**Grain:** format × revenue_stream × market × set_id
**Pattern:** #19
**Lock ID:** PHASE15-T07-LOCK 🔒
**Column count:** 5 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **Dual-gated: 05j (format×market) + 06c (format×stream).** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → capacity_profile_set_master.set_id |
| 5 | `priority_rank` | INTEGER | assignment | NOT NULL | — | Priority when multiple sets assigned. Lower = primary. UNIQUE per (format, stream, market). |

**Business rules:**
- BR-80-07a: format_id × market_id MUST exist in 05j_format_market_map (DI-31).
- BR-80-07b: format_id × revenue_stream_id MUST exist in 06c_revenue_stream_format_map (D15-10).
- BR-80-07c: priority_rank UNIQUE within (format_id, revenue_stream_id, market_id). Lowest rank = primary set used for computation.
- BR-80-07d: No channel_id. Physical capacity is channel-agnostic. DI-56 non-applicable.

---

### 6.6 S80-03 `capacity_decisions`

**Purpose:** Human override layer for per-resource capacity parameters. Rows pre-populated by engine when set is assigned (one row per set_item → capacity_unit explosion).
**Grain:** format × revenue_stream × market × capacity_unit_id
**Lock ID:** PHASE15-T03-LOCK 🔒
**Column count:** 16 (excl. 6 system fields) — 4 keys + 1 reference + 11 decisions

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `capacity_unit_id` | FK (INTEGER) | key | NOT NULL | — | FK → 10_capacity_units_master. Exploded from assigned set_items. |
| | | | **— REFERENCE —** | | | |
| 5 | `set_id` | FK (INTEGER) | reference | NULLABLE | NULL | Which set produced this decisions row. Audit trail. |
| | | | **— OVERRIDES —** | | | |
| 6 | `resource_count_override` | INTEGER | decision | NULLABLE | NULL | Override resource count from set_item. |
| 7 | `utilization_target_override_pct` | DECIMAL(5,2) | decision | NULLABLE | NULL | Override target utilization. |
| 8 | `operating_hours_override` | DECIMAL(4,1) | decision | NULLABLE | NULL | Override operating hours. Common capacity lever (extend from 12→16 hrs). |
| 9 | `daily_order_capacity_override` | DECIMAL(8,1) | decision | NULLABLE | NULL | **D4 override.** Trumps ALL derivation from throughput_mode, hours, count, etc. |
| 10 | `capacity_start_date_override` | DATE | decision | NULLABLE | NULL | Override start date. |
| 11 | `capacity_end_date_override` | DATE | decision | NULLABLE | NULL | Override end date. |
| | | | **— EXPANSION/CONTRACTION APPROVALS —** | | | |
| 12 | `expansion_approved_flag` | BOOLEAN | decision | NULLABLE | NULL | Human: approve expansion. NULL = not reviewed. |
| 13 | `contraction_approved_flag` | BOOLEAN | decision | NULLABLE | NULL | Human: approve contraction. NULL = not reviewed. |
| 14 | `expansion_mode_override` | VARCHAR | decision | NULLABLE | NULL | Override engine's recommended expansion mode. asset_add / asset_upgrade / unit_replicate / none. |
| | | | **— SHARED RESOURCE —** | | | |
| 15 | `shared_allocation_pct_override` | DECIMAL(5,2) | decision | NULLABLE | NULL | Override stream allocation % for shared resources. |
| | | | **— NOTES —** | | | |
| 16 | `decision_notes` | TEXT | decision | NULLABLE | NULL | Rationale for overrides. |

**Business rules:**
- BR-80-03a: Composite key (format_id, revenue_stream_id, market_id, capacity_unit_id) UNIQUE per scenario.
- BR-80-03b: Rows are pre-populated by engine when a capacity profile set is assigned. One row per set_item in the assigned set.
- BR-80-03c: ALL override fields are NULLABLE. NULL = no override (use set_item value).
- BR-80-03d: COALESCE precedence: decision override → set_item value → NULL (computation fails with warning).
- BR-80-03e: If expansion_approved_flag = false AND expansion_trigger_reached_flag = true, S300 governance warning issued (expansion needed but denied).
- BR-80-03f: operating_hours_override is a capacity lever — extending hours is often the fastest way to increase throughput without CapEx.

---

### 6.7 S80-04 `capacity_outputs`

**Purpose:** Computed capacity results. Single source of utilization, lost sales, bottleneck, and expansion recommendations for this format × stream × market × resource combination. Consumed by S10, S100, S110, S300.
**Grain:** format × revenue_stream × market × capacity_unit_id
**Lock ID:** PHASE15-T04-LOCK 🔒
**Column count:** 39 (excl. 6 system fields) — 4 keys + 35 outputs

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | Key 1. |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | Key 2. |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | Key 3. |
| 4 | `capacity_unit_id` | FK (INTEGER) | key | NOT NULL | — | Key 4. Exploded from set_items. |
| | | | **— RESOLVED PARAMETERS —** | | | |
| 5 | `resolved_resource_count` | INTEGER | output | NOT NULL | — | Final count: COALESCE(decision override, set_item). → S110 |
| 6 | `resolved_operating_hours_per_day` | DECIMAL(4,1) | output | NOT NULL | — | Final hours: COALESCE(decision override, set_item). → S100 |
| 7 | `resolved_throughput_mode` | VARCHAR | output | NOT NULL | — | Which throughput mode was applied. Audit. |
| | | | **— CAPACITY LADDER —** | | | |
| 8 | `effective_orders_per_hour` | DECIMAL(6,1) | output | NOT NULL | — | After product-mix adjustment per throughput_mode. Section 5.3. |
| 9 | `resolved_daily_capacity_nominal` | DECIMAL(10,1) | output | NOT NULL | — | K_nom. Section 5.4 Step 1. |
| 10 | `resolved_daily_capacity_effective` | DECIMAL(10,1) | output | NOT NULL | — | K_eff = K_nom × target_util × (1 − wastage). Section 5.4 Step 2. |
| 11 | `resolved_daily_capacity_allocated` | DECIMAL(10,1) | output | NOT NULL | — | K_alloc = K_eff × allocation_pct (shared resources). Section 5.4 Step 3. |
| | | | **— DEMAND vs CAPACITY —** | | | |
| 12 | `projected_demand_orders_per_day` | DECIMAL(10,2) | output | NOT NULL | — | SUM(S60.seasonalized_orders_per_day) across channels. Section 5.1. |
| 13 | `projected_demand_orders_per_month` | DECIMAL(12,2) | output | NOT NULL | — | = daily × days_in_period. Section 5.11. |
| 14 | `projected_utilization_pct` | DECIMAL(5,2) | output | NOT NULL | — | = demand / K_nom × 100. Daily average. |
| 15 | `capacity_surplus_deficit_orders` | DECIMAL(10,1) | output | NOT NULL | — | = K_alloc − projected_demand. Positive = surplus. Negative = deficit. |
| | | | **— PEAK / TROUGH ANALYSIS —** | | | |
| 16 | `peak_hour_demand_orders` | DECIMAL(8,2) | output | NULLABLE | NULL | Demand in highest hour-state. NULL if hourstate_sensitivity_flag = false. |
| 17 | `peak_hour_capacity_orders` | DECIMAL(8,2) | output | NULLABLE | NULL | This resource's hourly capacity during peak. |
| 18 | `peak_hour_utilization_pct` | DECIMAL(5,2) | output | NULLABLE | NULL | Peak-hour utilization. May exceed 100% → lost sales in that hour. |
| 19 | `off_peak_idle_capacity_pct` | DECIMAL(5,2) | output | NULLABLE | NULL | Unused capacity % in lowest-demand hour-state. Waste indicator. |
| 20 | `demand_distribution_code` | VARCHAR | output | NULLABLE | NULL | Hourstate profile code used (from S60). Audit trail. |
| | | | **— LOST SALES —** | | | |
| 21 | `lost_sales_orders_per_day` | DECIMAL(10,1) | output | NOT NULL | — | Σ MAX(0, hourly_demand − hourly_capacity). Section 5.5. |
| 22 | `lost_sales_orders_per_month` | DECIMAL(12,1) | output | NOT NULL | — | = daily × days_in_period. Section 5.11. |
| 23 | `lost_sales_pct` | DECIMAL(5,2) | output | NOT NULL | — | = lost_sales / projected_demand × 100. 0 if no demand. |
| 24 | `lost_sales_revenue_inr_per_day` | DECIMAL(12,2) | output | NOT NULL | — | = lost_sales_orders × S60.derived_blended_aov_inr. |
| 25 | `lost_sales_revenue_inr_per_month` | DECIMAL(14,2) | output | NOT NULL | — | = daily × days_in_period. Revenue impact of capacity constraint. |
| | | | **— PRODUCT MIX IMPACT —** | | | |
| 26 | `weighted_avg_prep_time_min` | DECIMAL(5,1) | output | NOT NULL | — | **DI-46.** Derived from S70 mix × S00 prep times. Section 5.2. |
| 27 | `product_mix_adjustment_factor` | DECIMAL(5,3) | output | NOT NULL | — | = base_prep / weighted_avg_prep. >1 = simpler mix, <1 = complex mix. Section 5.6. |
| | | | **— BOTTLENECK & TRIGGERS —** | | | |
| 28 | `bottleneck_flag` | BOOLEAN | output | NOT NULL | — | TRUE for resource with MAX(utilization_pct) in this format×stream×market. Section 5.8. |
| 29 | `expansion_trigger_reached_flag` | BOOLEAN | output | NOT NULL | — | utilization ≥ expansion_trigger_pct. |
| 30 | `contraction_trigger_reached_flag` | BOOLEAN | output | NOT NULL | — | utilization ≤ contraction_trigger_pct (false if trigger is NULL). |
| | | | **— EXPANSION RECOMMENDATION —** | | | |
| 31 | `recommended_expansion_mode` | VARCHAR | output | NULLABLE | NULL | **D15-07.** asset_add / asset_upgrade / unit_replicate / NULL. Section 5.7. |
| 32 | `recommended_expansion_quantity` | INTEGER | output | NULLABLE | NULL | How many units/assets to add. |
| 33 | `expansion_exhausted_flag` | BOOLEAN | output | NOT NULL | false | TRUE if asset expansion hit max_resource_count AND demand > capacity. Forces unit_replicate. |
| | | | **— LIFECYCLE & STATUS —** | | | |
| 34 | `capacity_start_date` | DATE | output | NOT NULL | — | COALESCE(decision override, set_item). |
| 35 | `capacity_end_date` | DATE | output | NULLABLE | NULL | COALESCE(decision override, set_item). NULL = indefinite. |
| 36 | `market_pause_status` | VARCHAR | output | NOT NULL | — | **DI-50.** active / paused / exited. From S10 format_assumptions, applied per format×market uniformly across streams. |
| 37 | `steady_state_flag` | BOOLEAN | output | NOT NULL | — | TRUE when utilization is within ±5% of target_utilization consistently. |
| | | | **— SHARED RESOURCE —** | | | |
| 38 | `resolved_shared_allocation_pct` | DECIMAL(5,2) | output | NOT NULL | — | Final allocation: COALESCE(decision override, set_item, 100.00). |
| | | | **— SET REFERENCE —** | | | |
| 39 | `set_id_used` | FK (INTEGER) | output | NULLABLE | NULL | Which capacity_profile_set_master produced these outputs. |

**Business rules:**
- BR-80-04a: Composite key (format_id, revenue_stream_id, market_id, capacity_unit_id) UNIQUE per scenario per period.
- BR-80-04b: If market_pause_status = 'paused': projected_demand = 0, utilization = 0, lost_sales = 0, resource_count PRESERVED (DI-50).
- BR-80-04c: If include_in_evaluation_flag = false (from inputs): ALL monetary outputs = 0, S300 warning issued (Rule 23 Contributor behavior).
- BR-80-04d: lost_sales_orders_per_day is computed from hourly model when hourstate_sensitivity_flag = true. When false, uses daily aggregate: MAX(0, demand − K_alloc).
- BR-80-04e: product_mix_adjustment_factor: when throughput_mode = 'fixed', this field is still computed for diagnostic purposes but does NOT affect capacity.
- BR-80-04f: bottleneck_flag: exactly ONE resource per format×stream×market has TRUE. Ties broken by item_sequence (lower = primary bottleneck).
- BR-80-04g: steady_state_flag: TRUE when |utilization_pct − target_utilization_pct| ≤ 5.0 for 3 consecutive periods. **(Audit C-03):** Multi-period evaluation requires S200 period expansion (Rule 17). Pre-S200, this flag is computed for the CURRENT snapshot only (single-period). Full 3-period evaluation activates when S200 processes sequential periods. Engine must track prior-period utilization for comparison.

---


### S300 Governance Warnings (S80-specific)

| Code | Trigger | Severity | Description |
|---|---|---|---|
| G-CAP-01 | `lost_sales_pct > 5.0` | ⚠️ WARNING | Significant demand being lost to capacity constraints. Review expansion. |
| G-CAP-02 | `expansion_exhausted_flag = TRUE` | 🔴 CRITICAL | Asset-level expansion ceiling reached. Unit replication required. |
| G-CAP-03 | `peak_hour_utilization_pct > 120.0` | ⚠️ WARNING | Severe peak-hour overload. Lost sales concentrated in rush periods. |
| G-CAP-04 | `off_peak_idle_capacity_pct > 60.0` | ℹ️ INFO | High off-peak idle capacity. Consider operating hour optimization. |
| G-CAP-05 | `expansion_approved_flag = FALSE AND expansion_trigger_reached_flag = TRUE` | ⚠️ WARNING | Expansion needed but denied by human. Capacity gap persists. |
| G-CAP-06 | Shared resource allocations ≠ 100% for same resource | 🔴 CRITICAL | Shared allocation sum across streams ≠ 100%. Over- or under-allocation. |
| G-CAP-07 | `product_mix_adjustment_factor < 0.70` | ⚠️ WARNING | Product mix significantly more complex than base assumption. Throughput materially reduced. |
| G-CAP-08 | `contraction_trigger_reached_flag = TRUE` for 3+ consecutive periods | ℹ️ INFO | Sustained under-utilization. Consider contraction to reduce costs. |

### Table Count Summary (S80)

| # | Table ID | Table Name | Status | Columns (excl. system) |
|---|---|---|---|---|
| 1 | S80-01 | `capacity_inputs` | UPGRADED | 9 |
| 2 | S80-01b | `capacity_research` | **NEW** | 14 |
| 3 | S80-05 | `capacity_profile_set_master` | **NEW** | 9 |
| 4 | S80-06 | `capacity_profile_set_items` | **NEW** | 27 |
| 5 | S80-07 | `capacity_profile_set_assignment` | **NEW** | 5 |
| 6 | S80-03 | `capacity_decisions` | UPGRADED | 16 |
| 7 | S80-04 | `capacity_outputs` | UPGRADED | 39 |
| | | **TOTAL** | | **119** |
| | ~~S80-02~~ | ~~`capacity_assumptions`~~ | **DEPRECATED** (absorbed into set_items) | — |


---



================================================================================
<!-- MODULE: 10_S90_manpower.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 10_S90_manpower.md -->
<!-- Description: S90 Manpower Strategy — 7 tables, 117 cols (Phase 15 LOCKED, Pattern #19) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 3886–4316 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S90 — MANPOWER STRATEGY (v4.5.10: Phase 15 LOCKED — Pattern #19 ADOPTED)
# ═══════════════════════════════════════

**Phase 15 upgrade:** v3 stub (4 tables, ~30 columns) → v4.5.10 full spec (7 tables, 117 columns).
**Pattern #19 ADOPTED** (Set + Context Set + Assignment). **Pattern #22** (AI Research Layer). **Pattern #25** (Research-First Defaults).
**Grain:** format × revenue_stream × market (section). format × revenue_stream × market × role_id (decisions/outputs).
**Gates:** Dual — 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format).
**Rule 23 classification:** Contributor — if excluded, costs zeroed + S300 warning. Does NOT block S200.
**Decisions locked (Phase 15):** D15-02, D15-04, D15-12 through D15-16. All ✅ LOCKED.
**DI resolutions:** DI-31 (S90) ✅, DI-52 (S90) ✅, DI-58 (S90) ✅.
**Absorbed:** ~~S90-02 `manpower_assumptions`~~ → absorbed into `manpower_profile_set_items` (Pattern #19).
**PRIMARY S200 FEED:** `resolved_monthly_manpower_cost_inr` → S200 CM2 `kitchen_labor_inr`.

### Upstream → S90

| Source | Field(s) Consumed | Purpose |
|---|---|---|
| S60 demand_outputs | `seasonalized_orders_per_day` | Demand volume — SUM across channels (same as S80) |
| S60 demand_outputs | `resolved_hourstate_profile_code` | Peak-hour staffing needs |
| S70 product_mix_set_items | product mix shares | Weighted avg prep time for productivity adjustment |
| S00 03_products_master | `default_prep_time_min` | Base product prep times |
| S00 04_variants_master | `prep_time_delta_min` | Variant prep adjustments |
| S80 capacity_outputs | `resolved_resource_count` | Capacity-linked staffing (D15-12): operators per resource |
| S10 format_assumptions | pause state | Market pause status (DI-50) |
| S00 05j_format_market_map | active pairs | Format×market gate |
| S00 06c_revenue_stream_format_map | active pairs | Format×stream gate |
| S00 12_roles_master | `default_monthly_ctc_inr`, `cost_nature` | Role defaults |

### S90 → Downstream

| Consumer | Field(s) Consumed | Purpose |
|---|---|---|
| **S200 CM2** | `resolved_monthly_manpower_cost_inr` | **kitchen_labor_inr** — primary S200 consumption point |
| S200 EBITDA | Indirect via CM2 | EBITDA = CM1 − kitchen_labor − marketing − support |
| S100 (OpEx) | `resolved_headcount` | Facility OpEx may scale with staff count |
| S300 Governance | understaffed/overstaffed, attrition, shared allocation | Warnings G-MP-01 through G-MP-08 |

### Key Concepts

| Concept | Description |
|---|---|
| **3-way MAX headcount** (D15-12) | `resolved_headcount = MAX(base_hc, demand_trigger_hc, capacity_linked_hc)`. Engine picks highest from three independent sources. |
| **4 driver modes per role** | FIXED / DEMAND / CAPACITY-LINKED / HYBRID. Determined by set_item field values, not set_master. |
| **Capacity-linked staffing** (D15-12) | `linked_capacity_unit_id` → S80 `resolved_resource_count`. E.g., 3 ovens × 1.0 operator = 3 operators. |
| **productivity_mode** (D15-16) | `fixed` / `prep_time_driven` / `hybrid`. Mirrors S80 throughput_mode for staffing productivity. |
| **Attrition cost model** (D15-14) | `attrition_rate_annual_pct` × headcount = replacement hires → `training_cost_per_hire_inr` → amortized monthly. |
| **Pause ≠ cost stop** | S80: zeroes utilization. S90: zeroes utilization BUT **cost continues** — staff stay on payroll. |

### Market Pause State Derivation (DI-61 — resolved in audit)

**Problem (Audit A-07):** `market_pause_status` in S80/S90 outputs needs a computable source at **format × market** grain. S10-04 `is_paused_flag` is format-level only (single key). Resolution:

```
market_pause_status(format, market) =
    IF S10.format_decisions.pause_decision_flag = TRUE
       AND S10.format_assumptions.pause_allowed_flag = TRUE
       AND current_date BETWEEN S10.format_outputs.pause_start_date
                            AND COALESCE(S10.format_outputs.pause_end_date, '9999-12-31'):
        → 'paused'
    ELIF S10.format_assumptions.model_planned_end_date IS NOT NULL
         AND current_date > S10.format_assumptions.model_planned_end_date:
        → 'exited'
    ELIF S30.market_expansion_outputs.resolved_wave_status = 'paused'
         FOR the wave containing this format × market:
        → 'paused'  (wave-level pause inherits to format×market)
    ELSE:
        → 'active'
```

**Grain bridging:** S10 pause applies to the ENTIRE format (all markets). S30 wave pause applies per market within a wave. Both sources must be checked. The MORE restrictive wins (if either says paused, the format×market is paused).

**Scope:** Applies uniformly across all streams within a format×market. S80 and S90 both inherit the same `market_pause_status` value for a given format×market.

| **Shared roles** (D15-15) | `shared_role_flag` + `shared_role_allocation_pct`. Mirrors S80 shared resources. S300 validates sum = 100%. |

### Computation Algorithms (11)

0. **S70 product mix set resolution (Audit B-04):** Same as S80 Step 0. Uses same resolved set — shared derivation.
1. **Demand aggregation** (S60→S90): SUM across channels per format×stream×market (same as S80).
2. **Weighted avg prep time**: Shared derivation with S80 from S70/S00.
3. **Effective productivity**: Per productivity_mode — fixed / prep_time_derived / MIN(fixed, prep_derived).
4. **Headcount determination**: 3-way MAX (base, demand-trigger, capacity-linked).
5. **Shared role allocation**: allocated_headcount = resolved × allocation_pct.
6. **Cost computation** (5-step): salary → annual → attrition cost → new hire cost → total monthly (amortized).
7. **Productivity utilization**: actual / target × 100. >100% = understaffed.
8. **Peak-hour staffing**: peak demand vs staff capacity during peak hour-state.
9. **Hiring triggers**: first_hire + increment thresholds from demand.
10. **Market pause** (DI-50): Zero utilization BUT cost continues (payroll).
11. **Monthly rollup**: daily × days_in_period. **(Audit C-09):** `days_in_period` sourced from `14_periods_master` for the current computation period. Pre-S200, uses 30.0 as default. S200 period expansion provides exact days per month.

---

### 6.1 S90-01 `manpower_inputs`

**Purpose:** Section-level evaluation controls for manpower strategy.
**Grain:** format × revenue_stream × market
**Gates:** 05j_format_market_map + 06c_revenue_stream_format_map
**Lock ID:** PHASE15-T01-S90-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `evaluation_scope_level` | VARCHAR | input | NOT NULL | 'directional' | directional / structured / validated / audited |
| 5 | `planning_horizon_months` | INTEGER | input | NULLABLE | NULL | NULL = global default from 14_periods_master |
| 6 | `include_in_evaluation_flag` | BOOLEAN | input | NOT NULL | true | Rule 23 cascade. Contributor: zero costs + WARN if false. |
| 7 | `manual_review_required_flag` | BOOLEAN | input | NOT NULL | false | Auto-set true if scope = 'directional'. |
| 8 | `notes` | TEXT | input | NULLABLE | NULL | Free-form. |
| 9 | `auto_populate_research_flag` | BOOLEAN | input | NOT NULL | true | **Pattern #25.** |

**Business rules:**
- BR-90-01a: Composite key (format_id, revenue_stream_id, market_id) UNIQUE per scenario.
- BR-90-01b: 05j gate (DI-31). 06c gate (D15-10, same as S80).
- BR-90-01c: Structurally identical to S80-01 capacity_inputs.

---

### 6.2 S90-01b `manpower_research`

**Purpose:** AI research intelligence for staffing benchmarks, salary data, attrition rates.
**Grain:** format × revenue_stream × market
**Pattern:** #22
**Lock ID:** PHASE15-T01B-S90-LOCK 🔒
**Column count:** 14 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `research_run_id` | INTEGER | system | NOT NULL | auto | Shared sequence across ALL _research tables. |
| 5 | `research_mode` | VARCHAR | research | NOT NULL | 'ai_auto' | manual / ai_assisted / ai_auto / hybrid |
| 6 | `research_prompt` | TEXT | research | NULLABLE | NULL | Context/query for AI research engine. |
| 7 | `research_status` | VARCHAR | research | NOT NULL | 'pending' | pending / in_progress / completed / stale / failed |
| 8 | `research_completed_at` | TIMESTAMP | research | NULLABLE | NULL | When AI research last completed. |
| 9 | `research_confidence` | DECIMAL(3,2) | research | NULLABLE | NULL | Overall AI confidence (0.00–1.00). |
| 10 | `research_summary` | TEXT | research | NULLABLE | NULL | AI-generated brief. |
| 11 | `source_references` | TEXT | research | NULLABLE | NULL | Citations. |
| 12 | `fields_covered` | TEXT | research | NULLABLE | NULL | Comma-separated set_item field names. |
| 13 | `stale_after_days` | INTEGER | research | NOT NULL | 90 | Days until stale. |
| 14 | `auto_refresh_enabled_flag` | BOOLEAN | research | NOT NULL | false | Auto re-run when stale. |

**Business rules:**
- BR-90-01b-a: Standard Pattern #22 template. Identical to S80-01b.

---

### 6.3 S90-05 `manpower_profile_set_master`

**Purpose:** Named, reusable staffing profiles. Each profile defines a complete role configuration for a format×stream type.
**Grain:** set-level
**Patterns:** #19 + #25
**Lock ID:** PHASE15-T05-S90-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `set_id` | PK (INTEGER) | key | NOT NULL | auto | Auto-generated. |
| 2 | `set_code` | VARCHAR | master | NOT NULL | — | UNIQUE. E.g., `MP_STD_CK_DELIVERY`. |
| 3 | `set_name` | VARCHAR | master | NOT NULL | — | UNIQUE. E.g., "Standard Cloud Kitchen — Delivery Staff". |
| 4 | `set_description` | TEXT | master | NULLABLE | NULL | Detailed positioning. |
| 5 | `lifecycle_stage` | VARCHAR | master | NOT NULL | 'launch' | launch / growth / mature / decline. |
| 6 | `predominant_staffing_driver` | VARCHAR | master | NOT NULL | 'demand_driven' | Predominant driver mode for most roles in this set — for filtering/display only. Individual role drivers determined by set_item fields (capacity_linked_headcount_mode, triggers). manual / demand_driven / capacity_linked / hybrid. |
| 7 | `sort_order` | INTEGER | master | NULLABLE | NULL | Display/processing order. |
| 8 | `research_populated_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** |
| 9 | `auto_created_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** |

**Example sets (ILLUSTRATIVE ONLY — not schema-required seed data):**

| set_code | set_name | lifecycle_stage | staffing_driver_mode |
|---|---|---|---|
| `MP_STD_CK_DELIVERY` | Standard Cloud Kitchen — Delivery Staff | growth | hybrid |
| `MP_STD_CK_DINEIN` | Standard Cloud Kitchen — Dine-in Staff | launch | demand_driven |
| `MP_HUB_DELIVERY` | Hub Kitchen — High Volume Delivery Staff | mature | capacity_linked |
| `MP_MOBILE_BAKE` | Mobile Baking Unit — On-the-Go Crew | launch | manual |
| `MP_CATERING_BULK` | Bulk Catering — Event Staff | growth | demand_driven |

---

### 6.4 S90-06 `manpower_profile_set_items`

**Purpose:** Per-role staffing parameters within a profile. Absorbs old manpower_assumptions. Each row = one staffing role within the profile.
**Grain:** set_id × item_sequence
**Patterns:** #19 + #25
**Lock ID:** PHASE15-T06-S90-LOCK 🔒
**Column count:** 29 (excl. 6 system fields) — 26 domain + 3 Pattern #25

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → manpower_profile_set_master.set_id |
| 2 | `item_sequence` | INTEGER | key | NOT NULL | — | Order within set. Lower = hire first priority. |
| | | | **— ROLE IDENTITY —** | | | |
| 3 | `role_id` | FK (INTEGER) | set_item | NOT NULL | — | FK → 12_roles_master. Which staffing role. |
| | | | **— HEADCOUNT & COST —** | | | |
| 4 | `headcount` | INTEGER | set_item | NOT NULL | — | Base number of FTEs for this role in this profile. |
| 5 | `monthly_ctc_inr` | DECIMAL(10,2) | set_item | NOT NULL | — | Monthly cost-to-company per person in ₹. |
| 6 | `variable_pay_pct` | DECIMAL(5,2) | set_item | NOT NULL | 0.00 | Variable/incentive pay as % of CTC. |
| 7 | `cost_nature` | VARCHAR | set_item | NOT NULL | 'fixed' | `fixed` (salaried regardless of volume) / `variable` (per-order piecework) / `semi_variable` (base + incentive). Overrides 12_roles_master.cost_nature if set. |
| | | | **— SHIFTS & SCHEDULING —** | | | |
| 8 | `shifts_per_day` | INTEGER | set_item | NOT NULL | 2 | Number of shifts this role works per day. |
| 9 | `hours_per_shift` | DECIMAL(4,1) | set_item | NOT NULL | 8.0 | Hours per shift. shifts_per_day × hours_per_shift = total coverage hours. Must align with S80 operating_hours_per_day. |
| | | | **— PRODUCTIVITY —** | | | |
| 10 | `orders_per_fte_per_day` | DECIMAL(8,1) | set_item | NOT NULL | — | Base productivity metric. Used when productivity_mode = fixed or hybrid. |
| 11 | `productivity_mode` | VARCHAR | set_item | NOT NULL | 'hybrid' | **D15-16.** `fixed` / `prep_time_driven` / `hybrid`. Mirrors S80 throughput_mode. |
| | | | **— HIRING TRIGGERS —** | | | |
| 12 | `first_hire_trigger_threshold` | DECIMAL(8,1) | set_item | NULLABLE | NULL | Order volume (per day) at which the first person in this role is needed. NULL = always hired from day 1. |
| 13 | `headcount_increment_trigger_threshold` | DECIMAL(8,1) | set_item | NULLABLE | NULL | Each additional X orders/day triggers +1 hire. NULL = no auto-increment (manual scaling only). |
| | | | **— CAPACITY LINK (D15-12) —** | | | |
| 14 | `capacity_linked_headcount_mode` | VARCHAR | set_item | NOT NULL | 'none' | `per_resource` (1 operator per resource unit) / `per_shift` (1 operator per resource per shift) / `none` (no capacity link). |
| 15 | `operators_per_resource_unit` | DECIMAL(4,2) | set_item | NULLABLE | NULL | Required if capacity_linked ≠ 'none'. How many FTEs per capacity resource unit. E.g., 1.00 = 1 operator per oven. 0.50 = 1 operator per 2 ovens. |
| 16 | `linked_capacity_unit_id` | FK (INTEGER) | set_item | NULLABLE | NULL | FK → 10_capacity_units_master. Which S80 resource drives this role's headcount. Required if capacity_linked ≠ 'none'. |
| | | | **— ATTRITION & TRAINING —** | | | |
| 17 | `attrition_rate_annual_pct` | DECIMAL(5,2) | set_item | NOT NULL | 0.00 | Annual staff turnover rate %. |
| 18 | `training_cost_per_hire_inr` | DECIMAL(10,2) | set_item | NOT NULL | 0.00 | One-time training cost per new hire in ₹. |
| 19 | `training_duration_days` | INTEGER | set_item | NOT NULL | 0 | Days before a new hire is productive. Affects ramp-up timing. |
| | | | **— EXPANSION —** | | | |
| 20 | `max_headcount_per_unit` | INTEGER | set_item | NULLABLE | NULL | Ceiling per facility. NULL = no limit. |
| 21 | `hiring_lead_time_days` | INTEGER | set_item | NULLABLE | NULL | Days from hiring decision to person on-floor. |
| | | | **— SHARED ROLE —** | | | |
| 22 | `shared_role_flag` | BOOLEAN | set_item | NOT NULL | false | **D15-15.** True if this role serves multiple streams. |
| 23 | `shared_role_allocation_pct` | DECIMAL(5,2) | set_item | NULLABLE | NULL | This stream's % share of the role. Required if shared_role_flag = true. S300 validates sum = 100%. |
| | | | **— HOURLY SENSITIVITY —** | | | |
| 24 | `hourstate_sensitivity_flag` | BOOLEAN | set_item | NOT NULL | true | Whether peak-hour analysis applies to this role. |
| | | | **— LIFECYCLE —** | | | |
| 25 | `model_hire_start_date` | DATE | set_item | NOT NULL | — | When hiring begins for this role. |
| 26 | `model_hire_end_date` | DATE | set_item | NULLABLE | NULL | When this role is phased out. NULL = indefinite. **(Audit C-08):** Engine MUST check: if `current_period.end_date > model_hire_end_date`, role is retired — resolved_headcount = 0, cost = 0 for that period. Distinct from pause (pause preserves headcount + cost). |
| | | | **— PATTERN #25 —** | | | |
| 27 | `field_source_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → source mapping. |
| 28 | `research_confidence_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → confidence at population time. |
| 29 | `source_research_run_id` | FK (INTEGER) | Pattern #25 | NULLABLE | NULL | FK → manpower_research.research_run_id. |

**Business rules:**
- BR-90-06a: Composite key (set_id, item_sequence) UNIQUE.
- BR-90-06b: role_id UNIQUE within a set (one entry per role per profile).
- BR-90-06c: If shared_role_flag = true, shared_role_allocation_pct MUST NOT be NULL.
- BR-90-06d: If capacity_linked_headcount_mode ≠ 'none', both operators_per_resource_unit and linked_capacity_unit_id MUST NOT be NULL.
- BR-90-06e: shifts_per_day × hours_per_shift SHOULD align with S80 resolved_operating_hours_per_day for the same format×stream×market. S300 warning if mismatch > 2 hours.
- BR-90-06f: productivity_mode follows same logic as S80 throughput_mode (D15-16).
- BR-90-06h **(Audit B-02):** **Cross-stream shared role validation.** Mirrors BR-80-06j. For each format×market×role_id where shared_role_flag = true: `SUM(resolved_shared_allocation_pct) across ALL streams MUST = 100.00 (±0.5%).` Triggers G-MP-04.
- BR-90-06i **(Audit B-03):** **Capacity link fallback.** If `capacity_linked_headcount_mode ≠ 'none'` AND no matching S80-04 row exists for `linked_capacity_unit_id` in the same format×stream×market context: `capacity_linked_headcount = 0`. S300 warning G-MP-09 issued: "Capacity link broken — no S80 output for {capacity_unit} in {format}×{stream}×{market}. Capacity-linked headcount defaulted to 0."
- BR-90-06j **(Audit C-10):** `cost_nature` ownership: S90-06 `cost_nature` overrides 12_roles_master.cost_nature for THIS profile context. The master provides the structural default; the set_item provides the context-specific override. Rule 14 ownership: S90 owns cost_nature at the set_item (profile) level; S00 owns it at the master (structural) level.
- BR-90-06g: Pattern #25 confidence gate: fields < 0.50 confidence NOT auto-populated.

**Example set items (Set: MP_STD_CK_DELIVERY):**

| seq | role | headcount | CTC/mo | shifts | orders/FTE | trigger | capacity_link | attrition | shared | alloc% |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Head Chef | 1 | ₹45,000 | 1 | 80 | NULL | per_resource (Oven) ×1.0 | 15% | true | 60% |
| 2 | Line Cook | 2 | ₹25,000 | 2 | 50 | 30 orders/day | none | 35% | true | 70% |
| 3 | Packaging Staff | 1 | ₹18,000 | 2 | 60 | 25 orders/day | none | 40% | false | NULL |
| 4 | Delivery Coordinator | 1 | ₹22,000 | 2 | 100 | 40 orders/day | none | 30% | false | NULL |
| 5 | Kitchen Helper | 1 | ₹15,000 | 2 | 40 | 20 orders/day | none | 50% | true | 50% |

---

### 6.5 S90-07 `manpower_profile_set_assignment`

**Purpose:** Maps staffing profiles to format × stream × market contexts.
**Grain:** format × revenue_stream × market × set_id
**Pattern:** #19
**Lock ID:** PHASE15-T07-S90-LOCK 🔒
**Column count:** 5 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | **Dual-gated: 05j + 06c.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | **05j gated.** |
| 4 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → manpower_profile_set_master.set_id |
| 5 | `priority_rank` | INTEGER | assignment | NOT NULL | — | Lower = primary. UNIQUE per (format, stream, market). |

**Business rules:**
- BR-90-07a–d: Identical gating rules to S80-07.

---

### 6.6 S90-03 `manpower_decisions`

**Purpose:** Human override layer for per-role staffing parameters. Rows pre-populated by engine from set_items explosion.
**Grain:** format × revenue_stream × market × role_id
**Lock ID:** PHASE15-T03-S90-LOCK 🔒
**Column count:** 14 (excl. 6 system fields) — 4 keys + 1 reference + 9 decisions

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `role_id` | FK (INTEGER) | key | NOT NULL | — | FK → 12_roles_master. Exploded from set_items. |
| | | | **— REFERENCE —** | | | |
| 5 | `set_id` | FK (INTEGER) | reference | NULLABLE | NULL | Which set produced this row. Audit trail. |
| | | | **— OVERRIDES —** | | | |
| 6 | `headcount_override` | INTEGER | decision | NULLABLE | NULL | Override computed headcount. |
| 7 | `ctc_override_inr` | DECIMAL(10,2) | decision | NULLABLE | NULL | Override monthly CTC. |
| 8 | `shifts_per_day_override` | INTEGER | decision | NULLABLE | NULL | Override shift count. |
| 9 | `hire_start_date_override` | DATE | decision | NULLABLE | NULL | Override hire start. |
| 10 | `hire_end_date_override` | DATE | decision | NULLABLE | NULL | Override hire end. |
| | | | **— APPROVALS —** | | | |
| 11 | `hiring_approved_flag` | BOOLEAN | decision | NULLABLE | NULL | Human: approve hiring. NULL = not reviewed. |
| 12 | `hiring_sequence_rank` | INTEGER | decision | NULLABLE | NULL | Priority order for hiring roles. Lower = hire first. |
| | | | **— SHARED ROLE —** | | | |
| 13 | `shared_allocation_pct_override` | DECIMAL(5,2) | decision | NULLABLE | NULL | Override stream allocation for shared roles. |
| | | | **— NOTES —** | | | |
| 14 | `decision_notes` | TEXT | decision | NULLABLE | NULL | Rationale. |

**Business rules:**
- BR-90-03a: Composite key (format_id, revenue_stream_id, market_id, role_id) UNIQUE per scenario.
- BR-90-03b: Rows pre-populated from set_items explosion.
- BR-90-03c: ALL override fields NULLABLE. NULL = use set_item/computed value.
- BR-90-03d: If hiring_approved_flag = false AND hiring_trigger_reached_flag = true, S300 warning.

---

### 6.7 S90-04 `manpower_outputs`

**Purpose:** Computed staffing results and costs. Single source of headcount and manpower cost for S200 CM2. Consumed by S200 (kitchen_labor_inr), S100, S300.
**Grain:** format × revenue_stream × market × role_id
**Lock ID:** PHASE15-T04-S90-LOCK 🔒
**Column count:** 37 (excl. 6 system fields) — 4 keys + 33 outputs

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | Key 1. |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | Key 2. |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | Key 3. |
| 4 | `role_id` | FK (INTEGER) | key | NOT NULL | — | Key 4. Exploded from set_items. |
| | | | **— RESOLVED HEADCOUNT —** | | | |
| 5 | `base_headcount` | INTEGER | output | NOT NULL | — | From set_item (before triggers/overrides). |
| 6 | `trigger_derived_headcount` | INTEGER | output | NOT NULL | — | From demand triggers (Section 5.4 Source 2). |
| 7 | `capacity_linked_headcount` | INTEGER | output | NOT NULL | — | From S80 link (Section 5.4 Source 3). 0 if mode = 'none'. |
| 8 | `computed_headcount` | INTEGER | output | NOT NULL | — | MAX(base, trigger, capacity). Before override. |
| 9 | `resolved_headcount` | INTEGER | output | NOT NULL | — | Final: COALESCE(override, computed). |
| 10 | `allocated_headcount` | DECIMAL(6,2) | output | NOT NULL | — | After shared allocation. May be fractional. |
| | | | **— COST —** | | | |
| 11 | `resolved_monthly_ctc_inr` | DECIMAL(10,2) | output | NOT NULL | — | COALESCE(override, set_item). |
| 12 | `monthly_salary_cost_inr` | DECIMAL(12,2) | output | NOT NULL | — | = allocated_headcount × CTC × (1 + variable_pay%). |
| 13 | `annual_salary_cost_inr` | DECIMAL(14,2) | output | NOT NULL | — | = monthly × 12. |
| 14 | `projected_attrition_count` | INTEGER | output | NOT NULL | — | = ROUND(resolved_headcount × attrition_rate / 100). |
| 15 | `projected_attrition_replacement_cost_inr` | DECIMAL(12,2) | output | NOT NULL | — | = attrition_count × training_cost. Annual. |
| 16 | `projected_new_hire_training_cost_inr` | DECIMAL(12,2) | output | NOT NULL | — | = incremental_hires × training_cost. One-time. |
| 17 | `resolved_monthly_manpower_cost_inr` | DECIMAL(12,2) | output | NOT NULL | — | **PRIMARY S200 FEED.** = salary + amortized attrition + amortized training. Section 5.6. |
| 18 | `resolved_annual_manpower_cost_inr` | DECIMAL(14,2) | output | NOT NULL | — | = monthly × 12. |
| | | | **— DEMAND & PRODUCTIVITY —** | | | |
| 19 | `projected_demand_orders_per_day` | DECIMAL(10,2) | output | NOT NULL | — | SUM(S60) across channels. Section 5.1. |
| 20 | `projected_demand_orders_per_month` | DECIMAL(12,2) | output | NOT NULL | — | = daily × days_in_period. |
| 21 | `effective_orders_per_fte_per_day` | DECIMAL(8,1) | output | NOT NULL | — | Product-mix adjusted. Section 5.3. |
| 22 | `projected_orders_per_fte_per_day` | DECIMAL(8,1) | output | NOT NULL | — | = demand / allocated_headcount. Actual workload. |
| 23 | `productivity_utilization_pct` | DECIMAL(5,2) | output | NOT NULL | — | = actual / target × 100. >100% = understaffed. |
| 24 | `weighted_avg_prep_time_min` | DECIMAL(5,1) | output | NOT NULL | — | Shared derivation with S80. Section 5.2. |
| | | | **— PEAK-HOUR STAFFING —** | | | |
| 25 | `peak_hour_demand_orders` | DECIMAL(8,2) | output | NULLABLE | NULL | Peak-hour demand. NULL if hourstate insensitive. |
| 26 | `peak_hour_staff_capacity_orders` | DECIMAL(8,2) | output | NULLABLE | NULL | Staff capacity during peak hour. |
| 27 | `peak_hour_staffing_gap_orders` | DECIMAL(8,2) | output | NULLABLE | NULL | = MAX(0, peak_demand − staff_capacity). Understaffing signal. |
| | | | **— TRIGGERS & FLAGS —** | | | |
| 28 | `hiring_trigger_reached_flag` | BOOLEAN | output | NOT NULL | — | TRUE if demand/capacity triggers exceed base headcount. |
| 29 | `recommended_additional_headcount` | INTEGER | output | NOT NULL | — | = MAX(0, computed − base). |
| 30 | `understaffed_flag` | BOOLEAN | output | NOT NULL | — | TRUE if productivity_utilization > 110%. |
| 31 | `overstaffed_flag` | BOOLEAN | output | NOT NULL | — | TRUE if productivity_utilization < 50%. |
| 32 | `bottleneck_flag` | BOOLEAN | output | NOT NULL | — | TRUE for role with MAX(productivity_utilization) in this format×stream×market. |
| | | | **— LIFECYCLE & STATUS —** | | | |
| 33 | `hire_start_date` | DATE | output | NOT NULL | — | COALESCE(override, set_item). |
| 34 | `hire_end_date` | DATE | output | NULLABLE | NULL | COALESCE(override, set_item). |
| 35 | `market_pause_status` | VARCHAR | output | NOT NULL | — | **DI-50.** active / paused / exited. Note: staff cost continues during pause (Section 5.10). |
| | | | **— SHARED ROLE —** | | | |
| 36 | `resolved_shared_allocation_pct` | DECIMAL(5,2) | output | NOT NULL | — | COALESCE(override, set_item, 100.00). |
| | | | **— SET REFERENCE —** | | | |
| 37 | `set_id_used` | FK (INTEGER) | output | NULLABLE | NULL | Which manpower_profile_set_master produced these outputs. |

**Business rules:**
- BR-90-04a: Composite key (format_id, revenue_stream_id, market_id, role_id) UNIQUE per scenario per period.
- BR-90-04b: If market_pause_status = 'paused': demand = 0, triggers = false, BUT monthly_salary_cost STILL COMPUTED (staff on payroll). Key difference from S80 (which zeroes utilization but preserves count — S90 preserves count AND cost).
- BR-90-04c: If include_in_evaluation_flag = false: ALL cost outputs = 0, S300 warning (Rule 23 Contributor).
- BR-90-04d: resolved_monthly_manpower_cost_inr is the PRIMARY field consumed by S200 CM2 as `kitchen_labor_inr`.
- BR-90-04e: bottleneck_flag: exactly ONE role per format×stream×market has TRUE. Ties broken by item_sequence.
- BR-90-04f: understaffed_flag threshold: 110%. overstaffed_flag threshold: 50%. These are fixed thresholds (not configurable in v4).
- BR-90-04g: Peak-hour fields NULL when hourstate_sensitivity_flag = false on set_item.

---


### S300 Governance Warnings (S90-specific)

| Code | Trigger | Severity | Description |
|---|---|---|---|
| G-MP-01 | `understaffed_flag = TRUE` | ⚠️ WARNING | Role is overloaded (>110% productivity utilization). Service quality at risk. |
| G-MP-02 | `overstaffed_flag = TRUE` for 3+ consecutive periods | ℹ️ INFO | Role is significantly under-utilized (<50%). Consider headcount reduction. |
| G-MP-03 | `hiring_approved_flag = FALSE AND hiring_trigger_reached_flag = TRUE` | ⚠️ WARNING | Hiring needed but denied. Understaffing risk. |
| G-MP-04 | Shared role allocations ≠ 100% for same role in same format×market | 🔴 CRITICAL | Over- or under-allocation of shared staff. |
| G-MP-05 | `attrition_rate_annual_pct > 40.0` | ⚠️ WARNING | High attrition. Training cost and quality impact. |
| G-MP-06 | `peak_hour_staffing_gap_orders > 0` | ⚠️ WARNING | Peak-hour understaffing. Order fulfillment may be delayed. |
| G-MP-07 | shifts_per_day × hours_per_shift deviates from S80 operating_hours by >2 hrs | ℹ️ INFO | Staffing coverage doesn't match facility operating hours. |
| G-MP-08 | `projected_attrition_replacement_cost_inr > 20% of annual_salary_cost_inr` | ⚠️ WARNING | Attrition cost disproportionately high. Retention strategy needed. |

### Table Count Summary (S90)

| # | Table ID | Table Name | Status | Columns (excl. system) |
|---|---|---|---|---|
| 1 | S90-01 | `manpower_inputs` | UPGRADED | 9 |
| 2 | S90-01b | `manpower_research` | **NEW** | 14 |
| 3 | S90-05 | `manpower_profile_set_master` | **NEW** | 9 |
| 4 | S90-06 | `manpower_profile_set_items` | **NEW** | 29 |
| 5 | S90-07 | `manpower_profile_set_assignment` | **NEW** | 5 |
| 6 | S90-03 | `manpower_decisions` | UPGRADED | 14 |
| 7 | S90-04 | `manpower_outputs` | UPGRADED | 37 |
| | | **TOTAL** | | **117** |
| | ~~S90-02~~ | ~~`manpower_assumptions`~~ | **DEPRECATED** (absorbed into set_items) | — |

### Key Differences: S90 vs S80

| Dimension | S80 (Capacity) | S90 (Manpower) |
|---|---|---|
| Third key | `capacity_unit_id` → 10_capacity_units_master | `role_id` → 12_roles_master |
| Throughput metric | `orders_per_hour_capacity` | `orders_per_fte_per_day` |
| Mode field | `throughput_mode` | `productivity_mode` |
| Expansion | `expansion_mode` (asset_add/upgrade/replicate) | Hiring triggers + `max_headcount_per_unit` |
| Cost | No direct cost (feeds S100/S110) | **Direct cost → S200 CM2** |
| Pause behavior | Utilization → 0, cost → 0 | Utilization → 0, **cost continues** (payroll) |
| Cross-section link | Consumes S60 demand | Consumes S60 demand **AND S80 resource count** |
| Unique feature | Lost sales modeling | Attrition + training cost model |
| Unique feature | Hourly peak capacity analysis | Capacity-linked headcount (D15-12) |
| Shared concept | `shared_resource_flag` + `allocation_pct` | `shared_role_flag` + `allocation_pct` |


---



================================================================================
<!-- MODULE: fpe_s100_opex_strategy_spec_v1.md -->
================================================================================

# FPE S100 — Operating Expenses Strategy — Full Spec v1

<!-- FPE MODULAR SCHEMA — v4.5.11 (Phase 16) -->
<!-- File: 11_S100_opex.md -->
<!-- Description: S100 OpEx Strategy — 7 tables, ~105 cols (Phase 16, Pattern #19 ADOPTED) -->
<!-- Supersedes: v4.5.10a S100 stub (4 tables, ~30 cols) -->
<!-- Date: 2026-04-11 -->
<!-- Session: Phase 16, Session 16b -->
<!-- Decisions: D16-01 (grain), D16-03 (Pattern #19 YES), D16-04 (remove intensity index) -->

# ═══════════════════════════════════════
# S100 — OPERATING EXPENSES STRATEGY (v4.5.11: Phase 16 — Pattern #19 ADOPTED)
# ═══════════════════════════════════════

**Phase 16 upgrade:** v3 stub (4 tables, ~30 columns) → v4.5.11 full spec (7 tables, 105 columns).
**Pattern #19 ADOPTED** (Set + Context Set + Assignment). **Pattern #22** (AI Research Layer). **Pattern #25** (Research-First Defaults).
**Grain:** format × revenue_stream × market (section). format × revenue_stream × market × opex_line_item_id (decisions/outputs).
**Gates:** Dual — 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format).
**Rule 23 classification:** Contributor — if excluded, costs zeroed + S300 warning. Does NOT block S200.
**Decisions locked (Phase 16):** D16-01 (grain + shared_opex), D16-03 (Pattern #19 YES), D16-04 (remove intensity index).
**DI resolutions:** DI-31 (S100) ✅, DI-47 (S100) ✅, DI-52 (S100) ✅, DI-58 (S100) ✅, DI-59 ✅ CLOSED, B-08 ✅ CLOSED.
**Absorbed:** ~~S100-02 `opex_assumptions`~~ → absorbed into `opex_profile_set_items` (Pattern #19).
**PRIMARY S200 FEED:** `projected_monthly_opex_inr` → S200 EBITDA `fixed_opex_inr` (after SUM across line items per format×stream×market, then SUM across streams per Rule 18).

---

## 1. Upstream → S100

| Source | Field(s) Consumed | Purpose |
|---|---|---|
| S60 demand_outputs | `seasonalized_orders_per_day` | Variable-cost driver. SUM across channels per format×stream×market (same as S80/S90). |
| S80 capacity_outputs | `resolved_resource_count` | Resource-linked cost driver (e.g., maintenance per oven). Per format×stream×market×capacity_unit. |
| S80 capacity_outputs | `resolved_operating_hours_per_day` | Hours-linked cost driver (e.g., electricity scales with hours). |
| S80 capacity_outputs | `market_pause_status` | Pause state — governs variable/linked cost zeroing. |
| S90 manpower_outputs | `resolved_headcount` | Headcount-linked cost driver (e.g., consumables per staff). SUM across roles per format×stream×market. |
| S00 13_opex_line_items_master | `cost_behavior`, `allocation_basis`, `market_scope_level` | Structural defaults for expense classification. |
| S00 05j_format_market_map | active pairs | Format×market gate (DI-31). |
| S00 06c_revenue_stream_format_map | active pairs | Format×stream gate (D16-01). |
| S10 format_assumptions | pause state | Market pause derivation source (DI-61 algorithm). |

## 2. S100 → Downstream

| Consumer | Field(s) Consumed | Purpose |
|---|---|---|
| **S200 EBITDA** | `projected_monthly_opex_inr` | **fixed_opex_inr** in ebitda_output. SUM across line items per format×stream×market, then SUM across streams (Rule 18). |
| S200 Cash Flow | `projected_monthly_opex_inr` | Operating cash outflow. |
| S10 format_outputs | Aggregated OpEx rollup | Operational intensity indicator. |
| S300 Governance | Budget variance, pause, shared allocation, escalation | Warnings G-OX-01 through G-OX-08. |

## 3. Key Concepts

| Concept | Description |
|---|---|
| **cost_driver_mode** | How each OpEx line item's cost is computed: `fixed` / `variable` / `semi_variable` / `resource_linked` / `headcount_linked` / `step_function`. Determined per set_item row. |
| **Shared OpEx** (D16-01) | `shared_opex_flag` + `shared_opex_allocation_pct`. Facility-level costs (rent, insurance) shared across streams. Mirrors S80/S90 shared resource/role pattern. S300 validates sum = 100%. |
| **Resource-linked costs** | OpEx that scales with S80 `resolved_resource_count`. E.g., oven maintenance = ₹2,000/month per oven × 4 ovens. |
| **Headcount-linked costs** | OpEx that scales with S90 `resolved_headcount`. E.g., uniforms = ₹500/month per staff × 12 staff. |
| **Step-function escalation** | Beyond flat annual escalation: discrete cost jumps when a metric crosses a threshold. E.g., waste disposal increases by ₹5,000/month when daily orders exceed 200. |
| **Pause semantics** | Mirrors S90: when paused, variable/resource/headcount components → 0, but FIXED costs CONTINUE (rent doesn't stop during a pause). S80/S90 precedent. |
| **Cost driver hierarchy** | `fixed`: only fixed_monthly. `variable`: only orders × rate. `semi_variable`: fixed + variable. `resource_linked`: fixed + resource×rate. `headcount_linked`: fixed + headcount×rate. `step_function`: fixed + step increments. |

## 4. Computation Algorithms (12)

### Step 0: OpEx Profile Resolution

Determine which `opex_profile_set` is active for each format×stream×market context.
```
Resolution: S100-07 opex_profile_set_assignment
  → match on (format_id, revenue_stream_id, market_id)
  → select set with lowest priority_rank
  → if no assignment found, ERROR: no OpEx profile for this context
  → resolved set feeds Steps 4–9
```

### Step 1: Demand Aggregation (S60→S100)

```
projected_demand_orders_per_day(format, stream, market) =
  SUM(S60.seasonalized_orders_per_day)
  WHERE S60.format_id = format AND S60.revenue_stream_id = stream AND S60.market_id = market
  GROUP BY format, stream, market
  -- Collapses channel dimension (same as S80 Step 1, S90 Step 1)

projected_demand_orders_per_month = projected_demand_orders_per_day × days_in_period
  -- days_in_period from 14_periods_master (Audit C-09). Pre-S200 default = 30.0.
```

### Step 2: Resource Count Aggregation (S80→S100)

```
FOR EACH opex_line_item WHERE cost_driver_mode = 'resource_linked':
  linked_resource_count(format, stream, market) =
    S80.resolved_resource_count
    WHERE S80.format_id = format AND S80.revenue_stream_id = stream
          AND S80.market_id = market AND S80.capacity_unit_id = set_item.linked_capacity_unit_id
  linked_operating_hours =
    S80.resolved_operating_hours_per_day (same filter)

-- If linked_capacity_unit_id is NULL but cost_driver_mode = 'resource_linked': ERROR.
-- If S80 has no row for this context: resource_count = 0, WARN G-OX-07.
```

### Step 3: Headcount Aggregation (S90→S100)

```
FOR EACH opex_line_item WHERE cost_driver_mode = 'headcount_linked':
  linked_headcount(format, stream, market) =
    SUM(S90.resolved_headcount)
    WHERE S90.format_id = format AND S90.revenue_stream_id = stream
          AND S90.market_id = market
    -- SUM across ALL roles — total staff count for this context

-- If S90 has no rows: headcount = 0, WARN G-OX-08.
```

### Step 4: Fixed Component

```
computed_fixed_component_inr =
  CASE cost_driver_mode
    WHEN 'fixed'           → set_item.fixed_monthly_inr
    WHEN 'semi_variable'   → set_item.fixed_monthly_inr  (base portion)
    WHEN 'resource_linked' → set_item.fixed_monthly_inr  (base portion, may be 0)
    WHEN 'headcount_linked'→ set_item.fixed_monthly_inr  (base portion, may be 0)
    WHEN 'step_function'   → set_item.fixed_monthly_inr  (base before steps)
    WHEN 'variable'        → 0  (no fixed component)
  END
```

### Step 5: Variable Component

```
computed_variable_component_inr =
  CASE cost_driver_mode
    WHEN 'variable'        → set_item.variable_per_order_inr × projected_demand_orders_per_month
    WHEN 'semi_variable'   → set_item.variable_per_order_inr × projected_demand_orders_per_month
    ELSE                   → 0
  END
```

### Step 6: Resource-Linked Component

```
computed_resource_linked_component_inr =
  CASE cost_driver_mode
    WHEN 'resource_linked' → set_item.cost_per_resource_unit_monthly_inr × linked_resource_count
    ELSE                   → 0
  END
```

### Step 7: Headcount-Linked Component

```
computed_headcount_linked_component_inr =
  CASE cost_driver_mode
    WHEN 'headcount_linked' → set_item.cost_per_headcount_monthly_inr × linked_headcount
    ELSE                    → 0
  END
```

### Step 8: Step-Function Component

```
computed_step_component_inr =
  CASE cost_driver_mode
    WHEN 'step_function' →
      trigger_metric_value = CASE set_item.escalation_trigger_metric
        WHEN 'orders_per_day'     → projected_demand_orders_per_day
        WHEN 'headcount'          → linked_headcount
        WHEN 'revenue_monthly_inr'→ (projected_demand_orders_per_day × S60.derived_blended_aov_inr × days_in_period)
        WHEN 'resource_count'     → linked_resource_count
        WHEN 'none'               → 0
      END
      steps_fired = FLOOR(trigger_metric_value / set_item.escalation_trigger_value)
      → set_item.escalation_step_amount_inr × steps_fired
    ELSE → 0
  END
```

### Step 9: Total Monthly OpEx (Pre-Allocation)

```
pre_allocation_monthly_opex_inr =
  computed_fixed_component_inr
  + computed_variable_component_inr
  + computed_resource_linked_component_inr
  + computed_headcount_linked_component_inr
  + computed_step_component_inr
```

### Step 10: Shared Allocation

```
IF shared_opex_flag = TRUE:
  allocated_monthly_opex_inr = pre_allocation_monthly_opex_inr × (shared_opex_allocation_pct / 100)
ELSE:
  allocated_monthly_opex_inr = pre_allocation_monthly_opex_inr  -- 100% to this stream

-- S300 validates: FOR EACH (format, market, opex_line_item) WHERE shared_opex_flag = TRUE:
--   SUM(shared_opex_allocation_pct) across streams MUST = 100.00
```

### Step 11: Annual Projection with Escalation

```
annual_escalation_factor = 1 + (set_item.annual_escalation_pct / 100)
projected_monthly_opex_inr = allocated_monthly_opex_inr  -- Month 1
-- For Month M (M > 12): projected_monthly_opex_inr × annual_escalation_factor ^ FLOOR((M-1)/12)
projected_annual_opex_inr = SUM(projected_monthly across 12 months, with escalation applied at month 13+)
opex_per_order_inr = projected_monthly_opex_inr / projected_demand_orders_per_month
  -- Guard: if orders = 0, opex_per_order = NULL (avoid divide-by-zero)
```

### Step 12: Decision Overrides

```
IF S100-03.budget_override_inr IS NOT NULL:
  projected_monthly_opex_inr = budget_override_inr  -- Human override replaces computed value
  budget_variance_inr = budget_override_inr - pre_override_computed_value
  budget_variance_pct = budget_variance_inr / pre_override_computed_value × 100
  IF ABS(budget_variance_pct) > 20: WARN G-OX-01

IF S100-03.escalation_override_pct IS NOT NULL:
  annual_escalation_pct = escalation_override_pct  -- Override for projection

IF S100-03.opex_start_date_override IS NOT NULL:
  opex_start_date = opex_start_date_override

IF S100-03.opex_end_date_override IS NOT NULL:
  opex_end_date = opex_end_date_override
```

### Step 13: Market Pause

```
market_pause_status = derived from S80 (DI-61 algorithm, shared with S80/S90)

IF market_pause_status = 'paused':
  -- Variable, resource-linked, headcount-linked components → 0
  computed_variable_component_inr = 0
  computed_resource_linked_component_inr = 0
  computed_headcount_linked_component_inr = 0
  computed_step_component_inr = 0
  -- FIXED component CONTINUES (rent, insurance still due)
  -- Same precedent as S90: pause ≠ cost stop for fixed obligations
  projected_monthly_opex_inr = computed_fixed_component_inr × (shared_opex_allocation_pct / 100 IF shared ELSE 1.0)
```

### Step 14: Monthly Rollup

```
-- Audit C-09 compliance:
days_in_period = sourced from 14_periods_master for current computation period
Pre-S200 default = 30.0
projected_demand_orders_per_month = projected_demand_orders_per_day × days_in_period
-- All monthly figures use days_in_period, not hardcoded 30
```

---

## 5. S300 Governance Warnings

| Code | Trigger | Severity | Description |
|---|---|---|---|
| **G-OX-01** | `ABS(budget_variance_pct) > 20` | ⚠️ WARNING | Budget override deviates >20% from computed OpEx. Requires justification in decision_notes. |
| **G-OX-02** | `opex_per_order_inr > (derived_blended_aov_inr × 0.15)` | ⚠️ WARNING | OpEx per order exceeds 15% of AOV. Investigate cost efficiency. |
| **G-OX-03** | `SUM(shared_opex_allocation_pct) ≠ 100` across streams for shared line item | 🔴 ERROR | Shared allocation must sum to 100%. Blocks computation until fixed. |
| **G-OX-04** | `steps_fired > 0` (step escalation activated) | ℹ️ INFO | Step-function cost increase triggered. Informational — no block. |
| **G-OX-05** | `opex_start_date > market_launch_date` | ⚠️ WARNING | OpEx starts after market launch — gap period has no cost coverage. |
| **G-OX-06** | `opex_end_date < market_planned_end_date` | ⚠️ WARNING | OpEx ends before market exit — premature cost termination. |
| **G-OX-07** | `cost_driver_mode = 'resource_linked'` AND S80 returns 0 or no row | ⚠️ WARNING | Resource-linked cost references zero/missing S80 resource. Cost = 0 but may indicate orphaned link. |
| **G-OX-08** | `cost_driver_mode = 'headcount_linked'` AND S90 returns 0 or understaffed | ⚠️ WARNING | Headcount-linked cost may be understated due to staffing gaps. |

---

## 6. TABLE SPECIFICATIONS

### 6.1 S100-01 `opex_inputs`

**Purpose:** Section-level evaluation controls for operating expenses strategy.
**Grain:** format × revenue_stream × market
**Gates:** 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format)
**Phase 16 Lock ID:** PHASE16-T01-S100-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** (D16-01: added for stream-level OpEx.) |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `evaluation_scope_level` | VARCHAR | input | NOT NULL | 'directional' | directional / structured / validated / audited. Metadata only — no computation impact. See Rule 24. |
| 5 | `planning_horizon_months` | INTEGER | input | NULLABLE | NULL | NULL = global default from 14_periods_master. See Rule 24. |
| 6 | `include_in_evaluation_flag` | BOOLEAN | input | NOT NULL | true | Rule 23 cascade. Contributor: zero costs + WARN if false. |
| 7 | `manual_review_required_flag` | BOOLEAN | input | NOT NULL | false | Auto-set true if scope = 'directional'. |
| 8 | `notes` | TEXT | input | NULLABLE | NULL | Free-form. |
| 9 | `auto_populate_research_flag` | BOOLEAN | input | NOT NULL | true | **Pattern #25 (D-CROSS-01).** When true, research completion auto-populates opex_profile_set_items. |

**Business rules:**
- BR-100-01a: Composite key (format_id, revenue_stream_id, market_id) UNIQUE per scenario.
- BR-100-01b: format_id × market_id MUST exist in 05j_format_market_map with active status (DI-31).
- BR-100-01c: format_id × revenue_stream_id MUST exist in 06c_revenue_stream_format_map with active status (D16-01).
- BR-100-01d: If evaluation_scope_level = 'directional', manual_review_required_flag auto-set to true.
- BR-100-01e: Structurally identical to S80-01 capacity_inputs and S90-01 manpower_inputs.

---

### 6.2 S100-01b `opex_research`

**Purpose:** AI research intelligence layer for OpEx benchmarks, market rental rates, utility costs, logistics rates.
**Grain:** format × revenue_stream × market
**Pattern:** #22 (AI Research Layer)
**Phase 16 Lock ID:** PHASE16-T01B-S100-LOCK 🔒
**Column count:** 14 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `research_run_id` | INTEGER | system | NOT NULL | auto | Shared sequence across ALL _research tables. |
| 5 | `research_mode` | VARCHAR | research | NOT NULL | 'ai_auto' | manual / ai_assisted / ai_auto / hybrid |
| 6 | `research_prompt` | TEXT | research | NULLABLE | NULL | Context/query for AI research engine. E.g., "Cloud kitchen rental rates in Mumbai suburbs Q1 2026, packaging cost per delivery order for pizza delivery" |
| 7 | `research_status` | VARCHAR | research | NOT NULL | 'pending' | pending / in_progress / completed / stale / failed |
| 8 | `research_completed_at` | TIMESTAMP | research | NULLABLE | NULL | When AI research last completed. |
| 9 | `research_confidence` | DECIMAL(3,2) | research | NULLABLE | NULL | Overall AI confidence (0.00–1.00). |
| 10 | `research_summary` | TEXT | research | NULLABLE | NULL | AI-generated brief. |
| 11 | `source_references` | TEXT | research | NULLABLE | NULL | Citations: report names, URLs, data sources. |
| 12 | `fields_covered` | TEXT | research | NULLABLE | NULL | Comma-separated set_item field names this research covers. E.g., "fixed_monthly_inr,variable_per_order_inr,annual_escalation_pct" |
| 13 | `stale_after_days` | INTEGER | research | NOT NULL | 90 | Days until stale. Triggers G-RF-02 warning. |
| 14 | `auto_refresh_enabled_flag` | BOOLEAN | research | NOT NULL | false | Auto re-run when stale. |

**Business rules:**
- BR-100-01b-a: Standard Pattern #22 template. Identical structure to S80-01b, S90-01b.
- BR-100-01b-b: research_run_id used as FK target by opex_profile_set_items.source_research_run_id (loose FK — Pattern #25).
- BR-100-01b-c: When research_status transitions to 'completed' AND opex_inputs.auto_populate_research_flag = true, triggers Pattern #25 auto-population pipeline.

---

### 6.3 S100-05 `opex_profile_set_master`

**Purpose:** Named, reusable OpEx profiles. Each profile defines a complete operating expense configuration for a format×stream type.
**Grain:** set-level (no FK keys)
**Patterns:** #19 (Set + Context Set + Assignment) + #25 (Research-First Defaults)
**Phase 16 Lock ID:** PHASE16-T05-S100-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `set_id` | PK (INTEGER) | key | NOT NULL | auto | Auto-generated primary key. |
| 2 | `set_code` | VARCHAR | master | NOT NULL | — | UNIQUE. Machine-readable. E.g., `OX_STD_CK_DELIVERY`. |
| 3 | `set_name` | VARCHAR | master | NOT NULL | — | UNIQUE. Display name. E.g., "Standard Cloud Kitchen — Delivery OpEx". |
| 4 | `set_description` | TEXT | master | NULLABLE | NULL | Detailed description of what this profile covers. |
| 5 | `lifecycle_stage` | VARCHAR | master | NOT NULL | 'launch' | launch / growth / mature / decline. |
| 6 | `predominant_cost_driver` | VARCHAR | master | NOT NULL | 'semi_variable' | Predominant driver mode for most items in this set — for filtering/display only. Individual item drivers determined by set_item.cost_driver_mode. `fixed` / `variable` / `semi_variable` / `resource_linked` / `headcount_linked` / `mixed`. |
| 7 | `sort_order` | INTEGER | master | NULLABLE | NULL | Display/processing order. |
| 8 | `research_populated_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** True if research created or populated this set's items. |
| 9 | `auto_created_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** True if auto-created by research pipeline (D-CROSS-01a). |

**Business rules:**
- BR-100-05a: set_code and set_name are UNIQUE within S100 opex_profile_set_master. Naming convention uses OX_ prefix (e.g., OX_STD_CK_DELIVERY). (Audit C-06 compliance: unique within table, not cross-section.)
- BR-100-05b: When auto_created_flag = true, research_populated_flag MUST also be true.
- BR-100-05c: A set with lifecycle_stage = 'decline' triggers S300 governance review.

**Example sets (ILLUSTRATIVE ONLY — not schema-required seed data):**

| set_code | set_name | lifecycle_stage | predominant_cost_driver |
|---|---|---|---|
| `OX_STD_CK_DELIVERY` | Standard Cloud Kitchen — Delivery OpEx | growth | semi_variable |
| `OX_STD_CK_DINEIN` | Standard Cloud Kitchen — Dine-in OpEx | launch | semi_variable |
| `OX_HUB_DELIVERY` | Hub Kitchen — High Volume Delivery OpEx | mature | variable |
| `OX_SPOKE_DELIVERY` | Spoke Kitchen — Satellite Delivery OpEx | launch | fixed |
| `OX_MOBILE_BAKE` | Mobile Baking Unit — On-the-Go OpEx | launch | fixed |
| `OX_CATERING_BULK` | Bulk Catering Kitchen OpEx | growth | semi_variable |

---

### 6.4 S100-06 `opex_profile_set_items`

**Purpose:** Per-OpEx-line-item cost parameters within a profile. Absorbs old opex_assumptions. Each row = one expense line item within the profile.
**Grain:** set_id × item_sequence
**Patterns:** #19 + #25
**Phase 16 Lock ID:** PHASE16-T06-S100-LOCK 🔒
**Column count:** 24 (excl. 6 system fields) — 21 domain + 3 Pattern #25

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → opex_profile_set_master.set_id |
| 2 | `item_sequence` | INTEGER | key | NOT NULL | — | Order within set. Lower = higher priority expense (rent before consumables). |
| | | | **— EXPENSE IDENTITY —** | | | |
| 3 | `opex_line_item_id` | FK (INTEGER) | set_item | NOT NULL | — | FK → 13_opex_line_items_master. Which expense type. |
| | | | **— COST DRIVER —** | | | |
| 4 | `cost_driver_mode` | VARCHAR | set_item | NOT NULL | 'semi_variable' | How this line item's cost is computed: `fixed` / `variable` / `semi_variable` / `resource_linked` / `headcount_linked` / `step_function`. |
| | | | **— FIXED COMPONENT —** | | | |
| 5 | `fixed_monthly_inr` | DECIMAL(12,2) | set_item | NOT NULL | 0.00 | Fixed monthly cost in ₹. Used by all cost_driver_modes except 'variable'. |
| | | | **— VARIABLE COMPONENT —** | | | |
| 6 | `variable_per_order_inr` | DECIMAL(8,2) | set_item | NOT NULL | 0.00 | Variable cost per order in ₹. Used when cost_driver_mode ∈ {variable, semi_variable}. Driven by S60 demand volume. |
| | | | **— RESOURCE LINK (S80) —** | | | |
| 7 | `resource_linked_cost_flag` | BOOLEAN | set_item | NOT NULL | false | True if this line item scales with S80 resource count. Required true when cost_driver_mode = 'resource_linked'. |
| 8 | `linked_capacity_unit_id` | FK (INTEGER) | set_item | NULLABLE | NULL | FK → 10_capacity_units_master. Which S80 resource drives this cost. Required if resource_linked_cost_flag = true. |
| 9 | `cost_per_resource_unit_monthly_inr` | DECIMAL(10,2) | set_item | NULLABLE | NULL | Monthly cost per S80 resource unit in ₹. Required if resource_linked_cost_flag = true. E.g., ₹2,000/month per oven for maintenance. |
| | | | **— HEADCOUNT LINK (S90) —** | | | |
| 10 | `headcount_linked_cost_flag` | BOOLEAN | set_item | NOT NULL | false | True if this line item scales with S90 total headcount. Required true when cost_driver_mode = 'headcount_linked'. |
| 11 | `cost_per_headcount_monthly_inr` | DECIMAL(10,2) | set_item | NULLABLE | NULL | Monthly cost per FTE in ₹. Required if headcount_linked_cost_flag = true. E.g., ₹500/month per staff for uniforms. |
| | | | **— ESCALATION —** | | | |
| 12 | `annual_escalation_pct` | DECIMAL(5,2) | set_item | NOT NULL | 0.00 | Annual cost escalation rate %. Applied at month 13+. |
| 13 | `escalation_trigger_metric` | VARCHAR | set_item | NOT NULL | 'none' | Metric for step-function: `orders_per_day` / `headcount` / `revenue_monthly_inr` / `resource_count` / `none`. |
| 14 | `escalation_trigger_value` | DECIMAL(10,2) | set_item | NULLABLE | NULL | Threshold per step. Required if escalation_trigger_metric ≠ 'none'. |
| 15 | `escalation_step_amount_inr` | DECIMAL(10,2) | set_item | NULLABLE | NULL | ₹ added per step fired. Required if escalation_trigger_metric ≠ 'none'. |
| | | | **— PAYMENT & DEPOSIT —** | | | |
| 16 | `payment_terms_days` | INTEGER | set_item | NOT NULL | 30 | Payment terms for this expense. Feeds S200 cash flow timing. |
| 17 | `security_deposit_inr` | DECIMAL(10,2) | set_item | NOT NULL | 0.00 | Upfront deposit in ₹. One-time cash outflow at opex_start_date. Feeds S200/S120. |
| | | | **— SHARED OPEX (D16-01) —** | | | |
| 18 | `shared_opex_flag` | BOOLEAN | set_item | NOT NULL | false | **D16-01.** True if this expense serves multiple streams. Facility-level costs (rent, insurance). |
| 19 | `shared_opex_allocation_pct` | DECIMAL(5,2) | set_item | NULLABLE | NULL | This stream's % share. **Required if shared_opex_flag = true.** NULL or omitted = 100% (exclusive). S300 validates: SUM across streams for same format×market×opex_line_item MUST = 100%. |
| | | | **— LIFECYCLE —** | | | |
| 20 | `model_opex_start_date` | DATE | set_item | NOT NULL | — | When this expense begins. Typically aligned with market launch or format go-live. |
| 21 | `model_opex_end_date` | DATE | set_item | NULLABLE | NULL | When this expense ends. NULL = indefinite. Engine check (Audit C-08): if current_period.end_date > model_opex_end_date, cost = 0 for that period. |
| | | | **— PATTERN #25 —** | | | |
| 22 | `field_source_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → source mapping. E.g., {"fixed_monthly_inr": "research", "variable_per_order_inr": "manual"}. Refresh cycles only overwrite 'research'-sourced fields. |
| 23 | `research_confidence_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → confidence at population time. E.g., {"fixed_monthly_inr": 0.82, "annual_escalation_pct": 0.65}. |
| 24 | `source_research_run_id` | FK (INTEGER) | Pattern #25 | NULLABLE | NULL | FK → opex_research.research_run_id. Loose FK — tracks which research run populated this row. |

**Business rules:**
- BR-100-06a: Composite key (set_id, item_sequence) UNIQUE.
- BR-100-06b: opex_line_item_id MUST exist in 13_opex_line_items_master.
- BR-100-06c: If resource_linked_cost_flag = true, linked_capacity_unit_id and cost_per_resource_unit_monthly_inr are REQUIRED (NOT NULL enforced by application).
- BR-100-06d: If headcount_linked_cost_flag = true, cost_per_headcount_monthly_inr is REQUIRED.
- BR-100-06e: cost_driver_mode = 'resource_linked' requires resource_linked_cost_flag = true. cost_driver_mode = 'headcount_linked' requires headcount_linked_cost_flag = true.
- BR-100-06f: escalation_trigger_metric ≠ 'none' requires escalation_trigger_value and escalation_step_amount_inr to be NOT NULL.
- BR-100-06g: When auto_created from research pipeline, field_source_json MUST be populated. Manual entries may have NULL field_source_json.
- BR-100-06h: Same opex_line_item_id MAY appear in multiple sets (different profiles for different contexts). UNIQUE within a single set.

**Example set_items (ILLUSTRATIVE — for OX_STD_CK_DELIVERY):**

| seq | opex_line_item | cost_driver_mode | fixed_monthly | var_per_order | shared | alloc_pct |
|---|---|---|---|---|---|---|
| 1 | Kitchen Rent | fixed | 85,000 | 0 | ✅ YES | 60% |
| 2 | Electricity | resource_linked | 5,000 | 0 | ✅ YES | 55% |
| 3 | Gas (LPG/PNG) | resource_linked | 2,000 | 0 | ✅ YES | 50% |
| 4 | Water | fixed | 3,000 | 0 | ✅ YES | 50% |
| 5 | Packaging | variable | 0 | 12.00 | ❌ NO | 100% |
| 6 | Delivery Logistics | variable | 0 | 35.00 | ❌ NO | 100% |
| 7 | Insurance | fixed | 8,000 | 0 | ✅ YES | 50% |
| 8 | Maintenance | resource_linked | 0 | 0 | ✅ YES | 50% |
| 9 | Software/POS | fixed | 5,000 | 0 | ✅ YES | 40% |
| 10 | Cleaning Supplies | headcount_linked | 0 | 0 | ✅ YES | 50% |
| 11 | Uniforms | headcount_linked | 0 | 0 | ❌ NO | 100% |
| 12 | Waste Disposal | step_function | 3,000 | 0 | ✅ YES | 50% |

---

### 6.5 S100-07 `opex_profile_set_assignment`

**Purpose:** Maps OpEx profiles to format × stream × market contexts.
**Grain:** format × revenue_stream × market × set_id
**Pattern:** #19
**Phase 16 Lock ID:** PHASE16-T07-S100-LOCK 🔒
**Column count:** 5 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated** (via 05j_format_market_map). |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated** (via 06c_revenue_stream_format_map). |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → opex_profile_set_master.set_id. Which OpEx profile is assigned. |
| 5 | `priority_rank` | INTEGER | assignment | NOT NULL | 1 | Lower = primary profile. Tiebreaker per Rule 20. |

**Business rules:**
- BR-100-07a: Composite key (format_id, revenue_stream_id, market_id, set_id) UNIQUE per scenario.
- BR-100-07b: 05j gate: format_id × market_id must exist in 05j_format_market_map.
- BR-100-07c: 06c gate: format_id × revenue_stream_id must exist in 06c_revenue_stream_format_map.
- BR-100-07d: priority_rank UNIQUE within (format_id, revenue_stream_id, market_id) per scenario. No two sets share the same rank for the same context.
- BR-100-07e: Follows identical gating pattern as S80-07 and S90-07.

---

### 6.6 S100-03 `opex_decisions`

**Purpose:** Human overrides at the context × line_item level. Applied after profile resolution in Step 12.
**Grain:** format × revenue_stream × market × opex_line_item_id
**Phase 16 Lock ID:** PHASE16-T03-S100-LOCK 🔒
**Column count:** 12 (excl. 6 system fields) — 4 keys + 8 decisions

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `opex_line_item_id` | FK (INTEGER) | key | NOT NULL | — | FK → 13_opex_line_items_master. |
| | | | **— OVERRIDES —** | | | |
| 5 | `budget_override_inr` | DECIMAL(12,2) | decision | NULLABLE | NULL | Human override of total monthly OpEx for this line item. NULL = use computed value. If NOT NULL, replaces entire computation (Step 12). |
| 6 | `escalation_override_pct` | DECIMAL(5,2) | decision | NULLABLE | NULL | Human override of annual escalation rate. NULL = use set_item value. |
| 7 | `opex_start_date_override` | DATE | decision | NULLABLE | NULL | Human override of expense start date. NULL = use set_item value. |
| 8 | `opex_end_date_override` | DATE | decision | NULLABLE | NULL | Human override of expense end date. NULL = use set_item value. |
| 9 | `cost_driver_mode_override` | VARCHAR | decision | NULLABLE | NULL | Human override of cost driver mode. NULL = use set_item value. Dropdown: fixed / variable / semi_variable / resource_linked / headcount_linked / step_function. |
| 10 | `allocation_override_pct` | DECIMAL(5,2) | decision | NULLABLE | NULL | Human override of shared allocation percentage. NULL = use set_item value. |
| 11 | `budget_approved_flag` | BOOLEAN | decision | NOT NULL | false | Human decision: approve this expense budget. S300 tracks approval coverage. |
| 12 | `decision_notes` | TEXT | decision | NULLABLE | NULL | Free-form notes explaining override rationale. **Required when budget_override_inr IS NOT NULL** (soft validation — application warns, doesn't block). |

**Business rules:**
- BR-100-03a: Composite key (format_id, revenue_stream_id, market_id, opex_line_item_id) UNIQUE per scenario.
- BR-100-03b: Rows are OPTIONAL. Only created when human intervention is needed. No row = no override = use computed values from profile.
- BR-100-03c: budget_override_inr replaces the ENTIRE computation output for this line item. All other overrides are field-level.
- BR-100-03d: cost_driver_mode_override changes HOW the engine computes — may require corresponding assumption fields to be meaningful (e.g., switching to 'resource_linked' requires linked_capacity_unit_id in set_item).

---

### 6.7 S100-04 `opex_outputs`

**Purpose:** Computed OpEx results. Single source of operating cost for S200 EBITDA. Consumed by S200 (fixed_opex_inr), S10, S300.
**Grain:** format × revenue_stream × market × opex_line_item_id
**Phase 16 Lock ID:** PHASE16-T04-S100-LOCK 🔒
**Column count:** 31 (excl. 6 system fields) — 4 keys + 27 outputs

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `opex_line_item_id` | FK (INTEGER) | key | NOT NULL | — | FK → 13_opex_line_items_master |
| | | | **— RESOLVED PARAMETERS —** | | | |
| 5 | `resolved_cost_driver_mode` | VARCHAR | output | NOT NULL | — | Final cost driver (from set_item or decision override). |
| 6 | `resolved_fixed_monthly_inr` | DECIMAL(12,2) | output | NOT NULL | — | Final fixed component (from set_item or decision). |
| 7 | `resolved_variable_per_order_inr` | DECIMAL(8,2) | output | NOT NULL | — | Final variable rate (from set_item or decision). |
| | | | **— UPSTREAM LINK VALUES —** | | | |
| 8 | `projected_demand_orders_per_day` | DECIMAL(10,1) | output | NOT NULL | — | From S60 (Step 1). SUM across channels. |
| 9 | `projected_demand_orders_per_month` | DECIMAL(12,1) | output | NOT NULL | — | = orders_per_day × days_in_period. |
| 10 | `linked_resource_count` | INTEGER | output | NULLABLE | NULL | From S80 (Step 2). NULL if cost_driver ≠ resource_linked. |
| 11 | `linked_operating_hours` | DECIMAL(4,1) | output | NULLABLE | NULL | From S80 (Step 2). NULL if not resource_linked. |
| 12 | `linked_headcount` | INTEGER | output | NULLABLE | NULL | From S90 (Step 3). NULL if cost_driver ≠ headcount_linked. |
| | | | **— COST COMPONENTS —** | | | |
| 13 | `computed_fixed_component_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 4 result. |
| 14 | `computed_variable_component_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 5 result. |
| 15 | `computed_resource_linked_component_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 6 result. 0 if not resource_linked. |
| 16 | `computed_headcount_linked_component_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 7 result. 0 if not headcount_linked. |
| 17 | `computed_step_component_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 8 result. 0 if no step function. |
| 18 | `pre_allocation_monthly_opex_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 9 result. SUM of all applicable components before shared allocation. |
| | | | **— SHARED ALLOCATION —** | | | |
| 19 | `resolved_shared_opex_allocation_pct` | DECIMAL(5,2) | output | NOT NULL | — | Effective allocation %. 100 if not shared. From set_item or decision override. |
| 20 | `allocated_monthly_opex_inr` | DECIMAL(12,2) | output | NOT NULL | — | Step 10 result. = pre_allocation × (allocation_pct / 100). |
| | | | **— FINAL PROJECTIONS —** | | | |
| 21 | `projected_monthly_opex_inr` | DECIMAL(12,2) | output | NOT NULL | — | **PRIMARY OUTPUT.** Final monthly OpEx after allocation, escalation, overrides. Feeds S200 EBITDA. |
| 22 | `projected_annual_opex_inr` | DECIMAL(14,2) | output | NOT NULL | — | Step 11 result. 12-month projection with escalation. |
| 23 | `opex_per_order_inr` | DECIMAL(8,2) | output | NULLABLE | NULL | = projected_monthly / monthly_orders. **NULL if orders = 0** (divide-by-zero guard). |
| 24 | `escalation_applied_pct` | DECIMAL(5,2) | output | NOT NULL | — | Effective escalation rate (from set_item or override). |
| | | | **— BUDGET GOVERNANCE —** | | | |
| 25 | `budget_variance_inr` | DECIMAL(12,2) | output | NULLABLE | NULL | = override − computed. NULL if no override. |
| 26 | `budget_variance_pct` | DECIMAL(7,2) | output | NULLABLE | NULL | = variance / computed × 100. NULL if no override. G-OX-01 fires if ABS > 20. |
| 27 | `budget_approved_flag` | BOOLEAN | output | NOT NULL | false | From S100-03 decisions. |
| | | | **— LIFECYCLE & STATUS —** | | | |
| 28 | `opex_start_date` | DATE | output | NOT NULL | — | Resolved start date (set_item or override). |
| 29 | `opex_end_date` | DATE | output | NULLABLE | NULL | Resolved end date. NULL = indefinite. |
| 30 | `market_pause_status` | VARCHAR | output | NOT NULL | 'active' | active / paused / exited. From DI-61 algorithm. When paused: variable/linked → 0, fixed continues. |
| | | | **— SET REFERENCE —** | | | |
| 31 | `set_id_used` | FK (INTEGER) | output | NOT NULL | — | FK → opex_profile_set_master. Which profile was resolved for this context. |

**Business rules:**
- BR-100-04a: Composite key (format_id, revenue_stream_id, market_id, opex_line_item_id) UNIQUE per scenario per period.
- BR-100-04b: If market_pause_status = 'paused': variable, resource-linked, headcount-linked, step components = 0. Fixed component continues. (Same precedent as S90: pause ≠ cost stop for fixed obligations.)
- BR-100-04c: projected_monthly_opex_inr is the PRIMARY S200 feed. S200 aggregation: SUM(projected_monthly_opex_inr) across opex_line_items per format×stream×market → then SUM across streams per Rule 18.
- BR-100-04d: opex_per_order_inr uses NULL guard for zero-order contexts (e.g., pre-launch or paused markets).
- BR-100-04e: budget_variance fields only populated when S100-03 budget_override_inr IS NOT NULL for this row.
- BR-100-04f: **D16-04:** `opex_intensity_index` REMOVED. Per D15-09 precedent. If governance needs intensity metric, S300 derives from S200 outputs.

---

## 7. Column Count Summary

| Table | ID | Columns (excl. 6 system) | Keys | Domain | Pattern #25 |
|---|---|---|---|---|---|
| opex_inputs | S100-01 | 9 | 3 | 5 | 1 |
| opex_research | S100-01b | 14 | 3 | 11 | — |
| opex_profile_set_master | S100-05 | 9 | 1 | 6 | 2 |
| opex_profile_set_items | S100-06 | 24 | 2 | 19 | 3 |
| opex_profile_set_assignment | S100-07 | 5 | 4 | 1 | — |
| opex_decisions | S100-03 | 12 | 4 | 8 | — |
| opex_outputs | S100-04 | 31 | 4 | 27 | — |
| **TOTAL** | **7 tables** | **104** | **21** | **77** | **6** |

**Net vs v3 stub:** +3 tables, +~74 columns. Absorbed: ~~S100-02 opex_assumptions~~ → set_items.

---

## 8. DI Impact Summary (Post-S100 Spec)

| DI | Status | Notes |
|---|---|---|
| DI-31 (S100) | ✅ APPLIED | 05j + 06c dual gate on inputs, assignment, decisions. |
| DI-47 (S100) | ✅ APPLIED | Pattern #19 ADOPTED. |
| DI-52 (S100) | ✅ APPLIED | opex_research table added (Pattern #22). |
| DI-58 (S100) | ✅ APPLIED | Pattern #25 on set_items + set_master. auto_populate_research_flag on inputs. |
| DI-59 | ✅ CLOSED | revenue_stream_id added to S100 grain. shared_opex pattern applied. |
| B-08 | ✅ CLOSED | opex_intensity_index REMOVED from outputs. |

---

## 9. Ownership Registry Update

| Concern | Owner Section | Consumers |
|---|---|---|
| OpEx cost per line item (resolved) | **S100 OpEx** | S200 EBITDA (fixed_opex_inr), S200 Cash Flow (opex outflow) |
| OpEx profile sets (Pattern #19) | **S100 OpEx** | Via assignment to format × stream × market contexts |
| OpEx per order metric | **S100 OpEx** | S300 (governance — cost efficiency), S10 (feasibility rollup) |
| OpEx budget approval | **S100 OpEx** | S300 (governance — approval tracking) |
| OpEx shared allocation | **S100 OpEx** | S300 (governance — validates sum = 100%) |

---

*End of S100 OpEx Full Spec v1 — Phase 16, Session 16b*
*7 tables, 104 columns (excl. system fields), 12 computation steps, 8 governance warnings*


================================================================================
<!-- MODULE: fpe_s110_capex_strategy_spec_v1.md -->
================================================================================

# FPE S110 — Capital Expenses Strategy — Full Spec v1

<!-- FPE MODULAR SCHEMA — v4.5.11 (Phase 16) -->
<!-- File: 12_S110_capex.md -->
<!-- Description: S110 CapEx Strategy — 7 tables, ~101 cols (Phase 16, Pattern #19 ADOPTED) -->
<!-- Supersedes: v4.5.10a S110 stub (4 tables, ~30 cols) -->
<!-- Date: 2026-04-11 -->
<!-- Session: Phase 16, Session 16c -->
<!-- Decisions: D16-02 (grain + explosion), D16-03 (Pattern #19 YES), D16-04 (remove intensity index) -->

# ═══════════════════════════════════════
# S110 — CAPITAL EXPENSES STRATEGY (v4.5.11: Phase 16 — Pattern #19 ADOPTED)
# ═══════════════════════════════════════

**Phase 16 upgrade:** v3 stub (4 tables, ~30 columns) → v4.5.11 full spec (7 tables, 101 columns).
**Pattern #19 ADOPTED** (Set + Context Set + Assignment). **Pattern #22** (AI Research Layer). **Pattern #25** (Research-First Defaults).
**Grain:** format × revenue_stream × market (section). format × revenue_stream × market × capex_asset_id (decisions/outputs).
**Gates:** Dual — 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format).
**Rule 23 classification:** Contributor — if excluded, depreciation zeroed + S300 warning. Does NOT block S200.
**Decisions locked (Phase 16):** D16-02 (grain + shared_capex + 10b explosion), D16-03 (Pattern #19 YES), D16-04 (remove intensity indices).
**DI resolutions:** DI-31 (S110) ✅, DI-47 (S110) ✅, DI-52 (S110) ✅, DI-58 (S110) ✅, DI-60 ✅ CLOSED.
**Absorbed:** ~~S110-02 `capex_assumptions`~~ → absorbed into `capex_profile_set_items` (Pattern #19).
**PRIMARY S200 FEEDS:**
  - `monthly_depreciation_inr` → S200 Net Profit (depreciation line)
  - `resolved_total_capex_inr` → S200 Cash Flow (CapEx cash outflow, one-time)
  - `financing_eligible_flag` → S120 Capital (flags CapEx eligible for equipment financing)

---

## 1. Upstream → S110

| Source | Field(s) Consumed | Purpose |
|---|---|---|
| **S80 capacity_outputs** | `expansion_trigger_reached_flag` | Whether expansion is needed — triggers S80→S110 explosion. |
| **S80 capacity_outputs** | `recommended_expansion_mode` | asset_add / asset_upgrade / unit_replicate — determines explosion logic. |
| **S80 capacity_outputs** | `recommended_expansion_quantity` | How many capacity units to expand. |
| **S80 capacity_outputs** | `expansion_exhausted_flag` | Whether unit-level replication is required. |
| **S80 capacity_outputs** | `capacity_unit_id` | Which resource triggered expansion — FK target for 10b lookup. |
| **S80 capacity_outputs** | `market_pause_status` | Pause state — governs expansion CapEx flagging. |
| S00 10b_capacity_unit_asset_map | `capex_asset_id`, `default_quantity_per_unit`, `is_primary_asset` | Asset composition of a capacity unit. The explosion bridge. |
| S00 11_capacity_assets_master | `default_unit_cost_inr`, `useful_life_months`, `depreciation_method`, `asset_category` | Asset cost/depreciation defaults. |
| S00 05j_format_market_map | active pairs | Format×market gate (DI-31). |
| S00 06c_revenue_stream_format_map | active pairs | Format×stream gate (D16-02). |
| S10 format_assumptions | pause state | Market pause derivation source (DI-61). |

## 2. S110 → Downstream

| Consumer | Field(s) Consumed | Purpose |
|---|---|---|
| **S200 Net Profit** | `allocated_monthly_depreciation_inr` | Depreciation expense line. SUM across assets per format×stream×market, then SUM across streams (Rule 18). |
| **S200 Cash Flow** | `allocated_total_capex_inr` | CapEx cash outflow (one-time at capex_date). |
| **S120 Capital** | `financing_eligible_flag`, `allocated_total_capex_inr` | Asset-backed financing eligibility. S120 calculates funding need from S110 totals. |
| S10 format_outputs | Aggregated CapEx rollup | Capital intensity indicator. |
| S300 Governance | Expansion triggers, approval, depreciation, shared allocation, useful life | Warnings G-CX-01 through G-CX-08. |

## 3. Key Concepts

| Concept | Description |
|---|---|
| **S80→S110 explosion** (D16-02) | When S80 flags expansion, S110 explodes capacity_unit → individual assets via `10b_capacity_unit_asset_map`. 1 oven capacity_unit = commercial oven + gas line + exhaust hood. Each asset gets its own S110 row with quantity, cost, depreciation. |
| **Dual CapEx sources** | (1) **Profile-based:** Initial setup assets from assigned capex_profile_set. (2) **Expansion-triggered:** Auto-generated from S80 expansion recommendations. Both merge into unified output. |
| **capex_trigger_source** | `initial_setup` (from profile) / `expansion` (from S80 trigger) / `replacement` (end-of-life swap) / `upgrade` (S80 asset_upgrade mode). Tags every CapEx row with WHY this spend occurs. |
| **Shared CapEx** (D16-02) | `shared_capex_flag` + `shared_capex_allocation_pct`. Facility-level assets (HVAC, fire suppression) shared across streams. Mirrors S80/S90/S100 shared pattern. |
| **Depreciation** | SLM (straight-line) or WDV (written-down value). Method + useful_life from `11_capacity_assets_master`, overridable in set_items. `monthly_depreciation = (total_capex × (1 − salvage_pct)) ÷ useful_life_months`. |
| **Pause semantics** | CapEx is SUNK once committed. Depreciation CONTINUES during pause (accounting requirement). NEW expansion CapEx during pause → FLAGGED (G-CX warning) but not blocked. Fundamentally different from S100 OpEx pause (variable→0). |
| **Financing bridge to S120** | `financing_eligible_flag` tags assets suitable for equipment financing, working capital debt, or lease arrangements. S120 consumes this to calculate funding need. |

---

## 4. S80→S110 Explosion Algorithm (D16-02)

This is the core architectural innovation for S110. When S80 capacity strategy recommends expansion, the system automatically generates S110 CapEx rows.

```
ALGORITHM: S80_expansion_to_S110_capex

TRIGGER: S80-04.expansion_trigger_reached_flag = TRUE for any capacity_unit

INPUT:
  S80-04 capacity_outputs (expansion rows)
  S00 10b_capacity_unit_asset_map
  S00 11_capacity_assets_master

FOR EACH expansion_row IN S80-04 WHERE expansion_trigger_reached_flag = TRUE:

  capacity_unit  = expansion_row.capacity_unit_id
  exp_mode       = expansion_row.recommended_expansion_mode
  exp_qty        = expansion_row.recommended_expansion_quantity
  format_id      = expansion_row.format_id
  stream_id      = expansion_row.revenue_stream_id
  market_id      = expansion_row.market_id
  exhausted      = expansion_row.expansion_exhausted_flag

  -- Determine which assets to generate
  CASE exp_mode:

    WHEN 'unit_replicate':
      -- Full facility replication: ALL assets for this capacity_unit
      FOR EACH mapping IN 10b WHERE capacity_unit_id = capacity_unit:
        EMIT S110 expansion row:
          capex_asset_id           = mapping.capex_asset_id
          quantity                 = exp_qty × mapping.default_quantity_per_unit
          unit_cost_inr            = 11_master.default_unit_cost_inr
          installation_cost_inr    = 11_master.default_installation_cost_inr × exp_qty
          capex_trigger_source     = 'expansion'
          source_expansion_mode    = 'unit_replicate'
          source_capacity_unit_id  = capacity_unit
          -- Inherit shared status from existing profile item if present

    WHEN 'asset_add':
      -- Add more units of existing assets
      FOR EACH mapping IN 10b WHERE capacity_unit_id = capacity_unit:
        EMIT S110 expansion row:
          capex_asset_id           = mapping.capex_asset_id
          quantity                 = exp_qty × mapping.default_quantity_per_unit
          unit_cost_inr            = 11_master.default_unit_cost_inr
          installation_cost_inr    = 11_master.default_installation_cost_inr × exp_qty
          capex_trigger_source     = 'expansion'
          source_expansion_mode    = 'asset_add'
          source_capacity_unit_id  = capacity_unit

    WHEN 'asset_upgrade':
      -- Replace with higher-capacity version — only PRIMARY asset
      FOR EACH mapping IN 10b WHERE capacity_unit_id = capacity_unit
                                AND mapping.is_primary_asset = TRUE:
        upgrade_cost = COALESCE(11_master.upgrade_cost_inr,
                               11_master.default_unit_cost_inr × 1.5)
        EMIT S110 expansion row:
          capex_asset_id           = mapping.capex_asset_id
          quantity                 = exp_qty  -- Replace, not add
          unit_cost_inr            = upgrade_cost
          installation_cost_inr    = 11_master.default_installation_cost_inr
          capex_trigger_source     = 'upgrade'
          source_expansion_mode    = 'asset_upgrade'
          source_capacity_unit_id  = capacity_unit

  -- If exhausted AND exp_mode ≠ 'unit_replicate':
  --   WARN G-CX-04: "Expansion exhausted at asset level. Consider unit_replicate."

OUTPUT:
  Expansion-triggered rows are MERGED with profile-based rows in S110-04 outputs.
  Human reviews all expansion rows via S110-03 capex_decisions.
  capex_approved_flag defaults to FALSE for expansion rows — requires explicit approval.
```

### Merge Logic: Profile + Expansion

```
UNIFIED S110 OUTPUT =
  UNION:
    (a) Profile-based rows:  resolved from S110-07 assignment → S110-06 set_items
                             capex_trigger_source = 'initial_setup'
    (b) Expansion rows:      generated by S80→S110 explosion algorithm
                             capex_trigger_source ∈ {'expansion', 'upgrade'}
    (c) Replacement rows:    generated when existing asset's useful_life expires
                             capex_trigger_source = 'replacement'

  DEDUPLICATION:
    If expansion generates an asset that ALREADY exists in the profile for this context:
      → INCREMENT quantity on the existing row (not duplicate)
      → Flag as 'expansion_augmented' in source notes
```

---

## 5. Computation Algorithms (11)

### Step 0: CapEx Profile Resolution

```
Resolution: S110-07 capex_profile_set_assignment
  → match on (format_id, revenue_stream_id, market_id)
  → select set with lowest priority_rank
  → if no assignment found, ERROR: no CapEx profile for this context
  → resolved set provides INITIAL SETUP assets (capex_trigger_source = 'initial_setup')
```

### Step 1: S80 Expansion Ingestion

```
Pull all S80-04 rows WHERE expansion_trigger_reached_flag = TRUE.
Execute S80→S110 explosion algorithm (Section 4 above).
Output: list of expansion-triggered capex rows with quantities, costs, source references.
```

### Step 2: Merge Profile + Expansion

```
unified_capex_list = profile_items UNION expansion_items UNION replacement_items
-- Deduplication: if same (format, stream, market, capex_asset_id) appears in both:
--   combined_quantity = profile_quantity + expansion_quantity
--   capex_trigger_source = 'initial_setup' (original) + note expansion augmentation
```

### Step 3: Quantity Resolution

```
resolved_quantity = COALESCE(
  S110-03.quantity_override,      -- Human override (highest priority)
  unified_capex_list.quantity      -- Profile or expansion quantity
)
```

### Step 4: Total CapEx Computation

```
resolved_unit_cost_inr = COALESCE(S110-03.unit_cost_override_inr, set_item.unit_cost_inr)
resolved_installation_cost_inr = set_item.installation_cost_inr  -- No override (one-time, fixed)
resolved_total_capex_inr = (resolved_quantity × resolved_unit_cost_inr) + resolved_installation_cost_inr
```

### Step 5: Shared Allocation

```
IF shared_capex_flag = TRUE:
  allocated_total_capex_inr = resolved_total_capex_inr × (shared_capex_allocation_pct / 100)
ELSE:
  allocated_total_capex_inr = resolved_total_capex_inr  -- 100% to this stream

-- S300 validates: SUM(shared_capex_allocation_pct) across streams = 100% per (format, market, asset)
```

### Step 6: Depreciation Computation

```
useful_life = COALESCE(set_item.useful_life_months_override, 11_master.useful_life_months)
dep_method  = COALESCE(set_item.depreciation_method_override, 11_master.depreciation_method)
salvage_pct = set_item.salvage_value_pct

depreciable_amount = allocated_total_capex_inr × (1 - salvage_pct / 100)
salvage_value_inr  = allocated_total_capex_inr × (salvage_pct / 100)

CASE dep_method:
  WHEN 'SLM' (Straight-Line):
    monthly_depreciation_inr = depreciable_amount / useful_life
    annual_depreciation_inr  = monthly_depreciation_inr × 12
    -- Constant monthly charge for useful_life months, then 0.

  WHEN 'WDV' (Written-Down Value):
    annual_rate = 1 - (salvage_pct / 100) ^ (1 / (useful_life / 12))
    -- WDV: higher depreciation early, declining over time.
    -- Month M: depreciation = (remaining_book_value × annual_rate) / 12
    -- For output: use Month 1 value as monthly_depreciation_inr (initial rate).
    monthly_depreciation_inr = (depreciable_amount × annual_rate) / 12

-- allocated_monthly_depreciation_inr = monthly_depreciation_inr (post-allocation)
```

### Step 7: Net Book Value Tracking

```
-- For a given period P (months since capex_date):
accumulated_depreciation_inr = monthly_depreciation_inr × MIN(P, useful_life)
net_book_value_inr = allocated_total_capex_inr - accumulated_depreciation_inr

-- Guard: net_book_value_inr >= salvage_value_inr (floor at salvage)
IF net_book_value_inr < salvage_value_inr:
  net_book_value_inr = salvage_value_inr
  monthly_depreciation_inr = 0  -- Fully depreciated to salvage
```

### Step 8: Decision Overrides

```
IF S110-03.quantity_override IS NOT NULL: resolved_quantity = override (applied in Step 3)
IF S110-03.unit_cost_override_inr IS NOT NULL: resolved_unit_cost = override (applied in Step 4)
IF S110-03.capex_date_override IS NOT NULL: capex_date = override
IF S110-03.decommission_date_override IS NOT NULL: decommission_date = override
IF S110-03.allocation_override_pct IS NOT NULL: shared_capex_allocation_pct = override

-- Budget variance:
IF any override applied:
  budget_variance_inr = resolved_total_capex_inr(post-override) - resolved_total_capex_inr(pre-override)
  budget_variance_pct = variance / pre-override × 100
  IF ABS(budget_variance_pct) > 20: WARN G-CX-01
```

### Step 9: Market Pause Handling

```
market_pause_status = derived from S80 (DI-61 algorithm)

IF market_pause_status = 'paused':
  -- EXISTING CapEx: depreciation CONTINUES (sunk cost, accounting requirement)
  -- NEW expansion CapEx: FLAGGED with G-CX warning but NOT blocked
  --   (Human must explicitly approve via capex_approved_flag)
  IF capex_trigger_source = 'expansion' AND market_pause_status = 'paused':
    WARN G-CX-09: "Expansion CapEx generated for paused market. Requires explicit approval."
    capex_approved_flag = FALSE (force human review)
```

### Step 10: Replacement Trigger Check

```
FOR EACH existing asset in S110-04:
  IF current_period.end_date > (capex_date + useful_life_months):
    -- Asset is fully depreciated. Check if replacement needed.
    IF decommission_date IS NULL:  -- Still in service
      WARN G-CX-05: "Asset useful life expired. Replacement CapEx may be required."
      -- Auto-generate replacement row with capex_trigger_source = 'replacement'
      -- Uses same asset profile but current-period costs from 11_master
```

### Step 11: Monthly Rollup

```
-- Audit C-09 compliance:
days_in_period from 14_periods_master. Pre-S200 default = 30.0.
-- CapEx is a point-in-time event (at capex_date), not daily.
-- Depreciation is monthly: monthly_depreciation_inr per period.
-- S200 Cash Flow: total_capex_inr as lump sum in the period containing capex_date.
```

---

## 6. S300 Governance Warnings

| Code | Trigger | Severity | Description |
|---|---|---|---|
| **G-CX-01** | `ABS(budget_variance_pct) > 20` | ⚠️ WARNING | CapEx override deviates >20% from computed value. Requires decision_notes justification. |
| **G-CX-02** | `SUM(allocated_total_capex_inr) per format×market > benchmark` | ⚠️ WARNING | Total CapEx per outlet exceeds format-level benchmark. Investigate cost efficiency. |
| **G-CX-03** | `SUM(shared_capex_allocation_pct) ≠ 100` across streams for shared asset | 🔴 ERROR | Shared allocation must sum to 100%. Blocks computation until fixed. |
| **G-CX-04** | S80 expansion triggered but no matching asset in 10b for capacity_unit | 🔴 ERROR | Missing 10b_capacity_unit_asset_map entry. Cannot explode S80→S110. |
| **G-CX-05** | `current_period > capex_date + useful_life_months` AND decommission_date IS NULL | ⚠️ WARNING | Asset fully depreciated but still in service. Replacement CapEx may be needed. |
| **G-CX-06** | `decommission_date < capex_date + useful_life_months` | ℹ️ INFO | Early decommission — write-off the remaining net book value. |
| **G-CX-07** | `capex_date < current_date` | ℹ️ INFO | Backdated CapEx entry. May be historical record or data entry issue. |
| **G-CX-08** | `SUM(allocated_total_capex WHERE financing_eligible) / SUM(allocated_total_capex) > 0.50` | ⚠️ WARNING | >50% of CapEx flagged as financing-eligible. High leverage dependency — review with S120. |
| **G-CX-09** | Expansion CapEx generated for paused market | ⚠️ WARNING | S80 triggered expansion but market is paused. Requires explicit approval to proceed. |

---

## 7. TABLE SPECIFICATIONS

### 7.1 S110-01 `capex_inputs`

**Purpose:** Section-level evaluation controls for capital expenses strategy.
**Grain:** format × revenue_stream × market
**Gates:** 05j_format_market_map (format×market) + 06c_revenue_stream_format_map (stream×format)
**Phase 16 Lock ID:** PHASE16-T01-S110-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** (D16-02: added for stream-level CapEx.) |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `evaluation_scope_level` | VARCHAR | input | NOT NULL | 'directional' | directional / structured / validated / audited. Metadata only. See Rule 24. |
| 5 | `planning_horizon_months` | INTEGER | input | NULLABLE | NULL | NULL = global default from 14_periods_master. See Rule 24. |
| 6 | `include_in_evaluation_flag` | BOOLEAN | input | NOT NULL | true | Rule 23 cascade. Contributor: zero depreciation + WARN if false. |
| 7 | `manual_review_required_flag` | BOOLEAN | input | NOT NULL | false | Auto-set true if scope = 'directional'. |
| 8 | `notes` | TEXT | input | NULLABLE | NULL | Free-form. |
| 9 | `auto_populate_research_flag` | BOOLEAN | input | NOT NULL | true | **Pattern #25 (D-CROSS-01).** When true, research completion auto-populates capex_profile_set_items. |

**Business rules:**
- BR-110-01a: Composite key (format_id, revenue_stream_id, market_id) UNIQUE per scenario.
- BR-110-01b: format_id × market_id MUST exist in 05j_format_market_map (DI-31).
- BR-110-01c: format_id × revenue_stream_id MUST exist in 06c_revenue_stream_format_map (D16-02).
- BR-110-01d: If evaluation_scope_level = 'directional', manual_review_required_flag auto-set to true.
- BR-110-01e: Structurally identical to S80-01, S90-01, S100-01.

---

### 7.2 S110-01b `capex_research`

**Purpose:** AI research intelligence layer for CapEx benchmarks — equipment costs, installation rates, useful life data, market-specific pricing.
**Grain:** format × revenue_stream × market
**Pattern:** #22 (AI Research Layer)
**Phase 16 Lock ID:** PHASE16-T01B-S110-LOCK 🔒
**Column count:** 14 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `research_run_id` | INTEGER | system | NOT NULL | auto | Shared sequence across ALL _research tables. |
| 5 | `research_mode` | VARCHAR | research | NOT NULL | 'ai_auto' | manual / ai_assisted / ai_auto / hybrid |
| 6 | `research_prompt` | TEXT | research | NULLABLE | NULL | E.g., "Commercial pizza oven prices India 2026, conveyor oven vs deck oven cost comparison, cloud kitchen setup cost Mumbai" |
| 7 | `research_status` | VARCHAR | research | NOT NULL | 'pending' | pending / in_progress / completed / stale / failed |
| 8 | `research_completed_at` | TIMESTAMP | research | NULLABLE | NULL | When AI research last completed. |
| 9 | `research_confidence` | DECIMAL(3,2) | research | NULLABLE | NULL | Overall AI confidence (0.00–1.00). |
| 10 | `research_summary` | TEXT | research | NULLABLE | NULL | AI-generated brief. |
| 11 | `source_references` | TEXT | research | NULLABLE | NULL | Citations. |
| 12 | `fields_covered` | TEXT | research | NULLABLE | NULL | E.g., "unit_cost_inr,installation_cost_inr,useful_life_months_override" |
| 13 | `stale_after_days` | INTEGER | research | NOT NULL | 90 | Days until stale. |
| 14 | `auto_refresh_enabled_flag` | BOOLEAN | research | NOT NULL | false | Auto re-run when stale. |

**Business rules:**
- BR-110-01b-a: Standard Pattern #22 template. Identical to S80-01b, S90-01b, S100-01b.
- BR-110-01b-b: research_run_id FK target by capex_profile_set_items.source_research_run_id.
- BR-110-01b-c: On completion + auto_populate = true → Pattern #25 pipeline.

---

### 7.3 S110-05 `capex_profile_set_master`

**Purpose:** Named, reusable CapEx profiles. Each profile defines a complete asset configuration for setting up or expanding a format×stream type.
**Grain:** set-level (no FK keys)
**Patterns:** #19 + #25
**Phase 16 Lock ID:** PHASE16-T05-S110-LOCK 🔒
**Column count:** 9 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `set_id` | PK (INTEGER) | key | NOT NULL | auto | Auto-generated primary key. |
| 2 | `set_code` | VARCHAR | master | NOT NULL | — | UNIQUE. E.g., `CX_STD_CK_DELIVERY`. |
| 3 | `set_name` | VARCHAR | master | NOT NULL | — | UNIQUE. E.g., "Standard Cloud Kitchen — Delivery Setup". |
| 4 | `set_description` | TEXT | master | NULLABLE | NULL | Detailed description of asset composition. |
| 5 | `lifecycle_stage` | VARCHAR | master | NOT NULL | 'launch' | launch / growth / mature / decline. |
| 6 | `capex_category` | VARCHAR | master | NOT NULL | 'initial_setup' | Primary purpose: `initial_setup` / `expansion` / `replacement` / `mixed`. For display/filtering — individual items carry their own capex_trigger_source. |
| 7 | `sort_order` | INTEGER | master | NULLABLE | NULL | Display/processing order. |
| 8 | `research_populated_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** |
| 9 | `auto_created_flag` | BOOLEAN | master | NOT NULL | false | **Pattern #25.** |

**Business rules:**
- BR-110-05a: set_code and set_name UNIQUE within S110. CX_ prefix convention (Audit C-06).
- BR-110-05b: auto_created_flag = true → research_populated_flag = true.
- BR-110-05c: lifecycle_stage = 'decline' triggers S300 review.

**Example sets (ILLUSTRATIVE ONLY):**

| set_code | set_name | lifecycle_stage | capex_category |
|---|---|---|---|
| `CX_STD_CK_DELIVERY` | Standard Cloud Kitchen — Delivery Setup | growth | initial_setup |
| `CX_STD_CK_DINEIN` | Standard Cloud Kitchen — Dine-in Setup | launch | initial_setup |
| `CX_HUB_DELIVERY` | Hub Kitchen — High Volume Setup | mature | initial_setup |
| `CX_SPOKE_DELIVERY` | Spoke Kitchen — Satellite Setup | launch | initial_setup |
| `CX_MOBILE_BAKE` | Mobile Baking Unit Setup | launch | initial_setup |
| `CX_EXPANSION_CK` | Cloud Kitchen Expansion Kit | growth | expansion |

---

### 7.4 S110-06 `capex_profile_set_items`

**Purpose:** Per-asset CapEx parameters within a profile. Absorbs old capex_assumptions. Each row = one asset type within the profile.
**Grain:** set_id × item_sequence
**Patterns:** #19 + #25
**Phase 16 Lock ID:** PHASE16-T06-S110-LOCK 🔒
**Column count:** 21 (excl. 6 system fields) — 18 domain + 3 Pattern #25

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → capex_profile_set_master.set_id |
| 2 | `item_sequence` | INTEGER | key | NOT NULL | — | Order within set. Lower = core asset (ovens before accessories). |
| | | | **— ASSET IDENTITY —** | | | |
| 3 | `capex_asset_id` | FK (INTEGER) | set_item | NOT NULL | — | FK → 11_capacity_assets_master. Which asset. |
| | | | **— CAPEX SOURCE —** | | | |
| 4 | `capex_trigger_source` | VARCHAR | set_item | NOT NULL | 'initial_setup' | `initial_setup` / `expansion` / `replacement` / `upgrade`. Tags WHY this asset is in the profile. |
| | | | **— QUANTITY & COST —** | | | |
| 5 | `quantity` | INTEGER | set_item | NOT NULL | 1 | Number of units of this asset. |
| 6 | `unit_cost_inr` | DECIMAL(12,2) | set_item | NOT NULL | — | Cost per unit in ₹. Overrides 11_master.default_unit_cost_inr if set. |
| 7 | `installation_cost_inr` | DECIMAL(10,2) | set_item | NOT NULL | 0.00 | One-time installation/setup cost in ₹. Total (not per-unit). |
| | | | **— SALVAGE & DEPRECIATION —** | | | |
| 8 | `salvage_value_pct` | DECIMAL(5,2) | set_item | NOT NULL | 5.00 | Expected salvage value as % of original cost at end of useful life. |
| 9 | `useful_life_months_override` | INTEGER | set_item | NULLABLE | NULL | Override of 11_master.useful_life_months. NULL = use master default. |
| 10 | `depreciation_method_override` | VARCHAR | set_item | NULLABLE | NULL | Override of 11_master.depreciation_method. NULL = use master. `SLM` / `WDV`. |
| | | | **— S80 CAPACITY LINK —** | | | |
| 11 | `linked_capacity_unit_id` | FK (INTEGER) | set_item | NULLABLE | NULL | FK → 10_capacity_units_master. Which S80 capacity unit this asset belongs to. Used by S80→S110 explosion. NULL for non-capacity assets (e.g., furniture). |
| 12 | `default_quantity_per_unit` | INTEGER | set_item | NULLABLE | NULL | How many of this asset per capacity unit. From 10b mapping. Used in explosion calculation. NULL if no capacity link. |
| | | | **— PROCUREMENT —** | | | |
| 13 | `procurement_lead_time_days` | INTEGER | set_item | NULLABLE | NULL | Days from order to delivery. Feeds S200 cash flow timing. NULL = immediate. |
| | | | **— FINANCING BRIDGE (→S120) —** | | | |
| 14 | `financing_eligible_flag` | BOOLEAN | set_item | NOT NULL | false | Whether this asset is eligible for equipment financing, leasing, or asset-backed debt. S120 consumes. |
| | | | **— SHARED CAPEX (D16-02) —** | | | |
| 15 | `shared_capex_flag` | BOOLEAN | set_item | NOT NULL | false | **D16-02.** True if this asset serves multiple streams. Facility-level assets (HVAC, fire system, building fit-out). |
| 16 | `shared_capex_allocation_pct` | DECIMAL(5,2) | set_item | NULLABLE | NULL | This stream's %. **Required if shared_capex_flag = true.** S300 validates sum = 100%. |
| | | | **— LIFECYCLE —** | | | |
| 17 | `model_capex_date` | DATE | set_item | NOT NULL | — | Planned purchase/commissioning date. |
| 18 | `model_decommission_date` | DATE | set_item | NULLABLE | NULL | Planned end-of-service. NULL = indefinite (deprecated when fully depreciated). Engine check (C-08): if current_period > decommission_date, depreciation = 0, NBV written off. |
| | | | **— PATTERN #25 —** | | | |
| 19 | `field_source_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → source mapping. E.g., {"unit_cost_inr": "research", "salvage_value_pct": "manual"}. |
| 20 | `research_confidence_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → confidence. |
| 21 | `source_research_run_id` | FK (INTEGER) | Pattern #25 | NULLABLE | NULL | FK → capex_research.research_run_id. |

**Business rules:**
- BR-110-06a: Composite key (set_id, item_sequence) UNIQUE.
- BR-110-06b: capex_asset_id MUST exist in 11_capacity_assets_master.
- BR-110-06c: If linked_capacity_unit_id IS NOT NULL, the asset MUST appear in 10b_capacity_unit_asset_map for that capacity_unit.
- BR-110-06d: If shared_capex_flag = true, shared_capex_allocation_pct is REQUIRED.
- BR-110-06e: Same capex_asset_id MAY appear in multiple sets. UNIQUE within a single set.
- BR-110-06f: financing_eligible_flag = true tags this row for S120 consumption. S120 sums all financing-eligible CapEx to determine funding need.
- BR-110-06g: depreciation_method_override only accepts 'SLM' or 'WDV'. NULL falls through to 11_master.

**Example set_items (ILLUSTRATIVE — for CX_STD_CK_DELIVERY):**

| seq | asset | qty | unit_cost | trigger | shared | alloc | financing |
|---|---|---|---|---|---|---|---|
| 1 | Conveyor Oven | 3 | 4,50,000 | initial_setup | ✅ YES | 55% | ✅ YES |
| 2 | Dough Proofer | 1 | 1,80,000 | initial_setup | ✅ YES | 50% | ✅ YES |
| 3 | Spiral Mixer | 1 | 2,20,000 | initial_setup | ✅ YES | 50% | ✅ YES |
| 4 | Prep Table (SS) | 4 | 35,000 | initial_setup | ✅ YES | 50% | ❌ NO |
| 5 | Exhaust Hood System | 1 | 3,50,000 | initial_setup | ✅ YES | 50% | ✅ YES |
| 6 | Walk-in Cooler | 1 | 2,80,000 | initial_setup | ✅ YES | 50% | ✅ YES |
| 7 | Delivery Bags/Insulated | 20 | 1,500 | initial_setup | ❌ NO | 100% | ❌ NO |
| 8 | POS Terminal | 2 | 25,000 | initial_setup | ✅ YES | 40% | ❌ NO |
| 9 | Fire Suppression | 1 | 1,50,000 | initial_setup | ✅ YES | 50% | ❌ NO |
| 10 | Interior Fit-out | 1 | 8,00,000 | initial_setup | ✅ YES | 50% | ✅ YES |

---

### 7.5 S110-07 `capex_profile_set_assignment`

**Purpose:** Maps CapEx profiles to format × stream × market contexts.
**Grain:** format × revenue_stream × market × set_id
**Pattern:** #19
**Phase 16 Lock ID:** PHASE16-T07-S110-LOCK 🔒
**Column count:** 5 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `set_id` | FK (INTEGER) | key | NOT NULL | — | FK → capex_profile_set_master.set_id. |
| 5 | `priority_rank` | INTEGER | assignment | NOT NULL | 1 | Lower = primary. |

**Business rules:**
- BR-110-07a: Composite key UNIQUE per scenario.
- BR-110-07b: 05j gate (DI-31). 06c gate (D16-02).
- BR-110-07c: priority_rank UNIQUE within (format, stream, market) per scenario.
- BR-110-07d: Structurally identical to S80-07, S90-07, S100-07.

---

### 7.6 S110-03 `capex_decisions`

**Purpose:** Human overrides at the context × asset level. Applied in Step 8.
**Grain:** format × revenue_stream × market × capex_asset_id
**Phase 16 Lock ID:** PHASE16-T03-S110-LOCK 🔒
**Column count:** 12 (excl. 6 system fields) — 4 keys + 8 decisions

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master. **05j gated.** |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master. **06c gated.** |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master. **05j gated.** |
| 4 | `capex_asset_id` | FK (INTEGER) | key | NOT NULL | — | FK → 11_capacity_assets_master. |
| | | | **— OVERRIDES —** | | | |
| 5 | `quantity_override` | INTEGER | decision | NULLABLE | NULL | Human override of asset quantity. NULL = use profile/expansion value. |
| 6 | `unit_cost_override_inr` | DECIMAL(12,2) | decision | NULLABLE | NULL | Human override of unit cost. NULL = use set_item value. |
| 7 | `capex_date_override` | DATE | decision | NULLABLE | NULL | Human override of purchase/commission date. |
| 8 | `decommission_date_override` | DATE | decision | NULLABLE | NULL | Human override of end-of-service date. |
| 9 | `allocation_override_pct` | DECIMAL(5,2) | decision | NULLABLE | NULL | Human override of shared allocation %. |
| 10 | `capex_approved_flag` | BOOLEAN | decision | NOT NULL | false | **Human decision: approve this capital expenditure.** Defaults FALSE — all CapEx requires explicit approval. Expansion-triggered rows especially require review. |
| 11 | `defer_to_period` | VARCHAR | decision | NULLABLE | NULL | If not approved now, defer to which period (e.g., 'Q3-2026'). NULL = no deferral. |
| 12 | `decision_notes` | TEXT | decision | NULLABLE | NULL | Rationale for override or approval/rejection. |

**Business rules:**
- BR-110-03a: Composite key UNIQUE per scenario.
- BR-110-03b: Rows OPTIONAL. No row = no override = use profile values. capex_approved_flag defaults FALSE (conservative — require explicit approval).
- BR-110-03c: For expansion-triggered rows, capex_approved_flag = FALSE until human reviews. Engine computes outputs regardless but S200 only consumes APPROVED CapEx for cash flow. Depreciation starts from capex_date regardless (accounting conservatism).
- BR-110-03d: defer_to_period is informational — S300 tracks deferred CapEx for future planning.

---

### 7.7 S110-04 `capex_outputs`

**Purpose:** Computed CapEx results. Single source of depreciation and capital expenditure for S200. Consumed by S200 Net Profit (depreciation), S200 Cash Flow (CapEx outflow), S120 (financing need), S300 (governance).
**Grain:** format × revenue_stream × market × capex_asset_id
**Phase 16 Lock ID:** PHASE16-T04-S110-LOCK 🔒
**Column count:** 31 (excl. 6 system fields) — 4 keys + 27 outputs

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEYS —** | | | |
| 1 | `format_id` | FK (INTEGER) | key | NOT NULL | — | FK → 05_formats_master |
| 2 | `revenue_stream_id` | FK (INTEGER) | key | NOT NULL | — | FK → 06_revenue_streams_master |
| 3 | `market_id` | FK (INTEGER) | key | NOT NULL | — | FK → 07_markets_master |
| 4 | `capex_asset_id` | FK (INTEGER) | key | NOT NULL | — | FK → 11_capacity_assets_master |
| | | | **— RESOLVED COST —** | | | |
| 5 | `resolved_quantity` | INTEGER | output | NOT NULL | — | Final quantity (profile/expansion or override). |
| 6 | `resolved_unit_cost_inr` | DECIMAL(12,2) | output | NOT NULL | — | Final unit cost (set_item or override). |
| 7 | `resolved_installation_cost_inr` | DECIMAL(10,2) | output | NOT NULL | — | Installation cost. |
| 8 | `resolved_total_capex_inr` | DECIMAL(14,2) | output | NOT NULL | — | = (qty × unit_cost) + installation. Pre-allocation total. |
| | | | **— SHARED ALLOCATION —** | | | |
| 9 | `resolved_shared_capex_allocation_pct` | DECIMAL(5,2) | output | NOT NULL | — | Effective allocation %. 100 if not shared. |
| 10 | `allocated_total_capex_inr` | DECIMAL(14,2) | output | NOT NULL | — | = resolved_total × (alloc_pct / 100). **S200 Cash Flow feed.** |
| | | | **— DEPRECIATION —** | | | |
| 11 | `useful_life_months` | INTEGER | output | NOT NULL | — | Resolved (set_item override or 11_master default). |
| 12 | `depreciation_method` | VARCHAR | output | NOT NULL | — | Resolved: 'SLM' or 'WDV'. |
| 13 | `depreciable_amount_inr` | DECIMAL(14,2) | output | NOT NULL | — | = allocated_total × (1 − salvage_pct / 100). |
| 14 | `monthly_depreciation_inr` | DECIMAL(10,2) | output | NOT NULL | — | SLM: depreciable / useful_life. WDV: declining balance rate. |
| 15 | `annual_depreciation_inr` | DECIMAL(12,2) | output | NOT NULL | — | = monthly × 12 (SLM), or annualized WDV rate. |
| 16 | `allocated_monthly_depreciation_inr` | DECIMAL(10,2) | output | NOT NULL | — | **PRIMARY S200 Net Profit feed.** Post-allocation depreciation. |
| 17 | `accumulated_depreciation_inr` | DECIMAL(14,2) | output | NOT NULL | — | Running total. For period P: monthly × MIN(P, useful_life). |
| 18 | `net_book_value_inr` | DECIMAL(14,2) | output | NOT NULL | — | = allocated_total − accumulated. Floor = salvage_value. |
| | | | **— SALVAGE —** | | | |
| 19 | `resolved_salvage_value_pct` | DECIMAL(5,2) | output | NOT NULL | — | From set_item. |
| 20 | `salvage_value_inr` | DECIMAL(12,2) | output | NOT NULL | — | = allocated_total × (salvage_pct / 100). |
| | | | **— S80 EXPANSION REFERENCE —** | | | |
| 21 | `expansion_triggered_flag` | BOOLEAN | output | NOT NULL | false | True if this row was auto-generated from S80 expansion. |
| 22 | `source_expansion_mode` | VARCHAR | output | NULLABLE | NULL | 'asset_add' / 'asset_upgrade' / 'unit_replicate'. NULL if initial_setup. |
| 23 | `source_capacity_unit_id` | FK (INTEGER) | output | NULLABLE | NULL | FK → 10_capacity_units_master. Which S80 resource triggered this. NULL if initial_setup. |
| 24 | `capex_trigger_source` | VARCHAR | output | NOT NULL | 'initial_setup' | 'initial_setup' / 'expansion' / 'replacement' / 'upgrade'. |
| | | | **— BUDGET & APPROVAL —** | | | |
| 25 | `capex_approved_flag` | BOOLEAN | output | NOT NULL | false | From S110-03 decisions. S200 Cash Flow only consumes APPROVED CapEx. |
| 26 | `budget_variance_inr` | DECIMAL(12,2) | output | NULLABLE | NULL | Override − computed. NULL if no override. |
| 27 | `budget_variance_pct` | DECIMAL(7,2) | output | NULLABLE | NULL | G-CX-01 fires if ABS > 20. |
| | | | **— LIFECYCLE & STATUS —** | | | |
| 28 | `capex_date` | DATE | output | NOT NULL | — | Resolved purchase date (set_item or override). |
| 29 | `decommission_date` | DATE | output | NULLABLE | NULL | Resolved end-of-service. NULL = indefinite. |
| 30 | `market_pause_status` | VARCHAR | output | NOT NULL | 'active' | active / paused / exited. Depreciation continues regardless. New expansion flagged G-CX-09. |
| | | | **— SET & FINANCING —** | | | |
| 31 | `set_id_used` | FK (INTEGER) | output | NOT NULL | — | FK → capex_profile_set_master. Which profile resolved. |

**Business rules:**
- BR-110-04a: Composite key (format_id, revenue_stream_id, market_id, capex_asset_id) UNIQUE per scenario per period.
- BR-110-04b: Depreciation CONTINUES during market pause. Sunk cost accounting. No variable component to zero.
- BR-110-04c: S200 Cash Flow only includes rows WHERE capex_approved_flag = TRUE. Unapproved CapEx is computed but not disbursed.
- BR-110-04d: S200 Net Profit includes depreciation for ALL rows (approved or not) — accounting conservatism. If unapproved rows should be excluded, human sets include_in_evaluation_flag = false at section level.
- BR-110-04e: **D16-04:** `capex_intensity_index` and `capex_per_outlet_inr` REMOVED. Per D15-09 precedent.
- BR-110-04f: net_book_value_inr is FLOORED at salvage_value_inr. Once reached, monthly_depreciation = 0.
- BR-110-04g: financing_eligible_flag (from set_item) is NOT repeated in outputs — S120 reads directly from set_items via set_id_used linkage.

---

## 8. Column Count Summary

| Table | ID | Columns (excl. 6 system) | Keys | Domain | Pattern #25 |
|---|---|---|---|---|---|
| capex_inputs | S110-01 | 9 | 3 | 5 | 1 |
| capex_research | S110-01b | 14 | 3 | 11 | — |
| capex_profile_set_master | S110-05 | 9 | 1 | 6 | 2 |
| capex_profile_set_items | S110-06 | 21 | 2 | 16 | 3 |
| capex_profile_set_assignment | S110-07 | 5 | 4 | 1 | — |
| capex_decisions | S110-03 | 12 | 4 | 8 | — |
| capex_outputs | S110-04 | 31 | 4 | 27 | — |
| **TOTAL** | **7 tables** | **101** | **21** | **74** | **6** |

**Net vs v3 stub:** +3 tables, +~71 columns. Absorbed: ~~S110-02 capex_assumptions~~ → set_items.

---

## 9. DI Impact Summary (Post-S110 Spec)

| DI | Status | Notes |
|---|---|---|
| DI-31 (S110) | ✅ APPLIED | 05j + 06c dual gate. |
| DI-47 (S110) | ✅ APPLIED | Pattern #19 ADOPTED. |
| DI-52 (S110) | ✅ APPLIED | capex_research table added. |
| DI-58 (S110) | ✅ APPLIED | Pattern #25 on set_items + set_master. |
| DI-60 | ✅ CLOSED | Stream added. shared_capex applied. 10b explosion algorithm defined. |

---

## 10. Ownership Registry Update

| Concern | Owner Section | Consumers |
|---|---|---|
| CapEx per asset (resolved) | **S110 CapEx** | S200 Cash Flow (capex outflow), S120 (financing need) |
| Monthly depreciation | **S110 CapEx** | S200 Net Profit (depreciation line) |
| Net book value | **S110 CapEx** | S300 (governance — asset health), S120 (collateral value) |
| CapEx profile sets (Pattern #19) | **S110 CapEx** | Via assignment to format × stream × market contexts |
| S80→S110 explosion results | **S110 CapEx** | S300 (governance — expansion tracking) |
| CapEx approval status | **S110 CapEx** | S300 (governance — approval coverage), S200 (cash flow gating) |
| Financing eligibility tagging | **S110 CapEx** | S120 (funding instrument sizing) |

---

*End of S110 CapEx Full Spec v1 — Phase 16, Session 16c*
*7 tables, 101 columns (excl. system fields), 11 computation steps, 9 governance warnings*
*Key innovation: S80→S110 explosion algorithm via 10b_capacity_unit_asset_map*


================================================================================
<!-- MODULE: fpe_s120_capital_strategy_spec_v1.md -->
================================================================================

# FPE S120 — Capital Structure & Funding Strategy — Full Spec v1

<!-- FPE MODULAR SCHEMA — v4.5.11 (Phase 16) -->
<!-- File: 13_S120_capital.md -->
<!-- Description: S120 Capital/Funding Strategy — 5 tables, ~95 cols (Phase 16, Standard + Research) -->
<!-- Supersedes: v4.5.10a S120 stub (4 tables, ~30 cols) -->
<!-- Date: 2026-04-11 -->
<!-- Session: Phase 16, Session 16d -->
<!-- Decisions: D16-03 (Pattern #19 NO), D16-05 (entity-level grain) -->

# ═══════════════════════════════════════
# S120 — CAPITAL STRUCTURE & FUNDING STRATEGY (v4.5.11: Phase 16 — STANDARD + RESEARCH)
# ═══════════════════════════════════════

**Phase 16 upgrade:** v3/v4 stub (4 tables, ~30 columns) → v4.5.11 full spec (5 tables, 95 columns).
**Pattern #19 NOT ADOPTED** (D16-03). Standard inputs + assumptions + decisions + outputs + research.
**Pattern #22** (AI Research Layer) ✅. **Pattern #25** (Research-First Defaults) ✅.
**Grain:** `funding_instrument_id` (entity-level). NOT format × stream × market.
**Gates:** Conditional 05j — only when `allocation_scope ∈ {format, format_market}` and format_id/market_id are populated. No 06c gate (no stream dimension).
**Rule 23 classification:** Contributor — if excluded, funding zeroed + S300 warning. Does NOT block S200 revenue/cost computation. Affects cash flow only.
**Decisions locked (Phase 16):** D16-03 (Pattern #19 NO), D16-05 (entity-level grain, conditional 05j).
**DI resolutions:** DI-31 (S120) ✅ conditional, DI-47 (S120) ✅ NO, DI-52 (S120) ✅, DI-58 (S120) ✅.
**NOT absorbed:** S120-02 `capital_assumptions` RETAINED (no Pattern #19 → no set_items absorption).
**PRIMARY S200 FEEDS:**
  - `resolved_amount_inr` → S200 Cash Flow (funding inflow at disbursement_date)
  - `monthly_repayment_inr` → S200 Cash Flow (debt repayment outflow)
  - `monthly_interest_inr` → S200 Net Profit (interest expense) + S200 Cash Flow (interest outflow)

---

## 1. Upstream → S120

| Source | Field(s) Consumed | Purpose |
|---|---|---|
| **S110 capex_outputs** | `allocated_total_capex_inr` (SUM, WHERE capex_approved_flag = TRUE) | Total CapEx requiring funding. Sizes debt/equity need. |
| **S110 capex_profile_set_items** | `financing_eligible_flag` | Which assets are eligible for equipment financing/leasing. |
| **S100 opex_outputs** | `projected_monthly_opex_inr` (SUM) | Monthly operating cash burn. Sizes working capital need. |
| **S90 manpower_outputs** | `resolved_monthly_manpower_cost_inr` (SUM) | Monthly payroll burn (for total cash need). |
| S200 cash_flow_output | `runway_months` | Current runway BEFORE this instrument. **Circular reference note:** S200 computes runway from existing instruments. New S120 instruments extend runway. Iterative resolution: S200 first pass without new instrument → runway. If runway < threshold → S120 activates new instrument → S200 re-computes. |
| S00 05j_format_market_map | active pairs | Conditional gate for allocated instruments. |

## 2. S120 → Downstream

| Consumer | Field(s) Consumed | Purpose |
|---|---|---|
| **S200 Cash Flow** | `resolved_amount_inr` | Funding inflow (one-time at disbursement_date). |
| **S200 Cash Flow** | `monthly_repayment_inr` | Debt principal repayment outflow (monthly from repayment_start_date). |
| **S200 Net Profit** | `monthly_interest_inr` | Interest expense line. |
| **S200 Cash Flow** | `monthly_interest_inr` | Interest cash outflow. |
| **S200 Cash Flow** | `processing_fee_amount_inr` | One-time fee outflow at disbursement. |
| S10 format_outputs | Allocated funding per format | Capital available per format. |
| S300 Governance | D/E ratio, coverage, runway, maturity, funding gap | Warnings G-CF-01 through G-CF-08. |

## 3. Key Concepts

| Concept | Description |
|---|---|
| **Entity-level grain** (D16-05) | Each row = one funding instrument (angel round, term loan, SAFE, etc.). NOT per-format or per-market. A Series A funds the company, not a kitchen. |
| **Instrument types** | `equity` (no repayment, dilution), `debt` (repayment + interest), `hybrid` (converts or repays), `internal` (promoter/retained). |
| **Allocation scope** | `company` (unrestricted use), `format` (allocated to specific format), `format_market` (tied to specific kitchen location). Conditional 05j gate only for non-company instruments. |
| **Amortization modes** | `emi` (equal monthly installments), `bullet` (lump-sum at maturity), `moratorium_then_emi` (interest-only period then EMI), `interest_only` (principal repaid at end). |
| **Financing bridge from S110** | S110 `financing_eligible_flag` tags assets suitable for equipment financing. S120 sizes instrument against eligible CapEx. |
| **WACC contribution** | Each instrument contributes to weighted average cost of capital. Equity: cost = dilution-implied return. Debt: cost = effective interest rate. S200 uses aggregate WACC for NPV discounting. |
| **Circular reference handling** | S120 consumes S200 runway (how long can we last?). S200 consumes S120 funding (cash in). Resolution: S200 computes base runway WITHOUT pending instruments. S120 sizes instruments against that gap. S200 re-computes with approved instruments. Max 2 iterations. |

---

## 4. Instrument Type Reference

| Type | Subtype | Repayment | Interest | Dilution | Typical Use |
|---|---|---|---|---|---|
| **equity** | angel | ❌ None | ❌ None | ✅ Yes | Seed-stage. MyLoveTriangle: ₹13 Cr angel round. |
| **equity** | seed | ❌ None | ❌ None | ✅ Yes | Pre-Series A. |
| **equity** | series_a | ❌ None | ❌ None | ✅ Yes | Growth capital. |
| **equity** | series_b | ❌ None | ❌ None | ✅ Yes | Scale capital. |
| **debt** | term_loan | ✅ EMI/Bullet | ✅ Yes | ❌ No | Bank term loan. Equipment, expansion. |
| **debt** | working_capital | ✅ Revolving | ✅ Yes | ❌ No | Short-term cash management. |
| **debt** | equipment_lease | ✅ EMI | ✅ Implicit | ❌ No | Asset-specific. Linked to S110 assets. |
| **debt** | revenue_based | ✅ % of revenue | ✅ Implied | ❌ No | Revenue-based financing (RBF). |
| **hybrid** | convertible_note | ✅ If not converted | ✅ Sometimes | ✅ If converted | Converts at next round or repays. |
| **hybrid** | safe | ❌ No repayment | ❌ None | ✅ On trigger | Simple Agreement for Future Equity. |
| **internal** | promoter_equity | ❌ None | ❌ None | ❌ Already owned | Founder's own capital. |
| **internal** | retained_earnings | ❌ None | ❌ None | ❌ N/A | Reinvested profits. |

---

## 5. Computation Algorithms (10)

### Step 0: Instrument Parameter Resolution

```
FOR EACH funding_instrument in S120-01:
  Resolve parameters from S120-02 assumptions.
  Apply any S120-03 decision overrides.
  Classification: instrument_type determines which computation path applies.
```

### Step 1: Equity Computation

```
IF instrument_type = 'equity':
  resolved_amount_inr = COALESCE(decision.amount_override, assumption.amount_inr)
  pre_money_valuation = assumption.pre_money_valuation_inr
  post_money_valuation = pre_money_valuation + resolved_amount_inr
  resolved_dilution_pct = (resolved_amount_inr / post_money_valuation) × 100
  
  -- Cost of equity (implied): investor expects return
  -- Simplified: use target_return_pct from assumption (e.g., 25% for angel, 35% for Series A)
  cost_of_equity_pct = assumption.target_return_pct
  
  -- No repayment, no interest
  monthly_repayment_inr = 0
  monthly_interest_inr = 0
  total_interest_cost_inr = 0
```

### Step 2: Debt Computation — EMI

```
IF instrument_type = 'debt' AND repayment_mode = 'emi':
  P = resolved_amount_inr  -- Principal
  r = interest_rate_annual_pct / 12 / 100  -- Monthly rate
  n = tenure_months - moratorium_months  -- Repayment months
  
  -- EMI formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
  monthly_repayment_inr = P × r × (1+r)^n / ((1+r)^n - 1)
  -- This EMI includes both principal and interest
  
  -- Decompose:
  -- Month 1: interest = P × r. Principal = EMI - interest.
  -- Month M: interest = remaining_principal × r. Principal = EMI - interest.
  monthly_interest_inr = P × r  -- First month (declines over time)
  
  -- During moratorium (if moratorium_months > 0):
  -- Only interest paid, no principal reduction
  moratorium_monthly_interest = P × r
  
  total_interest_cost_inr = (monthly_repayment_inr × n) - P + (moratorium_monthly_interest × moratorium_months)
  processing_fee_amount_inr = P × (processing_fee_pct / 100)
  total_cost_of_capital_inr = total_interest_cost_inr + processing_fee_amount_inr
  effective_annual_rate_pct = (total_cost_of_capital_inr / P) / (tenure_months / 12) × 100
```

### Step 3: Debt Computation — Bullet

```
IF instrument_type = 'debt' AND repayment_mode = 'bullet':
  monthly_interest_inr = resolved_amount_inr × (interest_rate_annual_pct / 12 / 100)
  monthly_repayment_inr = 0  -- Until maturity
  -- At maturity: lump-sum = resolved_amount_inr
  total_interest_cost_inr = monthly_interest_inr × tenure_months
```

### Step 4: Debt Computation — Revenue-Based

```
IF instrument_type = 'debt' AND instrument_subtype = 'revenue_based':
  -- Repayment = revenue_share_pct × monthly_revenue (from S200)
  -- Tenure variable — repays faster when revenue grows
  -- For projection: use S200 projected revenue as estimate
  monthly_repayment_inr = S200.projected_monthly_revenue × (revenue_share_pct / 100)
  -- Cap: repayment_cap_multiple × principal (e.g., 1.5× = repay 150% of borrowed amount)
```

### Step 5: Hybrid Computation

```
IF instrument_type = 'hybrid':
  IF instrument_subtype = 'convertible_note':
    -- Two scenarios: converts or repays
    -- Conversion: at next equity round, note converts at discount to valuation cap
    conversion_price = MIN(conversion_valuation_cap_inr, next_round_valuation × (1 - conversion_discount_pct/100))
    expected_dilution_if_converted_pct = resolved_amount_inr / (conversion_price + resolved_amount_inr) × 100
    
    -- If not converted by maturity: repay principal + accrued interest
    -- Use probability: conversion_probability_pct (assumption)
    monthly_interest_inr = CASE 
      WHEN interest_bearing = TRUE → amount × rate / 12
      ELSE 0  -- Many convertible notes are 0% interest
    END

  IF instrument_subtype = 'safe':
    -- No interest, no repayment, converts on trigger
    monthly_repayment_inr = 0
    monthly_interest_inr = 0
    resolved_dilution_pct = amount / conversion_valuation_cap × 100  -- Simplified
```

### Step 6: Coverage Analysis

```
-- How much of the funding need does this instrument cover?
total_capex_need = SUM(S110.allocated_total_capex_inr WHERE capex_approved_flag = TRUE)
total_monthly_opex = SUM(S100.projected_monthly_opex_inr)
total_monthly_manpower = SUM(S90.resolved_monthly_manpower_cost_inr)
total_monthly_burn = total_monthly_opex + total_monthly_manpower

IF allocation_scope = 'company':
  capex_coverage_inr = MIN(resolved_amount_inr, total_capex_need)  -- Up to full CapEx
  opex_coverage_months = (resolved_amount_inr - capex_coverage_inr) / total_monthly_burn
  -- Simplification: CapEx funded first, remainder covers OpEx
ELIF allocation_scope IN ('format', 'format_market'):
  -- Filter S100/S110 to allocated format/market
  capex_coverage_inr = MIN(resolved_amount_inr, filtered_capex_need)
  opex_coverage_months = remainder / filtered_monthly_burn

runway_contribution_months = resolved_amount_inr / total_monthly_burn
  -- How many additional months of runway this instrument provides
```

### Step 7: WACC Computation

```
-- Weighted Average Cost of Capital (portfolio-level, not per-instrument)
-- Per instrument:
wacc_weight_pct = resolved_amount_inr / SUM(all_instruments.resolved_amount_inr) × 100
wacc_component_rate_pct = CASE instrument_type
  WHEN 'equity'   → cost_of_equity_pct (target return)
  WHEN 'debt'     → effective_annual_rate_pct × (1 - tax_rate_pct/100)  -- After-tax cost of debt
  WHEN 'hybrid'   → blended based on conversion_probability
  WHEN 'internal' → 0  -- No explicit cost (opportunity cost excluded in v4)
END

-- Portfolio WACC = SUM(wacc_weight_pct × wacc_component_rate_pct) across all instruments
-- Stored as aggregated metric in S120 portfolio output (or S200 computation)
```

### Step 8: Decision Overrides

```
All overrides from S120-03 applied in Step 0.
funding_status progression: proposed → committed → disbursed → repaying → closed
  -- Only 'disbursed' and 'repaying' instruments feed S200 Cash Flow
  -- 'proposed' and 'committed' are planning-only
priority_rank determines draw order when multiple instruments available.
```

### Step 9: Maturity & Refinancing Tracking

```
FOR EACH debt/hybrid instrument:
  maturity_date = disbursement_date + tenure_months
  days_to_maturity = maturity_date - current_date
  
  IF days_to_maturity < 180: WARN G-CF-05 (refinancing needed)
  IF instrument_subtype = 'convertible_note' AND days_to_maturity < 90:
    WARN G-CF-06 (conversion deadline approaching)
  IF moratorium_months > 0 AND current_date approaching moratorium_end:
    WARN G-CF-07 (repayment starting soon)
```

### Step 10: Portfolio-Level Governance Metrics

```
-- Debt-to-Equity ratio
total_debt = SUM(resolved_amount_inr WHERE instrument_type = 'debt')
total_equity = SUM(resolved_amount_inr WHERE instrument_type IN ('equity', 'internal'))
debt_equity_ratio = total_debt / total_equity
IF debt_equity_ratio > 2.0: WARN G-CF-01

-- Funding gap
total_funding = SUM(resolved_amount_inr WHERE funding_status IN ('disbursed', 'committed'))
total_need = total_capex_need + (total_monthly_burn × planning_horizon_months)
funding_gap_inr = total_need - total_funding
IF funding_gap_inr > 0: WARN G-CF-04

-- Concentration risk
max_single_instrument_pct = MAX(resolved_amount_inr) / total_funding × 100
IF max_single_instrument_pct > 60: WARN G-CF-08
```

---

## 6. S300 Governance Warnings

| Code | Trigger | Severity | Description |
|---|---|---|---|
| **G-CF-01** | `debt_equity_ratio > 2.0` | ⚠️ WARNING | Leverage exceeds 2:1. Over-indebted for growth-stage foodtech. |
| **G-CF-02** | `monthly_interest_total / monthly_EBITDA < 1.5` | ⚠️ WARNING | Interest coverage ratio below 1.5×. Debt service at risk. |
| **G-CF-03** | `runway_months < 6` after all instruments deployed | 🔴 CRITICAL | Runway critically short. Immediate funding action required. |
| **G-CF-04** | `funding_gap_inr > 0` | ⚠️ WARNING | Total funding insufficient for CapEx + OpEx over planning horizon. |
| **G-CF-05** | `days_to_maturity < 180` for any debt instrument | ⚠️ WARNING | Instrument maturing within 6 months. Refinancing/repayment planning needed. |
| **G-CF-06** | Convertible note `days_to_maturity < 90` without conversion trigger | ⚠️ WARNING | Convertible approaching maturity without conversion event. May need to repay. |
| **G-CF-07** | Moratorium ending within 60 days | ℹ️ INFO | Repayment about to start. Cash flow planning reminder. |
| **G-CF-08** | Single instrument > 60% of total funding | ⚠️ WARNING | Concentration risk. Funding dependent on one source. |

---

## 7. TABLE SPECIFICATIONS

### 7.1 S120-01 `capital_inputs`

**Purpose:** Section-level evaluation controls per funding instrument. Each row = one instrument in the capital structure.
**Grain:** funding_instrument_id (entity-level)
**Gates:** Conditional 05j — only when allocation_scope ∈ {format, format_market} AND format_id IS NOT NULL.
**Phase 16 Lock ID:** PHASE16-T01-S120-LOCK 🔒
**Column count:** 11 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `funding_instrument_id` | PK (INTEGER) | key | NOT NULL | auto | Auto-generated. Unique identifier for this funding instrument. |
| 2 | `instrument_name` | VARCHAR | input | NOT NULL | — | Display name. E.g., "Angel Round — April 2024", "HDFC Term Loan #1", "Series A — Foodtech Ventures". |
| 3 | `allocation_scope` | VARCHAR | input | NOT NULL | 'company' | `company` (unrestricted) / `format` (allocated to a format) / `format_market` (tied to specific location). Controls 05j gate applicability. |
| 4 | `format_id` | FK (INTEGER) | key (conditional) | NULLABLE | NULL | FK → 05_formats_master. **Required if allocation_scope ∈ {format, format_market}.** NULL if company-level. **05j gated when populated.** |
| 5 | `market_id` | FK (INTEGER) | key (conditional) | NULLABLE | NULL | FK → 07_markets_master. **Required if allocation_scope = 'format_market'.** NULL otherwise. **05j gated when populated.** |
| 6 | `evaluation_scope_level` | VARCHAR | input | NOT NULL | 'directional' | directional / structured / validated / audited. See Rule 24. |
| 7 | `planning_horizon_months` | INTEGER | input | NULLABLE | NULL | NULL = global default. |
| 8 | `include_in_evaluation_flag` | BOOLEAN | input | NOT NULL | true | Rule 23 cascade. Contributor: funding zeroed + WARN if false. |
| 9 | `manual_review_required_flag` | BOOLEAN | input | NOT NULL | true | **Default TRUE for S120** (all funding decisions require human review). Auto-set true if scope = 'directional'. |
| 10 | `notes` | TEXT | input | NULLABLE | NULL | Free-form. |
| 11 | `auto_populate_research_flag` | BOOLEAN | input | NOT NULL | true | **Pattern #25.** Research auto-populates capital_assumptions. |

**Business rules:**
- BR-120-01a: funding_instrument_id is PRIMARY KEY. UNIQUE per scenario.
- BR-120-01b: If allocation_scope = 'format', format_id is REQUIRED (NOT NULL). market_id may be NULL.
- BR-120-01c: If allocation_scope = 'format_market', BOTH format_id and market_id are REQUIRED.
- BR-120-01d: If allocation_scope = 'company', both format_id and market_id MUST be NULL.
- BR-120-01e: When format_id IS NOT NULL, format_id × market_id MUST exist in 05j_format_market_map (conditional DI-31).
- BR-120-01f: manual_review_required_flag defaults TRUE for ALL S120 rows. Capital decisions always require human sign-off.

---

### 7.2 S120-01b `capital_research`

**Purpose:** AI research for funding benchmarks — VC terms, interest rates, market funding conditions.
**Grain:** funding_instrument_id
**Pattern:** #22 (AI Research Layer)
**Phase 16 Lock ID:** PHASE16-T01B-S120-LOCK 🔒
**Column count:** 12 (excl. 6 system fields)

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `funding_instrument_id` | FK (INTEGER) | key | NOT NULL | — | FK → capital_inputs.funding_instrument_id |
| 2 | `research_run_id` | INTEGER | system | NOT NULL | auto | Shared sequence across ALL _research tables. |
| 3 | `research_mode` | VARCHAR | research | NOT NULL | 'ai_auto' | manual / ai_assisted / ai_auto / hybrid |
| 4 | `research_prompt` | TEXT | research | NULLABLE | NULL | E.g., "Current term loan rates for foodtech startups India 2026, typical Series A terms for ₹50Cr+ revenue food delivery companies, equipment lease rates for commercial kitchen equipment" |
| 5 | `research_status` | VARCHAR | research | NOT NULL | 'pending' | pending / in_progress / completed / stale / failed |
| 6 | `research_completed_at` | TIMESTAMP | research | NULLABLE | NULL | When research last completed. |
| 7 | `research_confidence` | DECIMAL(3,2) | research | NULLABLE | NULL | Overall AI confidence (0.00–1.00). |
| 8 | `research_summary` | TEXT | research | NULLABLE | NULL | AI-generated brief. |
| 9 | `source_references` | TEXT | research | NULLABLE | NULL | Citations. |
| 10 | `fields_covered` | TEXT | research | NULLABLE | NULL | E.g., "interest_rate_annual_pct,processing_fee_pct,moratorium_months" |
| 11 | `stale_after_days` | INTEGER | research | NOT NULL | 30 | **S120 stale faster than other sections** — market rates change frequently. Default 30 days (vs 90 for S80–S110). |
| 12 | `auto_refresh_enabled_flag` | BOOLEAN | research | NOT NULL | false | Auto re-run when stale. |

**Business rules:**
- BR-120-01b-a: Adapted Pattern #22 template. Key is single funding_instrument_id (not triple key like S80–S110).
- BR-120-01b-b: stale_after_days defaults to 30 (capital markets are volatile). S80–S110 use 90.
- BR-120-01b-c: research_run_id FK target for capital_assumptions.source_research_run_id.

---

### 7.3 S120-02 `capital_assumptions`

**Purpose:** Complete funding parameters per instrument. NOT absorbed by Pattern #19 — each instrument is bespoke. Fields are grouped by instrument_type; unused fields are NULL.
**Grain:** funding_instrument_id
**Phase 16 Lock ID:** PHASE16-T02-S120-LOCK 🔒
**Column count:** 31 (excl. 6 system fields) — 1 key + 27 domain + 3 Pattern #25

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEY —** | | | |
| 1 | `funding_instrument_id` | FK (INTEGER) | key | NOT NULL | — | FK → capital_inputs.funding_instrument_id |
| | | | **— INSTRUMENT CLASSIFICATION —** | | | |
| 2 | `instrument_type` | VARCHAR | assumption | NOT NULL | — | `equity` / `debt` / `hybrid` / `internal`. Determines computation path. |
| 3 | `instrument_subtype` | VARCHAR | assumption | NOT NULL | — | See Section 4 instrument type reference. |
| | | | **— AMOUNT & TIMING —** | | | |
| 4 | `amount_inr` | DECIMAL(14,2) | assumption | NOT NULL | — | Total funding amount in ₹. |
| 5 | `disbursement_date` | DATE | assumption | NOT NULL | — | When funds are expected to arrive. |
| 6 | `drawdown_mode` | VARCHAR | assumption | NOT NULL | 'lump' | `lump` (full amount at once) / `tranched` (multiple disbursements). |
| 7 | `tranche_count` | INTEGER | assumption | NULLABLE | NULL | Number of tranches if drawdown_mode = 'tranched'. NULL if lump. |
| | | | **— EQUITY FIELDS (NULL if not equity) —** | | | |
| 8 | `pre_money_valuation_inr` | DECIMAL(14,2) | assumption | NULLABLE | NULL | Pre-money valuation. **Required if instrument_type = 'equity'.** |
| 9 | `target_return_pct` | DECIMAL(5,2) | assumption | NULLABLE | NULL | Investor's target annual return. Used for cost-of-equity calculation. |
| 10 | `investor_rights_summary` | TEXT | assumption | NULLABLE | NULL | Board seat, anti-dilution, liquidation preference, etc. Governance metadata. |
| | | | **— DEBT FIELDS (NULL if not debt) —** | | | |
| 11 | `interest_rate_annual_pct` | DECIMAL(5,2) | assumption | NULLABLE | NULL | Annual interest rate. **Required if instrument_type = 'debt'.** |
| 12 | `interest_type` | VARCHAR | assumption | NULLABLE | NULL | `fixed` / `floating`. |
| 13 | `floating_rate_benchmark` | VARCHAR | assumption | NULLABLE | NULL | E.g., 'MCLR', 'repo_rate', 'SOFR'. Required if interest_type = 'floating'. |
| 14 | `floating_rate_spread_bps` | INTEGER | assumption | NULLABLE | NULL | Basis points above benchmark. Required if floating. |
| 15 | `tenure_months` | INTEGER | assumption | NULLABLE | NULL | Loan duration in months. **Required if instrument_type = 'debt'.** |
| 16 | `repayment_mode` | VARCHAR | assumption | NULLABLE | NULL | `emi` / `bullet` / `moratorium_then_emi` / `interest_only` / `revenue_based`. |
| 17 | `moratorium_months` | INTEGER | assumption | NULLABLE | 0 | Interest-only period before EMI starts. 0 = no moratorium. |
| 18 | `collateral_type` | VARCHAR | assumption | NULLABLE | NULL | `unsecured` / `asset_backed` / `revenue_pledge` / `personal_guarantee`. |
| 19 | `collateral_value_inr` | DECIMAL(14,2) | assumption | NULLABLE | NULL | Value of collateral pledged. NULL if unsecured. |
| | | | **— HYBRID FIELDS (NULL if not hybrid) —** | | | |
| 20 | `conversion_trigger_type` | VARCHAR | assumption | NULLABLE | NULL | `next_equity_round` / `maturity` / `revenue_milestone` / `manual`. |
| 21 | `conversion_valuation_cap_inr` | DECIMAL(14,2) | assumption | NULLABLE | NULL | Maximum valuation for conversion price calculation. |
| 22 | `conversion_discount_pct` | DECIMAL(5,2) | assumption | NULLABLE | NULL | Discount to next-round valuation (e.g., 20% = converts at 80% of Series A price). |
| 23 | `maturity_date_if_unconverted` | DATE | assumption | NULLABLE | NULL | Repayment date if conversion doesn't trigger. |
| 24 | `conversion_probability_pct` | DECIMAL(5,2) | assumption | NULLABLE | NULL | Estimated probability of conversion (0–100). For blended cost calculation. |
| | | | **— REVENUE-BASED FIELDS —** | | | |
| 25 | `revenue_share_pct` | DECIMAL(5,2) | assumption | NULLABLE | NULL | % of monthly revenue paid as repayment. For revenue_based subtype. |
| 26 | `repayment_cap_multiple` | DECIMAL(4,2) | assumption | NULLABLE | NULL | Max total repayment as multiple of principal. E.g., 1.5 = repay max 150%. |
| | | | **— FEES —** | | | |
| 27 | `processing_fee_pct` | DECIMAL(5,2) | assumption | NOT NULL | 0.00 | One-time processing/origination fee as % of amount. Feeds S200 Cash Flow. |
| 28 | `prepayment_penalty_pct` | DECIMAL(5,2) | assumption | NOT NULL | 0.00 | Penalty for early repayment as % of outstanding principal. |
| | | | **— PATTERN #25 —** | | | |
| 29 | `field_source_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → source mapping. |
| 30 | `research_confidence_json` | TEXT | Pattern #25 | NULLABLE | NULL | JSON: field → confidence. |
| 31 | `source_research_run_id` | FK (INTEGER) | Pattern #25 | NULLABLE | NULL | FK → capital_research.research_run_id. |

**Business rules:**
- BR-120-02a: funding_instrument_id is UNIQUE per scenario. 1:1 with capital_inputs.
- BR-120-02b: NULL enforcement by instrument_type:
  - `equity`: pre_money_valuation_inr REQUIRED. Debt/hybrid fields SHOULD be NULL.
  - `debt`: interest_rate_annual_pct, tenure_months, repayment_mode REQUIRED. Equity fields SHOULD be NULL.
  - `hybrid`: conversion_trigger_type, conversion_valuation_cap_inr REQUIRED. Plus interest fields if interest-bearing.
  - `internal`: Only amount_inr, disbursement_date needed. All type-specific fields NULL.
- BR-120-02c: interest_type = 'floating' requires floating_rate_benchmark and floating_rate_spread_bps.
- BR-120-02d: repayment_mode = 'revenue_based' requires revenue_share_pct and repayment_cap_multiple.
- BR-120-02e: drawdown_mode = 'tranched' requires tranche_count > 1.

---

### 7.4 S120-03 `capital_decisions`

**Purpose:** Human overrides and approval status. ALL funding requires explicit approval.
**Grain:** funding_instrument_id
**Phase 16 Lock ID:** PHASE16-T03-S120-LOCK 🔒
**Column count:** 10 (excl. 6 system fields) — 1 key + 9 decisions

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEY —** | | | |
| 1 | `funding_instrument_id` | FK (INTEGER) | key | NOT NULL | — | FK → capital_inputs.funding_instrument_id |
| | | | **— OVERRIDES —** | | | |
| 2 | `amount_override_inr` | DECIMAL(14,2) | decision | NULLABLE | NULL | Human override of funding amount. |
| 3 | `interest_rate_override_pct` | DECIMAL(5,2) | decision | NULLABLE | NULL | Human override of interest rate (debt only). |
| 4 | `disbursement_date_override` | DATE | decision | NULLABLE | NULL | Human override of expected disbursement date. |
| 5 | `tenure_override_months` | INTEGER | decision | NULLABLE | NULL | Human override of debt tenure. |
| | | | **— STATUS & APPROVAL —** | | | |
| 6 | `funding_approved_flag` | BOOLEAN | decision | NOT NULL | false | **Human decision: approve this instrument.** Defaults FALSE — all funding requires explicit approval. S200 only consumes approved & disbursed instruments. |
| 7 | `funding_status` | VARCHAR | decision | NOT NULL | 'proposed' | `proposed` / `committed` / `disbursed` / `repaying` / `closed` / `cancelled`. S200 Cash Flow only processes `disbursed` and `repaying`. |
| 8 | `priority_rank` | INTEGER | decision | NOT NULL | 99 | Draw order among competing instruments. Lower = drawn first. Used when multiple instruments available for same need. |
| 9 | `board_approval_date` | DATE | decision | NULLABLE | NULL | When board/management approved. Governance tracking. |
| 10 | `decision_notes` | TEXT | decision | NULLABLE | NULL | Rationale, conditions, term sheet references. |

**Business rules:**
- BR-120-03a: funding_instrument_id UNIQUE per scenario.
- BR-120-03b: funding_status progression: proposed → committed → disbursed → repaying → closed. Cannot skip steps. 'cancelled' can happen from any state except 'closed'.
- BR-120-03c: S200 Cash Flow inflow ONLY when funding_status = 'disbursed'. Repayment outflow ONLY when funding_status = 'repaying'.
- BR-120-03d: funding_approved_flag = TRUE AND funding_status IN ('disbursed', 'repaying') → instrument is ACTIVE for S200.
- BR-120-03e: priority_rank determines draw order. If two instruments both cover CapEx need, lower rank is used first.

---

### 7.5 S120-04 `capital_outputs`

**Purpose:** Computed funding results. Single source of capital cost, repayment schedule, and coverage analysis for S200. Consumed by S200 (cash in/out, interest), S10 (format capital), S300 (governance).
**Grain:** funding_instrument_id
**Phase 16 Lock ID:** PHASE16-T04-S120-LOCK 🔒
**Column count:** 31 (excl. 6 system fields) — 1 key + 30 outputs

| # | Column | Type | Classification | Null | Default | Description |
|---|---|---|---|---|---|---|
| | | | **— KEY —** | | | |
| 1 | `funding_instrument_id` | FK (INTEGER) | key | NOT NULL | — | FK → capital_inputs.funding_instrument_id |
| | | | **— RESOLVED PARAMETERS —** | | | |
| 2 | `resolved_instrument_type` | VARCHAR | output | NOT NULL | — | From assumption (no override). |
| 3 | `resolved_instrument_subtype` | VARCHAR | output | NOT NULL | — | From assumption (no override). |
| 4 | `resolved_amount_inr` | DECIMAL(14,2) | output | NOT NULL | — | Final amount (assumption or override). **PRIMARY S200 Cash Flow inflow.** |
| 5 | `resolved_disbursement_date` | DATE | output | NOT NULL | — | Final disbursement date. |
| 6 | `resolved_interest_rate_pct` | DECIMAL(5,2) | output | NULLABLE | NULL | Final rate. NULL for equity/internal. |
| 7 | `resolved_tenure_months` | INTEGER | output | NULLABLE | NULL | Final tenure. NULL for equity/internal. |
| | | | **— REPAYMENT SCHEDULE —** | | | |
| 8 | `monthly_repayment_inr` | DECIMAL(12,2) | output | NOT NULL | 0 | **PRIMARY S200 Cash Flow outflow.** EMI or 0. For equity/internal: 0. |
| 9 | `monthly_interest_inr` | DECIMAL(10,2) | output | NOT NULL | 0 | **S200 Net Profit interest expense + Cash Flow outflow.** Month 1 value (declines for amortizing debt). |
| 10 | `total_interest_cost_inr` | DECIMAL(14,2) | output | NOT NULL | 0 | Lifetime interest cost. 0 for equity. |
| 11 | `processing_fee_amount_inr` | DECIMAL(10,2) | output | NOT NULL | 0 | One-time fee. **S200 Cash Flow outflow at disbursement.** |
| 12 | `total_cost_of_capital_inr` | DECIMAL(14,2) | output | NOT NULL | 0 | = interest + fees + penalties. All-in cost. |
| 13 | `effective_annual_rate_pct` | DECIMAL(7,2) | output | NOT NULL | 0 | Effective annual cost considering all fees and terms. |
| | | | **— EQUITY OUTPUTS —** | | | |
| 14 | `resolved_dilution_pct` | DECIMAL(7,2) | output | NULLABLE | NULL | Ownership dilution %. NULL if not equity/hybrid. |
| 15 | `post_money_valuation_inr` | DECIMAL(14,2) | output | NULLABLE | NULL | = pre_money + amount. NULL if not equity. |
| | | | **— HYBRID OUTPUTS —** | | | |
| 16 | `conversion_probability_pct` | DECIMAL(5,2) | output | NULLABLE | NULL | From assumption. NULL if not hybrid. |
| 17 | `expected_dilution_if_converted_pct` | DECIMAL(7,2) | output | NULLABLE | NULL | Estimated dilution upon conversion. NULL if not hybrid. |
| | | | **— DEBT TRACKING —** | | | |
| 18 | `remaining_principal_inr` | DECIMAL(14,2) | output | NULLABLE | NULL | Outstanding principal at current period. NULL if not debt. |
| 19 | `repayment_start_date` | DATE | output | NULLABLE | NULL | When EMI begins (after moratorium). NULL if no repayment. |
| 20 | `repayment_end_date` | DATE | output | NULLABLE | NULL | Final repayment date. NULL if no debt. |
| 21 | `maturity_date` | DATE | output | NULLABLE | NULL | Instrument maturity. NULL for indefinite equity. |
| 22 | `days_to_maturity` | INTEGER | output | NULLABLE | NULL | Remaining days. Triggers G-CF-05 if < 180. |
| | | | **— COVERAGE ANALYSIS —** | | | |
| 23 | `capex_coverage_inr` | DECIMAL(14,2) | output | NOT NULL | 0 | How much of S110 CapEx this instrument covers. |
| 24 | `opex_coverage_months` | DECIMAL(5,1) | output | NOT NULL | 0 | How many months of S100 OpEx this covers (after CapEx). |
| 25 | `runway_contribution_months` | DECIMAL(5,1) | output | NOT NULL | 0 | Total runway extension from this instrument. |
| | | | **— WACC COMPONENTS —** | | | |
| 26 | `wacc_weight_pct` | DECIMAL(5,2) | output | NOT NULL | 0 | This instrument's weight in portfolio WACC. |
| 27 | `wacc_component_rate_pct` | DECIMAL(7,2) | output | NOT NULL | 0 | This instrument's cost rate for WACC. |
| | | | **— PORTFOLIO GOVERNANCE —** | | | |
| 28 | `funding_status` | VARCHAR | output | NOT NULL | 'proposed' | From S120-03 decisions. Reflects current lifecycle stage. |
| 29 | `funding_approved_flag` | BOOLEAN | output | NOT NULL | false | From S120-03. |
| | | | **— ALLOCATION —** | | | |
| 30 | `allocation_scope` | VARCHAR | output | NOT NULL | 'company' | From inputs. Determines S200 routing. |
| 31 | `allocation_amount_inr` | DECIMAL(14,2) | output | NOT NULL | — | Amount attributed to the allocated scope. = resolved_amount if company. May be partial if format-allocated. |

**Business rules:**
- BR-120-04a: funding_instrument_id UNIQUE per scenario per period.
- BR-120-04b: S200 Cash Flow ONLY consumes rows WHERE funding_approved_flag = TRUE AND funding_status IN ('disbursed', 'repaying').
- BR-120-04c: monthly_repayment_inr = 0 for equity and internal. > 0 for active debt.
- BR-120-04d: resolved_dilution_pct only populated for equity and hybrid instruments.
- BR-120-04e: remaining_principal_inr decreases monthly for amortizing debt. Stays constant for bullet until maturity. NULL for equity.
- BR-120-04f: Coverage analysis assumes CapEx funded first (priority), then operating runway from remainder. This matches typical startup funding allocation.
- BR-120-04g: wacc_weight_pct sums to 100% across all ACTIVE instruments. Inactive instruments excluded from WACC.

---

## 8. Column Count Summary

| Table | ID | Columns (excl. 6 system) | Keys | Domain | Pattern #25 |
|---|---|---|---|---|---|
| capital_inputs | S120-01 | 11 | 1 (+2 conditional) | 8 | 1 |
| capital_research | S120-01b | 12 | 1 | 11 | — |
| capital_assumptions | S120-02 | 31 | 1 | 27 | 3 |
| capital_decisions | S120-03 | 10 | 1 | 9 | — |
| capital_outputs | S120-04 | 31 | 1 | 30 | — |
| **TOTAL** | **5 tables** | **95** | **5 (+2)** | **85** | **4** |

**Net vs v3 stub:** +1 table (research), +~65 columns. Assumptions table is the largest — hosting all instrument parameters without Pattern #19 decomposition.

---

## 9. DI Impact Summary (Post-S120 Spec)

| DI | Status | Notes |
|---|---|---|
| DI-31 (S120) | ✅ APPLIED | Conditional 05j gate on format-allocated instruments. |
| DI-47 (S120) | ✅ APPLIED | Pattern #19 NOT adopted (D16-03). DI-47 NOW FULLY CLOSED — all sections evaluated. |
| DI-52 (S120) | ✅ APPLIED | capital_research table added (Pattern #22). |
| DI-58 (S120) | ✅ APPLIED | Pattern #25 on assumptions. auto_populate_research_flag on inputs. |

---

## 10. Ownership Registry Update

| Concern | Owner Section | Consumers |
|---|---|---|
| Funding amount (resolved) | **S120 Capital** | S200 Cash Flow (inflow), S10 (capital availability) |
| Monthly repayment schedule | **S120 Capital** | S200 Cash Flow (outflow) |
| Interest expense | **S120 Capital** | S200 Net Profit (interest line), S200 Cash Flow (outflow) |
| Dilution tracking | **S120 Capital** | S300 (governance — ownership table) |
| WACC components | **S120 Capital** | S200 (NPV discounting, if implemented) |
| Cost of capital (total) | **S120 Capital** | S300 (governance — capital efficiency) |
| Funding gap analysis | **S120 Capital** | S300 (governance — G-CF-04) |
| Runway contribution | **S120 Capital** | S200 (cash flow projection), S300 (governance — G-CF-03) |

---

## 11. Circular Reference Protocol: S120 ↔ S200

```
S120 consumes S200 runway_months (how long can we survive?)
S200 consumes S120 funding (cash inflows and outflows)

RESOLUTION PROTOCOL:
  PASS 1: S200 computes WITHOUT any 'proposed' S120 instruments.
          → base_runway_months = result
  PASS 2: IF base_runway_months < threshold (e.g., 12 months):
          → S120 activates proposed instruments to close the gap
          → S120 sizing can reference base_runway from Pass 1
  PASS 3: S200 re-computes WITH newly-disbursed S120 instruments.
          → final_runway_months = result
  
  MAX 2 iterations. If funding still insufficient after Pass 3 → G-CF-03 CRITICAL warning.
  
  Implementation note: This is a SEQUENTIAL dependency, not a true circular.
  S200 Pass 1 → S120 → S200 Pass 2. The engine handles this in strict order.
```

---

*End of S120 Capital Structure & Funding Full Spec v1 — Phase 16, Session 16d*
*5 tables, 95 columns (excl. system fields), 10 computation steps, 8 governance warnings*
*Key features: Entity-level grain, 4 instrument types with 12 subtypes, EMI/bullet/RBF amortization, WACC, coverage analysis, circular reference protocol*


================================================================================
<!-- MODULE: 14_S200_finance_v3.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.12a -->
<!-- File: 14_S200_finance.md -->
<!-- Description: S200 Finance Stack — 6 tables, 113 columns (Phase 17 LOCKED, Post-Verification Patch) -->
<!-- Source: Consolidated from Session 17b/17c/17d specs + Cross-Verification Patch v1 -->
<!-- Date: 2026-04-11 -->
<!-- Supersedes: 14_S200_finance.md v4.5.12 (pre-patch) -->
<!-- Patch applied: S50-1 (field name), S50-2 (grain allocation), S50-3 (cac_implied), S50-4 (campaign_discount DI-64), S110 stub notes, S120 stub notes -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# S200 — FINANCE STACK (v4.5.12a: Phase 17 LOCKED + Verification Patches)
# 6 tables, 113 columns
# ═══════════════════════════════════════

**S200 is the COMPUTATION ENGINE.** All upstream sections (S10–S120) provide parameters; S200 projects the financial outcomes. Revenue is computed ONCE in S200 (Rule 12). Orders are consumed from S60 (Rule 13). Period dimension on every table (Rule 17). Strict computation order (Rule 18). Pricing waterfall (Rule 19).

**Architectural decisions locked (Session 17a):**
- D17-01: Sequential per-period engine. `14_periods_master` drives horizon. Quarterly/annual = computed views.
- D17-02: 5→4→3 key funnel. Explicit SUM rules per collapse step. Cost routing matrix defined.
- D17-03: Single effective tax rate + loss carry-forward. MAT/GST deferred to V5.
- D17-04: DSO/DPO/DIO working capital model.
- D17-05: 54 → 113 columns across 6 tables.

**DIs resolved:** DI-35 (hybrid pricing routing), DI-39 (S70 soft gate confirmed), DI-44 (two-level weighted average), DI-55 (pricing_source_section), DI-57 (S50→S60 awareness governance), DI-63 (kitchen_labor→manpower_cost rename).

**Post-verification patches applied (v4.5.12a):** S50-1 field name, S50-2 grain allocation, S50-3 cac_implied, S50-4 campaign discount (DI-64 opened).

---

## S200-01 `revenue_output` — Lock ID: PHASE17-T01-LOCK 🔒
Purpose: demand + pricing + discounts + channel mechanics → net revenue. **S200 is the SINGLE SOURCE of revenue** (Rule 12). 10-step pricing waterfall (Rule 19). DI-35/DI-55 hybrid pricing routing. DI-44 two-level weighted average.
**Grain: format × revenue_stream × channel × market × period** (5-key) | Row estimate: ~8,100 at 36 months | UI: format→market→period cascade, then stream×channel breakdown.

| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. 05j gatekeeper (DI-31). |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master.revenue_stream_id`. 06c gatekeeper. |
| `channel_id` | key | FK (INTEGER) | FK to `08_channels_master.channel_id`. S40 activation gate. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. 05j gatekeeper (format × market). |
| `period_id` | key | FK (INTEGER) | FK to `14_periods_master.period_id`. Rule 17: monthly base grain. |
| `gross_orders` | output | DECIMAL(12,2) | Total gross orders. = S60 `seasonalized_orders_per_day` × `days_in_period`. Rule 13: S60 is SINGLE SOURCE. |
| `cancel_return_orders` | output | DECIMAL(12,2) | = `gross_orders × (S40.resolved_cancellation_rate_pct + S40.resolved_return_rate_pct) / 100`. |
| `net_orders` | output | DECIMAL(12,2) | = `gross_orders − cancel_return_orders`. |
| `list_price_per_order_inr` | output | DECIMAL(10,2) | Pre-markup weighted avg list price. Source: DI-35/DI-55 routing → S70 mix-weighted (DI-44) or S20 direct/formula. |
| `customer_price_per_order_inr` | output | DECIMAL(10,2) | After channel markup (Rule 19 Step 6). = `MIN(list + markup, list + cap)` from 08b. |
| `gross_merchandise_value_inr` | output | DECIMAL(14,2) | = `net_orders × customer_price_per_order_inr`. |
| `base_discount_inr` | output | DECIMAL(14,2) | Rule 19 type 3. From S70 `resolved_base_discount_pct`. |
| `channel_platform_discount_inr` | output | DECIMAL(14,2) | Rule 19 type 2. Brand-borne share of platform discount. |
| `promo_discount_inr` | output | DECIMAL(14,2) | Rule 19 type 4. Brand-borne share of co-funded promo. |
| `campaign_discount_inr` | output | DECIMAL(14,2) | Rule 19 type 5. **⚠️ PATCH S50-4 / DI-64:** S50 outputs do not expose a campaign discount amount field. Default = 0 + G-FIN-32 warning until DI-64 is resolved. Source routing to be defined in S50 amendment or Phase 18. |
| `total_discounts_inr` | output | DECIMAL(14,2) | = SUM(4 discount types). Additive. |
| `net_revenue_inr` | output | DECIMAL(14,2) | = `MAX(0, GMV − total_discounts)`. Floor ₹0. Top line for P&L. |
| `channel_commission_inr` | output | DECIMAL(14,2) | = `net_revenue × commission_rate / 100`. From S40/08b. |
| `payment_gateway_fee_inr` | output | DECIMAL(14,2) | = `net_revenue × pg_fee_pct / 100`. From 08b. |
| `total_fees_inr` | output | DECIMAL(14,2) | = `commission + PG fee`. |
| `net_realization_inr` | output | DECIMAL(14,2) | = `net_revenue − total_fees`. What the business keeps. |
| `net_realization_per_order_inr` | output | DECIMAL(10,2) | = `net_realization / NULLIF(net_orders, 0)`. |

Constraints: UNIQUE(format_id, revenue_stream_id, channel_id, market_id, period_id, scenario, effective_from) — Rule 20.

**DI-35/DI-55 Pricing Route:** `CASE S20.pricing_source_section WHEN 'S70' → S70 resolved (DI-44 mix-weighted) | WHEN 'S20_direct' → S20 stream-level | WHEN 'S20_formula' → S20 formula-based | ELSE → BLOCK`.

**DI-44 Two-Level Weighted Average:** Level 1: `product_weighted_price = base + Σ(variant.delta × share/100)` from S70-02e. Level 2: `mix_weighted_price = Σ(product_weighted × product_mix_share/100)` across L1→L2→L3 hierarchy.

**10-Step Waterfall:** (1) Gate validation → (2) Resolve demand → (3) Cancel/return → (4) Pricing route → (5) List price → (6) Channel markup (capped) → (7) GMV → (8) 4 discount types → (9) Net revenue (floor ₹0) → (10) Fees → net realization.

v4.3: +`period_id`. v4.5.12 (Phase 17): 11→22 columns. v4.5.12a: S50-4 campaign_discount default-zero + DI-64. Lock ID: PHASE17-T01-LOCK.

---

## S200-02 `cm1_output` — Lock ID: PHASE17-T02-LOCK 🔒
Purpose: unit-level contribution after direct variable costs. Channel dimension collapsed via SUM from S200-01 (Rule 18, D17-02 Step 1). D17-02a: product packaging → CM1, delivery/operational packaging → EBITDA.
**Grain: format × revenue_stream × market × period** (4-key) | Row estimate: ~1,620 | Channel collapsed.

| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. 05j gatekeeper. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master.revenue_stream_id`. 06c gatekeeper. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. 05j gatekeeper. |
| `period_id` | key | FK (INTEGER) | FK to `14_periods_master.period_id`. Rule 17. |
| `net_orders` | output | DECIMAL(12,2) | = SUM(S200-01.net_orders) across channels. |
| `net_revenue_inr` | output | DECIMAL(14,2) | = SUM(S200-01.net_revenue_inr) across channels. |
| `food_cost_inr` | output | DECIMAL(14,2) | = `net_orders × mix_weighted_food_cogs`. Source: S70 via DI-44. |
| `packaging_cost_inr` | output | DECIMAL(14,2) | **Product packaging only** (D17-02a). = `net_orders × mix_weighted_packaging_cogs`. Source: S70. |
| `delivery_cost_inr` | output | DECIMAL(14,2) | Delivery logistics. Source: S100 WHERE `cost_category = 'cm1_direct'`. |
| `channel_commission_inr` | output | DECIMAL(14,2) | = SUM(S200-01.channel_commission_inr) across channels. |
| `payment_gateway_fee_inr` | output | DECIMAL(14,2) | = SUM(S200-01.payment_gateway_fee_inr) across channels. |
| `cm1_inr` | output | DECIMAL(14,2) | = `net_revenue − food − packaging − delivery − commission − PG`. |
| `cm1_pct` | output | DECIMAL(5,2) | = `cm1 / NULLIF(net_revenue, 0) × 100`. |
| `cm1_per_order_inr` | output | DECIMAL(10,2) | = `cm1 / NULLIF(net_orders, 0)`. |
| `gross_margin_pct` | output | DECIMAL(5,2) | = `(net_revenue − food_cost) / NULLIF(net_revenue, 0) × 100`. |
| `food_cost_pct` | output | DECIMAL(5,2) | = `food_cost / NULLIF(net_revenue, 0) × 100`. |

Constraints: UNIQUE(format_id, revenue_stream_id, market_id, period_id, scenario, effective_from) — Rule 20.

**Channel Collapse (D17-02 Step 1):** All monetary fields SUM across channels. Per-order metrics RE-DERIVED from summed totals. Never averaged.

**D17-02a Packaging Split:** Product packaging (pizza box, wrapping) → CM1. Delivery/operational packaging (thermal bag, cutlery) → S100 → EBITDA. S100 items tagged `cost_category = 'cm1_direct'` excluded from EBITDA, routed to CM1.

v4.3: +`period_id`. v4.5.12 (Phase 17): 10→16 columns. Lock ID: PHASE17-T02-LOCK.

---

## S200-03 `cm2_output` — Lock ID: PHASE17-T03-LOCK 🔒
Purpose: contribution after manpower, marketing, support costs. **DI-63 APPLIED:** `kitchen_labor_inr` → `manpower_cost_inr`.
**Grain: format × revenue_stream × market × period** (4-key) | Row estimate: ~1,620

| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. 05j gatekeeper. |
| `revenue_stream_id` | key | FK (INTEGER) | FK to `06_revenue_streams_master.revenue_stream_id`. 06c gatekeeper. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. 05j gatekeeper. |
| `period_id` | key | FK (INTEGER) | FK to `14_periods_master.period_id`. Rule 17. |
| `cm1_inr` | output | DECIMAL(14,2) | From S200-02. |
| `manpower_cost_inr` | output | DECIMAL(14,2) | **DI-63: renamed from `kitchen_labor_inr`.** = SUM(S90.`resolved_monthly_manpower_cost_inr`) across roles. ✅ Verified against S90-04 locked spec. Period alignment: `hire_start_date ≤ period.end AND (hire_end_date IS NULL OR ≥ period.start)`. Shared role allocation factored in S90. |
| `marketing_cost_inr` | output | DECIMAL(14,2) | **⚠️ PATCH S50-1/S50-2 APPLIED.** Source: S50-04 `projected_spend_inr` (NOT `resolved_monthly_spend_inr`). **S50 grain = f×m×ch (no stream dimension).** Requires two-step aggregation: (1) SUM S50 across channels per f×m, (2) allocate to streams by net_revenue share. See S50 Allocation Algorithm below. |
| `marketing_per_order_inr` | output | DECIMAL(10,2) | = `marketing / NULLIF(net_orders, 0)`. |
| `support_cost_inr` | output | DECIMAL(14,2) | = `support_cost_pct × net_revenue / 100`. System parameter. |
| `cm2_inr` | output | DECIMAL(14,2) | = `cm1 − manpower − marketing − support`. |
| `cm2_pct` | output | DECIMAL(5,2) | = `cm2 / NULLIF(net_revenue, 0) × 100`. |
| `cm2_per_order_inr` | output | DECIMAL(10,2) | = `cm2 / NULLIF(net_orders, 0)`. |
| `net_revenue_inr` | output | DECIMAL(14,2) | Carried through from S200-02. |
| `net_orders` | output | DECIMAL(12,2) | Carried through from S200-02. |
| `cac_implied_inr` | output | DECIMAL(10,2) | **⚠️ PATCH S50-3 APPLIED.** = `S50.blended_cac_inr` (channel-revenue-weighted avg) when available. **S50 does NOT expose `new_customers_acquired` as a standalone column.** If `blended_cac_inr` is unavailable or S50 excluded → NULL. V5 may add raw customer count to S50. |
| `contribution_after_marketing_inr` | output | DECIMAL(14,2) | = `cm1 − marketing`. Unit-econ view before manpower. |

Constraints: UNIQUE(format_id, revenue_stream_id, market_id, period_id, scenario, effective_from) — Rule 20.

### S50 Marketing Allocation Algorithm (PATCH S50-2)

S50 outputs are at **format × market × channel** grain. CM2 is at **format × stream × market** grain. No direct match exists. Two-step resolution:

```
-- Step 1: Collapse S50 across channels per format×market
total_marketing_format_market =
  SUM(S50.projected_spend_inr)
  WHERE S50.format_id = cm2.format_id
    AND S50.market_id = cm2.market_id
    AND S50.activation_status = 'active'
    AND S50.campaign_start_date ≤ period.end_date
    AND (S50.campaign_end_date IS NULL OR ≥ period.start_date)

-- Step 2: Allocate to streams by net_revenue share
stream_revenue_share =
  S200-02.net_revenue_inr(this_stream)
  / NULLIF(SUM(S200-02.net_revenue_inr) across all streams for f×m×p, 0)

marketing_cost_inr =
  total_marketing_format_market × stream_revenue_share

-- Edge case: all streams have zero revenue → equal split among active streams + WARN
-- Edge case: S50 excluded → marketing_cost_inr = 0 + WARN (Rule 23 contributor)
```

### CAC Resolution (PATCH S50-3)

```
-- S50-04 outputs blended_cac_inr = total_spend / new_customers (internally computed)
-- But new_customers is NOT a standalone S50 output column

-- Option A (v4 default): consume S50.blended_cac_inr directly
--   Aggregate across channels: revenue-weighted average
--   cac_implied_inr = Σ(S50.blended_cac_inr × channel_spend_share) / Σ(channel_spend_share)

-- Option B: NULL if S50.blended_cac_inr is NULL or S50 excluded
--   V5 may add new_customers_acquired as standalone S50 output

cac_implied_inr =
  IF S50 active AND S50.blended_cac_inr IS NOT NULL:
    channel-revenue-weighted average of S50.blended_cac_inr
  ELSE:
    NULL  -- G-FIN-16 warns after 3 consecutive periods
```

v4.3: +`period_id`. v4.5.12 (Phase 17): 10→16 columns. v4.5.12a: S50-1 field name fix, S50-2 allocation algorithm, S50-3 cac_implied resolution. Lock ID: PHASE17-T03-LOCK.

---

## S200-04 `ebitda_output` — Lock ID: PHASE17-T04-LOCK 🔒
Purpose: format-level operating profitability. Stream dimension collapsed via SUM from S200-03 (Rule 18, D17-02 Step 2). S100 OpEx absorbed (excl. cm1_direct items — D17-02a).
**Grain: format × market × period** (3-key) | Row estimate: ~540 | Stream collapsed.

| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. 05j gatekeeper. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. 05j gatekeeper. |
| `period_id` | key | FK (INTEGER) | FK to `14_periods_master.period_id`. Rule 17. |
| `net_revenue_inr` | output | DECIMAL(14,2) | = SUM(S200-03.net_revenue_inr) across streams. |
| `net_orders` | output | DECIMAL(12,2) | = SUM(S200-03.net_orders) across streams. |
| `cm2_inr` | output | DECIMAL(14,2) | = SUM(S200-03.cm2_inr) across streams. |
| `fixed_opex_inr` | output | DECIMAL(14,2) | S100 fixed/step_function items (excl. cm1_direct). SUM across line_items. Source: S100-04 `projected_monthly_opex_inr`. ✅ `cost_driver_mode` verified: `fixed` / `variable` / `semi_variable` / `resource_linked` / `headcount_linked` / `step_function`. |
| `variable_opex_inr` | output | DECIMAL(14,2) | S100 variable items (excl. cm1_direct). Source: S100-04 `computed_variable_component_inr` or `resolved_variable_per_order_inr × orders`. ✅ Verified against Phase 16. |
| `total_opex_inr` | output | DECIMAL(14,2) | = `fixed + variable`. |
| `g_and_a_inr` | output | DECIMAL(14,2) | System parameter: `g_and_a_pct × revenue` OR fixed amount. |
| `ebitda_inr` | output | DECIMAL(14,2) | = `cm2 − total_opex − g_and_a`. |
| `ebitda_pct` | output | DECIMAL(5,2) | = `ebitda / NULLIF(net_revenue, 0) × 100`. |
| `ebitda_per_order_inr` | output | DECIMAL(10,2) | = `ebitda / NULLIF(net_orders, 0)`. |
| `opex_per_order_inr` | output | DECIMAL(10,2) | = `total_opex / NULLIF(net_orders, 0)`. |
| `breakeven_orders_per_day` | output | DECIMAL(10,2) | = `fixed_monthly_costs / (contribution_per_order × days_in_period)`. NULL if contribution ≤ 0. |
| `operating_leverage_pct` | output | DECIMAL(5,2) | = `fixed_costs / NULLIF(total_costs, 0) × 100`. |
| `opex_to_revenue_pct` | output | DECIMAL(5,2) | = `total_opex / NULLIF(net_revenue, 0) × 100`. |
| `manpower_to_revenue_pct` | output | DECIMAL(5,2) | = `SUM(manpower) / NULLIF(net_revenue, 0) × 100`. Carried from CM2. |

Constraints: UNIQUE(format_id, market_id, period_id, scenario, effective_from) — Rule 20.

**Stream Collapse (D17-02 Step 2):** `cm2`, `net_revenue`, `net_orders`, `manpower`, `marketing`, `support` all SUM across streams. Per-order metrics RE-DERIVED.

**S100 Routing (✅ verified v4.5.12b):** Phase 16 defines 6 `cost_driver_modes`: `fixed`, `variable`, `semi_variable`, `resource_linked`, `headcount_linked`, `step_function`. S100-04 grain: f×s×m×opex_line_item_id (31 output cols). `cm1_direct` exclusion = D17-02a config on `13_opex_line_items_master.cost_category`. S100-04 `projected_monthly_opex_inr` (col 21) = PRIMARY S200 EBITDA feed. `payment_terms_days` on S100-06 set_items (col 16). `security_deposit_inr` on S100-06 set_items (col 17). `opex_start_date` on S100-04 outputs (col 28).

v4.3: +`period_id`. v4.5.12 (Phase 17): 8→18 columns. Lock ID: PHASE17-T04-LOCK.

---

## S200-05 `net_profit_output` — Lock ID: PHASE17-T05-LOCK 🔒
Purpose: bottom-line after depreciation (S110), interest (S120), and tax (D17-03). Sequential processing for loss carry-forward.
**Grain: format × market × period** (3-key) | Row estimate: ~540

| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. 05j gatekeeper. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. 05j gatekeeper. |
| `period_id` | key | FK (INTEGER) | FK to `14_periods_master.period_id`. Rule 17. |
| `ebitda_inr` | output | DECIMAL(14,2) | From S200-04. |
| `depreciation_inr` | output | DECIMAL(14,2) | = SUM(S110 monthly depreciation) across assets+streams. Approved only. SLM/WDV. **Stub field:** `S110-04.monthly_depreciation_inr`. **Phase 16 likely field:** `allocated_monthly_depreciation_inr` (post-10b explosion). Approval gate: `S110-03.capex_approved_flag = true` (stub) or `approval_status = 'approved'` (Phase 16). Asset key: `capacity_asset_id`. |
| `interest_inr` | output | DECIMAL(14,2) | = SUM(S120 interest) allocated to this format×market. **Stub:** derive from `S120-04.resolved_interest_rate_pct`. **Phase 16 likely field:** `monthly_interest_inr`. Scope: `format_id` NULLABLE in stub (NULL = company-wide); Phase 16 adds `funding_instrument_id` entity grain with explicit scope. |
| `pre_tax_profit_inr` | output | DECIMAL(14,2) | = `ebitda − depreciation − interest`. |
| `loss_offset_applied_inr` | output | DECIMAL(14,2) | D17-03: carry-forward loss used this period. |
| `taxable_income_inr` | output | DECIMAL(14,2) | = `MAX(0, pre_tax − loss_offset)`. |
| `effective_tax_rate_pct` | output | DECIMAL(5,2) | System parameter (default 25.17% India FY26). |
| `tax_inr` | output | DECIMAL(14,2) | = `taxable_income × rate / 100`. |
| `net_profit_inr` | output | DECIMAL(14,2) | = `pre_tax − tax`. |
| `net_margin_pct` | output | DECIMAL(5,2) | = `net_profit / NULLIF(net_revenue, 0) × 100`. |
| `net_revenue_inr` | output | DECIMAL(14,2) | Carried through from S200-04. |
| `accumulated_loss_carry_forward_inr` | output | DECIMAL(14,2) | Running total. D17-03 sequential. Per f×m independent. |
| `profit_per_order_inr` | output | DECIMAL(10,2) | = `net_profit / NULLIF(net_orders, 0)`. |
| `months_since_launch` | output | INTEGER | = MAX(0, period_start − MAX(format_launch, market_activation)) in months. |

Constraints: UNIQUE(format_id, market_id, period_id, scenario, effective_from) — Rule 20.

**D17-03 Tax Model:** IF pre_tax < 0 → tax=0, accumulate loss. IF pre_tax > 0 AND loss > 0 → offset=MIN(profit, loss), tax on remainder. IF pre_tax > 0 AND loss = 0 → full tax. MAT/GST/multi-jurisdiction deferred V5.

**S110 Stub Reconciliation:** Stub uses `monthly_depreciation_inr`, `resolved_total_capex_inr`, `capacity_asset_id`, `capex_approved_flag`. Phase 16 spec may use `allocated_*` prefix post-10b explosion and `approval_status` output field. Salvage in stub = `salvage_value_pct` (percentage); ₹ amount derived: `resolved_total_capex_inr × salvage_value_pct / 100`. Verify field names against Phase 16 full spec when available.

**S120 Stub Reconciliation:** Stub uses `resolved_amount_inr`, `resolved_drawdown_date`, `resolved_interest_rate_pct`. No `monthly_interest_inr` output in stub — derivation: `outstanding_principal × rate / 12 / 100`. Phase 16 spec likely adds `monthly_interest_inr`, `funding_instrument_id`, `processing_fee_inr`. Scope allocation in stub: `format_id` NULLABLE (NULL = company-wide, non-NULL = format-specific). No `market_id` key in stub — Phase 16 adds entity-level grain. Verify against full spec.

v4.3: +`period_id`. v4.5.12 (Phase 17): 9→17 columns. v4.5.12a: S110/S120 stub reconciliation notes added. Lock ID: PHASE17-T05-LOCK.

---

## S200-06 `cash_flow_output` — Lock ID: PHASE17-T06-LOCK 🔒
Purpose: cash-basis financial viability. D17-04 working capital (DSO/DPO/DIO). S120↔S200 circular reference protocol. **Strictest sequential dependency:** `opening_cash(P) = closing_cash(P−1)`.
**Grain: format × market × period** (3-key) | Row estimate: ~540 | Requires sequential processing (Rule 17).

| Column | Classification | Type | Description |
|---|---|---|---|
| `format_id` | key | FK (INTEGER) | FK to `05_formats_master.format_id`. |
| `market_id` | key | FK (INTEGER) | FK to `07_markets_master.market_id`. |
| `period_id` | key | FK (INTEGER) | FK to `14_periods_master.period_id`. Rule 17. |
| `opening_cash_inr` | output | DECIMAL(14,2) | = prior `closing_cash`. **Period 1 = S120 initial funding.** Stub source: SUM(`S120-04.resolved_amount_inr`) WHERE `selected_for_drawdown_flag = true`. Phase 16: SUM by instrument scope. |
| `ebitda_inr` | output | DECIMAL(14,2) | From S200-04. OCF starting point. |
| `working_capital_change_inr` | output | DECIMAL(14,2) | D17-04: Δ(AR + inventory − AP). Positive = outflow. |
| `tax_paid_inr` | output | DECIMAL(14,2) | = S200-05.tax_inr (simplified same-period). |
| `security_deposits_outflow_inr` | output | DECIMAL(14,2) | One-time from S100-02 `security_deposit_inr` at S100-04 `opex_start_date`. ✅ Verified against stub. |
| `operating_cash_flow_inr` | output | DECIMAL(14,2) | = `ebitda − WC_change − tax − deposits`. |
| `capex_outflow_inr` | output | DECIMAL(14,2) | SUM(S110 approved capex) at `capex_date`. Stub field: `S110-04.resolved_total_capex_inr` WHERE `S110-03.capex_approved_flag = true`. |
| `asset_disposal_inflow_inr` | output | DECIMAL(14,2) | Salvage proceeds at decommission. = `S110-04.resolved_total_capex_inr × S110-02.salvage_value_pct / 100`. Phase 16 may have pre-computed `salvage_value_inr`. |
| `investing_cash_flow_inr` | output | DECIMAL(14,2) | = `−capex + disposal`. |
| `debt_drawdown_inr` | output | DECIMAL(14,2) | S120 debt disbursements. Stub: `S120-04.resolved_amount_inr` WHERE `instrument_type IN (debt types)` AND `resolved_drawdown_date` in period. Phase 16: by `funding_instrument_id`. |
| `equity_infusion_inr` | output | DECIMAL(14,2) | S120 equity funding. Stub: `S120-04.resolved_amount_inr` WHERE `instrument_type = 'equity'`. |
| `debt_repayment_inr` | output | DECIMAL(14,2) | S120 `monthly_repayment_inr`. ✅ Verified against stub. |
| `interest_paid_inr` | output | DECIMAL(14,2) | S120 monthly interest (cash basis). Stub: derived from rate. Phase 16: `monthly_interest_inr`. |
| `processing_fees_paid_inr` | output | DECIMAL(14,2) | S120 one-time fees at disbursement. **Not in stub** — Phase 16 addition. Default 0 if unavailable. |
| `financing_cash_flow_inr` | output | DECIMAL(14,2) | = `drawdown + equity − repayment − interest − fees`. |
| `closing_cash_inr` | output | DECIMAL(14,2) | = `opening + OCF + ICF + FCF`. Carries to next period. |
| `cumulative_cash_invested_inr` | output | DECIMAL(14,2) | Running total: equity + debt drawdowns. |
| `cumulative_cash_generated_inr` | output | DECIMAL(14,2) | Running total: operating cash flows. |
| `months_to_cash_breakeven` | output | INTEGER | Period count until cumulative OCF > 0. NULL until achieved. |
| `runway_months` | output | DECIMAL(5,1) | = `closing_cash / ABS(OCF)` when OCF < 0. NULL if positive. |
| `free_cash_flow_inr` | output | DECIMAL(14,2) | = `OCF + ICF`. Before financing. |

Constraints: UNIQUE(format_id, market_id, period_id, scenario, effective_from) — Rule 20.

**D17-04 Working Capital:** `DSO = Σ(channel_share × settlement_days)` from S40/08b. `DPO = Σ(opex_share × payment_terms_days)` from S100-02 `payment_terms_days` (✅ verified). `DIO = system param (default 3d)`. `NWC = AR + inventory − AP`. `WC_change = NWC(P) − NWC(P−1)`.

**S120↔S200 Circular Reference Protocol:** Pass 1 = scheduled drawdowns. Pass 2 = cash-triggered instruments if closing_cash < threshold. Max 3 iterations. Convergence threshold ₹1,000.

v4.3: +`period_id`. v4.5.12 (Phase 17): 9→24 columns. v4.5.12a: S110/S120 stub field reconciliation notes, salvage derivation formula. Lock ID: PHASE17-T06-LOCK.

---

# ═══════════════════════════════════════
# S200 GOVERNANCE WARNINGS — G-FIN SERIES (32 warnings)
# ═══════════════════════════════════════

| Code | Layer | Trigger | Severity |
|---|---|---|---|
| G-FIN-01 | Revenue | S70 excluded → S20 pricing fallback | WARNING |
| G-FIN-02 | Revenue | S50 excluded → awareness modifier neutralized | WARNING |
| G-FIN-03 | Revenue | Awareness modifier >2× or <0.5× baseline | WARNING |
| G-FIN-04 | CM1 | CM1 margin < 0% | CRITICAL |
| G-FIN-05 | EBITDA | EBITDA margin < −50% for >3 consecutive periods | WARNING |
| G-FIN-06 | Cash Flow | Runway < 6 months | CRITICAL |
| G-FIN-07 | EBITDA | Breakeven orders > projected for >6 periods | WARNING |
| G-FIN-08 | Cash Flow | NWC > 30 days revenue equivalent | WARNING |
| G-FIN-09 | Net Profit | Loss carry-forward > 24 months revenue | WARNING |
| G-FIN-10 | All | Scenario fallback triggered (Rule 22) | INFO |
| G-FIN-11 | CM1 | food_cost_pct > 50% | WARNING |
| G-FIN-12 | CM1 | delivery_cost routed but S100 tagging incomplete | WARNING |
| G-FIN-13 | CM2 | manpower_cost = 0 for active context | WARNING |
| G-FIN-14 | CM2 | marketing_cost = 0 for >3 periods | WARNING |
| G-FIN-15 | CM2 | cm2_pct < −25% | WARNING |
| G-FIN-16 | CM2 | cac_implied NULL for >3 periods | INFO |
| G-FIN-17 | CM2 | manpower cost > revenue | WARNING |
| G-FIN-18 | EBITDA | Contribution/order ≤ 0 → breakeven unreachable | CRITICAL |
| G-FIN-19 | EBITDA | opex_to_revenue > 80% | WARNING |
| G-FIN-20 | EBITDA | manpower_to_revenue > 40% | WARNING |
| G-FIN-21 | EBITDA | Operating leverage > 80% early stage (<6mo) | INFO |
| G-FIN-22 | Net Profit | depreciation = 0 but S110 assets exist | WARNING |
| G-FIN-23 | Net Profit | interest = 0 but S120 debt exists | WARNING |
| G-FIN-24 | Net Profit | net_margin < −100% | CRITICAL |
| G-FIN-25 | Net Profit | Loss carry-forward offset used (info) | INFO |
| G-FIN-26 | Cash Flow | closing_cash < 0 | CRITICAL |
| G-FIN-27 | Cash Flow | FCF < 0 for >12 consecutive periods | WARNING |
| G-FIN-28 | Cash Flow | Invested > 5× generated after 24 months | WARNING |
| G-FIN-29 | Cash Flow | Circular reference Pass 2+ triggered | INFO |
| G-FIN-30 | Cash Flow | Circular reference did NOT converge | WARNING |
| G-FIN-31 | Cash Flow | Security deposits > 20% opening cash | WARNING |
| **G-FIN-32** | **Revenue** | **campaign_discount_inr = 0 due to missing S50 source (DI-64)** | **INFO** |

---

# ═══════════════════════════════════════
# S200 PRE-COMPUTATION VALIDATION SUITE (8 checks)
# ═══════════════════════════════════════

| # | Check | Source | Severity | Fallback |
|---|---|---|---|---|
| 1 | Format×market active in period | S10, S30 wave | GATE | Skip — no row |
| 2 | S60 demand exists for context | S60 outputs | GATE | Skip — no row |
| 3 | Pricing source available (S70 or S20) | S20 route → S70/S20 | BLOCK | Cannot compute revenue |
| 4 | Product mix resolved | S70 assignment | WARN | Equal-split fallback (Rule 21) |
| 5 | Channel terms available | S40/08b | WARN | Zero markup/commission/PG |
| 6 | S90 manpower data exists | S90 outputs | WARN | manpower = 0 |
| 7 | S100 OpEx data exists | S100 outputs | WARN | opex = 0 |
| 8 | S50 awareness governance (DI-57) | S50 outputs | WARN | Modifier = 1.0 |

---

# ═══════════════════════════════════════
# FIELD VERIFICATION REGISTER (FINAL — v4.5.12b)
# ═══════════════════════════════════════

All fields verified against locked source specs. S50/S90 verified in v4.5.12a. S100/S110/S120 verified in v4.5.12b.

| S200 field reference | 17a/S200 name | Stub name | Stub table | Status |
|---|---|---|---|---|
| S90 manpower cost | `resolved_monthly_manpower_cost_inr` | `resolved_monthly_manpower_cost_inr` | S90-04 col 17 | ✅ VERIFIED |
| S50 marketing spend | `projected_spend_inr` | `projected_spend_inr` | S50-04 col 7 | ✅ VERIFIED (patched v4.5.12a) |
| S100 monthly opex | `projected_monthly_opex_inr` | `projected_monthly_opex_inr` | S100-04 col 21 | ✅ VERIFIED |
| S100 security deposit | `security_deposit_inr` | `security_deposit_inr` | S100-06 col 17 | ✅ VERIFIED |
| S100 payment terms | `payment_terms_days` | `payment_terms_days` | S100-06 col 16 | ✅ VERIFIED |
| S100 cost_driver_mode | 6 values incl. `step_function` | `step_function` (not `step_fixed`) | S100-04 col 5 | ✅ VERIFIED (patched v4.5.12b) |
| S110 depreciation | `allocated_monthly_depreciation_inr` | `allocated_monthly_depreciation_inr` | S110-04 col 16 | ✅ CONFIRMED |
| S110 capex total | `allocated_total_capex_inr` | `allocated_total_capex_inr` | S110-04 col 10 | ✅ CONFIRMED |
| S110 approval | `capex_approved_flag = true` | `capex_approved_flag` | S110-04 col 25 | ✅ VERIFIED (patched v4.5.12b) |
| S110 salvage | `salvage_value_inr` (₹) | `salvage_value_inr` | S110-04 col 20 | ✅ CONFIRMED |
| S110 asset key | `capex_asset_id` | `capex_asset_id` | S110-04 col 4 | ✅ VERIFIED (patched v4.5.12b) |
| S120 amount | `resolved_amount_inr` | `resolved_amount_inr` | S120-04 col 4 | ✅ VERIFIED (patched v4.5.12b) |
| S120 drawdown date | `resolved_disbursement_date` | `resolved_disbursement_date` | S120-04 col 5 | ✅ VERIFIED (patched v4.5.12b) |
| S120 monthly interest | `monthly_interest_inr` | `monthly_interest_inr` | S120-04 col 9 | ✅ CONFIRMED |
| S120 processing fee | `processing_fee_amount_inr` | `processing_fee_amount_inr` | S120-04 col 11 | ✅ VERIFIED (patched v4.5.12b) |
| S120 instrument scope | `allocation_scope` = company/format/format_market | `allocation_scope` | S120-04 col 30 | ✅ VERIFIED (patched v4.5.12b) |
| S120 circular ref | 3-pass, max 2 iterations, runway-triggered | 3-pass protocol | S120 spec | ✅ VERIFIED (patched v4.5.12b) |

---


================================================================================
<!-- MODULE: fpe_s300_governance_spec_v3.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.13 -->
<!-- File: fpe_s300_governance_spec_v3.md -->
<!-- Description: S300 Governance Architecture — v3 with formula registry tables (DI-70) -->
<!-- Date: 2026-04-12 -->
<!-- Supersedes: fpe_s300_governance_spec_v2.md (adds 2 formula governance tables from DI-70) -->
<!-- Depends on: 00_header_rules.md, 14_S200_finance_v3.md, 92_deferred_impacts_v4513.md, fpe_decision_log_v4513.md, fpe_session_handoff_v10a.md, fpe_s100_opex_strategy_spec_v1.md, fpe_s110_capex_strategy_spec_v1.md, fpe_s120_capital_strategy_spec_v1.md, fpe_formula_lock_schema_proposal_v1.md -->

# S300 Governance Architecture — Spec v3

**Date:** 2026-04-12  
**Phase:** 19 (Schema Amendment Cycle)  
**Schema baseline:** v4.5.13  
**Supersedes:** `fpe_s300_governance_spec_v2.md` — adds 2 formula governance tables (DI-70 ACCEPTED)  
**Status:** LOCKED FOR v4.5.13

---

## 1. Scope of v3

This v3 specification **preserves all content from v2** (the Session 18b source-reconciliation patch) and adds **two new formula governance tables** accepted under DI-70 in Phase 19.

### What remains unchanged from v2:
- the S300 purpose and run pattern,
- the four canonical S300 tables (`s300_warning_registry`, `s300_warning_events`, `s300_cross_section_validation_results`, `s300_confidence_dashboard`),
- the 57 warning rows (32 G-FIN + 8 G-OX + 9 G-CX + 8 G-CF),
- the 12 cross-section validation rules (XVAL-01 through XVAL-12),
- the confidence-dashboard metadata,
- the DI-62 and DI-64 architecture-level decisions,
- all per-row change logs from v2.

### What changes in v3:
- **2 new tables** added to S300: `s300_formula_registry` (20 columns) and `s300_formula_audit_log` (10 columns),
- **6 new warning rows** added to `s300_warning_registry` for formula governance (G-FORMULA-01 through G-FORMULA-06),
- S300 canonical table count: **4 → 6** (4 original + 2 formula governance),
- total warning rows: **57 → 63** (57 existing + 6 formula warnings),
- Phase 19 decision D19-01 governs this addition.

---

## 2. Recommended phase split

**Unchanged from v2:**
- **Session 18a:** architecture lock, DI-62 warning-registry model, DI-64 campaign-discount decision, cross-section validation catalog, confidence-dashboard metadata.
- **Session 18b:** source-spec reconciliation of the 25 Phase-16 section warnings and implementation hardening.
- **Phase 19:** DI-70 formula registry tables (this spec), DI-71 lineage formula binding (S00), DI-54 closure, DI-56 deferral.

---

## 3. Purpose of S300

S300 is the governance layer that sits across S10–S120 and S200. Its function is to standardize warnings, evaluate trigger logic in deterministic passes, validate cross-section consistency, aggregate confidence health, manage formula versioning and audit, and produce machine-readable outputs for audit, UI, and downstream automation.

S300 now writes **six** tables:
1. `s300_warning_registry` (Phase 18a)
2. `s300_warning_events` (Phase 18a)
3. `s300_cross_section_validation_results` (Phase 18a)
4. `s300_confidence_dashboard` (Phase 18a)
5. `s300_formula_registry` **(Phase 19 — DI-70)**
6. `s300_formula_audit_log` **(Phase 19 — DI-70)**

---

## 4. Unchanged architectural sections inherited from v2

The following sections from `fpe_s300_governance_spec_v2.md` are incorporated unchanged into v3:
- three-pass S300 run order,
- `s300_warning_registry` schema (§5 of v2),
- `s300_warning_events` schema,
- `s300_cross_section_validation_results` schema,
- `s300_confidence_dashboard` schema,
- the 8 S200 pre-computation validations,
- the 12 locked cross-section validations (`XVAL-01` to `XVAL-12`),
- confidence thresholds and metadata,
- DI-64 rule that `campaign_discount_inr = 0` in v4 unless a dedicated upstream source field is added,
- all 57 warning rows (32 G-FIN + 8 G-OX + 9 G-CX + 8 G-CF) and their per-row change logs,
- severity normalization rule (source ERROR → S300 CRITICAL).

Readers should interpret v3 as the **current authoritative S300 spec**, with v2 preserved as reconciliation provenance and v1 as architectural provenance.

---

## 5. Registry semantics and severity normalization

*Unchanged from v2 — see §5 of `fpe_s300_governance_spec_v2.md`.*

### 5.1 Canonical S300 registry columns

| Column | Type | Meaning |
|---|---|---|
| `warning_code` | TEXT | Unique warning identifier |
| `section` | TEXT | Owner section / family |
| `layer` | TEXT | OpEx / CapEx / Capital / Revenue / CM1 / CM2 / EBITDA / NetProfit / CashFlow / Formula |
| `trigger_expression` | TEXT | Canonical pseudo-SQL / business rule |
| `severity` | TEXT | `CRITICAL`, `WARNING`, or `INFO` |
| `threshold_value` | DECIMAL(14,4) | Numeric trigger threshold when applicable |
| `threshold_unit` | TEXT | Unit for the threshold |
| `active_flag` | BOOLEAN | Active in current schema version |
| `last_triggered_at` | DATETIME | Latest observed trigger time |
| `consecutive_period_count` | INTEGER | Latest streak length, default `0` for non-streak checks |
| `description` | TEXT | Plain-English warning meaning and remediation cue |

**v3 change:** `layer` dropdown now includes `Formula` (added for G-FORMULA rows).

### 5.2 Severity normalization rule

*Unchanged from v2.* Source severity `ERROR` → S300 severity `CRITICAL`.

---

## 6. Patched warning-registry content

### 6.1 Registry inventory after v3

The v3 registry contains **63 total warning rows**:
- **32 G-FIN** rows inherited unchanged from Session 18a / S200,
- **8 G-OX** rows patched from S100 (v2),
- **9 G-CX** rows patched from S110 (v2),
- **8 G-CF** rows patched from S120 (v2),
- **6 G-FORMULA** rows added for formula governance (v3 — DI-70).

### 6.2 G-OX / G-CX / G-CF rows

*Unchanged from v2 — see §6.2 of `fpe_s300_governance_spec_v2.md` for all 25 corrected rows.*

### 6.3 G-FORMULA rows (NEW in v3)

| warning_code | section | layer | trigger_expression | severity | threshold_value | threshold_unit | active_flag | consecutive_period_count | description |
|---|---|---|---|---|---:|---|---|---:|---|
| G-FORMULA-01 | S300 | Formula | `production_formula_version != staging_formula_version` | WARNING | NULL | `version` | true | 0 | Formula version mismatch between environments. Verify intentional promotion lag or deploy alignment. |
| G-FORMULA-02 | S300 | Formula | `output_field.formula_id IS NULL AND output_field IS formula_derived` | CRITICAL | NULL | `binding` | true | 0 | S200 output computed without registered formula binding. Computation integrity unverifiable. |
| G-FORMULA-03 | S300 | Formula | `status = 'ACTIVE' AND DATEDIFF(NOW(), activated_at) > 30` | WARNING | 30 | `days` | true | 0 | Formula in ACTIVE status > 30 days without freeze. Review for promotion to FROZEN or deprecation. |
| G-FORMULA-04 | S300 | Formula | `new_version.status = 'FROZEN' AND old_version.status = 'FROZEN'` | INFO | NULL | `event` | true | 0 | Formula version superseded — new frozen version replaced old. Informational lifecycle trace. |
| G-FORMULA-05 | S300 | Formula | `blast_radius_count > 5` | WARNING | 5 | `downstream formulas` | true | 0 | Proposed formula change affects > 5 dependent formulas. Elevated review recommended. |
| G-FORMULA-06 | S300 | Formula | `environment = 'production' AND formula.status != 'FROZEN'` | CRITICAL | NULL | `status` | true | 0 | Production computation attempted with non-FROZEN formula. Blocks execution until formula is frozen. |

---

## 7. Per-row change log

### 7.1 G-OX / G-CX / G-CF change logs

*Unchanged from v2 — see §7 of `fpe_s300_governance_spec_v2.md`.*

### 7.2 G-FORMULA change log (v3)

| warning_code | v2 status | v3 status | Change |
|---|---|---|---|
| G-FORMULA-01 | — (did not exist) | NEW | Added per DI-70, Phase 19, D19-01. |
| G-FORMULA-02 | — (did not exist) | NEW | Added per DI-70, Phase 19, D19-01. |
| G-FORMULA-03 | — (did not exist) | NEW | Added per DI-70, Phase 19, D19-01. |
| G-FORMULA-04 | — (did not exist) | NEW | Added per DI-70, Phase 19, D19-01. |
| G-FORMULA-05 | — (did not exist) | NEW | Added per DI-70, Phase 19, D19-01. |
| G-FORMULA-06 | — (did not exist) | NEW | Added per DI-70, Phase 19, D19-01. |

---

## 8. NEW: Formula governance tables (DI-70)

### 8.1 Table: `s300_formula_registry`

**Purpose:** Central catalog of every named formula in the FPE system. Each row is one version of one formula. Immutable after freeze. Enables formula version control, tamper detection via SHA-256 hashing, and deterministic historical replay.

**Grain:** formula × version (composite key: `formula_id` × `formula_version`)

**System fields:** Standard 6 (per Rule 00) — `[table]_id`, `version` (app-wide), `scenario`, `effective_from`, `effective_to`, `row_status`.

**Note on system `version` vs formula `formula_version`:** The system `version` field is app-wide schema versioning (Rule 1). `formula_version` is the formula-specific version number. These are independent.

| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `formula_id` | key | VARCHAR(20) NOT NULL | No | — | Unique formula identifier. Pattern: `F-{SECTION}-{NN}`. E.g., `F-S200-01`. |
| `formula_version` | key | INTEGER NOT NULL | No | — | Monotonically increasing version per formula_id. Starts at 1. CHECK(>= 1). |
| `section` | master | VARCHAR(10) NOT NULL | No | — | Owner section. **Dropdown:** S200 / S60 / S80 / S120 / RULE. |
| `name` | master | VARCHAR(200) NOT NULL | No | — | Human-readable formula name. E.g., "Net Revenue (Floor Zero)". |
| `description` | master | TEXT | Yes | NULL | Extended description of what the formula computes and why. |
| `input_fields_json` | master | TEXT NOT NULL | No | — | JSON array of input field references. Each entry: `{"section": "S200", "table": "revenue_output", "column": "gross_merchandise_value_inr"}`. Ordered. |
| `output_field` | master | VARCHAR(200) NOT NULL | No | — | Target output field in `section.table.column` notation. E.g., `S200.revenue_output.net_revenue_inr`. |
| `expression_readable` | master | TEXT NOT NULL | No | — | Mathematical / business notation (LaTeX-compatible). Human-readable formula expression. |
| `expression_executable` | master | TEXT NOT NULL | No | — | Machine-parseable expression in SQL or Python pseudocode. Semantically equivalent to `expression_readable`. |
| `expression_hash` | master | VARCHAR(64) NOT NULL | No | — | SHA-256 hash of `expression_executable`. Used for tamper detection and equality checks across environments. |
| `decision_source` | master | VARCHAR(100) NOT NULL | No | — | Governing Rule or Decision. E.g., `Rule 12`, `D17-03`, `Patch S50-2`. |
| `status` | master | VARCHAR(20) NOT NULL | No | `'DRAFT'` | Formula lifecycle state. **Dropdown:** DRAFT / ACTIVE / FROZEN / DEPRECATED. |
| `created_at` | master | TIMESTAMP NOT NULL | No | CURRENT_TIMESTAMP | When this version was created. |
| `created_by` | master | VARCHAR(100) NOT NULL | No | — | Actor who created this version (user ID or system). |
| `activated_at` | master | TIMESTAMP | Yes | NULL | When DRAFT → ACTIVE transition occurred. |
| `frozen_at` | master | TIMESTAMP | Yes | NULL | When ACTIVE → FROZEN transition occurred. Immutability starts here. |
| `deprecated_at` | master | TIMESTAMP | Yes | NULL | When FROZEN → DEPRECATED transition occurred. |
| `superseded_by_version` | master | INTEGER | Yes | NULL | FK: formula_version of the newer version that supersedes this one. NULL if current. |
| `golden_test_passed_at` | master | TIMESTAMP | Yes | NULL | When golden tests last passed for this version. Required before activation. |
| `peer_review_approved_by` | master | VARCHAR(100) | Yes | NULL | Actor who approved the peer review. Required before activation. |
| `notes` | master | TEXT | Yes | NULL | Free-form notes about this version (change rationale, etc.). |

**Constraints:**
- PRIMARY KEY: `(formula_id, formula_version)`
- UNIQUE: `(output_field)` WHERE `status IN ('ACTIVE', 'FROZEN')` — prevents output-field conflicts
- CHECK: `formula_version >= 1`
- CHECK: `status IN ('DRAFT', 'ACTIVE', 'FROZEN', 'DEPRECATED')`
- CHECK: `frozen_at IS NOT NULL` WHEN `status = 'FROZEN'`
- CHECK: `activated_at IS NOT NULL` WHEN `status IN ('ACTIVE', 'FROZEN', 'DEPRECATED')`

**Dropdowns:**
- `section`: S200 / S60 / S80 / S120 / RULE
- `status`: DRAFT / ACTIVE / FROZEN / DEPRECATED

**Immutability enforcement:**
- When `status = 'FROZEN'`: all columns except `deprecated_at`, `superseded_by_version`, and system fields (`row_status`) are immutable. Application layer enforces this (no UPDATE on frozen rows except for deprecation transition).

**Table sizing:** ~50 rows (37 formulas × ~1.3 avg versions). Growth: slow — new versions created only on formula changes.

---

### 8.2 Table: `s300_formula_audit_log`

**Purpose:** Append-only audit trail of every formula lifecycle action. Supports regulatory audit, change tracking, and emergency override documentation.

**Grain:** formula × version × action × timestamp (append-only)

**System fields:** `[table]_id` and `row_status` only (audit log pattern — no version/scenario/effective_from/to).

| Column | Classification | Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `formula_audit_log_id` | system | INTEGER NOT NULL | No | AUTO | Auto-generated surrogate PK. |
| `formula_id` | key | VARCHAR(20) NOT NULL | No | — | FK to `s300_formula_registry.formula_id`. |
| `formula_version` | key | INTEGER NOT NULL | No | — | FK to `s300_formula_registry.formula_version`. |
| `action` | audit | VARCHAR(30) NOT NULL | No | — | **Dropdown:** `created` / `activated` / `frozen` / `deprecated` / `discarded` / `emergency_freeze` / `golden_test_passed` / `golden_test_failed` / `peer_review_approved` / `peer_review_rejected` / `blast_radius_computed`. |
| `action_timestamp` | audit | TIMESTAMP NOT NULL | No | CURRENT_TIMESTAMP | When the action occurred. |
| `actor` | audit | VARCHAR(100) NOT NULL | No | — | User ID or system identifier that performed the action. |
| `reason` | audit | TEXT | Yes | NULL | Justification for the action. Required for `emergency_freeze`, `discarded`, and `deprecated`. |
| `details_json` | audit | TEXT | Yes | NULL | Structured JSON payload for action-specific details. |
| `environment` | audit | VARCHAR(20) | Yes | NULL | **Dropdown:** development / staging / production. |
| `prior_status` | audit | VARCHAR(20) | Yes | NULL | Formula status before this action. |
| `new_status` | audit | VARCHAR(20) | Yes | NULL | Formula status after this action. |
| `row_status` | system | VARCHAR(20) NOT NULL | No | `'active'` | Lifecycle state. Audit log rows should never be set to anything other than `active`. |

**Constraints:**
- Append-only: no UPDATE or DELETE permitted (application-layer enforcement).
- FK: `(formula_id, formula_version)` → `s300_formula_registry(formula_id, formula_version)`.
- `action` must be one of the 11 defined dropdown values.

**Dropdowns:**
- `action`: created / activated / frozen / deprecated / discarded / emergency_freeze / golden_test_passed / golden_test_failed / peer_review_approved / peer_review_rejected / blast_radius_computed
- `environment`: development / staging / production

**Table sizing:** ~200 rows (50 formula versions × ~4 lifecycle events). Growth: moderate.

---

## 9. NEW: Formula pre-computation validation extension

The existing S200 pre-computation validation sequence (8 validations locked in v2) is extended with one additional check:

```
VALIDATION-09: Formula Readiness Check
  FOR each output_column in S200 tables:
    IF column is formula-derived:
      formula = SELECT * FROM s300_formula_registry
                WHERE output_field = column
                  AND status IN ('ACTIVE', 'FROZEN')
                  AND row_status = 'active'
      IF formula IS NULL:
        → BLOCK + emit G-FORMULA-02
      IF environment = 'production' AND formula.status != 'FROZEN':
        → BLOCK + emit G-FORMULA-06
    END
  END
```

This validation runs as part of Pass 1 (pre-computation) in the existing three-pass S300 run order. **No fourth pass is required.**

---

## 10. Formula table integration with existing S300

| Existing Element | Relationship |
|---|---|
| `s300_warning_registry` | Extended with 6 G-FORMULA warnings (G-FORMULA-01 through G-FORMULA-06) |
| `s300_warning_events` | Receives formula warning events at runtime (no schema change to events table) |
| `s300_cross_section_validation_results` | No change — formula validation runs pre-computation, not cross-section |
| `s300_confidence_dashboard` | No change — formula governance is orthogonal to confidence health |
| `91_metric_lineage_log` | Extended with `formula_id` + `formula_version` (DI-71, see S00 patch) |
| `00_table_registry` | Two new tables registered: `s300_formula_registry`, `s300_formula_audit_log` |
| S200 computation tables | No schema changes — formulas reference S200 columns, not modify them |

---

## 11. Cross-section validations

*Unchanged from v2 — all 12 XVAL rules (XVAL-01 through XVAL-12) remain locked.*

---

## 12. Confidence dashboard metadata

*Unchanged from v2.*

---

## 13. Table registry updates required

Two new rows must be added to `00_table_registry`:

| table_name | section_name | table_display_name | table_type | table_description | grain_description |
|---|---|---|---|---|---|
| `s300_formula_registry` | S300 | Formula Registry | governance | Central catalog of versioned formulas with lifecycle management and tamper detection | formula × version |
| `s300_formula_audit_log` | S300 | Formula Audit Log | governance | Append-only audit trail of formula lifecycle transitions | formula × version × action × timestamp |

---

## 14. Migration path

### 14.1 Phase 1: Table Creation
1. Create `s300_formula_registry` and `s300_formula_audit_log`.
2. Add `formula_id` and `formula_version` columns to `91_metric_lineage_log` (nullable, per DI-71).
3. Register both new tables in `00_table_registry`.

### 14.2 Phase 2: Initial Population
1. Load all 37 v1 formulas from the Formula Registry spec into `s300_formula_registry` with `status = 'ACTIVE'`.
2. Create audit log entries for each with `action = 'created'` and `action = 'activated'`.

### 14.3 Phase 3: Freeze Cycle
1. Run golden tests against all 37 formulas.
2. Transition passing formulas to `status = 'FROZEN'`.
3. Create audit log entries for each with `action = 'frozen'`.
4. Enable G-FORMULA-06 enforcement in production.

### 14.4 Phase 4: Lineage Binding
1. Update S200/S60 computation engine to write `formula_id` + `formula_version` on every lineage entry.
2. Enable G-FORMULA-02 enforcement.

---

## 15. v2 → v3 change summary

| Item | v2 | v3 | Delta |
|---|---|---|---|
| S300 tables | 4 | 6 | +2 (formula_registry, formula_audit_log) |
| Warning rows | 57 | 63 | +6 (G-FORMULA-01 through G-FORMULA-06) |
| Warning layer values | 9 | 10 | +Formula |
| Pre-computation validations | 8 | 9 | +VALIDATION-09 (formula readiness) |
| Cross-section validations | 12 | 12 | No change |
| Schema columns added | — | 32 | 20 (registry) + 12 (audit log) |
| DI resolved | — | DI-70 | Formula registry tables accepted |
| Decision | — | D19-01 | Phase 19 approval |

---

*End of S300 Governance Architecture — Spec v3*


================================================================================
<!-- MODULE: 90_ownership_registry.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 90_ownership_registry.md -->
<!-- Description: Ownership Registry — field ownership by section -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 4778–4825 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# OWNERSHIP REGISTRY
# ═══════════════════════════════════════

| Concern | Owner Section | Consumers |
|---|---|---|
| TAM/SAM/SOM (9 fields) | **S30 Market Strategy** | S10 consumes via cross-section rollup. Phase 8: ownership S10→S30. Phase 10: fields landed. |
| Product pricing | §S20→S60§ Product Economics | S200 (revenue), S60 (elasticity input) |
| Product COGS | §S20→S60§ Product Economics | S200 (CM1) |
| Base discount | §S20→S60§ Product Economics | S200 (net revenue) |
| Mix shares (scenario) | §S20→S60§ Product Economics | S200, S60 (via derived AOV) |
| Mix shares (structural defaults) | S00 Bridge Tables | §S20→S60§ (fallback) |
| Channel markup | S00 Channel Terms | S200 (customer price) |
| Channel co-funded promo | S00 Channel Terms | S200 (promo offset) |
| Campaign discount | S50 Marketing | S200 (discount aggregation) |
| Market growth rate | S30 Market Strategy | S60 (context) |
| Demand growth rate | S60 Demand | None |
| Demand volume (orders/day) | S60 Demand | S80, S200, S10 |
| Demand ramp | S60 Demand | S30 (consumes) |
| Cancel/return per channel | S40 Channel | S60 (derives blended) |
| CAC (detailed) | S50 Marketing | S40 (benchmark) |
| Repeat rate | S50 Marketing | S40 (benchmark) |
| Revenue projection | S200 Finance Stack | All sections consume |
| Runway | S200 Cash Flow | No other section computes |
| Non-product-sales pricing | S20 Revenue Stream | S200 (for catering/subscription/etc.) |
| Ancillary income (delivery/pkg fees) | S20 Revenue Stream | S200 |
| Pricing source routing | S20 Revenue Stream (pricing_source_section) | S200 |
| Channel cancel/return/conversion rates | S40 Channel | S60 (per-channel direct at expanded grain), S50 (CVR funnel), S200 (net orders) |
| Marketing spend profiles (sets) | S50 Marketing | S200 (CM2), S30 (wave triggers) |
| Order estimation gap | S50 Marketing | S300 (governance) |
| Demand volume (orders/day) | **S60 Demand** | S80 (capacity), S200 (revenue), S30 (wave triggers), S300 (governance) |
| Demand penetration curve | **S60 Demand** | S300 (governance), S30 (wave triggers) |
| Demand decomposition (7 factors) | **S60 Demand** | S300 (governance — attribution analysis) |
| Demand seasonality profiles | **S60 Demand** | S80 (hourly capacity distribution), S200 (monthly volumes) |
| Demand awareness modifier | **S60 Demand** | S300 (governance — awareness health), S50 (DI-57 feedback) |
| Demand profile sets (Pattern #19) | **S60 Demand** | Via assignment to format × stream × channel × market contexts |
| Capacity utilization & lost sales | **S80 Capacity** | S10 (feasibility), S100 (OpEx), S110 (CapEx), S300 (governance) |
| Capacity expansion recommendations | **S80 Capacity** | S110 (CapEx planning), S300 (governance) |
| Capacity ladder (K_nom→K_eff→K_alloc) | **S80 Capacity** | S300 (governance), S10 (feasibility rollup) |
| Capacity resource count | **S80 Capacity** | S90 (capacity-linked headcount), S100 (OpEx), S110 (CapEx) |
| Capacity profile sets (Pattern #19) | **S80 Capacity** | Via assignment to format × stream × market contexts |
| Manpower headcount (resolved) | **S90 Manpower** | S100 (OpEx scaling), S300 (governance) |
| Manpower cost (monthly) | **S90 Manpower** | **S200 CM2 (kitchen_labor_inr)** — primary S200 feed |
| Manpower attrition & training costs | **S90 Manpower** | S200 (via total monthly cost), S300 (governance) |
| Manpower profile sets (Pattern #19) | **S90 Manpower** | Via assignment to format × stream × market contexts |

---



================================================================================
<!-- MODULE: 91_change_summary_patterns.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.10a -->
<!-- File: 91_change_summary_patterns.md -->
<!-- Description: Change Summary + Architectural Patterns (25 total) -->
<!-- Source: fpe_canonical_v4.5.10a_consolidated_schema.md lines 4826–4888 -->
<!-- Date: 2026-04-11 -->
<!-- Load this file per the Loading Guide (fpe_loading_guide_v1.md) -->

# ═══════════════════════════════════════
# v3 → v4.3 CHANGE SUMMARY
# ═══════════════════════════════════════

| Metric | v3 | v4.3.1 | v4.4.0 | v4.5.7 | **v4.5.10** | Delta (v3→v4.5.10) |
|---|---|---|---|---|---|---|
| Total tables (active) | 91 | 107 | 118 | 138 | **144** | +53 |
| Total tables (incl. deprecated) | 91 | 107 | 121 | 141 | **149** | +58 (5 deprecated) |
| Total rules | 11 | 24 | 24 | 27 | **27** (Rule 26 amended) | +16 |
| Architectural patterns | — | 18 | 21 | 24 | **25** (+Pattern #25) | +25 |
| Tables locked | — | — | 74 (62.7%) | 113 (81.9%) | **127 (88.2%)** | Progressive review |
| Findings raised/resolved | — | — | 266 / 266 | 552+ / 552+ | **552+ / 552+** | +286 (Ph10–14) |
| Architectural decisions | — | — | — | 14 (D11→D14) | **32** (+D-CROSS-01, +D-CROSS-01a, +D15-01→D15-16) | Phases 11–15 + Cross-cutting |
| **New columns (D-CROSS-01)** | — | — | — | — | **+53 across 24 tables** | Pattern #25 Research-First |
| **Governance warnings** | — | — | — | — | **+7 (G-RF-01→G-RF-07)** | S300 Research-First monitoring |
| Fields removed/moved | — | 56 | **70** | +14 Phase 8 (9 moved to S30, 5 killed) |
| New §S20→S60§ set-based tables | — | — | **+13** | Mix/price/cost sets + context sets + adjustments |
| §S20→S60§ deprecated tables | — | — | **3** | Flat assumptions → set-based architecture |
| S00 new bridges | — | — | **+3** | 05j (format×market), context_set_master, context_set_members |
| Max dimension rule | — | ≤3 per view | ≤3 per view | Rule 16 enforced |
| §S20→S60§ architecture | flat | flat | **set-based** | 4-layer resolution stack (Pattern #21) |
| Scenario management | None | Full lifecycle | Full lifecycle | v4.3: 15_scenarios_master + Rule 22 |
| Time-series capability | None | Monthly P&L/CF | Monthly P&L/CF | v4.3: 14_periods_master + Rule 17 |

Phase 8–9 key architectural changes:
- **Phase 8 (v4.3.2):** Option A lean schema (format_assumptions 16→3 fields), Option X three-tier start date cascade, 05j bridge gap fill, TAM/SAM/SOM ownership S10→S30
- **Phase 9 (v4.4.0):** revenue_stream_id on all §S20→S60§ tables (Option A), mix set 4-level hierarchy, independent price+cost sets (Option Z), context sets (S00 shared infrastructure), 4-layer resolution stack (Pattern #21)


# ═══════════════════════════════════════
# ARCHITECTURAL PATTERNS (25 total)
# ═══════════════════════════════════════

| # | Pattern | Phase | Description |
|---|---|---|---|
| 1 | System fields on every table | 1 | 6 standard fields (PK, version, scenario, effective_from/to, row_status) |
| 2 | Format = infrastructure chain | 2 | Format defined by its 05f/05g/05h/05i bridges, not a type label |
| 3 | Bridge/map tables for M:N | 3 | Multi-select relationships as separate tables (Rule 4) |
| 4 | Temporal exclusivity | 3 | Rule 20 — no overlapping active_from/active_to for same composite key |
| 5 | Phase 5 bridge pattern | 5 | Standard bridge: 2-key composite, active_from/to, priority_rank |
| 6 | Dual-scope variants | 5 | category-scope + product-scope with product overrides category |
| 7 | 3-level mix share chain | 5 | collection → category → product with bridge defaults |
| 8 | Layered structure views | 5 | Max 3 dimensions per view (Rule 16), progressive drill-down |
| 9 | Extensible managed fields | 5 | UI autocomplete + new entries, not closed enums |
| 10 | Scores = outputs only | 5 | Rule 5 — all scores computed in output tables |
| 11 | Priority_rank vs sequence_no | 5 | Rule 11 — bridges use priority_rank, outputs use sequence_no |
| 12 | Single ownership | 5 | Rule 14 — every contestable field has exactly one owner section |
| 13 | S200 strict computation order | 7 | Rule 18 — revenue → CM1 → CM2 → EBITDA → Net Profit → Cash Flow |
| 14 | 4-discount pricing waterfall | 7 | Rule 19 — channel markup, channel discount, base discount, promo, campaign |
| 15 | Scenario fallback | 7 | Rule 22 — non-base scenario falls back to base if no rows exist |
| 16 | Inclusion cascade | 7 | Rule 23 — gate/contributor/soft-gate sections |
| 17 | Rule 24 input control | 7 | 5 canonical input fields after keys |
| 18 | Three-tier start date cascade | **8** | S30 assumption → S10 directive → S30 exception (Tier 3 > 2 > 1) |
| **19** | **Set + Context Set + Assignment** | **9** | **Universal section template: reusable set definitions + context-based assignment** |
| **20** | **Context sets with nullable stream** | **9** | **format × stream? × market groupings; NULL stream = stream-agnostic** |
| **21** | **4-layer resolution stack** | **9** | **Set Base → Context Multiplier → Variant Delta → Adjustment → Decision Override** |
| **22** | **AI Research Layer** | **v4.5.0** | **Per-section _research table at _inputs grain. AI suggests, human accepts. Confidence → auto-flag. Rule 25.** |
| **23** | **Research Outcome Landing Model** | **v4.5.1** | **Shared research_outcome_items table. Field-level suggestions with 4-state workflow (pending→accepted/rejected/overridden). Promoted values land in assumption tables with lineage. Rule 26.** |
| **24** | **Hierarchical Wave Expansion** | **v4.5.2** | **3-level cascade (micro→macro→cluster). Performance-triggered wave advancement. Same-level sequential + upward aggregate triggers. S200 respects wave timing. Rule 27.** |
| **25** | **Research-First Defaults (D-CROSS-01)** | **v4.5.9** | **Research auto-populates model parameters as default data source. Pattern #19 sections: research creates + populates set_items rows with auto-created sets. Non-Pattern #19 sections: research populates assumption fields directly. Source tracking via `field_source_json`. Refresh safety: research-sourced fields overwritable, manual protected. Confidence gate: ≥0.50 auto-populates, <0.50 → NULL → human MUST enter. Multi-data-point mandate: ≥2 independent sources per field. S300 governance tracks coverage %, stale values, proxy ratio, source diversity. Rules 25–26 amended. Patterns #22–#23 amended.** |

---



================================================================================
<!-- MODULE: 92_deferred_impacts_v4513.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.13 -->
<!-- File: 92_deferred_impacts_v4513.md -->
<!-- Supersedes: 92_deferred_impacts_v4512c.md -->
<!-- Date: 2026-04-12 -->

# ═══════════════════════════════════════
# DEFERRED IMPACTS — STATUS (as of v4.5.13)
# ═══════════════════════════════════════

**Active: 0 | Deferred to V5: 3 | Closed/Resolved: 27+**  
(v4.5.13: DI-54 resolved, DI-56 deferred to V5, DI-65 registered, DI-70 resolved, DI-71 resolved — Phase 19 amendment cycle)

| ID | Description | Status | Target | Resolution / Notes |
|---|---|---|---|---|
| ~~DI-26~~ | ~~S30 TAM/SAM/SOM~~ | ✅ RESOLVED | — | Phase 10. |
| ~~DI-31~~ | ~~05j gatekeeper~~ | ✅ RESOLVED | — | Phase 16. |
| ~~DI-34~~ | ~~Three-way bridge~~ | ✅ CLOSED | — | Phase 11. |
| ~~DI-35~~ | ~~S200 hybrid routing~~ | ✅ RESOLVED | — | Phase 17. `pricing_source_section` CASE. |
| ~~DI-36~~ | ~~S20/S70 boundary~~ | ✅ RESOLVED | — | Phase 11. |
| ~~DI-39~~ | ~~S70 gate~~ | ✅ RESOLVED | — | Phase 17. Soft gate → S20 fallback. |
| ~~DI-40~~ | ~~Ownership registry~~ | ✅ RESOLVED | — | v4.5.10a. |
| ~~DI-44~~ | ~~Variant weighted avg~~ | ✅ RESOLVED | — | Phase 17. Two-level. |
| ~~DI-46~~ | ~~S80 prep_time~~ | ✅ CLOSED | — | Phase 15. |
| ~~DI-47~~ | ~~Pattern #19 eval~~ | ✅ RESOLVED | — | Phase 16. |
| **DI-48** | Modifier rules | ⏸️ DEFERRED | V5 | Attribute-based modifier system. No change in Phase 19. |
| **DI-49** | S30 grain mismatch | ⏸️ DEFERRED | V5 | Option B for v1, Option A for v5. No change in Phase 19. |
| ~~DI-50~~ | ~~Pause semantics~~ | ✅ CLOSED | — | Phase 15. |
| ~~DI-51~~ | ~~S10↔S30~~ | ✅ CLOSED | — | Phase 11. |
| ~~DI-52~~ | ~~Research tables~~ | ✅ RESOLVED | — | Phase 16. |
| ~~DI-53~~ | ~~benchmark_aov~~ | ✅ CLOSED | — | Phase 14. |
| ~~DI-54~~ | ~~AI research engine~~ | ✅ **RESOLVED** | — | **Phase 19 (D19-04).** Full architecture spec produced (`fpe_research_engine_spec_v1.md`), 12-section integration map, resolution note. Zero schema modifications — engine-side logic only. Rules 24, 25, 26, Patterns #19, #22, #23, #25 verified. 5 dropdown values applied as data residual. |
| ~~DI-55~~ | ~~pricing_source_section~~ | ✅ RESOLVED | — | Phase 17. |
| **DI-56** | context_set + channel | ⏸️ **DEFERRED** | **V5** | **Phase 19 (D19-03).** Task K analysis confirms: Option B (status quo / direct assignment) for v1 is functionally complete. Option A (add `channel_id` to `context_set_members`) targeted for v5. S50/S60 locked phases would require unlocking. Only 2 of ~8 Pattern #19 sections affected. Convenience loss, not functional defect. |
| ~~DI-57~~ | ~~S50→S60 awareness~~ | ✅ RESOLVED | — | Phase 17. |
| ~~DI-58~~ | ~~Research-First S80–S120~~ | ✅ RESOLVED | — | Phase 16. |
| ~~DI-59~~ | ~~S100 grain~~ | ✅ RESOLVED | — | Phase 16. |
| ~~DI-60~~ | ~~S110 grain~~ | ✅ RESOLVED | — | Phase 16. |
| ~~DI-61~~ | ~~pause_status derivation~~ | ✅ RESOLVED | — | Phase 15. |
| ~~DI-62~~ | ~~S300 warning registry~~ | ✅ RESOLVED | — | Phase 18 Session 18a. |
| ~~DI-63~~ | ~~kitchen_labor rename~~ | ✅ RESOLVED | — | Phase 17. |
| ~~DI-64~~ | ~~S50 campaign discount routing~~ | ✅ RESOLVED | — | Phase 18 Session 18a. |
| ~~DI-65~~ | ~~`91_metric_lineage_log` full table spec~~ | ✅ **RESOLVED** | — | **Phase 19 downstream refresh.** Full 22-column specification produced (`fpe_di65_lineage_log_full_spec_v1.md`) with constraints, indexes, dropdowns, and consumer interaction map. Integrated into `01_S00_masters.md` as formal S00-42 section. Documentation debt resolved. |
| ~~DI-70~~ | ~~Formula registry tables~~ | ✅ **RESOLVED** | — | **Phase 19 (D19-01).** 2 new tables added to S300: `s300_formula_registry` (20 cols) + `s300_formula_audit_log` (12 cols). 6 G-FORMULA warnings added. Fully additive, zero breaking changes. Source: `fpe_formula_lock_schema_proposal_v1.md`. |
| ~~DI-71~~ | ~~Lineage formula binding~~ | ✅ **RESOLVED** | — | **Phase 19 (D19-02).** 2 nullable columns (`formula_id`, `formula_version`) added to `91_metric_lineage_log`. FK to `s300_formula_registry`. Paired nullability CHECK constraint. Backward compatible — existing rows get NULL. Source: `fpe_formula_lock_schema_proposal_v1.md` §3. |

---

## Summary

| Category | Count | IDs |
|---|---|---|
| ✅ Resolved/Closed | 25+ | DI-26, DI-31, DI-34, DI-35, DI-36, DI-39, DI-40, DI-44, DI-46, DI-47, DI-50, DI-51, DI-52, DI-53, DI-54, DI-55, DI-57, DI-58, DI-59, DI-60, DI-61, DI-62, DI-63, DI-64, DI-70, DI-71 |
| ✅ Resolved | — | (DI-65 resolved in downstream refresh) |
| ⏸️ Deferred V5 | 3 | DI-48, DI-49, DI-56 |

**Post-Phase 19 posture:** 0 open + 3 deferred to V5 (DI-48, DI-49, DI-56) = **FULLY CLEAN for v1 launch**.

---

## Change note from v4.5.12c → v4.5.13

### Phase 19 — Schema Amendment Cycle (2026-04-12)

**Resolved:**
- **DI-54** — AI Research Engine: full spec produced, zero schema changes, 5 dropdown values applied.
- **DI-70** — Formula Registry Tables: 2 new S300 tables accepted and integrated (`s300_formula_registry`, `s300_formula_audit_log`).
- **DI-71** — Lineage Formula Binding: 2 nullable columns added to `91_metric_lineage_log`.

**Deferred:**
- **DI-56** — context_set + channel: moved from OPEN to DEFERRED V5 per Task K analysis (D19-03).

**Registered:**
- **DI-65** — `91_metric_lineage_log` full table spec: NEW, OPEN (LOW). Documentation debt, not functional gap.

### No status change
- DI-48 remains deferred to V5
- DI-49 remains deferred to V5

---

## Sources used

- Deferred Impacts v4.5.12c: `/FPE/92_deferred_impacts_v4512c.md`
- DI-54 Resolution Note: `/FPE/DI_54/fpe_di54_resolution_note_v1.md`
- DI-56 Decision: `/FPE/DI_56/fpe_di56_decision_v1.md`
- Formula Lock Schema Proposal: `/FPE/Formula_Lock/fpe_formula_lock_schema_proposal_v1.md`
- Decision Log v4.5.13: `/FPE/Phase_19/fpe_decision_log_v4513.md`
- Phase 19 Handoff Brief: `/FPE/fpe_phase19_handoff_brief.md`


================================================================================
<!-- MODULE: 93_section_audit_tables_v4513.md -->
================================================================================

<!-- FPE MODULAR SCHEMA — v4.5.13 -->
<!-- File: 93_section_audit_tables_v4513.md -->
<!-- Description: Section Audit Tables — per-section table counts and lock status (Phase 19 patched) -->
<!-- Supersedes: 93_section_audit_tables.md (v4.5.10a) -->
<!-- Date: 2026-04-12 -->

# ═══════════════════════════════════════
# TABLE COUNT SUMMARY (v4.5.13)
# ═══════════════════════════════════════

**Section hierarchy (v4.5.0 — business decision flow):**
```
S10 Format (HOW operate) → S20 Stream (HOW monetize) → S30 Market (WHERE) →
S40 Channel (THROUGH WHOM) → S50 Marketing (HOW reach) → S60 Demand (HOW MANY) →
S70 Product Economics (WHAT charge/cost) → S80–S120 Operations → S200 Finance → S300 Governance
```

**Section code migration (v4.5.0):**
| Old Code | New Code | Section |
|---|---|---|
| S50 | **S20** | Revenue Stream Strategy |
| S60 | **S50** | Marketing Strategy |
| S70 | **S60** | Demand Strategy |
| S20 | **S70** | Product Economics |
| S10, S30, S40, S80–S120, S200, S300 | *unchanged* | — |

---

## Current Table Counts (v4.5.13)

| Section | Active Tables | Total (incl. deprecated) | Status |
|---|---|---|---|
| S00 Masters | 51 | 51 | LOCKED (v4.5.13: +2 cols on `91_metric_lineage_log` DI-71, +5 dropdown values DI-54 residual, +2 `00_table_registry` rows) |
| S10 Format Strategy | 7 | 7 | LOCKED |
| S20 Revenue Stream Strategy | 5 | 5 | LOCKED |
| S30 Market Strategy | 11 | 11 | LOCKED |
| S40 Channel Strategy | 5 | 5 | LOCKED |
| S50 Marketing Strategy | 8 | 8 | LOCKED |
| S60 Demand Strategy | 8 | 8 | LOCKED |
| S70 Product Economics | 17 | 20 | LOCKED |
| S80 Capacity Strategy | 7 | 8 | LOCKED |
| S90 Manpower Strategy | 7 | 8 | LOCKED |
| S100 OpEx Strategy | 4 | 4 | LOCKED |
| S110 CapEx Strategy | 4 | 4 | LOCKED |
| S120 Capital/Funding Strategy | 4 | 4 | LOCKED |
| S200 Finance Stack | 6 | 6 | LOCKED |
| S300 Governance | **5** | **5** | **LOCKED** (v4.5.13: +2 tables DI-70 `s300_formula_registry` + `s300_formula_audit_log`, +6 G-FORMULA warnings) |
| **TOTAL** | **149** | **154** | **ALL LOCKED (100%)** |

---

## v4.5.13 Changes (Phase 19 — Schema Amendment Cycle)

### S300 Governance: 3 → 5 active tables (+2)

| New Table | Columns | DI | Decision |
|---|---|---|---|
| `s300_formula_registry` | 20 + 6 system = 26 | DI-70 | D19-01 |
| `s300_formula_audit_log` | 10 + 2 system = 12 | DI-70 | D19-01 |

**Note:** The 4 original S300 tables (`s300_warning_registry`, `s300_warning_events`, `s300_cross_section_validation_results`, `s300_confidence_dashboard`) remain unchanged. Total S300 tables: **6** (4 original + 2 formula governance). Active count shown as **5** because `s300_warning_events` is runtime-populated and counted as active alongside the rest.

**Correction:** S300 active tables = **6** (all 6 tables are active).

### S00 Masters: column additions (no new tables)

| Table | Change | DI | Decision |
|---|---|---|---|
| `91_metric_lineage_log` | +2 columns (`formula_id`, `formula_version`) | DI-71 | D19-02 |
| `research_outcome_items` | +5 dropdown values on `source_research_table` | DI-54 residual | D19-04 |
| `00_table_registry` | +2 rows (new S300 tables), total 151 (146 active + 5 deprecated) | — | — |

### Warning count update

| Category | v4.5.12d | v4.5.13 | Delta |
|---|---|---|---|
| G-FIN | 32 | 32 | — |
| G-OX | 8 | 8 | — |
| G-CX | 9 | 9 | — |
| G-CF | 8 | 8 | — |
| G-FORMULA | 0 | **6** | +6 |
| **Total warnings** | **57** | **63** | **+6** |

### Column count update

| Metric | v4.5.12d | v4.5.13 | Delta |
|---|---|---|---|
| Active columns (approx.) | ~1,316 | ~1,350 | +34 (26 formula_registry + 12 audit_log − 4 system overlap + 2 lineage) |
| Active tables | ~150 | ~152 | +2 |
| `00_table_registry` rows | 149 (144+5) | 151 (146+5) | +2 |

---

## Table count evolution (Phase 8 → Phase 19)

```
v4.3.1:   107 active, 107 total
v4.3.2:   108 active, 108 total  (+1: 05j_format_market_map)
v4.4.0:   118 active, 121 total  (+13 new, −3 deprecated)
v4.4.1:   118 active, 121 total  (+12 fields on S30)
v4.5.0:   132 active, 135 total  (+14 research tables, section reorder)
v4.5.4:   132 active, 135 total  (consolidated — wave engine, research landing, context sets)
v4.5.5:   132 active, 135 total  (Phase 11 S20: +3 output fields, 38 findings)
v4.5.6:   132 active, 135 total  (Phase 12 S40: +3 output fields, 48 findings)
v4.5.7:   135 active, 138 total  (Phase 13 S50: +3 set tables, +2 output fields)
v4.5.8:   138 active, 141 total  (Phase 14 S60: 7-factor decomposition, +3 set tables)
v4.5.9:   138 active, 141 total  (Cross-cutting D-CROSS-01: +53 columns, +7 warnings)
v4.5.10:  144 active, 149 total  (Phase 15–16: S80/S90/S100/S110/S120 locked)
v4.5.12d: ~150 active, ~154 total (Phase 17–18: S200 + S300 locked)
v4.5.13:  ~152 active, ~156 total (Phase 19: +2 formula governance tables)
```

---

*End of Table Count Summary — v4.5.13*


================================================================================
<!-- MODULE: fpe_decision_log_v4513.md -->
================================================================================

# FPE Decision Log — v4.5.13

**Date:** 2026-04-12  
**Covers:** Phase 17 complete (D17-01–D17-05 + VPA-01–VPA-05 + P1–P9) + **Phase 19 (D19-01–D19-05)**  
**Supersedes:** `fpe_decision_log_v4512b.md`

---

## Phase 19 Decisions — ALL LOCKED ✅

### D19-01: DI-70 — Formula Registry Tables (ACCEPT)

**Decision:** Accept DI-70. Add two new tables to S300 Governance: `s300_formula_registry` (20 business columns + 6 system) and `s300_formula_audit_log` (10 business columns + 2 system). Add 6 G-FORMULA warning rows to `s300_warning_registry`.

**Rationale:**
- Fully additive — zero breaking changes to existing tables.
- Enables formula version control, tamper detection (SHA-256 hash), lifecycle management (DRAFT → ACTIVE → FROZEN → DEPRECATED), and audit trail.
- Natural extension of S300 governance architecture.
- Source: `fpe_formula_lock_schema_proposal_v1.md` (Task R).

**Impact:** S300 tables: 4 → 6. Warning rows: 57 → 63. Column count: +32 (net).

### D19-02: DI-71 — Lineage Formula Binding (ACCEPT)

**Decision:** Accept DI-71. Add 2 nullable columns (`formula_id` VARCHAR(20), `formula_version` INTEGER) to `91_metric_lineage_log` with FK to `s300_formula_registry` and paired-nullability CHECK constraint.

**Rationale:**
- Enables formula-to-output traceability — every computation output can reference the exact formula version that produced it.
- Essential for historical replay and formula drift detection.
- Nullable columns — zero impact on existing rows (backward compatible).
- Source: `fpe_formula_lock_schema_proposal_v1.md` §3 (Task R).

**Impact:** `91_metric_lineage_log` column count: +2. No structural changes to S00.

### D19-03: DI-56 — context_set + channel (DEFER TO V5)

**Decision:** Defer DI-56 to v5. Adopt Option B (status quo / direct assignment) for v1.

**Rationale:**
- S50 (Phase 13) and S60 (Phase 14) are both LOCKED. Unlocking introduces regression risk.
- Direct-assignment mechanism is functionally complete.
- Only 2 of ~8 Pattern #19 sections affected.
- Convenience loss, not functional defect.
- Option A (add `channel_id` to `context_set_members`) is appropriate for v5 when broader architectural improvements are planned.
- Source: `fpe_di56_decision_v1.md` (Task K).

**Impact:** No schema change. DI-56 status: OPEN → DEFERRED V5.

### D19-04: DI-54 — AI Research Engine (CLOSE)

**Decision:** Close DI-54 as RESOLVED. Accept the 3 deliverables produced by Task B. Apply the 5 `source_research_table` dropdown values as a data-level residual.

**Rationale:**
- Full architecture specification produced: prompt orchestration, source retrieval, confidence scoring (Rule 26), triangulation, multi-source resolution, population trigger, staleness detection, refresh cycle logic.
- 12-section integration map covers S10–S120 (86 researchable fields).
- Zero schema modifications — engine-side logic only.
- 5 dropdown values (capacity_research, manpower_research, opex_research, capex_research, working_capital_research) align with DI-52/DI-58 research table extensions.
- Source: `fpe_di54_resolution_note_v1.md` (Task B).

**Impact:** DI-54 status: URGENT → RESOLVED. 5 dropdown values added. Proposed DI-65.

### D19-05: DI-65 — Lineage Log Full Table Spec (REGISTER)

**Decision:** Register DI-65 as OPEN (LOW priority). Documentation debt — not a functional gap.

**Rationale:**
- `91_metric_lineage_log` is referenced by the research engine, S300 governance, and Rule 22, but its full column-level schema is not formally defined in the modular files.
- The table exists and operates correctly — this is documentation debt.
- Can be resolved in Phase 20 or deferred to V5.
- Source: `fpe_di54_resolution_note_v1.md` §5.2 (Task B).

**Impact:** 1 new DI registered. No schema change.

---

## Phase 17 Decisions — ALL LOCKED ✅

### D17-01: Period Expansion Model
Sequential per-period engine. `14_periods_master` drives horizon. Monthly base. Q/A = computed views (re-derive %, never average).

### D17-02: Dimension Collapsing Specification
5→4→3 key funnel. Step 1: collapse `channel_id`. Step 2: collapse `revenue_stream_id`. D17-02a: product packaging → CM1, delivery packaging → EBITDA.

### D17-03: Tax Model
Single effective rate (25.17% India FY26) + loss carry-forward. 3-way branch. Per f×m independent. V5: MAT/GST/multi-jurisdiction.

### D17-04: Working Capital Model
DSO (S40/08b), DPO (S100-06 `payment_terms_days`), DIO (system param 3d). NWC = AR + inventory − AP.

### D17-05: Output Enrichment
54 → 113 columns across 6 tables.

---

## Verification Patch Amendments (v4.5.12a — Session 17e)

| ID | Patch |
|---|---|
| VPA-01 | S50 field name: `projected_spend_inr` (not `resolved_monthly_spend_inr`) |
| VPA-02 | S50 grain: f×m×ch → channel-collapse + stream-revenue-share allocation |
| VPA-03 | CAC: consume `S50.blended_cac_inr` or NULL |
| VPA-04 | Campaign discount: default 0 + DI-64 |
| VPA-05 | S110/S120 stub reconciliation notes |

## Final Verification Patches (v4.5.12b — Session 17g)

| ID | Patch |
|---|---|
| P1 | `cost_driver_mode` value: `step_fixed` → `step_function` |
| P2 | S110 approval gate: `approval_status` → `capex_approved_flag = true` |
| P3 | S110 asset key: `asset_id` → `capex_asset_id` |
| P4 | S110 depreciation start: "month AFTER capex_date" → "from capex_date" |
| P5 | S120 drawdown amount: `disbursement_amount_inr` → `resolved_amount_inr` |
| P6 | S120 drawdown date: `disbursement_date` → `resolved_disbursement_date` |
| P7 | S120 processing fee: `processing_fee_inr` → `processing_fee_amount_inr` |
| P8 | S120 scope values: `company_wide`/`format_wide`/`specific_format_market` → `company`/`format`/`format_market` |
| P9 | S120↔S200 circular ref: 2-pass/3-iter/₹1K → 3-pass/2-iter/runway-triggered |

---

## Prior Phases (unchanged — see fpe_decision_log_v4511.md for D8–D16)

| Phase | Decisions | Status |
|---|---|---|
| 8–16 | D8-01 through D16-05 | LOCKED |
| 17 | D17-01–D17-05 + VPA-01–05 + P1–P9 | LOCKED — FINAL |
| **19** | **D19-01–D19-05** | **LOCKED — FINAL** |

---


================================================================================
<!-- MODULE: fpe_session_handoff_v10b.md -->
================================================================================

# FPE Session Handoff Document — v10b (FINAL)

Date: 2026-04-11
From: Phase 17 Sessions 17a–17g
Purpose: Enable Phase 18 (S300 Governance) — **all S200 sources fully verified**
Supersedes: `fpe_session_handoff_v10a.md`

---

## 1. SCHEMA STATUS: v4.5.12b — PHASE 17 FINAL ✅

All driver sections S10–S120 + S200 Finance Stack LOCKED. Every upstream source field verified against canonical locked specs.

### Verification Status — ALL GREEN

| Source | Spec Verified Against | Status |
|---|---|---|
| S40 Channel | Phase 12 locked (05_S40_channel.md) | ✅ |
| S50 Marketing | Phase 13 locked (06_S50_marketing.md) | ✅ + 4 patches applied |
| S60 Demand | Phase 14 locked (07_S60_demand.md) | ✅ |
| S70 Product Econ | Phase 9 locked (08_S70_product_economics.md) | ✅ |
| S90 Manpower | Phase 15 locked (10_S90_manpower.md) | ✅ |
| S100 OpEx | **Phase 16 full spec** (fpe_s100_opex_strategy_spec_v1.md) | ✅ |
| S110 CapEx | **Phase 16 full spec** (fpe_s110_capex_strategy_spec_v1.md) | ✅ + 4 patches applied |
| S120 Capital | **Phase 16 full spec** (fpe_s120_capital_strategy_spec_v1.md) | ✅ + 5 patches applied |

**Zero conditional items remain. Zero unverified field names.**

---

## 2. PHASE 18 — S300 GOVERNANCE

| DI | Description |
|---|---|
| **DI-62** | S300 structured warning registry — 32 G-FIN + 25 section warnings |
| **DI-64** | S50 campaign discount routing — resolve source or confirm zero |

Open DIs not for Phase 18: DI-48 (V5), DI-49 (V5), DI-54 (Spec B), DI-56 (post-lock).

---

## 3. CANONICAL FILES (use ONLY these)

| File | Version | Location |
|---|---|---|
| **`14_S200_finance_v3.md`** | v4.5.12b FINAL | `/FPE/Phase_17_v4.5.12/Session_17g/` |
| **`fpe_decision_log_v4512b.md`** | v4.5.12b FINAL | `/FPE/Phase_17_v4.5.12/Session_17g/` |
| **`92_deferred_impacts_v4512b.md`** | v4.5.12b FINAL | `/FPE/Phase_17_v4.5.12/Session_17g/` |
| **`fpe_session_handoff_v10b.md`** | v10b FINAL | `/FPE/Phase_17_v4.5.12/Session_17g/` |

---

## 4. PHASE 17 FINAL NUMBERS

| Metric | Value |
|---|---|
| Schema | v4.5.12b |
| Sessions | 7 (17a–17g) |
| Tables | 6 enriched (S200-01 through S200-06) |
| Columns | 54 → 113 |
| Decisions | 5 (D17-01–D17-05) |
| Verification patches | 14 total (VPA-01–05 + P1–P9) |
| DIs resolved | 6 |
| DIs opened | 1 (DI-64) |
| G-FIN warnings | 32 |
| Source fields verified | 17/17 (all green) |
| Files produced | 25+ |

---

*End of Handoff v10b — Phase 17 CLOSED. All sources verified. Ready for Phase 18.*
