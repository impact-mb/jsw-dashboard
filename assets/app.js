
const state = {
  data: null,
  mode: "cumulative",
  filters: {
    period: "All",
    region: "All",
    state: "All",
    district: "All"
  }
};

const $ = (id) => document.getElementById(id);

const elements = {
  monthlyBtn: $("monthlyBtn"),
  cumulativeBtn: $("cumulativeBtn"),
  monthlyEmpty: $("monthlyEmpty"),
  dashboardContent: $("dashboardContent"),
  periodFilter: $("periodFilter"),
  regionFilter: $("regionFilter"),
  stateFilter: $("stateFilter"),
  districtFilter: $("districtFilter"),
  resetFilters: $("resetFilters"),
  lastUpdated: $("lastUpdated"),
  reportingPeriod: $("reportingPeriod"),

  kpiCommunities: $("kpiCommunities"),
  kpiSchools: $("kpiSchools"),
  kpiLsAchieved: $("kpiLsAchieved"),
  kpiClcAchieved: $("kpiClcAchieved"),
  kpiHouseVisits: $("kpiHouseVisits"),
  kpiEventsDelivered: $("kpiEventsDelivered"),
};

const chartIds = [
  "communitiesChart",
  "schoolsChart",
  "lsOutreachChart",
  "lsGenderChart",
  "lsSessionChart",
  "lsAttendanceChart",
  "clcOutreachChart",
  "clcGenderChart",
  "clcSessionChart",
  "clcLevelsChart",
  "houseVisitChart",
  "parentsChart",
  "eventsChart",
  "balpanchayatChart"
];

const charts = {};
chartIds.forEach(id => charts[id] = echarts.init($(id)));

function formatNumber(v) {
  return Number(v || 0).toLocaleString("en-IN");
}

function unique(values) {
  return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function rowsForMode() {
  return state.data?.[state.mode] || [];
}

function rowPasses(row, ignoreKey = null) {
  return Object.entries(state.filters).every(([key, value]) => {
    if (key === ignoreKey || value === "All") return true;
    return row[key] === value;
  });
}

function filteredRows(ignoreKey = null) {
  return rowsForMode().filter(row => rowPasses(row, ignoreKey));
}

function fillSelect(select, values, selected) {
  select.innerHTML = "";

  ["All", ...values].forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
    select.appendChild(option);
  });
}

function refreshFilters() {
  const mapping = {
    period: elements.periodFilter,
    region: elements.regionFilter,
    state: elements.stateFilter,
    district: elements.districtFilter
  };

  for (const [key, select] of Object.entries(mapping)) {
    const values = unique(filteredRows(key).map(row => row[key]));

    if (!["All", ...values].includes(state.filters[key])) {
      state.filters[key] = "All";
    }

    fillSelect(select, values, state.filters[key]);
  }
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function districts(rows) {
  return rows.map(row => row.district);
}

function baseBarOption(categories, series, opts = {}) {
  return {
    animationDuration: 450,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    legend: series.length > 1 ? { top: 2 } : undefined,
    grid: {
      left: 48,
      right: 18,
      top: series.length > 1 ? 40 : 22,
      bottom: 44
    },
    xAxis: {
      type: "category",
      data: categories,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d7dde7" } },
      axisLabel: { color: "#5f697a", interval: 0 }
    },
    yAxis: {
      type: "value",
      max: opts.max,
      axisLabel: {
        color: "#7a8496",
        formatter: opts.percent ? "{value}%" : "{value}"
      },
      splitLine: { lineStyle: { color: "#edf0f5" } }
    },
    series: series.map(s => ({
      ...s,
      type: "bar",
      barMaxWidth: 46,
      emphasis: { focus: "series" },
      itemStyle: { borderRadius: [7, 7, 0, 0] },
      label: {
        show: true,
        position: "top",
        formatter: p => opts.percent ? `${p.value}%` : formatNumber(p.value)
      }
    }))
  };
}

function stacked100Option(categories, series) {
  return {
    animationDuration: 450,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: value => `${value}%`
    },
    legend: { top: 2 },
    grid: { left: 50, right: 18, top: 40, bottom: 44 },
    xAxis: {
      type: "category",
      data: categories,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d7dde7" } },
      axisLabel: { color: "#5f697a", interval: 0 }
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLabel: { formatter: "{value}%", color: "#7a8496" },
      splitLine: { lineStyle: { color: "#edf0f5" } }
    },
    series: series.map(s => ({
      ...s,
      type: "bar",
      stack: "total",
      barMaxWidth: 72,
      emphasis: { focus: "series" }
    }))
  };
}

function render() {
  const modeRows = rowsForMode();

  if (state.mode === "monthly" && modeRows.length === 0) {
    elements.monthlyEmpty.classList.remove("hidden");
    elements.dashboardContent.classList.add("hidden");
    return;
  }

  elements.monthlyEmpty.classList.add("hidden");
  elements.dashboardContent.classList.remove("hidden");

  refreshFilters();

  const rows = filteredRows();
  const cats = districts(rows);

  // KPIs
  elements.kpiCommunities.textContent = formatNumber(sum(rows, "communities"));
  elements.kpiSchools.textContent = formatNumber(sum(rows, "schools"));
  elements.kpiLsAchieved.textContent = formatNumber(sum(rows, "ls_achieved"));
  elements.kpiClcAchieved.textContent = formatNumber(sum(rows, "clc_achieved"));
  elements.kpiHouseVisits.textContent = formatNumber(sum(rows, "house_visits"));
  elements.kpiEventsDelivered.textContent = formatNumber(sum(rows, "events_delivered"));

  // Coverage
  charts.communitiesChart.setOption(
    baseBarOption(cats, [{ name: "Communities", data: rows.map(r => r.communities) }]),
    true
  );

  charts.schoolsChart.setOption(
    baseBarOption(cats, [{ name: "Schools", data: rows.map(r => r.schools) }]),
    true
  );

  // Life Skills
  charts.lsOutreachChart.setOption(
    baseBarOption(cats, [
      { name: "Target", data: rows.map(r => r.ls_target) },
      { name: "Achieved", data: rows.map(r => r.ls_achieved) }
    ]),
    true
  );

  const lsGenderPct = rows.map(r => {
    const total = Number(r.ls_boys || 0) + Number(r.ls_girls || 0);
    return {
      boys: total ? (r.ls_boys / total) * 100 : 0,
      girls: total ? (r.ls_girls / total) * 100 : 0
    };
  });

  charts.lsGenderChart.setOption(
    stacked100Option(cats, [
      { name: "Boys", data: lsGenderPct.map(x => +x.boys.toFixed(1)) },
      { name: "Girls", data: lsGenderPct.map(x => +x.girls.toFixed(1)) }
    ]),
    true
  );

  charts.lsSessionChart.setOption(
    stacked100Option(cats, [
      { name: "0", data: rows.map(r => r.ls_session_0_pct) },
      { name: "1–2", data: rows.map(r => r.ls_session_1_2_pct) },
      { name: "3 & above", data: rows.map(r => r.ls_session_3_plus_pct) }
    ]),
    true
  );

  charts.lsAttendanceChart.setOption(
    baseBarOption(
      cats,
      [{ name: "Attended at least 1 session", data: rows.map(r => r.ls_attended_pct) }],
      { percent: true, max: 100 }
    ),
    true
  );

  // CLC
  charts.clcOutreachChart.setOption(
    baseBarOption(cats, [
      { name: "Target", data: rows.map(r => r.clc_target) },
      { name: "Achieved", data: rows.map(r => r.clc_achieved) }
    ]),
    true
  );

  const clcGenderPct = rows.map(r => {
    const total = Number(r.clc_boys || 0) + Number(r.clc_girls || 0);
    return {
      boys: total ? (r.clc_boys / total) * 100 : 0,
      girls: total ? (r.clc_girls / total) * 100 : 0
    };
  });

  charts.clcGenderChart.setOption(
    stacked100Option(cats, [
      { name: "Boys", data: clcGenderPct.map(x => +x.boys.toFixed(1)) },
      { name: "Girls", data: clcGenderPct.map(x => +x.girls.toFixed(1)) }
    ]),
    true
  );

  charts.clcSessionChart.setOption(
    stacked100Option(cats, [
      { name: "0", data: rows.map(r => r.clc_session_0_pct) },
      { name: "1–4", data: rows.map(r => r.clc_session_1_4_pct) },
      { name: "5 & above", data: rows.map(r => r.clc_session_5_plus_pct) }
    ]),
    true
  );

  charts.clcLevelsChart.setOption(
    baseBarOption(cats, [
      { name: "Level 1", data: rows.map(r => r.clc_level_1) },
      { name: "Level 2", data: rows.map(r => r.clc_level_2) },
      { name: "Level 3", data: rows.map(r => r.clc_level_3) }
    ]),
    true
  );

  // Engagement
  charts.houseVisitChart.setOption(
    baseBarOption(cats, [{ name: "House visits", data: rows.map(r => r.house_visits) }]),
    true
  );

  charts.parentsChart.setOption(
    baseBarOption(cats, [{ name: "Parents engaged", data: rows.map(r => r.parents_engaged) }]),
    true
  );

  charts.eventsChart.setOption(
    baseBarOption(cats, [
      { name: "Planned", data: rows.map(r => r.events_planned) },
      { name: "Delivered", data: rows.map(r => r.events_delivered) }
    ]),
    true
  );

  charts.balpanchayatChart.setOption(
    baseBarOption(cats, [
      { name: "Planned", data: rows.map(r => r.balpanchayat_meetings_planned) },
      { name: "Held", data: rows.map(r => r.balpanchayat_meetings_held) }
    ]),
    true
  );
}

function setMode(mode) {
  state.mode = mode;
  state.filters = { period: "All", region: "All", state: "All", district: "All" };

  elements.monthlyBtn.classList.toggle("active", mode === "monthly");
  elements.cumulativeBtn.classList.toggle("active", mode === "cumulative");

  render();
}

elements.monthlyBtn.addEventListener("click", () => setMode("monthly"));
elements.cumulativeBtn.addEventListener("click", () => setMode("cumulative"));

[
  ["period", elements.periodFilter],
  ["region", elements.regionFilter],
  ["state", elements.stateFilter],
  ["district", elements.districtFilter]
].forEach(([key, select]) => {
  select.addEventListener("change", event => {
    state.filters[key] = event.target.value;
    render();
  });
});

elements.resetFilters.addEventListener("click", () => {
  state.filters = { period: "All", region: "All", state: "All", district: "All" };
  render();
});

document.querySelectorAll("[data-scroll]").forEach(button => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scroll);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

window.addEventListener("resize", () => {
  Object.values(charts).forEach(chart => chart.resize());
});

fetch("data/dashboard.json")
  .then(response => {
    if (!response.ok) throw new Error("Could not load dashboard.json");
    return response.json();
  })
  .then(data => {
    state.data = data;
    elements.lastUpdated.textContent = data.meta?.last_updated || "—";
    elements.reportingPeriod.textContent =
      `Reporting period: ${data.meta?.reporting_period || "—"}`;

    render();
  })
  .catch(error => {
    console.error(error);
    document.body.innerHTML = `
      <div style="padding:40px;font-family:Arial,sans-serif">
        <h2>Dashboard could not load</h2>
        <p>${error.message}</p>
        <p>Open the project through a web server or GitHub Pages, not directly as a local file.</p>
      </div>
    `;
  });
