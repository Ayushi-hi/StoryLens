# StoryLens — AI-Powered Data Storytelling for Big Data Visualization

StoryLens is an interactive eCommerce analytics and data storytelling application designed to help non-technical stakeholders understand large datasets. It combines verified numerical analysis, visualizations, and plain-language explanations to communicate what happened, why a finding matters, and what should be investigated next.

> **Research status:** The application includes a study design comparing traditional dashboards with storytelling-enhanced dashboards. No participant outcomes or hypothesis confirmations are claimed until real study data has been collected and analyzed.

## Project overview

Traditional dashboards present charts and metrics, but users may struggle to interpret their implications. StoryLens explores whether adding a short, verified narrative improves comprehension, response time, and confidence.

The application analyzes the **October 2019 Kaggle eCommerce Behavior Data from Multi-Category Store** dataset, containing **42,448,764 recorded events**. Events include product views, cart additions, and purchases. Event counts are **not** counts of unique shoppers.

## Features

| Module | Purpose |
| --- | --- |
| **Overview** | Summary KPI cards, daily event trends, and event distribution. |
| **User Journey** | Event-count funnel from product views to cart additions and purchases, including continuation and drop-off percentages. |
| **Story Mode** | Three template-based narratives organized as **WHAT / SO WHAT / NOW WHAT** using verified statistics. |
| **AI Insights** | Rule-detected patterns, supporting evidence, template-based explanations, and suggested investigations. |
| **Explore Data** | Filterable category/product exploration with search, event type, brand, date, and price controls. |
| **Traditional vs Storytelling** | Side-by-side comparison of metric-only and narrative-enhanced presentation. |
| **Research Mode** | Interface for the planned controlled user study. |
| **Methodology** | Explanation of the data-to-story pipeline and its safeguards. |

## Technology stack

- **Backend:** Python, FastAPI
- **Data processing and storage:** CSV-to-Parquet conversion
- **Analytics:** DuckDB and SQL aggregations
- **Frontend:** React-based interface with Vite development server
- **Narratives:** Verified-metric templates in the regular application; human-reviewed AI-generated narratives prepared for the study

## System architecture

```text
Kaggle eCommerce CSV (October 2019)
                |
                v
        Python processing
                |
                v
          Parquet files
                |
                v
     DuckDB + parameterized SQL
                |
                v
       Verified aggregations
                |
         +------+------+
         |             |
         v             v
   Pattern detection   FastAPI responses
         |             |
         v             |
  Narrative templates  |
         +------+------+
                |
                v
     React dashboard / charts

Study narratives: verified metrics -> AI draft -> checks -> human review
```

**Separation of responsibilities:** The analytics layer establishes numerical facts. The language-generation layer explains verified facts; it is not responsible for calculating the underlying metrics.

## Dataset and metrics

**Source:** Kaggle, *eCommerce Behavior Data from Multi-Category Store*, October 2019.

The application's screenshots display these metrics (rounded where noted):

| Metric | Value |
| --- | ---: |
| Total events | 42,448,764 |
| Product views | 40,779,399 |
| Cart additions | 926,516 |
| Purchases | 742,849 |
| Purchase events / view events | 1.82% |
| View-to-cart event-count drop-off | 97.7% |
| Cart-to-purchase event-count ratio | 80.2% |
| Highest category conversion shown | Smartphone, 3.18% |
| Lowest category conversion shown | Shoes, 0.56% |

The funnel compares **aggregate event counts**, not tracked user sessions or individual customer journeys. Therefore, it should not be interpreted as a causal or session-based conversion funnel. The October 2019 file contains no `remove_from_cart` events; this does not establish that shoppers never removed items from carts.

### Example calculations

```text
Purchase-to-view event ratio = purchases / views * 100
                             = 742,849 / 40,779,399 * 100
                             ≈ 1.82%

View-to-cart drop-off = (views - cart additions) / views * 100
                      ≈ 97.7%
```

## Storytelling framework

Each story answers three questions:

1. **WHAT?** What do the verified numbers show?
2. **SO WHAT?** Why is the observed pattern relevant?
3. **NOW WHAT?** What could be investigated next, without inventing causes?

For example, the system can identify that the largest aggregate funnel reduction is between product views and cart additions, then suggest comparing this pattern across categories, brands, and time periods. The dataset alone cannot explain *why* the reduction occurred.

### Safeguards and limitations

The study narrative workflow includes numerical checks, restricted wording, fixed limitation statements, fallback behavior, and human review. These safeguards can detect some invented numbers or prohibited phrases, but **cannot guarantee semantic accuracy or prevent every misleading interpretation**. The ordinary Story Mode and Insights views use templates derived from verified metrics; they should not be described as raw, live LLM output.

## Running locally

### Prerequisites

- Python and a working virtual environment
- Node.js and npm
- Required Python and frontend dependencies installed
- Project data prepared according to the repository's processing scripts

### 1. Start the backend

From the project root in PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API documentation (when the backend is running): **http://127.0.0.1:8000/docs**

### 2. Start the frontend

Open another terminal in the project root. Enter the directory containing the frontend `package.json` (often `frontend`):

```powershell
cd frontend
npm install
npm run dev
```

The shared screenshots show the frontend running at **http://localhost:5173**. If Vite prints a different local address, use the address shown in your terminal.

> **Configuration:** Confirm the frontend's backend API URL and the repository's environment variables before running. Exact environment variable names and data preparation commands should be copied from the source repository rather than guessed.

## Research design

**Research question:** Does adding a short, verified narrative improve comprehension, task completion speed, and confidence compared with charts and numerical metrics alone?

### Hypotheses (not findings)

- **H1:** Storytelling improves comprehension.
- **H2:** Storytelling reduces response time.
- **H3:** Storytelling increases reported confidence.

### Experimental conditions

- **TRADITIONAL:** Charts and metric tiles.
- **STORYTELLING:** The same charts and metric tiles plus an approved narrative.

The planned study uses a **between-subjects** design with balanced assignment. Participants complete four tasks: identifying a purchase trend, identifying the highest-conversion category, identifying the biggest drop-off, and choosing what to investigate next. Comprehension, time per task, and confidence (1–5) are recorded.

### Planned analysis

- Primary outcome: proportion of correct answers per participant.
- Account for repeated tasks within participants; do not treat four answers from one participant as four independent participants.
- Analyze time appropriately (e.g., log transformation) and confidence as ordinal data.
- Report effect sizes and confidence intervals alongside statistical tests.
- Determine sample size using a power analysis; a practical minimum of 20 completed participants per condition is **not** a statistically justified sample size.

**Study results:** `[PENDING REAL PARTICIPANT DATA]`

## Research limitations

- Adding a narrative also adds information, so any measured difference may not be due to narrative form alone.
- The story may spell out derived percentages that the traditional condition presents only as metrics.
- The fourth task's answer options may resemble the story's “NOW WHAT” suggestion.
- Fixed task order, a convenience sample, and a single month/domain limit generalizability.
- Event-count ratios are not session-based customer conversion rates.
- The dataset cannot establish why customers behave as they do.
- The file contains no recorded remove-from-cart events.
- Findings may differ with other AI models, prompts, or narrative editing decisions.

## Future work

- Build session-based funnels and analyze more months.
- Randomize task order and recruit more diverse participants.
- Evaluate other domains and different narrative styles.
- Test additional model/prompt combinations and strengthen semantic validation.

## Project status

- **Dashboard and visualizations:** Demonstrated in the shared application screenshots.
- **Research interface:** Present in application navigation; end-to-end study operation not independently verified here.
- **Controlled study outcomes:** Not yet reported.

## Acknowledgments

The project uses the Kaggle eCommerce Behavior Data from Multi-Category Store dataset. Add the dataset's exact URL, creator attribution, license information, and any third-party libraries or model credits after checking the original sources.

---

**StoryLens: Verified facts first. Understandable explanations second.**
