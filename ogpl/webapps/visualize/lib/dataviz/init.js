var DataViz = {
	query: null,
	query_instance: '',
	node_id: '',
	node_detail: {},
	ganerate_query: '',
	job_queue: [],
	job_queue_pos: 0,
	_query_elemnts: {
		select: [],
		aggregate: [],
		where:[],
		group_by:[],
		order_by:[],
		limit:''
	},
	_chart_data: {
		base_axis: null, 
		series: []
	},
	_viz_path: "",
	_chart_type: "LineChart",
	_chart_base: null,
	_visualization_chart_wrapper: null,
	_visualization_chart_wrapper_za: null,
	_chart_theme: 'light',
	_mapminZoomLevel: 4,
	arcgis_map: null,
	mapExtension: null,
	_cache_data: null,
	_local_data: {
		'chart': null
	},
	_view_container: null,
	_view_current_id: null,
	view_current_id: null,
	_set_view_onload: true,
	_data_scource: null,
	_data_instance: null,
	_data_views: null,
	_query_opration: {
		'string': [
			'=',
			'!=',
			'starts with',
			'ends with',
			'contains',
			'matches'
		],
		'number': [
			 '<=', 
			 '<', 
			 '>', 
			 '>=', 
			 '=', 
			 '!='
		]
	},
	init: function() {
		if(!this._check_jquery()) {
			alert('jQuery Not found!');
			return;
		}
		//dojo.require("esri.map");
		//dojo.require("esri.tasks.query");
	    //dojo.require("esri.tasks.geometry");
		
		return this;
	},
	toggleDatasetInfo: function() {
		$('.dataset-details').toggle();
	},
	drawVisualization: function() {
		  // To see the data that this visualization uses, browse to
			//DataViz.query = new google.visualization.Query('http://spreadsheets.google.com/tq?key=0B_UVLpCtvU0NUFJNanVQaUszd2c&range=B1:C11&pub=1');
			DataViz.loadDataScource();
			
			DataViz.query = new google.visualization.Query(DataViz.query_instance);
			
			// Apply query language.
			//var _query = DataViz.queryBuilder.set_query(DataViz._query_elemnts).parse_vars().get_query();
			
			var _query = DataViz.queryBuilder.set_query(DataViz._query_elemnts).parse_vars().get_query();
			
			
			
			if(_query != '') {
				DataViz.query.setQuery(_query);
				_query = DVE_replace_script(_query);
				$('#data_viz_custom_query_value').html(_query);
			}
	        // Send the query with a callback function.
			DataViz.query.send(DataViz.handleQueryResponse);
	},
	sendQueryRequest: function(query, callback) {
		var googleQueryObj = new google.visualization.Query(DataViz.query_instance);
		googleQueryObj.setQuery(query);
		googleQueryObj.send(callback);
	},
	updateVisualisation: function() {
		DataViz.drawVisualization();
	},
	createInstanceList: function(node_id) {
		DataViz.node_id = node_id;
		var data = "type=option";
		
		$.ajax({
	         url: "/visualizationinstances/"+node_id,
	         type: "GET",
	         data: data,
	         cache: false,
	         dataType: 'json',
	         success: function (response) {
	             if(response.status) {
	            	 $('#instance-dropdown').html('');
	            	 for(d in response.data) {
	            		 var selected = '';
	            		 
	            		 if(DataViz._data_instance == response.data[d].data_instance) {
	            			 selected = 'selected="selected";'
	            		 }
	            		 $('#instance-dropdown').append('<option value="'+response.data[d].data_instance+'" '+selected+' >'+response.data[d].title+'</option>');
	            		 
	            	 } 
	            	 //$('#instance-dropdown').select2();
	             }
	             
	         }
	     });
	},
	setVizPath: function(path) {
		DataViz._viz_path = path;
	},
	setDatasource: function(source, instance, loadNow) {
		DataViz._data_scource = source;
		DataViz._data_instance = instance;
		if(loadNow == true) {
			DataViz._reset_all();
			DataViz._loadDataScource();
		}
	},
	loadDataScource: function() {
		var source = DataViz._data_scource ;
		var instance = DataViz._data_instance;
		var loadinghtml = '<center><img src="'+DataViz._viz_path+'images/loading.gif" /></center>';
		
		switch(source) {
			case'google_spreadsheet':
				DataViz.query_instance = $('#google-spreadsheet-source').val();
				//$('#ModalgoogleSpreadsheet').modal('hide');
				$('#data_viz_grid').html(loadinghtml);
				break;
			case'data_gov_in_source':
				DataViz.query_instance = '/opendatavisualization/' + instance + '/json';
				//$('#ModalDataGovIn').modal('hide');
				$('#data_viz_grid').html(loadinghtml);
				break;
			default:
				query_instance = '/opendatavisualization/' + instance + '/json';
				$('#data_viz_grid').html(loadinghtml);
				break;
			
		}
	},
	/*
	 * On page load
	 */
	_loadDataScource: function() {
		var source = DataViz._data_scource ;
		var instance = DataViz._data_instance;
		var loadinghtml = '<center><img src="'+DataViz._viz_path+'images/loading.gif" /></center>';
		
		switch(source) {
			case'google_spreadsheet':
				DataViz.query_instance = $('#google-spreadsheet-source').val();
				//$('#ModalgoogleSpreadsheet').modal('hide');
				$('#data_viz_grid').html(loadinghtml);
				DataViz.drawVisualization();
				break;
			case'data_gov_in_source':
				DataViz.query_instance = '/opendatavisualization/' + instance + '/json';
				//$('#ModalDataGovIn').modal('hide');
				$('#data_viz_grid').html(loadinghtml);
				DataViz.drawVisualization();
				DataViz.loadView();
				break;
			default:
				query_instance = '/opendatavisualization/' + instance + '/json';
				$('#data_viz_grid').html(loadinghtml);
				DataViz.drawVisualization();
				break;
			
		}
	},
	handleQueryResponse: function(response) {
		//$('#data_viz_chart').html('');
		if (response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
		    return;
		}
		
		var data = response.getDataTable();
		DataViz._cache_data = data;
		//DataViz._local_data.chart = data;
		console.log(data);
		DataViz._add_fields(data.H);
		
		DataViz._initialize_grid(data, false);
		
		//DataViz._initialize_chart(data, true);
		
		/* 
		visualization_geomap = new google.visualization.GeoMap(document.getElementById('data_viz_geomap'));
		visualization_geomap.draw(data, {
				"title": ""
			}
		);
		  
		visualization_timeline = new google.visualization.MotionChart(document.getElementById('data_viz_timeline'));
		visualization_timeline.draw(data, {
				"title": ""
			}
		);
		*/
		
		DataViz._initialize_map(data, true, true);
		DataViz._check_component();
		DataViz._populat_available_field(DataViz._chart_base, 'data_viz_available_chart_base_field');
		DataViz._populate_filter();
		DataViz._populate_lat_lon();
		DataViz._update_group();
		//DataViz._getNodeDetail();
		DataViz._populat_chart_series();
		DataViz._compute_chart_series();
		DataViz.set_query_filter();
		DataViz.loadView();
	},
	
	removeFilter: function(i) {
		if(typeof DataViz._query_elemnts.where[i] != 'undefined') {
			DataViz._query_elemnts.where.splice(i, 1);
			DataViz.addIndicatorViewChanges();
			DataViz.drawVisualization();
		}
	},
	_reset_all: function() {
		DataViz._query_elemnts = {
			select: [],
			where:[],
			group_by:[],
			order_by:[],
			limit:''
		};
		
		DataViz._local_data = {
			'chart': null
		};
		
		DataViz._chart_data =  {
			base_axis: null,
			series: []
		};
		
		DataViz._chart_base = null;
		DataViz._chart_theme = null;
		
		var html = '<h4><span class="graphicon-view"></span> Complete View </h4>';
		$("#data_viz_current_view_info").html(html);
		$('#data_viz_added_series').html('')
		
		$('#data_viz_chart').html('');
		
		if($("#data_component button.chart").hasClass('active')) {
			$("#data_component button.chart").click();
		}
		
		if($("#data_component button.map").hasClass('active')) {
			$("#data_component button.map").click();
		}
		
		if($("#data_component button.dashboard").hasClass('active')) {
			$("#data_component button.dashboard ").click();
		}
		
		DataViz.updateVisualisation();
	},
	addFilter: function() {
		var field 		= $('#data_viz_available_field').val();
		var operator 	= $('#data_viz_operator').val();
		var value		= $('#data_viz_filter_value').val();
		var and_or		= $('#data_viz_and_or').val();
		
		if(and_or == '') {
			DataViz._show_message('Error', 'Please entre a value!');
			return false;
		}
		
		if(field == '') {
			DataViz._show_message('Error', 'Please select a field!');
			return false;
		}
		
		if(operator == '') {
			DataViz._show_message('Error', 'Please select a operator!');
			return false;
		}
		
		if(value == '') {
			DataViz._show_message('Error', 'Please entre a value!');
			return false;
		}
		
		if(DVE_test_blacklist(field)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		if(DVE_test_blacklist(operator)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		if(DVE_test_blacklist(value)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		if(DVE_test_blacklist(and_or)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		var where = {
			and_or: and_or,
			statement: DataViz._cache_data.getColumnId(parseInt(field))+' '+operator+' \''+value+'\'',
			statement_label: DataViz._cache_data.getColumnLabel(parseInt(field))+' '+operator+' \''+value+'\'',
			field: DataViz._cache_data.getColumnId(parseInt(field)),
			field_index: field,
			operator: operator,
			value: value
		};
		
		
		
		if (typeof DataViz._query_elemnts.where == 'undefined') {
			DataViz._query_elemnts.where = [];
		}
		
		DataViz._query_elemnts.where.push(where);
		DataViz.addIndicatorViewChanges();
		DataViz.updateVisualisation();
	},
	addGroup: function() {
		var group_by_val = $('#data_viz_available_groupby_data_field').val();
		
		if(group_by_val == '' || typeof group_by_val == 'undefined') {
			DataViz._show_message('Error', 'Please select a Group field');
			return false;
		}
		
		if(DVE_test_blacklist(group_by_val)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		if (typeof DataViz._query_elemnts.group_by == 'undefined') {
			DataViz._query_elemnts.group_by = [];
		}
		
		var group_by = {
				field: DataViz._cache_data.getColumnId(parseInt(group_by_val)),
				field_index: group_by_val
		};
		
		DataViz._query_elemnts.group_by.push(group_by);
		DataViz.updateVisualisation();
	},
	_update_group: function() {
		var container = $("#data_viz_group");
		var group_by = DataViz._query_elemnts.group_by;
		
		$(container).html(
				'<div class="row-fluid">'+
			      '<div class="span12"><H6>Applied Group</H6></div>'+
				'</div>');
		
		for (i in group_by) {
			$(container).append(
			'<div class="row-fluid">'+
					'<div class="span10">'+
					'<span class="label">'+DataViz._cache_data.getColumnLabel(parseInt(group_by[i].field_index))+'</span> </div>'+
					'<div class="span2"><button class="close" onclick="DataViz.removeGroup('+i+')">&times;</button></div>'+
			'</div>');
		}
		
	},
	removeGroup: function(i) {
		if(typeof DataViz._query_elemnts.group_by[i] != 'undefined') {
			DataViz._query_elemnts.group_by.splice(i, 1);
			DataViz.drawVisualization();
		}
	},
	addAggregate: function() {
		var aggregate_field = $('#data_viz_available_aggregate_data_field').val();
		var funtn = $('#data_viz_aggregate_function_field').val();
		
		if(aggregate_field == '' || typeof aggregate_field == 'undefined') {
			DataViz._show_message('Error', 'Please select a field!');
			return false;
		}
		
		if(funtn == '' || typeof funtn == 'undefined') {
			DataViz._show_message('Error', 'Please select a function!');
			return false;
		}
		
		if(DVE_test_blacklist(aggregate_field)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		if(DVE_test_blacklist(funtn)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		if (typeof DataViz._query_elemnts.aggregate == 'undefined') {
			DataViz._query_elemnts.aggregate = [];
		} 
		
		var aggregate = {
			field_index: aggregate_field,
			aggregate_fun: funtn
		};
		
		DataViz._query_elemnts.aggregate.push(aggregate);
		
		DataViz.update_aggregate();
		
		DataViz.updateVisualisation();
		
	},
	update_aggregate: function() {
		$('#data_viz_aggregate_field').html("");
		var aggregate = DataViz._query_elemnts.aggregate;
		for (i in aggregate) {
			var agg = aggregate[i].aggregate_fun + '(' + DataViz._cache_data.getColumnLabel(parseInt(aggregate[i].field_index)) + ')';
			$('#data_viz_aggregate_field').append(
				'<div class="row-fluid">'+
						'<div class="span10">' +
						'<span class="label">' + agg + '</span></div>'+
						'<div class="span2"><button class="close" onclick="DataViz.removeAggregate(' + i + ')">&times;</button></div>' +
				'</div>');
			
			var field_id = DataViz._cache_data.getColumnId(parseInt(aggregate[i].field_index));
			var _field 	 = aggregate[i].aggregate_fun + '(' + field_id + ')';
			
			DataViz._query_elemnts.select.push(_field);
		}
		
	},
	removeAggregate: function(i) {
		if(typeof DataViz._query_elemnts.aggregate[i] != 'undefined') {
			DataViz._query_elemnts.aggregate.splice(i, 1);
			DataViz.update_aggregate();
			DataViz.drawVisualization();
		}
	},
	_initialize_chart: function(data, cache, type) {
		
		
		if(typeof type == 'undefined') {
			type = DataViz._chart_type;
		}
		
		if (cache)
			DataViz._draw_chart(data, type);
		else
			DataViz._draw_chart(DataViz._local_data.chart, type);
	},
	_draw_chart: function(data, type) {
		var chart_title = $('#chart_name').val();
		var hAxis_title = $('#chart_base_axis_label').val();
		var vAxis_title = $('#chart_series_axis_label').val();
		
		if(DataViz._chart_type != null && typeof DataViz._chart_type != 'undefined' &&  DataViz._chart_type != '') {
			if(typeof DataViz._visualization_chart_wrapper != 'undeifned') {
				DataViz._visualization_chart_wrapper = new google.visualization.ChartWrapper({
					chartType: DataViz._chart_type,
					dataTable: data,
					"title": chart_title,
					chartArea: {width: '75%', height: '75%'},
					vAxis: {title: hAxis_title},
					hAxis: {title: vAxis_title},
					containerId: 'data_viz_chart'
				});
			} else {
				DataViz._visualization_chart_wrapper.setDataTable(data);
				DataViz._visualization_chart_wrapper.setChartType(DataViz._chart_type);
			}
			
			DataViz._visualization_chart_wrapper.draw();
		}
	},
	_open_chart_editor: function() {
		// Handler for the "Open Editor" button.
		  var editor = new google.visualization.ChartEditor();
		  google.visualization.events.addListener(editor, 'ok',
		    function() {
			  DataViz._visualization_chart_wrapper = editor.getChartWrapper();
			  DataViz._visualization_chart_wrapper.draw(document.getElementById('data_viz_chart'));
			  DataViz._visualization_chart_wrapper_za = DataViz._visualization_chart_wrapper.Za;
			  DataViz._chart_type = DataViz._visualization_chart_wrapper.getChartType();
			  DataViz.addIndicatorViewChanges();
		  });
		  editor.openDialog(DataViz._visualization_chart_wrapper);
	},
	_initialize_grid: function(data, cache) {
		if (cache == true)
			DataViz._draw_grid(DataViz._cache_data);
		else
			DataViz._draw_grid(data);
	},
	_draw_grid: function(data) {
		visualization_grid = new google.visualization.Table(document.getElementById('data_viz_grid'));
	      visualization_grid.draw(data, {
	             "title": "",
				 "page" : "enable",
				 "pageSize": 10,
				 "pagingButtonsConfiguration": "auto",
				 "showRowNumber" : true,
	           }
	      );
	      $('.record-count').html(data.getNumberOfRows() + " Records");
	},
	_vizMouseOver: function(vizobj, e) {
		vizobj.setSelection([e]);
	},
	generateMap: function() {
		DataViz._initialize_map(DataViz._cache_data, false, false);
	},
	_generate_map: function(data, map, auto) {
		var geo_index = DataViz._get_lat_lon_index(data, auto);
			// Limit the zoom level
		   google.maps.event.addListener(map, 'zoom_changed', function() {
		     if (map.getZoom() < DataViz._mapminZoomLevel) map.setZoom(DataViz._mapminZoomLevel);
		   });
		   
		if (typeof(geo_index['lat']) != 'undefined') {
			$.each (data.J, function(key, value) { 
			var myLatlng = new google.maps.LatLng(value.c[geo_index['lat']].v,value.c[geo_index['lon']].v);
			var information = '';
			$.each (value, function(i, rowdata) { 
				$.each (rowdata, function(j, rowvalue) { 
					if (j !== geo_index['lat'] && j !== geo_index['lon']) {
					information += data.H[j].label + ": " + rowvalue.v + " </br>";
					}
				});
			});
			var marker = new google.maps.Marker({
		        position: myLatlng,
		        map: map
		        });
				var infowindow = new google.maps.InfoWindow({
				    content: information
				});
	
				google.maps.event.addListener(marker, 'click', function() {
			    	infowindow.open(map,marker);
			    });
			});
		}
	},
	_generate_arcgis_map: function(data, auto) {
		var geo_index = DataViz._get_lat_lon_index(data, auto);
		if (typeof(geo_index['lat']) !== 'undefined') {
			$.each (data.J, function(key, value) { 
			var myLatlng = new google.maps.LatLng(value.c[geo_index['lat']].v,value.c[geo_index['lon']].v);
			var information = '';
			$.each (value, function(i, rowdata) { 
				$.each (rowdata, function(j, rowvalue) { 
					if (j !== geo_index['lat'] && j !== geo_index['lon']) {
					information += data.H[j].label + ": " + rowvalue.v + " </br>";
					}
				});
			});
				//DataViz._add_point_arcgis_map(value.c[geo_index['lon']].v,value.c[geo_index['lat']].v,information);
			});
		}
	},
	_add_point_arcgis_map: function(lon,lat, content) {
		var point = new esri.geometry.Point(lon, lat);
        point = esri.geometry.geographicToWebMercator(point);
        var symbol = new esri.symbol.PictureMarkerSymbol("marker.png", 32, 32);
        var graphic = new esri.Graphic(point, symbol);
        var layer = new esri.layers.GraphicsLayer();
        layer.add(graphic);
        DataViz.arcgis_map.addLayer(layer);
        dojo.connect(layer, "onClick", dojo.partial(DataViz.showPoint,content));
	},
	_get_lat_lon_index: function(data, auto) {
		
		var lat_val = ['lat','latitude'];
		var lon_val = ['lon','longitude'];
		var geo_index = {};
		if (auto) {
		$.each(data.H, function(key, value) { 
			  if ($.inArray(value.label.toLowerCase(), lat_val) !== -1) {
				  geo_index['lat'] = key;
			  }
			  if ($.inArray(value.label.toLowerCase(), lon_val) !== -1) {
				  geo_index['lon'] = key;
			  }
		});
		}
		else {
			geo_index['lat'] = $('#data_viz_available_map_lat_field').val();
			geo_index['lon'] = $('#data_viz_available_map_lon_field').val()
			
		}
		return geo_index;
	},
	_populate_lat_lon: function() {
		var geo_index = DataViz._get_lat_lon_index(DataViz._cache_data, true);
		if(typeof(geo_index['lat']) !== 'undefined') {
			//DataViz._populat_available_field(geo_index['lat'], 'data_viz_available_map_lat_field');
			$('#data_viz_available_map_lat_field').val(geo_index['lat']);
		}
		if(typeof(geo_index['lon']) !== 'undefined') {
			//DataViz._populat_available_field(geo_index['lon'], 'data_viz_available_map_lon_field');
			$('#data_viz_available_map_lon_field').val(geo_index['lon']);
		}
	},
	_initialize_arcgis_map: function(){
		DataViz.arcgis_map = new esri.Map("data_viz_arcgismap");
       //DataViz.arcgis_map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"));
       DataViz.arcgis_map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://10.1.31.19/ArcGIS/rest/services/india11_new/MapServer"));
       DataViz.arcgis_map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://10.1.31.19/ArcGIS/rest/services/locations_new/MapServer"));
	},
	showPoint: function(content, evt) {
		DataViz.arcgis_map.infoWindow.setTitle("Information");
        DataViz.arcgis_map.infoWindow.setContent(content);
        DataViz.arcgis_map.infoWindow.show(evt.mapPoint,DataViz.arcgis_map.getInfoWindowAnchor(evt.screenPoint));
	},
	_show_arcgis_map: function() {
		dojo.addOnLoad(DataViz._initialize_arcgis_map);
		DataViz._generate_arcgis_map(DataViz._cache_data, true);
	},
	_initialize_map: function(data, cache, auto) {
		var mapDiv = document.getElementById('data_viz_map');
        var map = new google.maps.Map(mapDiv, {
          center: new google.maps.LatLng(28.6358, 77.2244),
          zoom: DataViz._mapminZoomLevel,
          copyrights: 'Powered by Dataviz. Map Data &copy; Goole 2012',
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID]
          },
        });
       
        if(auto) {
        	var auto_latlon= true;
        }
        else {
        	var auto_latlon= false;
        }
        if (cache)
			DataViz._generate_map(data, map, auto_latlon);
		else
			DataViz._generate_map(DataViz._cache_data, map, auto_latlon);
       	
	},
	executeQuery: function(){
		var custom_query = $('#data_viz_custom_query_value').val();
		if(DVE_test_blacklist(custom_query)) {			
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		DataViz._set_visualization_query(custom_query);
	},
	_set_visualization_query: function(query) {
		if(query) {
			DataViz.query.setQuery(query);
		} else {
			DataViz.query.setQuery(DataViz.ganerate_query);
		}
		
		DataViz._reload_visualization();
	},
	_reload_visualization: function(){
		var loadinghtml = '<center><img src="'+DataViz._viz_path+'images/loading.gif" /></center>';
		$('#data_viz_grid').html(loadinghtml);
		DataViz.query.send(DataViz.handleQueryResponse);
	},
	
	_add_fields: function(cols) {
		for(i in cols) {
			DataViz._add_fields_row(cols[i]);
		}
	},
	_clear_fields: function() {
		$("#data_control_pane").html('');
	},
	_add_fields_row: function(col) {
		if(typeof col.is_aggregate == 'undefined') {
			$("#data_control_pane").append(DataViz._create_fields(col.id, col.label));
		}
		
	},
	_add_query_window: function() {
		var query = '';
		$("#data_control_pane").append();	
	},
	_set_query_filter: function() {
		DataViz.ganerate_query = '';
		var query = [];
		$('.data__col input').each(function(i) {
			if($(this).is(':checked')) {
				query.push($(this).val());
			}
		});
		DataViz._query_elemnts.select = query;
		DataViz.updateVisualisation();
		
	},
	set_query_filter: function() {
		DataViz.ganerate_query = '';
		var query = [];
		$('.data__col input').each(function(i) {
			if($(this).is(':checked')) {
				query.push($(this).val());
			}
		});
		DataViz._query_elemnts.select = query;
	},
	_create_fields: function(id, label) {
		if(id == 'undefined' || id == null) {
			return '';
		}
		if(typeof $('.data__col #'+id).attr('id') != 'undefined') {
			return '';
		}
		var button = '<div class="data__col">' 
			+ '<input class="pull-left" checked="checked" '
			+ 'type="checkbox" id="'+id+'" value="'+id.toLowerCase()+'" '
			+ 'onclick="DataViz._set_query_filter()" '
			+ '/><label for="'+id+'">'+label+'</label></div>';
		
		
		return button;
	},
	_populate_filter: function() {
		var container = $("#data_viz_filter");
		var where = DataViz._query_elemnts.where;
		
		if(typeof where != 'undefined') {
			$('#data_viz_and_or').show();
		} else {
			$('#data_viz_and_or').hide();
		}
		
		$(container).html(
				'<div class="row-fluid">'+
			      '<div class="span12"><H6>Applied Filter</H6></div>'+
				'</div>');
		
		for(i in where) {
			var statement_label = DataViz._cache_data.getColumnLabel(parseInt(where[i].field_index)) + ' ' + where[i].operator + ' ' + where[i].value;
			$(container).append(
			'<div class="row-fluid">'+
					'<div class="span10">'+
					(i>0?'<span class="label label-info">'+where[i].and_or+'</span> ':'')+
					'<span class="label">'+statement_label+'</span> </div>'+
					'<div class="span2"><button class="close" onclick="DataViz.removeFilter('+i+')">&times;</button></div>'+
			'</div>');
		}
		
	},
	_populat_available_field: function(index_val, id) {

		$(".data_viz_available_field").each(function() {
			var first_option = $(this).find('option[value=""]');
			
			$(this).html("");
			$(this).append(first_option);
			var columns = DataViz._cache_data.H;
			
			for(key in columns) {
				if (index_val && key == index_val && id != 'undefined' && $(this).attr('id') == id)
					$(this).append('<option value="'+key+'" selected="selected">'+columns[key].label+'</option>');
				else
					$(this).append('<option value="'+key+'">'+columns[key].label+'</option>');
			}
		});
		
		$(".data_viz_all_field").each(function() {
			var first_option = $(this).find('option[value=""]');
			
			$(this).html("");
			$(this).append(first_option);
			var columns = DataViz.data.H;
			
			for(key in columns) {
				$(this).append('<option value="'+key+'">'+columns[key].label+'</option>');
			}
		});
		
		DataViz._populat_operator('');
	},
	_populat_operator: function(columnKey) {
		var column_type;
		if(columnKey != '')
			column_type = DataViz._cache_data.getColumnType(parseInt(columnKey));
		
		$("#data_viz_operator").html("");
		$("#data_viz_operator").append('<option value="">Select Operator</option>');
		
		switch(column_type) {
			case 'string':
			$.each(DataViz._query_opration.string, function(key, value) { 
			  $("#data_viz_operator").append('<option value="'+value+'">'+value+'</option>');
			});	
			break;
			case 'number':
			$.each(DataViz._query_opration.number, function(key, value) { 
			  $("#data_viz_operator").append('<option value="'+value+'">'+value+'</option>');
			});	
			break;
		}
		
	},
	_get_data_column: function(columnKey) {
		var column_data = [];
		$.each(DataViz._cache_data.J, function(key, value) {
			var column_data_row = [];
			column_data_row.push(value.c[columnKey].v);
			column_data.push(column_data_row);
		});
		return column_data;
	},
	_compute_chart_series: function() {
		if(DataViz._chart_data) {
			var columnKeys = DataViz._chart_data.series;
			var column_id;
			var column_type;
			var column_label;
			var column_data = [];
			var column_data_arr = [];
			var chart_data = new google.visualization.DataTable();
			
			for(i in columnKeys) {
				var _column_data= [];
				columnKey 		= parseInt(columnKeys[i]);
				column_id 		= DataViz._cache_data.getColumnId(columnKey);
				column_type 	= DataViz._cache_data.getColumnType(columnKey);
				column_label 	= DataViz._cache_data.getColumnLabel(columnKey);
				
				chart_data.addColumn(column_type, column_label);
				
				_column_data = DataViz._get_data_column(columnKey);
				
				if(i == 0){
					column_data = _column_data;
				} else {
					var _temp = [];
					for(j in _column_data) {
						var merged = $.merge(column_data[j],_column_data[j]);
						_temp.push(merged);
					}
					
					column_data_arr = _temp;
				}
			}
			
			chart_data.addRows(column_data_arr);
			DataViz._local_data.chart = chart_data;
			
			DataViz._initialize_chart(null, false);
		}
	},
	setBaseLabel: function(i) {
		if(i) {
			$('#chart_base_axis_label').val(DataViz._cache_data.getColumnLabel(parseInt(i)));
			
			if(!DataViz._chart_data) {
				DataViz._chart_data = {};
			}
			DataViz._chart_data.base_axis = i;
			
			if(typeof DataViz._chart_data.series != 'undefined')
				DataViz._chart_data.series[0] = i;
			else {
				DataViz._chart_data.series = [];
				DataViz._chart_data.series.push(i);
			}
			
			DataViz._compute_chart_series();
		}
	},
	addSeries: function() {
		if(typeof DataViz._chart_data.series[0] == 'undefined') {
			return false;
		}
		
		var columnKey = $('#data_viz_available_chart_data_field').val();
		
		DataViz._chart_data.series.push(columnKey);
		
		DataViz._populat_chart_series();
		
		/*
		 * TODO need to replace with new chart data array 
		 */
		
		DataViz._chart_base = $("#data_viz_available_chart_base_field").val();		
		DataViz._compute_chart_series();
	},
	_populat_chart_series: function() {
		if(DataViz._chart_data) {
			var series = DataViz._chart_data.series;
			$('#data_viz_added_series').html('');
			for(i in series) {
				if(i != 0) {
					$('#data_viz_added_series').append(
					'<div class="row-fluid">'+
							'<div class="span10">' +
							'<span class="label">' + DataViz._cache_data.getColumnLabel(parseInt(series[i])) + '</span>'+
							'<input type="hidden" name="series[]" value="' + series[i] + '"/></div>' +
							'<div class="span2"><button class="close" onclick="DataViz.removeSeries(' + i + ')">&times;</button></div>' +
					'</div>');
				}
			}
		}
	},
	removeSeries: function(i) {
		if(typeof i != 'undefined') {
			DataViz._chart_data.series.splice(i, 1);
		}
		DataViz._populat_chart_series();
		DataViz._compute_chart_series();
	},
	/*
	 * DataViz View
	 */
	loadView: function() {
		if (typeof $(DataViz._view_container).attr('id') != 'undefined') {
			$(DataViz._view_container).find('.data_viz_viewer_content').html('Loading View...');
			$.ajax({
		         url: "/visualizationview/"+DataViz._data_instance+"/json",
		         type: "GET",
		         cache: false,
		         dataType: 'json',
		         success: function (response) {
		        	 if (response.status) {
		        		 $(DataViz._view_container).find('.data_viz_viewer_header h5').html('Available Views');
		        		 $(DataViz._view_container).find('.data_viz_viewer_header .clearfix').remove();
		        		 $(DataViz._view_container).find('.data_viz_viewer_header').append('<div class="clearfix"></div>');
		        		 
		        		 DataViz.setViewOptions(response.operation);
		        		 DataViz._data_views = response.data;
		        		 DataViz.populateView(response.data, $(DataViz._view_container).find('.data_viz_viewer_content'));
		        		 
		        	 } else {
		        		 response.message = DVE_replace_script(response.message);
		        		 $(DataViz._view_container).html(response.message);
		        	 }
		         }
		     });
		}
	},
	setViewOptions: function(operation) {
		var button = '';
		
		if(operation._create) {
			button = '<button type="button" class="btn btn-mini" id="data_viz_viewer_add_view" ' +
			'onclick="return DataViz.createView();">Clone Current View</button>';
		}
		
		var html = '<div class="data_viz_viewer_option pull-right">'+
		button +
		'</div>';
		
		if(operation._view == true && typeof $(DataViz._view_container).find('.data_viz_viewer_header .data_viz_viewer_option').attr('class') == 'undefined') {
			$(DataViz._view_container).find('.data_viz_viewer_header').append(html);
			$(DataViz._view_container).find('.data_viz_viewer_header .clearfix').remove();
   		 	$(DataViz._view_container).find('.data_viz_viewer_header').append('<div class="clearfix"></div>');
		}
	},
	populateViewChartOnDashboard: function(view) {
		var id = 'data_viz_chart';
		var _id = 'data_viz_chart';
		var i  = 0;
		id = _id + '_' + i;
		i++;
		while(typeof $('#' + id).attr('id') != 'undefined') {
			id = _id + '_' + i;
			i++;
			
			if(i > 4) {
				return;
			}
		}
		
		$('#data_viz_dashboard').append('<div id="'+id+'" style="height:200px; width:400px;"></div>');
		
		var _query = DataViz.queryBuilder.set_query(view.data._query_elemnts).parse_vars().get_query();
		
		var param = {
			chartType	: view.data._chart_type,
			containerId	: id,
			chartArea	: {width: '75%', height: '75%'},
		};
		
		DataViz.job_queue.push(param);
		
		DataViz.sendQueryRequest(_query,function(response) {
			var i = DataViz.job_queue_pos;
			
			if(typeof DataViz.job_queue[i] != 'undefined') {
				DataViz.job_queue[i].dataTable = response.getDataTable();
				var chart = new google.visualization.ChartWrapper(DataViz.job_queue[i]);
				chart.draw();
				DataViz.job_queue_pos ++;
			}
		});
	},
	
	populateView: function(data, container) {
		if(typeof data != 'undefined' && typeof container != 'undefined') {
			var html = '<ul style="list-style-type:none;" >';
			
			html += DataViz._create_default_view_block();
			
			$('#data_viz_dashboard').html('');
			
			for(i in data) {
				html += DataViz._create_view_block(data[i]);
				
				if (data[i].default == 1 && DataViz._set_view_onload) {
					DataViz._view_current_id = i;
					DataViz._set_view_onload = false;
				}
				
				if(data[i].dashboard == 1) {
					DataViz.populateViewChartOnDashboard(data[i]);
					if(!$("#data_component button.dashboard").hasClass('active')) {
						$("#data_component button.dashboard ").click();
					}
				}
				
			}
			
			html += '</ul>';
			
			html = DVE_replace_script(html);
			
			$(container).html(html);
			
			$('.data_viz_view').click(function() {
				var view_id = $(this).attr('datavizview');
				DataViz.setCurrentView(view_id);
				return false;
			});
			$('.data_viz_view_default').click(function() {
				DataViz._reset_all();
				return false;
			});
			if(typeof $('#data_viz_view' + DataViz._view_current_id) != 'undefined'){
				$('#data_viz_view' + DataViz._view_current_id).trigger('click');
				DataViz._view_current_id = null;
			}
			
		}
	},
	setCurrentView: function(view_id) {
		if (typeof DataViz._data_views[view_id] != 'undefined' ) {
			DataViz.view_current_id = view_id;
			DataViz._query_elemnts = DataViz._data_views[view_id].data._query_elemnts;
			
			DataViz._chart_base = DataViz._data_views[view_id].data._chart_base;
			DataViz._visualization_chart_wrapper_za = DataViz._data_views[view_id].data._visualization_chart_wrapper_za;
			DataViz._chart_type = DataViz._data_views[view_id].data._chart_type;
			DataViz._chart_data = DataViz._data_views[view_id].data._chart_data;
			
			if (DataViz._chart_base != '') {
				$("#data_viz_available_chart_base_field").val(DataViz._chart_base);
			}
			
			if (DataViz._chart_data) {
				if(!$("#data_component button.chart").hasClass('active')) {
					$("#data_component button.chart").click();
				}
			}
			
			DataViz.update_aggregate();
			
			DataViz.setViewTitle(DataViz._data_views[view_id]);
			
			DataViz.updateVisualisation();
		}
	},
	setViewTitle: function(view) {
		 var operation ='';
		 if (typeof view.operation != 'undefined') {
				if (view.operation._edit ) {
					operation +=  '<button onclick="return DataViz.editView(' + view.id + ');" id="data_viz_viewer_edit_view" '+
					 'class="btn btn-mini" title="Edit View Title" type="button">Edit</button>' +
					 ' <button onclick="return DataViz.updateView(' + view.id + ');" id="data_viz_viewer_save_view" '+
					 'class="btn btn-mini" title="Save Changes" type="button">Save</button>' ;
				}
			}
		 var html = '<h4><span class="graphicon-view"></span> ' + view.title + ' ' + operation + '</h4>';
		 html = DVE_replace_script(html);
		 
		 $("#data_viz_current_view_info").html(html);
	},
	setView: function(container) {
		DataViz._view_container = container;
	},
	_create_view_block: function(view) {
		var html = '<div class="data_viz_view" id="data_viz_view'+view.id+'" datavizview="'+view.id+
			'" ><span class="graphicon-view"></span><span>View'+view.id+'</span></div>';
		var operation = '';
		
		if (typeof view.operation != 'undefined') {
			operation += '<span class="data_viz_view_op_delete span3">' ;
			if(view.operation._delete ) {
				operation += '<button title="Delete View" onclick="return DataViz.deleteView(' + view.id + ');" class="close">' + 
				'<i class="icon-trash"></i></button>';
			}
			
			if(view.operation._edit ) {
				operation += '<button title="Edit View" onclick="return DataViz.editView(' + view.id + ');" class="close" >' + 
				'<i class="icon-pencil"></i></button>';
			}
			
			if(typeof view.operation._default != 'undefined' && view.operation._default && view.default != 1 ) {
				operation += '<button title="Set View As Default" onclick="return DataViz.defaultView(' + view.id + ');" class="close" >' + 
				'<i class="icon-star"></i></button>';
			}
			
			if(view.operation._public) {
				if(view.is_public == 0) {
					operation += '<button title="Get Public" onclick="return DataViz.setToPublic(' + view.id + ');" class="close" >' + 
					'<i class="icon-lock"></i></button>';
				} else {
					operation += '<button title="Get Private" onclick="return DataViz.setToPrivate(' + view.id + ');" class="close" >' + 
					'<i class="icon-globe"></i></button>';
				}
			}
			
			if(view.operation._dashboard) {
				if(view.dashboard == 0) {
					operation += '<button title="Show in Dashboard" onclick="return DataViz.setToDashboard(' + view.id + ');" class="close" >' + 
					'<i class="icon-plus-sign"></i></button>';
				} else {
					operation += '<button title="Remove From Dashboard" onclick="return DataViz.unsetFromDashboard(' + view.id + ');" class="close" >' + 
					'<i class="icon-minus-sign"></i></button>';
				}
			}
			
			operation += '</span>';
		}
		
		html = '<li id="data_viz_view_content_'+view.id+'"><div class="row-fluid">' + 
		'<span class="span2"><span class="graphicon-view"></span></span><span class="span7">' + 
		'<a tabindex="-1" href="#" class="data_viz_view" id="data_viz_view' +  
		view.id + '" datavizview="'+view.id+'" >' +  
		view.title + '</a></span>' + operation + '</div></li>';
		
		return html;
	},
	_create_default_view_block: function() {
		html = '<li><div class="row-fluid">' + 
		'<span class="span2"><span class="graphicon-view"></span></span><span class="span7">' + 
		'<a tabindex="-1" href="#" class="data_viz_view_default" id="data_viz_view_default" >' + 
		'Complete View</a></span></div></li>';
		
		return html;
	},
	editView: function(view_id) {
		$('#data_viz_modal_view_edit').modal('show');
		if (typeof DataViz._data_views[view_id] != 'undefined' ) {
			$("#data_viz_modal_view_edit_form .view_title").val(DataViz._data_views[view_id].title);
			$("#data_viz_modal_view_edit_form .view_id").val(view_id);
		}
		
	},
	defaultView: function(view_id) {
		var data = {
				'key' : DataViz._data_instance,
				'data': {
					id: view_id
				}
			};
		$.ajax({
	         url: "/visualizationviewdefault/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 DataViz._show_message('Loading...','');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        		 if(typeof response.data != "undefined") {
	        			 DataViz.setViewTitle(response.data);
	        		 }
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
		});
		return false;
		
	},
	setToPublic: function(view_id) {
		var data = {
				'key' : DataViz._data_instance,
				'data': {
					id: view_id
				}
			};
		$.ajax({
	         url: "/visualizationviewpublic/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 DataViz._show_message('Loading...','');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        		 if(typeof response.data != "undefined") {
	        			 DataViz.setViewTitle(response.data);
	        		 }
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
		});
		return false;
		
	},
	setToPrivate: function(view_id) {
		var data = {
				'key' : DataViz._data_instance,
				'data': {
					id: view_id
				}
			};
		$.ajax({
	         url: "/visualizationviewprivate/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 DataViz._show_message('Loading...','');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        		 if(typeof response.data != "undefined") {
	        			 DataViz.setViewTitle(response.data);
	        		 }
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
		});
		return false;
		
	},
	setToDashboard: function(view_id) {
		var data = {
				'key' : DataViz._data_instance,
				'data': {
					id: view_id
				}
			};
		$.ajax({
	         url: "/visualizationviewsetdashboard/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 DataViz._show_message('Loading...','');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        		 if(typeof response.data != "undefined") {
	        			 DataViz.setViewTitle(response.data);
	        		 }
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
		});
		return false;
	},
	unsetFromDashboard: function(view_id) {
		var data = {
				'key' : DataViz._data_instance,
				'data': {
					id: view_id
				}
			};
		$.ajax({
	         url: "/visualizationviewunsetdashboard/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 DataViz._show_message('Loading...','');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        		 if(typeof response.data != "undefined") {
	        			 DataViz.setViewTitle(response.data);
	        		 }
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
		});
		return false;
	},
	createView: function() {
		$('#data_viz_modal_view_add').modal('show');
		return false;
	},
	updateViewFormSubmit: function(from) {
		
		if($("#data_viz_modal_view_edit_form .view_title").val() == '' || typeof $("#data_viz_modal_view_edit_form .view_title").val() == 'undefined') {
			DataViz._show_message('Error', 'Please enter title');
			return false;
		}
		
		if(DVE_test_blacklist($("#data_viz_modal_view_edit_form .view_title").val())) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		var data = {
			'key' : DataViz._data_instance,
			'data': {
				title: $("#data_viz_modal_view_edit_form .view_title").val(),
				id: $("#data_viz_modal_view_edit_form .view_id").val()
			}
		};
		$.ajax({
	         url: "/visualizationviewtitle/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 $('#data_viz_modal_view_edit').modal('hide');
	        	 DataViz._show_message('Loading...','');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        		 if(typeof response.data != "undefined") {
	        			 DataViz.setViewTitle(response.data);
	        		 }
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
		});
		return false;
	},
	updateView: function(view_id) {
		var data = {
			'key' : DataViz._data_instance,
			'id' : view_id,
			'data': {
				_query_elemnts: DataViz._query_elemnts,
				_chart_base: DataViz._chart_base,
				_chart_data: DataViz._chart_data,
				_chart_type: null,
				_visualization_chart_wrapper_za: null
			}
		};
		
		if(typeof DataViz._visualization_chart_wrapper != 'undefined' && DataViz._visualization_chart_wrapper != null) {
			data.data._chart_type = DataViz._visualization_chart_wrapper.getChartType();
			data.data._visualization_chart_wrapper_za = DataViz._visualization_chart_wrapper.Za;
		}
		
		$.ajax({
	         url: "/visualizationviewupdate/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 $('#data_viz_modal_view_add').modal('hide');
	        	 DataViz._show_message('Loading...', '');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz.removeIndicatorViewChanges();
	        		 DataViz._close_message();
	        		 DataViz.loadView();
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
	     });
		
		return false;
	},
	createViewFormSubmit: function(form) {
		if(form.title.value == '' || typeof form.title.value == 'undefined') {
			DataViz._show_message('Error', 'Please enter title');
			return false;
		}
		
		if(DVE_test_blacklist(form.title.value)) {
			DataViz._show_message('Error', 'Invalid input!');
			return false;
		}
		
		var data = {
			'key' : DataViz._data_instance,
			'title': form.title.value,
			'data': {
				_query_elemnts: DataViz._query_elemnts,
				_chart_base: DataViz._chart_base,
				_chart_data: DataViz._chart_data,
				_chart_type: null,
				_visualization_chart_wrapper_za: null
			}
		};
		
		if(typeof DataViz._visualization_chart_wrapper != 'undefined' && DataViz._visualization_chart_wrapper != null) {
			data.data._chart_type = DataViz._visualization_chart_wrapper.getChartType();
			data.data._visualization_chart_wrapper_za = DataViz._visualization_chart_wrapper.Za;
		}
		
		$.ajax({
	         url: "/visualizationviewsave/"+DataViz._data_instance+"/json",
	         type: "POST",
	         cache: false,
	         data: data,
	         dataType: 'json',
	         beforeSend: function() {
	        	 $('#data_viz_modal_view_add').modal('hide');
	        	 DataViz._show_message('Loading...', '');
	         },
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz._close_message();
	        		 DataViz._view_current_id = response.data.id;
	        		 DataViz.loadView();
	        	 } else {
	        		 DataViz._show_message('Error', response.message);
	        	 }
	         },
	         error: function() {
	        	 DataViz._close_message();
	         }
	     });
		
		return false;
	},
	deleteView: function(view_id) {
		if(DataViz.view_current_id == view_id) {
			DataViz._reset_all();
		}
		
		if(typeof $('#data_viz_view_content_' + view_id).attr('id') != 'undefined' ) {
			$('#data_viz_view_content_' + view_id).hide();
		}
		
		$.ajax({
	         url: "/visualizationviewdelete/"+view_id+"/json",
	         type: "POST",
	         cache: false,
	         dataType: 'json',
	         success: function (response) {
	        	 if (response.status) {
	        		 $('#data_viz_view_content_' + response.view_id).remove();
	        	 } else {
	        		 $('#data_viz_view_content_' + response.view_id).show();
	        		 DataViz._show_message('', response.message);
	        	 }
	         }
	     });
		return false;
	},
	addIndicatorViewChanges: function() {
		if(typeof $("#data_viz_viewer_save_view") != 'undefined' ) {
			$("#data_viz_viewer_save_view").addClass("btn-warning");
		}
	},
	removeIndicatorViewChanges: function() {
		if(typeof $("#data_viz_viewer_save_view") != 'undefined' ) {
			$("#data_viz_viewer_save_view").removeClass("btn-warning");
		}
	},
	_getNodeDetail: function() {
		var node_id = DataViz.node_id;
		$.ajax({
	         url: "/visualizationnodedetail/"+node_id+"/json",
	         type: "POST",
	         cache: false,
	         dataType: 'json',
	         success: function (response) {
	        	 if (response.status) {
	        		 DataViz.node_detail = response.data;
	        		 DataViz.setNodeDetail();
	        	 } else {
	        		 DataViz._show_message('', response.message);
	        	 }
	         }
	     });
		;
	},
	setNodeDetail: function() {
		var node_detail = DataViz.node_detail;
		var html = '';
		
		if(typeof node_detail['title'] != 'undefined') {
			html += '<dt>Title</dt><dd>'+node_detail['title']+'</dd>';
		}
		
		if(typeof node_detail['description'] != 'undefined') {
			html += '<dt>Description</dt><dd>'+node_detail['description']+'</dd>';
		}
		
		if(typeof node_detail['note'] != 'undefined' && node_detail['note'] != null && node_detail['note'] != '') {
			html += '<dt>Note</dt><dd>'+node_detail['note']+'</dd>';
		}
		
		if(typeof node_detail['url'] != 'undefined') {
			html += '<dt>Link</dt><dd><a target="_blank" title="View Dataset" href="'+node_detail['url']+'">View Dataset</a></dd>';
		}
		
		if (html != '') {
			html = '<dl>'+html+'</dl>';
		}
		
		html = DVE_replace_script(html);
		
		$("#data_viz_sidebar_content_about_inner").html(html);
	},
	_show_message: function($title, $message) {
		$title = DVE_replace_script($title);
		$('#data_viz_modal_message h3').html($title);
		$message = DVE_replace_script($message);
		$('#data_viz_modal_message .modal-body').html($message);
		$('#data_viz_modal_message').modal('show');
	},
	_close_message: function() {
		$('#data_viz_modal_message').modal('hide');
	},
	_reset_component: function() {
		$("#data_viz_grid").hide();
		$("#data_viz_geomap").hide();
		$("#data_viz_map").hide();
		$("#data_viz_arcgismap").hide();
		$("#data_viz_chart").hide();
		$("#data_viz_timeline").hide();
	},
	_check_component: function() {
		$('#data_component button').each(function(i) {
			if($(this).hasClass('active')) {
				if($(this).hasClass('dashboard')){
					$("#data_viz_dashboard").show();
				}
				if($(this).hasClass('grid')){
					$("#data_viz_grid").show();
					DataViz._initialize_grid(null, true);
				}
				if($(this).hasClass('geomap')){
					$("#data_viz_geomap").show();
				}
				if($(this).hasClass('map')){
					$("#data_viz_map").show();
					$('.data_viz_sidebar_control.sidebar_map').show();
					DataViz._initialize_map(null, false, true);
				}
				if($(this).hasClass('arcgismap')){
					$("#data_viz_arcgismap").show();
					DataViz._show_arcgis_map();
				}
				if($(this).hasClass('chart')){
					$("#data_viz_chart").show();
					$('.data_viz_sidebar_control.sidebar_visualize_chart').show();
					DataViz._initialize_chart(null, false);
				}
				if($(this).hasClass('timeline')){
					$("#data_viz_timeline").show();
				}
			} else {
				if($(this).hasClass('dashboard')){
					$("#data_viz_dashboard").hide();
				}
				if($(this).hasClass('grid')){
					$("#data_viz_grid").hide();
				}
				if($(this).hasClass('geomap')){
					$("#data_viz_geomap").hide();
				}
				if($(this).hasClass('map')){
					$("#data_viz_map").hide();
					$('.data_viz_sidebar_control.sidebar_map').hide();
				}
				if($(this).hasClass('arcgismap')){
					$("#data_viz_arcgismap").hide();
				}
				if($(this).hasClass('chart')){
					$("#data_viz_chart").hide();
					$('.data_viz_sidebar_control.sidebar_visualize_chart').hide();
				}
				if($(this).hasClass('timeline')){
					$("#data_viz_timeline").hide();
				}
			}
		});
	},
	_check_jquery: function() {
		if(typeof jQuery != 'undefined') {
			return true;
		}
		return false;
	},
	_load_css:function(url) {
		var oLink = document.createElement("link")
		oLink.href = url;
		oLink.rel = "stylesheet";
		oLink.type = "text/css";
		document.getElementsByTagName("head")[0].appendChild(oLink);
	},
	_load_css_to_body:function(url) {
		var oLink = document.createElement("link")
		oLink.href = url;
		oLink.rel = "stylesheet";
		oLink.type = "text/css";
		document.getElementsByTagName("body")[0].appendChild(oLink);
	},
	_load_script:function(url,callback) {
		var e = document.createElement("script");
		e.src = url;
		
		if (typeof callback != 'undefined' && callback instanceof Function ){
	 		var callbackname = 'data_callback'+(Math.random()+'').replace(/^.*\./,'');
	 		window[callbackname] = function(data){
	 			callback(data);
	 			try{ delete window[ callbackname ]; } catch(e){}
	 		}
	 		e.src += (e.src.indexOf('?')!=-1?'&':'?')+'callback='+callbackname;
	 	}
		
		e.type="text/javascript";
		document.getElementsByTagName("head")[0].appendChild(e); 
	},
	_load_script_to_body:function(url,callback) {
		var e = document.createElement("script");
		e.src = url;
		
		if (typeof callback != 'undefined' && callback instanceof Function ){
	 		var callbackname = 'data_callback'+(Math.random()+'').replace(/^.*\./,'');
	 		window[callbackname] = function(data){
	 			callback(data);
	 			try{ delete window[ callbackname ]; } catch(e){}
	 		}
	 		e.src += (e.src.indexOf('?')!=-1?'&':'?')+'callback='+callbackname;
	 	}
		
		e.type="text/javascript";
		document.getElementsByTagName("body")[0].appendChild(e); 
	}
}.init();


//fixed the toggle property to get active class element
$.fn.button.Constructor.prototype.toggle = function () {
    var $parent = this.$element.closest('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
    
    if (this.$element.hasClass('active')) {
        this.$element.trigger('active')
    } else {
    	this.$element.trigger('inactive')
    }
}

$(function(){
	$('#data_component button').on('active', function() {
		DataViz._check_component();
	});
	$('#data_component button').on('inactive', function() {
		DataViz._check_component();
	});
	
	/*
	$('#dataset-title').html($.cookie('dataset_title'));
	$('#dataset-desc').html($.cookie('dataset_desc'));
	$('#dataset-email').html($.cookie('dataset_email'));
	$('#chart_name').val($.cookie('dataset_title'));
	*/
	
});
$(function() {
	$('#data_viz_sidebar').hide();
	if($('#data_viz_content').hasClass('span9')) {
		$('#data_viz_content').removeClass('span9');
		$('#data_viz_content').addClass('span12');
	}
	
	$("#data_viz_hide_sidebar, .data_viz_hide_sidebar").click(function(){
		$('#data_viz_sidebar').hide();
		
		if($('#data_viz_content').hasClass('span9')) {
			$('#data_viz_content').removeClass('span9');
			$('#data_viz_content').addClass('span12');
			DataViz._initialize_grid(null, true);
			DataViz._initialize_chart(null, false);
		}
		
		DataViz._populat_chart_series();
		
		$(".data_viz_sidebar_control").removeClass('active');
		return false;
	});
	
	//$('#instance-dropdown').select2();
	$('#instance-dropdown').change(function(){
		if($(this).val() != '') {
			DataViz._set_view_onload = true;
			DataViz.setDatasource('data_gov_in_source',$(this).val(), true);
		}
	});
	
});
$(function() {
	
	var sidebar_control = {
		'sidebar_view': ['data_viz_sidebar_content_view'],
		'sidebar_fields': ['data_viz_sidebar_content_fields'],
		'sidebar_filter': ['data_viz_sidebar_content_filter'],
		'sidebar_groups': ['data_viz_sidebar_content_groups'],
		'sidebar_visualize_chart': ['data_viz_sidebar_content_visualize_chart'],
		'sidebar_map': ['data_viz_sidebar_content_map'],
		'sidebar_custom_query': ['data_viz_sidebar_content_custom_query'],
		'sidebar_about': ['data_viz_sidebar_content_about'],
	};
	
	$(".data_viz_sidebar_control").click(function() {
		$('#data_viz_sidebar').show();
		
		if($('#data_viz_content').hasClass('span12')) {
			$('#data_viz_content').removeClass('span12');
			$('#data_viz_content').addClass('span9');
			DataViz._initialize_grid(null, true);
			DataViz._initialize_chart(null, false);
		}
		
		for(i in sidebar_control) {
			if($(this).hasClass(i)) {
				$(".data_viz_sidebar_content").hide();
				for(j in sidebar_control[i]) {
					$("#" + sidebar_control[i][j]).show();
				}
			}
		}
		DataViz._populat_chart_series();
	});
});
