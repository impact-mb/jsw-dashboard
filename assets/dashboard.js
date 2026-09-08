
const PAGE_MODE = document.body.dataset.mode;
const DATA_FILE = document.body.dataset.file;

const FY_MONTHS = [
  "April","May","June","July","August","September",
  "October","November","December","January","February","March"
];

const COLORS = {
  target:"#94a3b8",
  achieved:"#173f93",
  boys:"#3b82f6",
  girls:"#ec4899",
  community:"#f59e0b",
  school:"#173f93",
  ls0:"#dbeafe",
  ls12:"#60a5fa",
  ls3:"#1d4ed8",
  clc0:"#dcfce7",
  clc14:"#4ade80",
  clc5:"#15803d",
  planned:"#94a3b8",
  delivered:"#173f93",
  single:"#173f93"
};

const state = {
  data:[],
  fy:null,
  months:[],
  region:"All",
  stateName:"All",
  districts:[]
};

const $ = id => document.getElementById(id);

const chartIDs = [
  "communityChart",
  "schoolChart",
  "lsOutreachChart",
  "lsGenderChart",
  "lsAttendanceChart",
  "clcOutreachChart",
  "clcGenderChart",
  "clcAttendanceChart",
  "lsDistributionChart",
  "clcDistributionChart",
  "houseVisitsChart",
  "eventsChart",
  "parentsChart",
  "balPanchayatChart",
  "educatorTrainingChart",
  "sustainabilityChart"
];

const charts = {};

chartIDs.forEach(id=>{
  charts[id] = echarts.init($(id), null, { renderer:"svg" });
});

/* ============================================================
   HELPERS
============================================================ */

function numberValue(value){
  if(value===null || value===undefined || value==="") return null;

  const x = Number(
    String(value)
      .replace(/,/g,"")
      .trim()
  );

  return Number.isFinite(x) ? x : null;
}

function formatNumber(value){
  return Number(value || 0).toLocaleString("en-IN");
}

function percentage(value){
  return `${Number(value || 0).toFixed(1)}%`;
}

function unique(values){
  return [...new Set(
    values.filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    )
  )].sort((a,b)=>String(a).localeCompare(String(b)));
}

function monthSort(a,b){
  return FY_MONTHS.indexOf(a) - FY_MONTHS.indexOf(b);
}

function fyRows(){
  return state.data.filter(row => row.fy === state.fy);
}

function availableMonths(){
  return unique(
    fyRows().map(row=>row.month)
  ).sort(monthSort);
}

function monthRows(){
  if(state.months.length===0) return fyRows();

  return fyRows().filter(
    row => state.months.includes(row.month)
  );
}

function filteredRows(){
  let rows = monthRows();

  if(state.region !== "All"){
    rows = rows.filter(row=>row.region===state.region);
  }

  if(state.stateName !== "All"){
    rows = rows.filter(row=>row.state===state.stateName);
  }

  if(state.districts.length){
    rows = rows.filter(
      row=>state.districts.includes(row.district)
    );
  }

  return rows;
}

function categories(rows){
  const multipleMonths = state.months.length > 1;

  return rows.map(row=>{
    if(multipleMonths){
      return `${row.district} • ${row.month.slice(0,3)}`;
    }
    return row.district;
  });
}

function hasData(rows, columns){
  return rows.some(
    row => columns.some(
      column => numberValue(row[column]) !== null
    )
  );
}

/* ============================================================
   STANDARD BAR CHART
============================================================ */

function barOption(labels, series, isPercent=false){

  return {
    animationDuration:350,

    tooltip:{
      trigger:"axis",
      axisPointer:{type:"shadow"}
    },

    legend:
      series.length > 1
      ? {top:2}
      : undefined,

    grid:{
      left:52,
      right:18,
      top:series.length>1 ? 42 : 24,
      bottom:50
    },

    xAxis:{
      type:"category",
      data:labels,
      axisTick:{show:false},
      axisLabel:{
        interval:0,
        fontSize:10,
        color:"#5f697a"
      }
    },

    yAxis:{
      type:"value",
      max:isPercent ? 100 : undefined,
      axisLabel:{
        formatter:isPercent ? "{value}%" : "{value}",
        color:"#7a8496"
      },
      splitLine:{show:false}
    },

    series:series.map(item=>({

      name:item.name,

      type:"bar",

      data:item.data,

      barMaxWidth:44,

      itemStyle:{
        color:item.color,
        borderRadius:[6,6,0,0]
      },

      label:{
        show:true,
        position:"top",
        fontSize:9,
        formatter:
          parameter =>
            isPercent
            ? percentage(parameter.value)
            : formatNumber(parameter.value)
      }

    }))
  };
}

/* ============================================================
   100% STACKED
============================================================ */

function stackedOption(labels, series){

  return {
    animationDuration:350,

    tooltip:{
      trigger:"axis",
      axisPointer:{type:"shadow"}
    },

    legend:{top:2},

    grid:{
      left:52,
      right:18,
      top:42,
      bottom:50
    },

    xAxis:{
      type:"category",
      data:labels,
      axisTick:{show:false},
      axisLabel:{
        interval:0,
        fontSize:10,
        color:"#5f697a"
      }
    },

    yAxis:{
      type:"value",
      max:100,
      axisLabel:{
        formatter:"{value}%",
        color:"#7a8496"
      },
      splitLine:{show:false}
    },

    series:series.map(item=>({

      name:item.name,

      type:"bar",

      stack:"total",

      data:item.data,

      barMaxWidth:70,

      itemStyle:{
        color:item.color
      },

      label:{
        show:true,
        fontSize:9,

        formatter:
          parameter =>
            parameter.value >= 8
            ? `${Number(parameter.value).toFixed(0)}%`
            : ""
      }

    }))
  };
}

/* ============================================================
   GENDER - STANDARD COLOR
   Boys = Blue
   Girls = Pink
============================================================ */

function genderChart(rows, boysColumn, girlsColumn){

  const labels = categories(rows);

  const boysPercent = [];
  const girlsPercent = [];

  rows.forEach(row=>{

    const boys = numberValue(row[boysColumn]) || 0;
    const girls = numberValue(row[girlsColumn]) || 0;

    const total = boys + girls;

    boysPercent.push(
      total
      ? Number((boys / total * 100).toFixed(1))
      : 0
    );

    girlsPercent.push(
      total
      ? Number((girls / total * 100).toFixed(1))
      : 0
    );
  });

  const option = stackedOption(
    labels,
    [
      {
        name:"Boys",
        data:boysPercent,
        color:COLORS.boys
      },
      {
        name:"Girls",
        data:girlsPercent,
        color:COLORS.girls
      }
    ]
  );

  option.tooltip.formatter = params => {

    const index = params[0]?.dataIndex ?? 0;
    const row = rows[index];

    const boys = numberValue(row[boysColumn]) || 0;
    const girls = numberValue(row[girlsColumn]) || 0;

    const total = boys + girls;

    return `
      <strong>${params[0]?.axisValue || ""}</strong><br>
      <span style="color:${COLORS.boys}">●</span>
      Boys: ${formatNumber(boys)}
      (${total ? percentage(boys/total*100) : "0%"})
      <br>

      <span style="color:${COLORS.girls}">●</span>
      Girls: ${formatNumber(girls)}
      (${total ? percentage(girls/total*100) : "0%"})
      <br>

      <strong>Total: ${formatNumber(total)}</strong>
    `;
  };

  return option;
}

/* ============================================================
   NO DATA
============================================================ */

function showNoData(
  chartName,
  message="No data available in this data file"
){

  charts[chartName].clear();

  charts[chartName].setOption({

    graphic:[
      {
        type:"text",
        left:"center",
        top:"middle",

        style:{
          text:message,
          fill:"#6c7688",
          font:"12px Segoe UI"
        }
      }
    ]
  });
}

/* ============================================================
   SINGLE INDICATOR
============================================================ */

function drawSingleIndicator(
  rows,
  labels,
  chartID,
  column,
  name
){

  if(hasData(rows,[column])){

    charts[chartID].setOption(
      barOption(
        labels,
        [
          {
            name:name,
            data:rows.map(
              row=>numberValue(row[column]) || 0
            ),
            color:COLORS.single
          }
        ]
      ),
      true
    );

  }else{

    showNoData(chartID);
  }
}

/* ============================================================
   RENDER ALL INDICATORS
============================================================ */

function renderCharts(){

  const rows = filteredRows();
  const labels = categories(rows);

  /* 1A - Communities */
  if(hasData(rows,["communities"])){

    charts.communityChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Communities",
            data:rows.map(
              row=>numberValue(row.communities) || 0
            ),
            color:COLORS.community
          }
        ]
      ),
      true
    );

  }else{
    showNoData("communityChart");
  }

  /* 1B - Schools */
  if(hasData(rows,["schools"])){

    charts.schoolChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Schools",
            data:rows.map(
              row=>numberValue(row.schools) || 0
            ),
            color:COLORS.school
          }
        ]
      ),
      true
    );

  }else{
    showNoData("schoolChart");
  }

  /* 2 - LS Target & Achieved */
  if(hasData(rows,["ls_target","ls_achieved"])){

    charts.lsOutreachChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Target",
            data:rows.map(
              row=>numberValue(row.ls_target) || 0
            ),
            color:COLORS.target
          },
          {
            name:"Achieved",
            data:rows.map(
              row=>numberValue(row.ls_achieved) || 0
            ),
            color:COLORS.achieved
          }
        ]
      ),
      true
    );

  }else{
    showNoData("lsOutreachChart");
  }

  /* 2.1 - LS Gender */
  if(hasData(rows,["ls_boys","ls_girls"])){

    charts.lsGenderChart.setOption(
      genderChart(
        rows,
        "ls_boys",
        "ls_girls"
      ),
      true
    );

  }else{
    showNoData("lsGenderChart");
  }

  /* 2.2 - LS Attendance */
  if(hasData(rows,["ls_attended_pct"])){

    charts.lsAttendanceChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Attended at least 1 LS session",
            data:rows.map(
              row=>numberValue(row.ls_attended_pct) || 0
            ),
            color:COLORS.single
          }
        ],
        true
      ),
      true
    );

  }else{
    showNoData("lsAttendanceChart");
  }

  /* 3 - CLC Target & Achieved */
  if(hasData(rows,["clc_target","clc_achieved"])){

    charts.clcOutreachChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Target",
            data:rows.map(
              row=>numberValue(row.clc_target) || 0
            ),
            color:COLORS.target
          },
          {
            name:"Achieved",
            data:rows.map(
              row=>numberValue(row.clc_achieved) || 0
            ),
            color:COLORS.achieved
          }
        ]
      ),
      true
    );

  }else{
    showNoData("clcOutreachChart");
  }

  /* 3.1 - CLC Gender */
  if(hasData(rows,["clc_boys","clc_girls"])){

    charts.clcGenderChart.setOption(
      genderChart(
        rows,
        "clc_boys",
        "clc_girls"
      ),
      true
    );

  }else{
    showNoData("clcGenderChart");
  }

  /* 3.2 - CLC Attendance */
  if(hasData(rows,["clc_attended_pct"])){

    charts.clcAttendanceChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Attended at least 1 CLC session",
            data:rows.map(
              row=>numberValue(row.clc_attended_pct) || 0
            ),
            color:COLORS.single
          }
        ],
        true
      ),
      true
    );

  }else{
    showNoData("clcAttendanceChart");
  }

  /* 4A - LS Distribution */
  if(
    hasData(
      rows,
      [
        "ls_session_0_pct",
        "ls_session_1_2_pct",
        "ls_session_3_plus_pct"
      ]
    )
  ){

    charts.lsDistributionChart.setOption(
      stackedOption(
        labels,
        [
          {
            name:"0",
            data:rows.map(
              row=>numberValue(row.ls_session_0_pct) || 0
            ),
            color:COLORS.ls0
          },
          {
            name:"1–2",
            data:rows.map(
              row=>numberValue(row.ls_session_1_2_pct) || 0
            ),
            color:COLORS.ls12
          },
          {
            name:"3 & above",
            data:rows.map(
              row=>numberValue(row.ls_session_3_plus_pct) || 0
            ),
            color:COLORS.ls3
          }
        ]
      ),
      true
    );

  }else{
    showNoData("lsDistributionChart");
  }

  /* 4B - CLC Distribution */
  if(
    hasData(
      rows,
      [
        "clc_session_0_pct",
        "clc_session_1_4_pct",
        "clc_session_5_plus_pct"
      ]
    )
  ){

    charts.clcDistributionChart.setOption(
      stackedOption(
        labels,
        [
          {
            name:"0",
            data:rows.map(
              row=>numberValue(row.clc_session_0_pct) || 0
            ),
            color:COLORS.clc0
          },
          {
            name:"1–4",
            data:rows.map(
              row=>numberValue(row.clc_session_1_4_pct) || 0
            ),
            color:COLORS.clc14
          },
          {
            name:"5 & above",
            data:rows.map(
              row=>numberValue(row.clc_session_5_plus_pct) || 0
            ),
            color:COLORS.clc5
          }
        ]
      ),
      true
    );

  }else{
    showNoData("clcDistributionChart");
  }

  /* 5 - House Visits */
  drawSingleIndicator(
    rows,
    labels,
    "houseVisitsChart",
    "house_visits",
    "House Visits"
  );

  /* 6 - Events */
  if(hasData(rows,["events_planned","events_delivered"])){

    charts.eventsChart.setOption(
      barOption(
        labels,
        [
          {
            name:"Planned",
            data:rows.map(
              row=>numberValue(row.events_planned) || 0
            ),
            color:COLORS.planned
          },
          {
            name:"Delivered",
            data:rows.map(
              row=>numberValue(row.events_delivered) || 0
            ),
            color:COLORS.delivered
          }
        ]
      ),
      true
    );

  }else{
    showNoData("eventsChart");
  }

  /* 7 - Parents */
  drawSingleIndicator(
    rows,
    labels,
    "parentsChart",
    "parents_engaged",
    "Parents Engaged"
  );

  /* 8 - Bal Panchayat */
  drawSingleIndicator(
    rows,
    labels,
    "balPanchayatChart",
    "balpanchayat_formed",
    "Bal Panchayats Formed"
  );

  /* 9 - Educators */
  drawSingleIndicator(
    rows,
    labels,
    "educatorTrainingChart",
    "educator_training",
    "Educators Trained"
  );

  /* 10 - Sustainability */
  drawSingleIndicator(
    rows,
    labels,
    "sustainabilityChart",
    "school_staff_training",
    "School Staff Trained"
  );
}

/* ============================================================
   FILTER UI
============================================================ */

function populateDropdown(
  element,
  values,
  selected,
  includeAll=true
){

  element.innerHTML="";

  if(includeAll){

    const option =
      document.createElement("option");

    option.value="All";
    option.textContent="All";

    element.appendChild(option);
  }

  values.forEach(value=>{

    const option =
      document.createElement("option");

    option.value=value;
    option.textContent=value;

    element.appendChild(option);
  });

  element.value =
    selected ?? (
      includeAll
      ? "All"
      : values[0] || ""
    );
}

function buildMonthFilter(){

  const holder = $("monthOptions");

  holder.innerHTML="";

  availableMonths().forEach(month=>{

    const label =
      document.createElement("label");

    label.className="multi-option";

    const checkbox =
      document.createElement("input");

    checkbox.type="checkbox";

    checkbox.checked =
      state.months.includes(month);

    checkbox.addEventListener(
      "change",
      ()=>{

        if(
          checkbox.checked &&
          !state.months.includes(month)
        ){
          state.months.push(month);
        }

        if(!checkbox.checked){
          state.months =
            state.months.filter(
              item=>item!==month
            );
        }

        state.months.sort(monthSort);

        updateMonthButton();

        refreshGeography(true);

        render();
      }
    );

    const text =
      document.createElement("span");

    text.textContent=month;

    label.append(
      checkbox,
      text
    );

    holder.appendChild(label);
  });
}

function updateMonthButton(){

  if(state.months.length===0){

    $("monthButtonText").textContent =
      "Select Month(s)";

  }else if(state.months.length<=2){

    $("monthButtonText").textContent =
      state.months.join(", ");

  }else{

    $("monthButtonText").textContent =
      `${state.months.length} months selected`;
  }
}

function selectAllMonths(){

  state.months =
    availableMonths();

  buildMonthFilter();

  updateMonthButton();

  refreshGeography(true);

  render();
}

function clearMonths(){

  state.months=[];

  buildMonthFilter();

  updateMonthButton();

  refreshGeography(true);

  render();
}

/* ============================================================
   DISTRICT FILTER
============================================================ */

function geographyBaseRows(){

  let rows=monthRows();

  if(state.region!=="All"){
    rows=rows.filter(
      row=>row.region===state.region
    );
  }

  if(state.stateName!=="All"){
    rows=rows.filter(
      row=>row.state===state.stateName
    );
  }

  return rows;
}

function availableDistricts(){

  return unique(
    geographyBaseRows().map(
      row=>row.district
    )
  );
}

function buildDistrictFilter(reset=false){

  const districts =
    availableDistricts();

  if(reset){

    state.districts=[
      ...districts
    ];

  }else{

    state.districts =
      state.districts.filter(
        district =>
          districts.includes(district)
      );

    if(
      state.districts.length===0 &&
      districts.length
    ){
      state.districts=[
        ...districts
      ];
    }
  }

  const holder =
    $("districtOptions");

  holder.innerHTML="";

  districts.forEach(district=>{

    const label =
      document.createElement("label");

    label.className =
      "multi-option";

    const checkbox =
      document.createElement("input");

    checkbox.type =
      "checkbox";

    checkbox.checked =
      state.districts.includes(district);

    checkbox.addEventListener(
      "change",
      ()=>{

        if(
          checkbox.checked &&
          !state.districts.includes(district)
        ){
          state.districts.push(district);
        }

        if(!checkbox.checked){

          state.districts =
            state.districts.filter(
              item=>item!==district
            );
        }

        updateDistrictButton();

        render();
      }
    );

    const text =
      document.createElement("span");

    text.textContent =
      district;

    label.append(
      checkbox,
      text
    );

    holder.appendChild(label);
  });

  updateDistrictButton();
}

function updateDistrictButton(){

  const all =
    availableDistricts();

  if(state.districts.length===0){

    $("districtButtonText")
      .textContent =
      "No District Selected";

  }else if(
    state.districts.length===
    all.length
  ){

    $("districtButtonText")
      .textContent =
      `All districts (${all.length})`;

  }else if(
    state.districts.length<=2
  ){

    $("districtButtonText")
      .textContent =
      state.districts.join(", ");

  }else{

    $("districtButtonText")
      .textContent =
      `${state.districts.length} districts selected`;
  }
}

function selectAllDistricts(){

  state.districts =
    availableDistricts();

  buildDistrictFilter(false);

  render();
}

function clearDistricts(){

  state.districts=[];

  document.querySelectorAll(
    "#districtOptions input"
  ).forEach(
    checkbox =>
      checkbox.checked=false
  );

  updateDistrictButton();

  render();
}

/* ============================================================
   REGION -> STATE -> DISTRICT
============================================================ */

function refreshGeography(resetDistricts=false){

  let rows =
    monthRows();

  const regions =
    unique(
      rows.map(
        row=>row.region
      )
    );

  if(
    state.region!=="All" &&
    !regions.includes(state.region)
  ){
    state.region="All";
  }

  populateDropdown(
    $("regionFilter"),
    regions,
    state.region,
    true
  );

  if(state.region!=="All"){

    rows =
      rows.filter(
        row=>
          row.region===
          state.region
      );
  }

  const states =
    unique(
      rows.map(
        row=>row.state
      )
    );

  if(
    state.stateName!=="All" &&
    !states.includes(state.stateName)
  ){
    state.stateName="All";
  }

  populateDropdown(
    $("stateFilter"),
    states,
    state.stateName,
    true
  );

  buildDistrictFilter(
    resetDistricts
  );
}

/* ============================================================
   LABELS
============================================================ */

function updateLabels(){

  const monthText =
    state.months.length
    ? state.months.join(", ")
    : "All Months";

  $("reportingLabel")
    .textContent =
    `${state.fy} | ${PAGE_MODE} | ${monthText}`;

  $("filterSummary")
    .innerHTML = `

      <span class="chip">
        <strong>FY:</strong>
        ${state.fy}
      </span>

      <span class="chip">
        <strong>View:</strong>
        ${PAGE_MODE}
      </span>

      <span class="chip">
        <strong>Month:</strong>
        ${monthText}
      </span>

      <span class="chip">
        <strong>Region:</strong>
        ${state.region}
      </span>

      <span class="chip">
        <strong>State:</strong>
        ${state.stateName}
      </span>

      <span class="chip">
        <strong>District:</strong>
        ${state.districts.join(", ")}
      </span>
    `;
}

function render(){

  updateLabels();

  renderCharts();
}

/* ============================================================
   FILTER EVENTS
============================================================ */

$("fyFilter")
.addEventListener(
  "change",
  event=>{

    state.fy=
      event.target.value;

    const months =
      availableMonths();

    state.months =
      months.length
      ? [months[months.length-1]]
      : [];

    state.region="All";
    state.stateName="All";
    state.districts=[];

    buildMonthFilter();

    updateMonthButton();

    refreshGeography(true);

    render();
  }
);

$("regionFilter")
.addEventListener(
  "change",
  event=>{

    state.region=
      event.target.value;

    state.stateName="All";

    state.districts=[];

    refreshGeography(true);

    render();
  }
);

$("stateFilter")
.addEventListener(
  "change",
  event=>{

    state.stateName=
      event.target.value;

    state.districts=[];

    refreshGeography(true);

    render();
  }
);

/* ============================================================
   RESET
============================================================ */

function resetFilters(){

  const fys =
    unique(
      state.data.map(
        row=>row.fy
      )
    );

  state.fy =
    fys[
      fys.length-1
    ];

  populateDropdown(
    $("fyFilter"),
    fys,
    state.fy,
    false
  );

  const months =
    availableMonths();

  state.months =
    months.length
    ? [months[months.length-1]]
    : [];

  state.region="All";
  state.stateName="All";
  state.districts=[];

  buildMonthFilter();

  updateMonthButton();

  refreshGeography(true);

  render();
}

/* ============================================================
   MULTI SELECT MENUS
============================================================ */

function setupMenu(
  buttonID,
  menuID
){

  $(buttonID)
  .addEventListener(
    "click",
    event=>{

      event.stopPropagation();

      const currentMenu =
        $(menuID);

      document
        .querySelectorAll(
          ".multi-menu"
        )
        .forEach(
          menu=>{

            if(
              menu !==
              currentMenu
            ){
              menu.classList
                .remove("show");
            }
          }
        );

      currentMenu
        .classList
        .toggle("show");
    }
  );

  $(menuID)
  .addEventListener(
    "click",
    event=>
      event.stopPropagation()
  );
}

setupMenu(
  "monthButton",
  "monthMenu"
);

setupMenu(
  "districtButton",
  "districtMenu"
);

document
.addEventListener(
  "click",
  ()=>{

    document
      .querySelectorAll(
        ".multi-menu"
      )
      .forEach(
        menu=>
          menu.classList
            .remove("show")
      );
  }
);

/* ============================================================
   PRINT
============================================================ */

function preparePrint(){

  const monthText =
    state.months.length
    ? state.months.join(", ")
    : "All";

  $("printFilterInfo")
    .innerHTML = `

      <strong>Filters Applied:</strong>

      FY:
      ${state.fy}

      &nbsp; | &nbsp;

      View:
      ${PAGE_MODE}

      &nbsp; | &nbsp;

      Month:
      ${monthText}

      &nbsp; | &nbsp;

      Region:
      ${state.region}

      &nbsp; | &nbsp;

      State:
      ${state.stateName}

      &nbsp; | &nbsp;

      District:
      ${state.districts.join(", ")}
    `;

  Object
    .values(charts)
    .forEach(
      chart=>chart.resize()
    );

  setTimeout(
    ()=>window.print(),
    180
  );
}

/* ============================================================
   RESIZE
============================================================ */

window
.addEventListener(
  "resize",
  ()=>{

    Object
      .values(charts)
      .forEach(
        chart=>chart.resize()
      );
  }
);

/* ============================================================
   LOAD CSV
============================================================ */

Papa.parse(
  DATA_FILE,
  {

    download:true,

    header:true,

    skipEmptyLines:true,

    transformHeader:
      header=>
        header
          .trim()
          .toLowerCase()
          .replace(/\s+/g,"_"),

    complete:
      result=>{

        state.data =
          result.data.map(
            row=>{

              const clean={};

              Object
                .entries(row)
                .forEach(
                  ([key,value])=>{

                    clean[key] =
                      typeof value==="string"
                      ? value.trim()
                      : value;
                  }
                );

              return clean;
            }
          );

        if(state.data.length===0){

          $("status")
            .textContent =
            `No data found in ${DATA_FILE}`;

          return;
        }

        const required = [
          "fy",
          "month",
          "region",
          "state",
          "district"
        ];

        const missing =
          required.filter(
            column =>
              !(column in state.data[0])
          );

        if(missing.length){

          $("status")
            .textContent =
            `Missing required column(s): ${missing.join(", ")}`;

          return;
        }

        const fys =
          unique(
            state.data.map(
              row=>row.fy
            )
          );

        state.fy =
          fys[
            fys.length-1
          ];

        populateDropdown(
          $("fyFilter"),
          fys,
          state.fy,
          false
        );

        const months =
          availableMonths();

        state.months =
          months.length
          ? [
              months[
                months.length-1
              ]
            ]
          : [];

        buildMonthFilter();

        updateMonthButton();

        refreshGeography(true);

        $("status")
          .textContent =
          `Loaded ${state.data.length.toLocaleString("en-IN")} rows from ${DATA_FILE}`;

        render();
      },

    error:
      error=>{

        console.error(error);

        $("status")
          .textContent =
          `Could not load ${DATA_FILE}. Run python -m http.server 8000`;
      }
  }
);


/* ============================================================
   CHART EXPORT METADATA
============================================================ */

const chartExportConfig = {

  communityChart:{
    title:"Communities Covered",
    columns:[
      ["communities","Communities"]
    ]
  },

  schoolChart:{
    title:"Schools Covered",
    columns:[
      ["schools","Schools"]
    ]
  },

  lsOutreachChart:{
    title:"Target and Achieved Life Skill Outreach",
    columns:[
      ["ls_target","Target"],
      ["ls_achieved","Achieved"]
    ]
  },

  lsGenderChart:{
    title:"Gender Distribution of Life Skill Programmes",
    columns:[
      ["ls_boys","Boys"],
      ["ls_girls","Girls"]
    ]
  },

  lsAttendanceChart:{
    title:"Life Skill Sessions Attended",
    columns:[
      ["ls_attended_pct","Attended at least 1 LS session (%)"]
    ]
  },

  clcOutreachChart:{
    title:"Target and Achieved CLC Outreach",
    columns:[
      ["clc_target","Target"],
      ["clc_achieved","Achieved"]
    ]
  },

  clcGenderChart:{
    title:"Gender Distribution of CLC Programmes",
    columns:[
      ["clc_boys","Boys"],
      ["clc_girls","Girls"]
    ]
  },

  clcAttendanceChart:{
    title:"CLC Sessions Attended",
    columns:[
      ["clc_attended_pct","Attended at least 1 CLC session (%)"]
    ]
  },

  lsDistributionChart:{
    title:"Life Skill Session Distribution",
    columns:[
      ["ls_session_0_pct","0 (%)"],
      ["ls_session_1_2_pct","1-2 (%)"],
      ["ls_session_3_plus_pct","3 & above (%)"]
    ]
  },

  clcDistributionChart:{
    title:"CLC Session Distribution",
    columns:[
      ["clc_session_0_pct","0 (%)"],
      ["clc_session_1_4_pct","1-4 (%)"],
      ["clc_session_5_plus_pct","5 & above (%)"]
    ]
  },

  houseVisitsChart:{
    title:"House Visits",
    columns:[
      ["house_visits","House Visits"]
    ]
  },

  eventsChart:{
    title:"Events",
    columns:[
      ["events_planned","Events Planned"],
      ["events_delivered","Events Delivered"]
    ]
  },

  parentsChart:{
    title:"Parents Engaged",
    columns:[
      ["parents_engaged","Parents Engaged"]
    ]
  },

  balPanchayatChart:{
    title:"Bal Panchayats Formed",
    columns:[
      ["balpanchayat_formed","Bal Panchayats Formed"]
    ]
  },

  educatorTrainingChart:{
    title:"Educators Training",
    columns:[
      ["educator_training","Educators Trained"]
    ]
  },

  sustainabilityChart:{
    title:"Sustainability School Staff Training",
    columns:[
      ["school_staff_training","School Staff Trained"]
    ]
  }

};


/* ============================================================
   EXPORT MENU
============================================================ */

function toggleExportMenu(event, menuID){

  event.stopPropagation();

  const selected =
    document.getElementById(menuID);

  document
    .querySelectorAll(".export-menu")
    .forEach(menu=>{

      if(menu !== selected){
        menu.classList.remove("show");
      }

    });

  selected.classList.toggle("show");
}


document.addEventListener(
  "click",
  ()=>{

    document
      .querySelectorAll(".export-menu")
      .forEach(
        menu=>menu.classList.remove("show")
      );

  }
);


/* ============================================================
   SAFE FILE NAME
============================================================ */

function safeFileName(value){

  return String(value)

    .replace(/[^\w\-]+/g,"_")

    .replace(/_+/g,"_")

    .replace(/^_|_$/g,"");

}


function currentFilterSuffix(){

  const monthPart =
    state.months.length
    ? state.months.join("-")
    : "All-Months";

  const districtPart =
    state.districts.length
    ? state.districts.join("-")
    : "All-Districts";

  return safeFileName(
    `${state.fy}_${monthPart}_${districtPart}`
  );
}


/* ============================================================
   DOWNLOAD HELPER
============================================================ */

function triggerDownload(url, fileName){

  const link =
    document.createElement("a");

  link.href =
    url;

  link.download =
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();
}


/* ============================================================
   PNG EXPORT
============================================================ */

function exportChartPNG(chartID){

  const config =
    chartExportConfig[chartID];

  const chart =
    charts[chartID];

  if(!config || !chart){
    return;
  }

  const dataURL =
    chart.getDataURL({

      type:"png",

      pixelRatio:2,

      backgroundColor:"#ffffff"

    });

  const fileName =
    `${safeFileName(config.title)}_${currentFilterSuffix()}.png`;

  triggerDownload(
    dataURL,
    fileName
  );

}


/* ============================================================
   CSV EXPORT
============================================================ */

function csvEscape(value){

  if(
    value === null ||
    value === undefined
  ){
    return "";
  }

  const text =
    String(value);

  if(
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ){

    return `"${text.replace(/"/g,'""')}"`;
  }

  return text;
}


function exportChartCSV(chartID){

  const config =
    chartExportConfig[chartID];

  if(!config){
    return;
  }

  const rows =
    filteredRows();

  const baseColumns = [
    ["fy","Financial Year"],
    ["month","Month"],
    ["region","Region"],
    ["state","State"],
    ["district","District"]
  ];

  const exportColumns = [
    ...baseColumns,
    ...config.columns
  ];

  const csvRows = [];

  csvRows.push(
    exportColumns
      .map(item=>csvEscape(item[1]))
      .join(",")
  );

  rows.forEach(row=>{

    csvRows.push(
      exportColumns
        .map(
          item=>
            csvEscape(
              row[item[0]]
            )
        )
        .join(",")
    );

  });

  const blob =
    new Blob(
      [
        "\ufeff",
        csvRows.join("\r\n")
      ],
      {
        type:"text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const fileName =
    `${safeFileName(config.title)}_${currentFilterSuffix()}.csv`;

  triggerDownload(
    url,
    fileName
  );

  setTimeout(
    ()=>URL.revokeObjectURL(url),
    1000
  );

}
