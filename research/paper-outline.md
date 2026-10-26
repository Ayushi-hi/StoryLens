# Paper outline: The Role of Data Storytelling in Big Data Visualization for Non-Technical Stakeholders

Rule for every section: report only what was measured. Results stay as placeholders until real participants exist.

## Abstract (write last)
Problem, approach (verified analytics plus human-reviewed narratives), study design, main findings [FROM DATA], limitations.

## 1. Introduction
- Big data dashboards show numbers, but non-technical readers often cannot tell what the numbers mean.
- Research question: does adding a short, verified narrative improve comprehension, speed and confidence compared with charts and numbers alone?
- Hypotheses H1 (comprehension), H2 (time), H3 (confidence). State them as hypotheses.
- Contribution: a pipeline where analytics establishes facts and an AI only explains them, plus a controlled user study.

## 2. Related work (find and verify your own sources)
- Narrative visualization and data storytelling.
- Automatic insight generation and natural-language descriptions of charts.
- Large language models for data explanation, and their risk of invented numbers and causes.
- Evaluating visualization comprehension with non-expert users.
Check every citation yourself before using it.

## 3. System (maps to the app)
| Section | App feature |
|---|---|
| 3.1 Data and processing | Kaggle eCommerce events, October 2019, 42,448,764 events; CSV to Parquet; DuckDB aggregates; aggregate table verified against raw counts |
| 3.2 Analytics layer | Funnel, category conversion, trend; parameterized SQL |
| 3.3 Story generation | WHAT / SO WHAT / NOW WHAT; model and prompt version; number check, banned phrases, fixed limitations; fallback |
| 3.4 Safeguards and their limits | Checks verify numbers and some wording, not meaning; examples of failures found during development |
| 3.5 Interface | Overview, User Journey, Story Mode, Insights, Explore |

Be explicit: only the study stories were AI-written. Story Mode and Insights use templates from verified numbers. The study stories were human-edited, so describe them as human-reviewed AI-generated narratives, not as raw AI output.

## 4. Method
### 4.1 Design
Between-subjects, two conditions (TRADITIONAL, STORYTELLING), balanced assignment.
### 4.2 Participants
[N per group] recruited from [SOURCE]. Inclusion criteria, non-technical definition, compensation, ethics approval number [FILL].
### 4.3 Materials
Same charts and metric tiles in both conditions. STORYTELLING adds the approved story. Model, prompt version, edit rounds, number of sentences changed.
### 4.4 Tasks
T1 purchase trend, T2 highest-conversion category, T3 biggest drop-off, T4 what to investigate next. Correct answers for T1 to T3 computed from the data. T4 scored by rubric. Every task has an "I can't tell" option.
### 4.5 Measures
Comprehension (correct answers), time per task, confidence (1 to 5).
### 4.6 Procedure
Consent, assignment, four tasks in fixed order, confidence after each, no feedback on correctness.

## 5. Analysis plan (fix this before collecting data)
- Primary outcome: proportion correct per participant.
- Tasks are repeated measures per participant, so analyze per participant or use a mixed model, not 4 independent observations.
- Time: log-transform; compare conditions with a suitable test.
- Confidence: ordinal; use a rank-based test or ordinal model.
- Report effect sizes and confidence intervals, not only p-values.
- Sample size: do a power analysis. The app's minimum of 20 finished per group is a practical floor, not a justified sample size.
- Consider preregistering hypotheses and analysis.

## 6. Results (placeholders only)
- 6.1 Participants: N per group, completion rate [FROM /api/research/results].
- 6.2 Comprehension: [TABLE FROM export.csv].
- 6.3 Time: [TABLE].
- 6.4 Confidence: [TABLE].
- 6.5 Per-task breakdown: [TABLE].
- 6.6 Optional reasons given for T4: [QUALITATIVE SUMMARY].
Write nothing here until data exists.

## 7. Discussion
- Which hypotheses were supported, not supported, or undetermined, using only the measured results.
- Why the result may have occurred, labelled as interpretation.
- Link to the system finding: automated checks caught invented numbers but missed misleading wording, so human review stayed necessary.

## 8. Limitations (write these honestly)
- The STORYTELLING condition contains more information (the story), so a difference may come from the extra content, not from narrative form.
- Story text includes derived numbers (for example percentages) that the Traditional group sees only as tiles.
- T4 options resemble the story's NOW WHAT sentence.
- Fixed task order, one dataset month, convenience sample, small sample.
- Counts are events, not shoppers. The dataset cannot explain why people act as they do.
- October 2019 has no remove-from-cart events, which is a property of the file.
- Model-specific: results may differ with other models or prompts.

## 9. Conclusion
What was built, what was found [FROM DATA], what to do next (session-based funnels, more months, randomized task order, other domains).

## Appendices
A. Tasks and answer options. B. The three study stories, original and final text. C. Prompt and checks. D. Consent text. E. Data export format.
