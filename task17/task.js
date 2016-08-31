/* 
{
  "北京": {
    "2016-01-01": 10,
    "2016-01-02": 10,
    "2016-01-03": 10,
    "2016-01-04": 10
  }
};
this json-like data should be loaded from server, here is just built for demo
*/
var aqiSourceData = {
  "北京": randomBuildData(500),
  "上海": randomBuildData(300),
  "广州": randomBuildData(200),
  "深圳": randomBuildData(100),
  "成都": randomBuildData(300),
  "西安": randomBuildData(500),
  "福州": randomBuildData(100),
  "厦门": randomBuildData(100),
  "沈阳": randomBuildData(500)
}
//return a random integer number which is among [1,seed];
function randomInteger(seed) {return Math.floor(Math.random() * seed) + 1; }
//make the input Date object to move forward exactly one day;
function moveOneDay(date) {date.setTime((date.getTime() + 24 * 60 * 60 * 1000)); }
//format the input Date object to be a "yyyy-mm-dd" like string
function formatDate(date){
	return [date.getFullYear(), 
			(((date.getMonth()+1)<10)?"0":"") + (date.getMonth()+1),
			((date.getDate()<10)?"0":"") + date.getDate()
		   ].join("-");
}
/*
return a random-built aqi data map for the 91 days of the first 3 month of 2016 year;
each aqi score will be a random integer number which is among [1,seed];
*/
function randomBuildData(seed){
	var ret = {};
	for(var d=new Date("2016-01-01"), end=new Date("2016-04-01");d.getTime() < end.getTime();moveOneDay(d)){
		ret[formatDate(d)] = randomInteger(seed);
	}
	return ret;
}

function $(id) {return document.getElementById(id);}

function buildCitySelect(){
  var options = [];
  for(var city in aqiSourceData){
    options.push("<option>" + city + "</option>");
  }
  $("city-select").innerHTML = options.join("");
}
var chartInfo = {
  axis_x_size: "90%",
  axis_y_size: "600px",
  max_aqi: 500,                   //已有数据中aqi数值可能的最大值
  max_aqi_height_radio: 0.8,       //aqi数值可能的最大值对应显示的柱状图高度占Y轴高度的百分比，当前配置中意味着500大小的aqi柱状图高度为480px
  colors: ["#f00","#0f0","#00f","#0ff","#f0f","#ff0"],
  
  randomColor: function(){return this.colors[Math.floor(Math.random() * this.colors.length)];}   
}

//build data by week based on the input data by day
function buildDataByWeek(dataMap){
  var ret = {};   //the result data map
  var i = 1;      //next week index
  var sum = 0;    //the sum for current week
  var count = 0;  //the day count for current week
  for(var day in dataMap){
    sum += dataMap[day];
    ++count;
    if(new Date(day).getDay() === 0){                 //it is sunday, so got a new week now
     ret["2016-week"+(i++)] = sum / count;
     sum = count = 0;
    }
  }
  if(count>0){  //the final weeek which is less than 7 days
    ret["2016-week"+i] = sum / count;
  }
  
  return ret;
}

//build data by month based on the input data by day
function buildDataByMonth(dataMap){
  var ret = {};   //the result data map
  var i = 1;      //next month index
  var sum = 0;    //the sum for current month
  var count = 0;  //the day count for current month
  var m;          //the month index for the current day
  for(var day in dataMap){
    m = new Date(day).getMonth() + 1;
    if(m > i) {  // now we got to the first day of the next month, we need to caculate the current month firstly
      ret["2016年"+(i++)+"月"] = sum / count;
      sum = count = 0;
    }
    sum += dataMap[day];
    ++count;
  }
  ret["2016年"+(i)+"月"] = sum / count; //for the final month;
  return ret;
}

//先画出视图的总标题和坐标轴区域
function drawAxis(){
  $("aqi-chart-wrap").innerHTML = "";
  
  var div = document.createElement("div");  
  div.id = "aqi-chart-container";
  div.style.width = chartInfo.axis_x_size;
  div.style.height = chartInfo.axis_y_size;
  div.style.margin = "50px auto 0";
  div.style.borderLeft = "2px solid #aaa";
  div.style.borderBottom = "2px solid #aaa";  
  div.style.position = "relative"; 
  div.style.textAlign = "center";
  $("aqi-chart-wrap").appendChild(div);
}
//根据用户当前选择的日期粒度选项和目标城市选项（已经cache到setting对象中了），绘制对应的柱状图；在本demo中有三种可能被调用的时机；
function drawChart(){
  console.log("trying to draw chart with setting: " + setting.city + ", by " + setting.granularity);
  drawAxis();
  
  //首先从aqiSourceData中的取出所选城市对应的按天数据对象，然后根据粒度选项，直接获得或者计算出需要呈现的数据对象dataMap
  var dataMap = aqiSourceData[setting.city];
  if(setting.granularity === "week"){
    dataMap = buildDataByWeek(dataMap);
  } else if(setting.granularity === "month"){
    dataMap = buildDataByMonth(dataMap);
  }  
  
  var h2 = document.createElement("h2");
  h2.innerHTML = '空气质量柱状图-<span style="color: red;">' + setting.city + '</span>-按<span style="color: red;">' + setting.granularityByChinese() + "</span>统计";
  
  var divHTMLArray = [h2.outerHTML];
  var div, i=0;
  var dataCount = Object.getOwnPropertyNames(dataMap).length;
  for(var key in dataMap){
    div = document.createElement("div");    
    div.title = key + ": " + dataMap[key];
    div.style.backgroundColor = chartInfo.randomColor();
    div.style.height = parseInt(chartInfo.axis_y_size.substring(0, chartInfo.axis_y_size.indexOf("px"))) 
                        * chartInfo.max_aqi_height_radio * dataMap[key] / chartInfo.max_aqi;                        
    div.style.position = "absolute";
    div.style.bottom = "2px";
          
    div.style.width = (100 / dataCount) + "%";
    div.style.left =  ((i++) * 100 / dataCount) + "%";
                        
    divHTMLArray.push(div.outerHTML);
  }
  
  $("aqi-chart-container").innerHTML = divHTMLArray.join("");  
}

//缓存用户的当前选中的配置，当用户选择发生改变时会对应更新相关分量属性的取值
var setting = {
  city: "北京",
  granularity: "day",
  granularityInfoMap: {day: "天", week: "周", month: "月"},
  granularityByChinese: function(){return this.granularityInfoMap[this.granularity]}
};

(function(){
  //build the city droplist based on the aqiSourceData
	buildCitySelect();
  
  //当city select选项change时，触发柱状图的重绘
  $("city-select").addEventListener("change", function(){
     setting.city = this.value;     //cache修改后的city设置
     drawChart();
  });
  
  var radioChangeHandler = function(event){
    setting.granularity = event.target.value;      //cache修改后的granularity设置
    drawChart();
  }
  var radioList = document.querySelectorAll('#form-gra-time [type="radio"]');
  for(var i=0; i<radioList.length; i++){
    radioList[i].addEventListener("change", radioChangeHandler);
  }  
  //当页面初始化加载时，柱状图第一次绘制
  drawChart();
})();