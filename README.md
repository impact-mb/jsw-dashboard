# JSW Dashboard - Design v2

## Changes in this version

1. Gridlines removed from all charts.
2. Every chart has an Export menu:
   - Download PNG
   - Download CSV for the currently filtered chart data
3. Print/PDF layout redesigned for A4 landscape:
   - filters hidden
   - applied filters printed in a compact summary
   - export buttons hidden
   - flat report-style cards
   - smaller charts
   - controlled page breaks
4. Notes footer section added with placeholder text:
   - "Notes will be added later."
5. Historical monthly and cumulative data added for:
   - Dolvi
   - Vasind
   - Kalmeshwar
6. Cumulative dashboard enhanced with:
   - Financial Year filter
   - Reporting Period filter
   - Region filter
   - State filter
   - District filter
   - Reset Filters button
7. Monthly and cumulative dashboards are maintained separately while using a common visual design.
8. JSW logo presentation updated for better visibility and balance in the dashboard header.

## Files

- `index.html` -> Monthly Dashboard
- `cumulative.html` -> Cumulative Dashboard
- `assets/styles.css`
- `assets/dashboard.js`
- `assets/cumulative.js`
- `data/monthly_data.csv`
- `data/cumulative_data.csv`

Keep the logo files:

- `assets/images/magicbus_logo.png`
- `assets/images/logo_jsw.png`

## Data Update Approach

The dashboard is designed so that the visual structure and chart logic remain fixed.

For future reporting periods, approved data can be appended to:

- `data/monthly_data.csv` for monthly reporting
- `data/cumulative_data.csv` for cumulative reporting

This reduces the need to rebuild or reconfigure the dashboard for each reporting cycle.

## Data Privacy and DPDP Controls

This repository is intended to contain only approved, aggregated programme reporting data.

No child-level or personally identifiable information should be published in this repository.

### Data that must not be uploaded

- Beneficiary or child names
- Child IDs or registration IDs
- Aadhaar or other government identifiers
- Phone numbers
- Email addresses
- Date of birth
- Full residential addresses
- Individual attendance records
- Case-level beneficiary records
- Any other field that can directly identify an individual

### Publication Principle

Only aggregated data at approved reporting levels such as Financial Year, Reporting Period, Region, State and District should be published.

Raw and individual-level source data must remain within authorised internal systems and must not be uploaded to the public GitHub repository.

### Pre-Publication Privacy Check

Before any new dataset is pushed to this repository, it should be checked for:

1. Personal identifiers
2. Individual-level records
3. Unnecessary personal or sensitive fields
4. Small-cell disclosure or re-identification risk
5. Correct aggregation level
6. Correct reporting period and geography
7. Removal of temporary or raw source columns

## Important

GitHub is being used only as the presentation and version-control layer for approved aggregated reporting data.

Publication of any dataset should continue to follow the organisation's internal data governance, information security and DPDP compliance requirements.

## Local Test

From the repository root:

```bash
python -m http.server 8000
```

Open the Monthly Dashboard:

```text
http://localhost:8000/
```

Open the Cumulative Dashboard:

```text
http://localhost:8000/cumulative.html
```

## Live Dashboard

Monthly Dashboard:

```text
https://impact-mb.github.io/jsw-dashboard/
```

Cumulative Dashboard:

```text
https://impact-mb.github.io/jsw-dashboard/cumulative.html
```

## Version Control

All dashboard code, design and approved data updates should be committed through Git so that changes remain traceable and previous versions can be reviewed or restored when required.
