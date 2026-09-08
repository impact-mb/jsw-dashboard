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
   "Notes will be added later."

## Files
- index.html -> Monthly
- cumulative.html -> Cumulative
- assets/styles.css
- assets/dashboard.js
- data/monthly_data.csv
- data/cumulative_data.csv

Keep your logo files:
- assets/images/magicbus_logo.png
- assets/images/logo_jsw.png

## Local test

From the repository root:

python -m http.server 8000

Open:

http://localhost:8000/
