
const DATA_FILE = "data/cumulative_data.csv";

const COLORS = {
  target:"#94a3b8",
  achieved:"#173f93",
  boys:"#3b82f6",
  girls:"#ec4899",
  community:"#f59e0b",
  school:"#173f93",
  single:"#173f93"
};

const state = {
  allData:[],
  data:[],
  fy:null,
  selectedPeriod:null,
  selectedOrder:null,
  region:"All",
  stateName:"All",
  districts:[]
};

const $ = id => document.getElementById(id);

const chartIDs = [
  "communityChart","schoolChart",
  "lsOutreachChart","lsGenderChart","lsDistributionChart",
  "clcOutreachChart","clcGenderChart","clcDistributionChart",
  "lsPlannedAboveChart","clcPlannedAboveChart",
  "houseVisitsChart","eventsChart",
  "parentsChart","balpanchayatChart",
  "educatorTrainingChart","sustainabilityChart"
];

const charts = {};
chartIDs.forEach(id=>{
  charts[id] = echarts.init($(id), null, {renderer:"svg"});
});

function numberValue(value){
  if(value===null || value===undefined || value==="") return null;
  const n = Number(String(value).replace(/,/g,"").trim());
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value){
  return Number(value || 0).toLocaleString("en-IN");
}

function percentage(value){
  return `${Number(value || 0).toFixed(1)}%`;
}

function unique(values){
  return [...new Set(values.filter(v=>v!==null && v!==undefined && String(v).trim()!==""))]
    .sort((a,b)=>String(a).localeCompare(String(b)));
}

function hasData(rows, cols){
  return rows.some(r=>cols.some(c=>numberValue(r[c])!==null));
}

function categories(rows){
  return rows.map(r=>r.district);
}

function filteredRows(){
  let rows=[...state.data];

  if(state.region!=="All"){
    rows=rows.filter(r=>r.region===state.region);
  }

  if(state.stateName!=="All"){
    rows=rows.filter(r=>r.state===state.stateName);
  }

  if(!state.districts.length) return [];

  return rows.filter(r=>state.districts.includes(r.district));
}

/* ---------------- Chart Options ---------------- */

function barOption(labels, series, isPercent=false){
  return {
    animationDuration:350,
    tooltip:{trigger:"axis",axisPointer:{type:"shadow"}},
    legend:series.length>1 ? {top:2} : undefined,
    grid:{left:52,right:18,top:series.length>1?42:24,bottom:45},

    xAxis:{
      type:"category",
      data:labels,
      axisTick:{show:false},
      axisLine:{lineStyle:{color:"#cfd6e1"}},
      axisLabel:{interval:0,fontSize:10,color:"#5f697a"}
    },

    yAxis:{
      type:"value",
      max:isPercent ? 100 : undefined,
      splitLine:{show:false},
      axisLine:{show:false},
      axisTick:{show:false},
      axisLabel:{
        formatter:isPercent ? "{value}%" : "{value}",
        color:"#7a8496"
      }
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
        formatter:p=>isPercent ? percentage(p.value) : formatNumber(p.value)
      }
    }))
  };
}

function stackedOption(labels, series){
  return {
    animationDuration:350,
    tooltip:{trigger:"axis",axisPointer:{type:"shadow"}},
    legend:{top:2,type:"scroll"},
    grid:{left:52,right:18,top:48,bottom:45},

    xAxis:{
      type:"category",
      data:labels,
      axisTick:{show:false},
      axisLine:{lineStyle:{color:"#cfd6e1"}},
      axisLabel:{interval:0,fontSize:10,color:"#5f697a"}
    },

    yAxis:{
      type:"value",
      max:100,
      splitLine:{show:false},
      axisLine:{show:false},
      axisTick:{show:false},
      axisLabel:{formatter:"{value}%",color:"#7a8496"}
    },

    series:series.map(item=>({
      name:item.name,
      type:"bar",
      stack:"total",
      data:item.data,
      barMaxWidth:72,
      itemStyle:{color:item.color},
      label:{
        show:true,
        fontSize:8,
        formatter:p=>p.value>=8 ? `${Number(p.value).toFixed(0)}%` : ""
      }
    }))
  };
}

function genderOption(rows,boysCol,girlsCol){
  const labels=categories(rows);
  const boysPct=[], girlsPct=[];

  rows.forEach(r=>{
    const boys=numberValue(r[boysCol])||0;
    const girls=numberValue(r[girlsCol])||0;
    const total=boys+girls;

    boysPct.push(total ? +(boys/total*100).toFixed(1) : 0);
    girlsPct.push(total ? +(girls/total*100).toFixed(1) : 0);
  });

  const option=stackedOption(labels,[
    {name:"Boys",data:boysPct,color:COLORS.boys},
    {name:"Girls",data:girlsPct,color:COLORS.girls}
  ]);

  option.tooltip.formatter=params=>{
    const i=params[0]?.dataIndex ?? 0;
    const r=rows[i];
    const boys=numberValue(r[boysCol])||0;
    const girls=numberValue(r[girlsCol])||0;
    const total=boys+girls;

    return `
      <strong>${params[0]?.axisValue || ""}</strong><br>
      <span style="color:${COLORS.boys}">●</span> Boys: ${formatNumber(boys)}
      (${total ? percentage(boys/total*100) : "0%"})<br>
      <span style="color:${COLORS.girls}">●</span> Girls: ${formatNumber(girls)}
      (${total ? percentage(girls/total*100) : "0%"})<br>
      <strong>Total: ${formatNumber(total)}</strong>
    `;
  };

  return option;
}

function showNoData(chartID,message="No data available"){
  charts[chartID].clear();
  charts[chartID].setOption({
    graphic:[{
      type:"text",
      left:"center",
      top:"middle",
      style:{text:message,fill:"#6c7688",font:"12px Segoe UI"}
    }]
  });
}

function drawSingle(rows,chartID,column,name){
  if(hasData(rows,[column])){
    charts[chartID].setOption(
      barOption(categories(rows),[
        {
          name,
          data:rows.map(r=>numberValue(r[column])||0),
          color:COLORS.single
        }
      ]),
      true
    );
  }else{
    showNoData(chartID);
  }
}

function plannedAboveOption(rows,countCol,pctCol,plannedCol,name){
  const option=barOption(categories(rows),[
    {
      name,
      data:rows.map(r=>numberValue(r[countCol])||0),
      color:COLORS.single
    }
  ]);

  option.tooltip.formatter=params=>{
    const i=params[0]?.dataIndex ?? 0;
    const r=rows[i];
    const count=numberValue(r[countCol]);
    const pct=numberValue(r[pctCol]);
    const planned=r[plannedCol];

    return `
      <strong>${r.district}</strong><br>
      Adolescents planned & above: ${count===null ? "No data" : formatNumber(count)}<br>
      Percent: ${pct===null ? "No data" : percentage(pct)}<br>
      Planned sessions: ${planned==="" || planned===null || planned===undefined ? "No data" : planned}
    `;
  };

  return option;
}

/* ---------------- Render ---------------- */

function renderCharts(){
  const rows=filteredRows();
  const labels=categories(rows);

  if(hasData(rows,["communities"])){
    charts.communityChart.setOption(
      barOption(labels,[{
        name:"Communities",
        data:rows.map(r=>numberValue(r.communities)||0),
        color:COLORS.community
      }]),true
    );
  }else showNoData("communityChart");

  if(hasData(rows,["schools"])){
    charts.schoolChart.setOption(
      barOption(labels,[{
        name:"Schools",
        data:rows.map(r=>numberValue(r.schools)||0),
        color:COLORS.school
      }]),true
    );
  }else showNoData("schoolChart");

  if(hasData(rows,["ls_target","ls_achieved"])){
    charts.lsOutreachChart.setOption(
      barOption(labels,[
        {name:"Target",data:rows.map(r=>numberValue(r.ls_target)||0),color:COLORS.target},
        {name:"Achieved",data:rows.map(r=>numberValue(r.ls_achieved)||0),color:COLORS.achieved}
      ]),true
    );
  }else showNoData("lsOutreachChart");

  if(hasData(rows,["ls_boys","ls_girls"])){
    charts.lsGenderChart.setOption(genderOption(rows,"ls_boys","ls_girls"),true);
  }else showNoData("lsGenderChart");

  const lsDist=[
    ["ls_touchpoint_0_pct","0","#e2e8f0"],
    ["ls_touchpoint_1_5_pct","1–5","#bfdbfe"],
    ["ls_touchpoint_6_10_pct","6–10","#60a5fa"],
    ["ls_touchpoint_11_15_pct","11–15","#3b82f6"],
    ["ls_touchpoint_16_20_pct","16–20","#2563eb"],
    ["ls_touchpoint_21_25_pct","21–25","#1d4ed8"],
    ["ls_touchpoint_26_32_pct","26–32","#1e3a8a"]
  ];

  if(hasData(rows,lsDist.map(x=>x[0]))){
    charts.lsDistributionChart.setOption(
      stackedOption(labels,lsDist.map(([col,name,color])=>({
        name,
        data:rows.map(r=>numberValue(r[col])||0),
        color
      }))),true
    );
  }else showNoData("lsDistributionChart");

  if(hasData(rows,["clc_target","clc_achieved"])){
    charts.clcOutreachChart.setOption(
      barOption(labels,[
        {name:"Target",data:rows.map(r=>numberValue(r.clc_target)||0),color:COLORS.target},
        {name:"Achieved",data:rows.map(r=>numberValue(r.clc_achieved)||0),color:COLORS.achieved}
      ]),true
    );
  }else showNoData("clcOutreachChart");

  if(hasData(rows,["clc_boys","clc_girls"])){
    charts.clcGenderChart.setOption(genderOption(rows,"clc_boys","clc_girls"),true);
  }else showNoData("clcGenderChart");

  const clcDist=[
    ["clc_touchpoint_0_pct","0","#dcfce7"],
    ["clc_touchpoint_1_10_pct","1–10","#bbf7d0"],
    ["clc_touchpoint_11_20_pct","11–20","#86efac"],
    ["clc_touchpoint_21_30_pct","21–30","#4ade80"],
    ["clc_touchpoint_31_40_pct","31–40","#22c55e"],
    ["clc_touchpoint_41_50_pct","41–50","#16a34a"],
    ["clc_touchpoint_51_60_pct","51–60","#15803d"]
  ];

  if(hasData(rows,clcDist.map(x=>x[0]))){
    charts.clcDistributionChart.setOption(
      stackedOption(labels,clcDist.map(([col,name,color])=>({
        name,
        data:rows.map(r=>numberValue(r[col])||0),
        color
      }))),true
    );
  }else showNoData("clcDistributionChart");

  if(hasData(rows,["ls_planned_above_count"])){
    charts.lsPlannedAboveChart.setOption(
      plannedAboveOption(
        rows,
        "ls_planned_above_count",
        "ls_planned_above_pct",
        "ls_planned_sessions",
        "Adolescents"
      ),true
    );
  }else showNoData("lsPlannedAboveChart");

  if(hasData(rows,["clc_planned_above_count"])){
    charts.clcPlannedAboveChart.setOption(
      plannedAboveOption(
        rows,
        "clc_planned_above_count",
        "clc_planned_above_pct",
        "clc_planned_sessions",
        "Adolescents"
      ),true
    );
  }else showNoData("clcPlannedAboveChart");

  drawSingle(rows,"houseVisitsChart","house_visits","House Visits");

  const eventCols=[
    ["gov_meetings_held","Government/Panchayat","#173f93"],
    ["parent_meetings_held","Parent Meetings","#3b82f6"],
    ["teacher_meetings_held","Teacher/Principal","#60a5fa"],
    ["balpanchayat_meetings_held","Bal Panchayat","#94a3b8"]
  ];

  if(hasData(rows,eventCols.map(x=>x[0]))){
    charts.eventsChart.setOption(
      barOption(labels,eventCols.map(([col,name,color])=>({
        name,
        data:rows.map(r=>numberValue(r[col])||0),
        color
      }))),true
    );
  }else showNoData("eventsChart");

  drawSingle(rows,"parentsChart","parents_engaged","Parents Engaged");
  drawSingle(rows,"balpanchayatChart","balpanchayat_formed","Bal Panchayats Formed");
  drawSingle(rows,"educatorTrainingChart","educator_training","Educators Trained");
  drawSingle(rows,"sustainabilityChart","school_staff_training","School Staff Trained");

  const lsText=rows.map(r=>`${r.district}: ${r.ls_planned_sessions ?? "No data"}`).join(" | ");
  const clcText=rows.map(r=>`${r.district}: ${r.clc_planned_sessions ?? "No data"}`).join(" | ");

  if($("lsPlannedNote")) $("lsPlannedNote").textContent=`Planned LS sessions — ${lsText}`;
  if($("clcPlannedNote")) $("clcPlannedNote").textContent=`Planned CLC sessions — ${clcText}`;
}


/* ---------------- Financial Year + Reporting Period ---------------- */

function fyOptions(){
  return unique(
    state.allData.map(row=>row.fy)
  ).sort((a,b)=>{
    const ay = Number(String(a).match(/(\d{4})/)?.[1] || 0);
    const by = Number(String(b).match(/(\d{4})/)?.[1] || 0);
    return ay - by;
  });
}

function populateFYFilter(){
  const select = $("fyFilter");
  select.innerHTML = "";

  const years = fyOptions();

  years.forEach(fy=>{
    const option = document.createElement("option");
    option.value = fy;
    option.textContent = fy;
    select.appendChild(option);
  });

  if(!state.fy && years.length){
    state.fy = years[years.length-1];
  }

  if(!years.includes(state.fy) && years.length){
    state.fy = years[years.length-1];
  }

  select.value = state.fy;
}

function periodOptions(){
  const map = new Map();

  state.allData
    .filter(row=>row.fy===state.fy)
    .forEach(row=>{
      const order = Number(row.period_order) || 0;
      const label = row.period || "";

      if(label){
        map.set(order,label);
      }
    });

  return [...map.entries()]
    .sort((a,b)=>a[0]-b[0])
    .map(([order,label])=>({order,label}));
}

function populatePeriodFilter(selectLatest=false){
  const select = $("periodFilter");
  select.innerHTML = "";

  const options = periodOptions();

  options.forEach(item=>{
    const option = document.createElement("option");
    option.value = String(item.order);
    option.textContent = item.label;
    select.appendChild(option);
  });

  const availableOrders = options.map(x=>x.order);

  if(
    selectLatest ||
    state.selectedOrder===null ||
    !availableOrders.includes(Number(state.selectedOrder))
  ){
    const latest = options[options.length-1];

    if(latest){
      state.selectedOrder = latest.order;
      state.selectedPeriod = latest.label;
    }
  }

  select.value = String(state.selectedOrder);
}

function applySelectedPeriod(){
  state.data = state.allData.filter(
    row =>
      row.fy === state.fy &&
      Number(row.period_order) === Number(state.selectedOrder)
  );

  state.selectedPeriod =
    state.data[0]?.period || "Selected cumulative period";

  state.region = "All";
  state.stateName = "All";
  state.districts = [];

  refreshGeography(true);
}

/* ---------------- Filters ---------------- */

function populateSelect(element,values,selected){
  element.innerHTML="";

  const all=document.createElement("option");
  all.value="All";
  all.textContent="All";
  element.appendChild(all);

  values.forEach(value=>{
    const option=document.createElement("option");
    option.value=value;
    option.textContent=value;
    element.appendChild(option);
  });

  element.value=selected;
}

function geographyBaseRows(){
  let rows=[...state.data];

  if(state.region!=="All"){
    rows=rows.filter(r=>r.region===state.region);
  }

  if(state.stateName!=="All"){
    rows=rows.filter(r=>r.state===state.stateName);
  }

  return rows;
}

function availableDistricts(){
  return unique(geographyBaseRows().map(r=>r.district));
}

function buildDistrictFilter(reset=false){
  const districts=availableDistricts();

  if(reset){
    state.districts=[...districts];
  }else{
    state.districts=state.districts.filter(d=>districts.includes(d));
  }

  const holder=$("districtOptions");
  holder.innerHTML="";

  districts.forEach(district=>{
    const label=document.createElement("label");
    label.className="multi-option";

    const checkbox=document.createElement("input");
    checkbox.type="checkbox";
    checkbox.checked=state.districts.includes(district);

    checkbox.addEventListener("change",()=>{
      if(checkbox.checked && !state.districts.includes(district)){
        state.districts.push(district);
      }

      if(!checkbox.checked){
        state.districts=state.districts.filter(d=>d!==district);
      }

      updateDistrictButton();
      render();
    });

    const text=document.createElement("span");
    text.textContent=district;

    label.append(checkbox,text);
    holder.appendChild(label);
  });

  updateDistrictButton();
}

function updateDistrictButton(){
  const all=availableDistricts();

  if(!state.districts.length){
    $("districtButtonText").textContent="No District Selected";
  }else if(state.districts.length===all.length){
    $("districtButtonText").textContent=`All districts (${all.length})`;
  }else if(state.districts.length<=2){
    $("districtButtonText").textContent=state.districts.join(", ");
  }else{
    $("districtButtonText").textContent=`${state.districts.length} districts selected`;
  }
}

function selectAllDistricts(){
  state.districts=availableDistricts();
  buildDistrictFilter(false);
  render();
}

function clearDistricts(){
  state.districts=[];
  document.querySelectorAll("#districtOptions input").forEach(cb=>cb.checked=false);
  updateDistrictButton();
  render();
}

function refreshGeography(resetDistricts=false){
  let rows=[...state.data];

  const regions=unique(rows.map(r=>r.region));

  if(state.region!=="All" && !regions.includes(state.region)){
    state.region="All";
  }

  populateSelect($("regionFilter"),regions,state.region);

  if(state.region!=="All"){
    rows=rows.filter(r=>r.region===state.region);
  }

  const states=unique(rows.map(r=>r.state));

  if(state.stateName!=="All" && !states.includes(state.stateName)){
    state.stateName="All";
  }

  populateSelect($("stateFilter"),states,state.stateName);
  buildDistrictFilter(resetDistricts);
}

$("fyFilter").addEventListener("change",event=>{
  state.fy = event.target.value;
  populatePeriodFilter(true);
  applySelectedPeriod();
  render();
});

$("periodFilter").addEventListener("change",event=>{
  state.selectedOrder = Number(event.target.value);
  applySelectedPeriod();
  render();
});

$("regionFilter").addEventListener("change",event=>{
  state.region=event.target.value;
  state.stateName="All";
  state.districts=[];
  refreshGeography(true);
  render();
});

$("stateFilter").addEventListener("change",event=>{
  state.stateName=event.target.value;
  state.districts=[];
  refreshGeography(true);
  render();
});


function resetCumulativeFilters(){
  const years = fyOptions();

  if(years.length){
    state.fy = years[years.length-1];
  }

  populateFYFilter();
  populatePeriodFilter(true);

  state.region = "All";
  state.stateName = "All";
  state.districts = [];

  applySelectedPeriod();
  render();
}

$("resetFilters").addEventListener("click",()=>{
  resetCumulativeFilters();
});

$("districtButton").addEventListener("click",event=>{
  event.stopPropagation();
  $("districtMenu").classList.toggle("show");
});

$("districtMenu").addEventListener("click",event=>event.stopPropagation());

document.addEventListener("click",()=>{
  $("districtMenu").classList.remove("show");
  document.querySelectorAll(".export-menu").forEach(menu=>menu.classList.remove("show"));
});

/* ---------------- Render ---------------- */

function render(){
  if($("periodBadge")) $("periodBadge").textContent=state.selectedPeriod;

  if($("status")){
    $("status").textContent =
      `Loaded ${state.allData.length.toLocaleString("en-IN")} cumulative rows. Showing ${state.fy} — ${state.selectedPeriod}.`;
  }

  if($("filterSummary")){
    $("filterSummary").innerHTML=`
      <span class="chip"><strong>FY:</strong> ${state.fy}</span>
      <span class="chip"><strong>Reporting:</strong> ${state.selectedPeriod}</span>
      <span class="chip"><strong>Region:</strong> ${state.region}</span>
      <span class="chip"><strong>State:</strong> ${state.stateName}</span>
      <span class="chip"><strong>District:</strong> ${state.districts.join(", ") || "None"}</span>
    `;
  }

  renderCharts();
}

/* ---------------- Print ---------------- */

function preparePrint(){
  $("printFilterInfo").innerHTML=`
    <strong>JSW Cumulative Dashboard</strong>
    &nbsp; | &nbsp; FY: ${state.fy}
    &nbsp; | &nbsp; ${state.selectedPeriod}
    &nbsp; | &nbsp; Region: ${state.region}
    &nbsp; | &nbsp; State: ${state.stateName}
    &nbsp; | &nbsp; District: ${state.districts.join(", ")}
  `;

  Object.values(charts).forEach(chart=>chart.resize());
  setTimeout(()=>window.print(),180);
}

window.addEventListener("resize",()=>{
  Object.values(charts).forEach(chart=>chart.resize());
});

/* ---------------- Export ---------------- */

const chartExportConfig = {
  communityChart:{title:"Communities Covered",columns:[["communities","Communities"]]},
  schoolChart:{title:"Schools Covered",columns:[["schools","Schools"]]},

  lsOutreachChart:{
    title:"Target and Achieved Life Skill Outreach",
    columns:[["ls_target","Target"],["ls_achieved","Achieved"]]
  },

  lsGenderChart:{
    title:"Gender Distribution of Life Skill Programmes",
    columns:[["ls_boys","Boys"],["ls_girls","Girls"]]
  },

  lsDistributionChart:{
    title:"Life Skill Session Distribution",
    columns:[
      ["ls_touchpoint_0_pct","0 (%)"],
      ["ls_touchpoint_1_5_pct","1-5 (%)"],
      ["ls_touchpoint_6_10_pct","6-10 (%)"],
      ["ls_touchpoint_11_15_pct","11-15 (%)"],
      ["ls_touchpoint_16_20_pct","16-20 (%)"],
      ["ls_touchpoint_21_25_pct","21-25 (%)"],
      ["ls_touchpoint_26_32_pct","26-32 (%)"]
    ]
  },

  clcOutreachChart:{
    title:"Target and Achieved CLC Outreach",
    columns:[["clc_target","Target"],["clc_achieved","Achieved"]]
  },

  clcGenderChart:{
    title:"Gender Distribution of CLC Programmes",
    columns:[["clc_boys","Boys"],["clc_girls","Girls"]]
  },

  clcDistributionChart:{
    title:"CLC Session Distribution",
    columns:[
      ["clc_touchpoint_0_pct","0 (%)"],
      ["clc_touchpoint_1_10_pct","1-10 (%)"],
      ["clc_touchpoint_11_20_pct","11-20 (%)"],
      ["clc_touchpoint_21_30_pct","21-30 (%)"],
      ["clc_touchpoint_31_40_pct","31-40 (%)"],
      ["clc_touchpoint_41_50_pct","41-50 (%)"],
      ["clc_touchpoint_51_60_pct","51-60 (%)"]
    ]
  },

  lsPlannedAboveChart:{
    title:"Adolescents Planned and Above Life Skill Sessions",
    columns:[
      ["ls_planned_sessions","Planned Sessions"],
      ["ls_planned_above_count","Adolescents Planned & Above"],
      ["ls_planned_above_pct","Percent"]
    ]
  },

  clcPlannedAboveChart:{
    title:"Adolescents Planned and Above CLC Sessions",
    columns:[
      ["clc_planned_sessions","Planned Sessions"],
      ["clc_planned_above_count","Adolescents Planned & Above"],
      ["clc_planned_above_pct","Percent"]
    ]
  },

  houseVisitsChart:{
    title:"House Visits",
    columns:[["house_visits","House Visits"]]
  },

  eventsChart:{
    title:"Events",
    columns:[
      ["gov_meetings_held","Government/Panchayat Meetings"],
      ["parent_meetings_held","Parent Meetings"],
      ["teacher_meetings_held","Teacher/Principal Meetings"],
      ["balpanchayat_meetings_held","Bal Panchayat Meetings"]
    ]
  },

  parentsChart:{
    title:"Parents Engaged",
    columns:[["parents_engaged","Parents Engaged"]]
  },

  balpanchayatChart:{
    title:"Bal Panchayats Formed",
    columns:[["balpanchayat_formed","Bal Panchayats Formed"]]
  },

  educatorTrainingChart:{
    title:"Educators Training",
    columns:[["educator_training","Educators Trained"]]
  },

  sustainabilityChart:{
    title:"Sustainability School Staff Training",
    columns:[["school_staff_training","School Staff Trained"]]
  }
};

function toggleExportMenu(event,menuID){
  event.stopPropagation();

  const selected=document.getElementById(menuID);

  document.querySelectorAll(".export-menu").forEach(menu=>{
    if(menu!==selected){
      menu.classList.remove("show");
    }
  });

  selected.classList.toggle("show");
}

function safeFileName(value){
  return String(value)
    .replace(/[^\w\-]+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_|_$/g,"");
}

function exportSuffix(){
  return safeFileName(
    `${state.fy}_${state.selectedPeriod}_${state.districts.join("-") || "No-District"}`
  );
}

function triggerDownload(url,fileName){
  const link=document.createElement("a");
  link.href=url;
  link.download=fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function exportChartPNG(chartID){
  const config=chartExportConfig[chartID];
  const chart=charts[chartID];

  if(!config || !chart) return;

  const dataURL=chart.getDataURL({
    type:"png",
    pixelRatio:2,
    backgroundColor:"#ffffff"
  });

  triggerDownload(
    dataURL,
    `${safeFileName(config.title)}_${exportSuffix()}.png`
  );
}

function csvEscape(value){
  if(value===null || value===undefined) return "";

  const text=String(value);

  if(text.includes(",") || text.includes('"') || text.includes("\n")){
    return `"${text.replace(/"/g,'""')}"`;
  }

  return text;
}

function exportChartCSV(chartID){
  const config=chartExportConfig[chartID];
  if(!config) return;

  const rows=filteredRows();

  const exportColumns=[
    ["fy","Financial Year"],
    ["period","Reporting Period"],
    ["region","Region"],
    ["state","State"],
    ["district","District"],
    ...config.columns
  ];

  const csvRows=[
    exportColumns.map(c=>csvEscape(c[1])).join(",")
  ];

  rows.forEach(row=>{
    csvRows.push(
      exportColumns.map(c=>csvEscape(row[c[0]])).join(",")
    );
  });

  const blob=new Blob(
    ["\ufeff",csvRows.join("\r\n")],
    {type:"text/csv;charset=utf-8;"}
  );

  const url=URL.createObjectURL(blob);

  triggerDownload(
    url,
    `${safeFileName(config.title)}_${exportSuffix()}.csv`
  );

  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* ---------------- Load Data ----------------
   Cumulative dashboard always shows the latest appended period.
   Example: Till August 2026.
-------------------------------------------- */

Papa.parse(DATA_FILE,{
  download:true,
  header:true,
  skipEmptyLines:true,

  transformHeader:header=>
    header
      .replace(/^\uFEFF/,"")
      .trim()
      .toLowerCase()
      .replace(/\s+/g,"_"),

  complete:result=>{
    state.allData=result.data.map(row=>{
      const clean={};

      Object.entries(row).forEach(([key,value])=>{
        clean[key]=typeof value==="string" ? value.trim() : value;
      });

      clean.period_order=Number(clean.period_order);

      // Fallback for older CSVs where FY may be blank.
      if(!clean.fy && clean.period_order){
        const y = Math.floor(clean.period_order / 100);
        const m = clean.period_order % 100;
        const startYear = m >= 4 ? y : y - 1;
        clean.fy = `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
      }

      return clean;
    });

    if(!state.allData.length){
      $("status").textContent=`No data found in ${DATA_FILE}`;
      return;
    }

    populateFYFilter();
    populatePeriodFilter(true);
    applySelectedPeriod();

    $("status").textContent=
      `Loaded ${state.allData.length.toLocaleString("en-IN")} cumulative rows. Showing ${state.fy} — ${state.selectedPeriod}.`;

    render();
  },

  error:error=>{
    console.error(error);

    $("status").textContent=
      `Could not load ${DATA_FILE}. Run python -m http.server 8000`;
  }
});
