var data = crossfilter(data);

function prepareDataForHighCharts(groups){
    var data = [];
    var categories = [];
    var gdata = groups.all();
    gdata.forEach(d => {
           // let val = d.value.toFixed(2);
            categories.push(d.key);
            data.push(Math.round(d.value));
            console.log(typeof(d.value))
                        
    });
    //console.log("data",data);
    return {
        categories : categories ,
        data : data,
    }
}


//TIME TO RESOLVE
var dim_date = data.dimension( function(d) {         
    let res = new Date (d.closing_date);
return res.getTime();
} );
var grp_days_to_resolve = dim_date.group().reduceSum( d => d.Time_to_resolve);
var grp_days = dim_date.group().reduceCount( d => d.Deduction_id);
let tile_days_to_resolve =  prepareDataForHighCharts( grp_days_to_resolve );
let days = prepareDataForHighCharts( grp_days);
var t = tile_days_to_resolve.data.reduce((a,b) => a+b , 0) / days.data.reduce((a,b) => a+b , 1);
document.getElementById("avg").innerHTML = Math.round(t);
//VOLUME AND VALUE

var grp_value = dim_date.group().reduceSum( d => d.amount);
var grp_volume = dim_date.group().reduceCount( d => d.Deduction_id); 

var temp_volume = prepareDataForHighCharts( grp_volume );
var temp_value = prepareDataForHighCharts( grp_value );

//tile
let sum_vol = temp_volume.data.reduce((a, b) => a + b, 0);
console.log("sum vol",sum_vol);
document.getElementById("vol").innerHTML = sum_vol;
let sum_val = temp_value.data.reduce((a, b) => a + b, 0);
console.log("sum val",sum_vol);
let v = sum_val / 1000000;
document.getElementById("val").innerHTML = v.toFixed(2) + "M" ;

console.log("temp_value",temp_value)
console.log(temp_volume);
var options_vol_val= {
    chart: {
        renderTo: vol_val,
        zoomType: 'xy',
        height:450,
        width: 850
    },
    title: {
        text: 'Deduction Volume and Value',
        style : {
            color:'dimgray',
            fontSize:'small'
        }
        
    },
    xAxis: [{
        type:'datetime',
        // dateTimeLabelFormats:{
        //     day:'%b %d,%Y'
        // },
       // format:'{value:%b %d,%Y}',
        categories: temp_volume.categories,
             
        labels:{
            rotation:0,              
            step :80,
            align:'left',
            format:'{value:%b %d,%Y}',
            style:{
                color:'black'
            }
        }
    }],
    yAxis: [{ // Primary yAxis
        labels: {
            style: {
                color:Highcharts.getOptions().colors[0]
            }
        },
        title: {
            text: 'Volume',
            style: {
                color: Highcharts.getOptions().colors[0]
            }
        }
    }, { // Secondary yAxis
        title: {
            text: 'Value',
            style: {
                color: 'Orange'
            }
        },
        labels: {
            style: {
                color: 'Orange'
            }
        },
        opposite: true
    }],
    tooltip: {
        shared: true,
        formatter: function() {
            var tooltip = Highcharts.dateFormat('%b %e, %Y', this.points[0].x);
            tooltip += '<br>'+ "Value : " + this.points[1].y + '</span>';
             tooltip +=  " ,  Volume : " + this.points[0].y ;
           // console.log(this);
            //tooltip = "abcd";
            return tooltip;
          } 
    },
    
    series: [ {
        name: 'Volume',
        type: 'column',
        // pointStart: Date.UTC(2018, 1, 9),
        //  pointInterval: 15*24*3600*1000,
        data: temp_volume.data
    },{
        name: 'Value',
        type: 'spline',
        yAxis: 1,
        data: temp_value.data,
        color:'Orange'
          }],
    credits:{
        enabled:false,
    }
};
   

//REASON CODE BY COUNT
var dim_reason_code = data.dimension(d => d.reason_code);
var grp_reason_count = dim_reason_code.group().
reduce(reduceAdd, reduceRemove, reduceInitial).order(orderValue).top(Infinity);

var temp_reason_code = prepareCountDataForHighCharts(grp_reason_count);
//console.log(grp_reason_count);

var options_reason_code = {
    chart: {
        renderTo:'reason_code',
        type: 'bar',
        height: 280,
        width:400
    },
    title: {
        text: 'Reason Code',
        align: 0 ,
        style : {
            color:'dimgray'  ,
            fontSize:'small'         
        }
    },
    xAxis: {
        categories: temp_reason_code.categories,
        title: {
            text: null
        },
        labels:{
            style:{
                color:'black'
            }
        },
        max:10,
        scrollbar: {
            enabled: true
          },
    },
    yAxis: {
        min: 0,
        title:{
            enabled:false
        },
        labels: {
            overflow: 'justify',
            style:{
                color:'black'
            }
        }
    }, tooltip: {
        //shared: true,
        formatter: function() {
            var tooltip =  this.x +" : " + this.y;
            return tooltip;
          } 
    },
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: false
            }
        },      
       
        series:{
            
            point:{
                events:{
                    click : function(){
                        this.select(null,true);
                        var selectedPoint = this.series.chart.getSelectedPoints();
                     
                        var filteredPointType = [];
                        for( let i =0 ; i< selectedPoint.length ; i++){
                            filteredPointType.push(selectedPoint[i].category);
                        }//for
                       
                        function multivalue_filter(values){
                            return function(v){
                                console.log("v=",v,"=",values.indexOf(v)!=-1);                                            
                                return values.indexOf(v)!=-1;                                
                            }
                        }

                        //filtering chart1
                        if( filteredPointType.length > 0){
                            dim_reason_code.filterFunction(multivalue_filter(filteredPointType));
                        }
                        else{
                            dim_reason_code.filterAll();
                        }

                        //creting new data
                        var newData_processor = prepareCountDataForHighCharts(grp_processor_count);
                        var newData_top_cust = prepareCountDataForHighCharts(grp_cust_count);
                        var newData_val = prepareDataForHighCharts(grp_value);
                       var newData_vol = prepareDataForHighCharts(grp_volume);
                        var new_resolve = prepareDataForHighCharts(grp_days_to_resolve);
                        var new_days = prepareDataForHighCharts(grp_days) ;

                        var t = new_resolve.data.reduce((a,b) => a+b , 0) / new_days.data.reduce((a,b) => a+b , 1);
                        document.getElementById("avg").innerHTML = Math.round(t);
                        

                        //updating the chart
                        chart_processor.xAxis[0].setCategories(newData_processor);
                        chart_processor.series[0].setData(newData_processor.data);
                       
                        chart_top_cust.xAxis[0].setCategories( newData_top_cust );
                        chart_top_cust.series[0].setData( newData_top_cust.data );

                        chart_vol_val.xAxis[0].setCategories( newData_vol.categories);
                        chart_vol_val.series[0].setData( newData_vol.data);
                        chart_vol_val.series[1].setData( newData_val.data);
                        
                        //console.log("new val",newData_val.data[9].toFixed(2));

                          //tiles
                       let sum_vol = newData_vol.data.reduce((a, b) => a + b, 0)
                       console.log("sum vol",sum_vol);
                       document.getElementById("vol").innerHTML = sum_vol;
                       let sum_val = newData_val.data.reduce((a, b) => a + b, 0)
                       let v = sum_val / 1000000;
                       document.getElementById("val").innerHTML = v.toFixed(2) + "M" ;

                    }
                }
            }
        }
        },
    credits: {
        enabled: false
    },
    series: [{
       name:null,
        data: temp_reason_code.data
    }],
    legend:{
        enabled:false
    }
};
              

//TOP K CUSTOMERS BASED ON count
var dim_top_cust = data.dimension(d => d.customer);
var grp_cust_count = dim_top_cust.group().
reduce(reduceAdd, reduceRemove, reduceInitial).order(orderValue).top(10);
//console.log("top",top_);

function prepareTopDataForHighCharts(gdata){

    var data = [];
    var categories = [];
    //var gdata = groups.all();
    gdata.forEach(d => {
       
            categories.push(d.key);
            data.push(d.value);
                            
    });
    return {
        categories : categories ,
        data : data
    }

}


var temp_top = prepareCountDataForHighCharts(grp_cust_count);
//console.log("temp_top",temp_top);

var options_top_cust= {
    chart: {
        renderTo: top_cust,
        type: 'bar',
        height:280,
        width:400
    },
    title: {
        text: 'Top 10 Customers',
        align: 0 ,
        style : {
            color:'dimgray'    ,
            fontSize:'small'       
        }
    },
    xAxis: {
        categories: temp_top.categories,
        title: {
            text: null
        },
        labels:{
            style:{
                color:'black'
            }
        }
    },
    yAxis: {
        min: 0,
        title:{
            enabled:false
        },
        labels: {
            overflow: 'justify',
            style:{
                color:'black'
            }
        }
    },
    tooltip: {
        //shared: true,
        formatter: function() {
            var tooltip =  this.x +" : " + this.y;
            return tooltip;
          } 
    },
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: false
            }
        }, series:{
            
            point:{
                events:{
                    click : function(){
                        this.select(null,true);
                        var selectedPoint = this.series.chart.getSelectedPoints();
                     
                        var filteredPointType = [];
                        for( let i =0 ; i< selectedPoint.length ; i++){
                            filteredPointType.push(selectedPoint[i].category);
                        }//for
                       
                        function multivalue_filter(values){
                            return function(v){
                               // console.log("v=",v,"=",values.indexOf(v)!=-1);                                            
                                return values.indexOf(v)!=-1;                                
                            }
                        }

                        //filtering chart
                        if( filteredPointType.length > 0){
                            dim_top_cust.filterFunction(multivalue_filter(filteredPointType));
                        }
                        else{
                            dim_top_cust.filterAll();
                        }

                        //creting new data
                        var newData_processor = prepareCountDataForHighCharts(grp_processor_count);
                        var newData_reason_code = prepareCountDataForHighCharts(grp_reason_count);
                        var newData_val = prepareDataForHighCharts(grp_value);
                       var newData_vol = prepareDataForHighCharts(grp_volume);
                        
                       var new_resolve = prepareDataForHighCharts(grp_days_to_resolve);
                        var new_days = prepareDataForHighCharts(grp_days) ;

                        var t = new_resolve.data.reduce((a,b) => a+b , 0) / new_days.data.reduce((a,b) => a+b , 1);
                        document.getElementById("avg").innerHTML = Math.round(t);
                        

                        //updating the chart
                        chart_processor.xAxis[0].setCategories(newData_processor);
                        chart_processor.series[0].setData(newData_processor.data);
                       
                        chart_reason_code.xAxis[0].setCategories( newData_reason_code );
                        chart_reason_code.series[0].setData( newData_reason_code.data );

                        chart_vol_val.xAxis[0].setCategories( newData_vol.categories);
                        chart_vol_val.series[0].setData( newData_vol.data);
                        chart_vol_val.series[1].setData( newData_val.data);
                        console.log("new vol",newData_vol.data);
                        console.log("new val",newData_val.data);

                          //tiles
                       let sum_vol = newData_vol.data.reduce((a, b) => a + b, 0)
                       console.log("sum vol",sum_vol);
                       document.getElementById("vol").innerHTML = sum_vol;
                       let sum_val = newData_val.data.reduce((a, b) => a + b, 0)
                       let v = sum_val / 1000000;
                       document.getElementById("val").innerHTML = v.toFixed(2) + "M" ;
                        

                    }
                }
            }
        }
    },
    credits: {
        enabled: false
    },
    series: [{
       name:null,
        data: temp_top.data
    }],
    legend:{
        enabled:false
    }
};

var dim_top_cust = data.dimension(d => d.customer);
var grp_cust_amount_sum = dim_top_cust.group();
var top_ = grp_cust_amount_sum.top(10);
//console.log("top",top_);

function prepareTopDataForHighCharts(gdata){

    var data = [];
    var categories = [];
    //var gdata = groups.all();
    gdata.forEach(d => {
       
            categories.push(d.key);
            data.push(d.value);
                            
    });
    return {
        categories : categories ,
        data : data
    }

}


//PROCESSOR BY COUNT
function prepareCountDataForHighCharts(gdata){

    var data = [];
    var categories = [];
    //var gdata = groups.all();
    gdata.forEach(d => {
       
            categories.push(d.key);
            data.push(d.value.count);
                            
    });
    return {
        categories : categories ,
        data : data
    }

}


function reduceAdd(p, v) {
    ++p.count;
   // p.total += v.total;
    return p;
  }
  
  function reduceRemove(p, v) {
    --p.count;
  //  p.total -= v.total;
    return p;
  }
  
  function reduceInitial() {
    return {count: 0};
  }
function orderValue(p) {
    return p.count;
  } 

var dim_processor = data.dimension( d => d.D_processor );
var grp_processor_count = dim_processor.group().
reduce(reduceAdd, reduceRemove, reduceInitial).order(orderValue).top(Infinity);
//console.log(grp_processor_count);
var temp_processor = prepareCountDataForHighCharts( grp_processor_count );


var options_processor = {
    chart: {
        renderTo:processor,
        type: 'bar',
        height:280,
        width:400
    },
    title: {
        text: 'Processor',
        align: 0 ,
        style : {
            color:'dimgray' ,
            fontSize:'small'          
        }
    },
    xAxis: {
        categories: temp_processor.categories,
       
        title: {
            text: null,
                      
        },
        labels:{
            style:{
                color:'black'
            }
        },
        max:10,
        scrollbar: {
            enabled: true
          }
    },
    yAxis: {
        min: 0,
        title:{
            enabled: false
        },
        labels: {
            overflow: 'justify',
            style:{
                color:'black'
            }
        }
    },
    tooltip: {
        //shared: true,
        formatter: function() {
            var tooltip =  this.x +" : " + this.y;
            return tooltip;
          } 
    },
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: false
            }
        },
        series:{
            
            point:{
                events:{
                    click : function(){
                        this.select(null,true);
                        var selectedPoint = this.series.chart.getSelectedPoints();
                     
                        var filteredPointType = [];
                        for( let i =0 ; i< selectedPoint.length ; i++){
                            filteredPointType.push(selectedPoint[i].category);
                        }//for
                       
                        function multivalue_filter(values){
                            return function(v){
                               // console.log("v=",v,"=",values.indexOf(v)!=-1);                                            
                                return values.indexOf(v)!=-1;                                
                            }
                        }

                        //filtering chart
                        if( filteredPointType.length > 0){
                            dim_processor.filterFunction(multivalue_filter(filteredPointType));
                        }
                        else{
                            dim_processor.filterAll();
                        }

                        //creting new data
                        var newData_top_cust = prepareCountDataForHighCharts(grp_cust_count);
                        var newData_reason_code = prepareCountDataForHighCharts(grp_reason_count);
                        var newData_val = prepareDataForHighCharts(grp_value);
                       var newData_vol = prepareDataForHighCharts(grp_volume);

                       var new_resolve = prepareDataForHighCharts(grp_days_to_resolve);
                        var new_days = prepareDataForHighCharts(grp_days) ;

                        var t = new_resolve.data.reduce((a,b) => a+b , 0) / new_days.data.reduce((a,b) => a+b , 1);
                        document.getElementById("avg").innerHTML = Math.round(t);
                        
                        

                        //updating the chart
                        chart_top_cust.xAxis[0].setCategories(newData_top_cust);
                        chart_top_cust.series[0].setData(newData_top_cust.data);
                       
                        chart_reason_code.xAxis[0].setCategories( newData_reason_code );
                        chart_reason_code.series[0].setData( newData_reason_code.data );

                        chart_vol_val.xAxis[0].setCategories( newData_vol.categories);
                        chart_vol_val.series[0].setData( newData_vol.data);
                        chart_vol_val.series[1].setData( newData_val.data);
                        console.log("new vol",newData_vol.data);
                        console.log("new val",newData_val.data);

                        //tiles
                       let sum_vol = newData_vol.data.reduce((a, b) => a + b, 0)
                       console.log("sum vol",sum_vol);
                       document.getElementById("vol").innerHTML = sum_vol;
                       let sum_val = newData_val.data.reduce((a, b) => a + b, 0)
                       let v = sum_val / 1000000;
                       document.getElementById("val").innerHTML = v.toFixed(2) + "M" ;

                       

                    }
                }
            }
        }
    },
    credits: {
        enabled: false
    },
    series: [{
       name:null,
        data: temp_processor.data
    }],
    legend:{
        enabled:false
    }
};

var chart_vol_val = Highcharts.chart(options_vol_val);
var chart_reason_code = Highcharts.chart(options_reason_code);
var chart_processor = Highcharts.chart(options_processor);
var chart_top_cust = Highcharts.chart(options_top_cust);