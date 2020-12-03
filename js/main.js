// We want to start by pulling Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiYXNyZW5uaW5nZXIiLCJhIjoiY2szMGV1OG9jMDM4aTNkbnphNXpzcm1wYyJ9.UnnfQkiXT3y4ALqIjzHnNw';

// We load them map with this custom style
// This uses an Albers project on a clean background, rather than the usual globe
// To achieve this, I followed this tutorial: https://blog.mapbox.com/mapping-the-us-elections-guide-to-albers-usa-projection-in-studio-45be6bafbd7e
// It involves using mapshaper to reproject and then loading that geojson into the mapbox styles API
// From there, you just remove all styles from the map, because this new map of America is projected over Africa (0, 0)
// Also, because it is a separate map with no real ties to the globe, I set bounds and zoom limits so users cannot get lost in an abyss
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/asrenninger/ck94zj6re187o1jo5r4n5r7q5',
  center: [0, 0],
  zoom: 4,
  minZoom: 4,
  maxZoom: 15,
  maxBounds: [[-32.21921, -25.45054], [30.71495, 22.76302]]
});

var layers = ['0.10 %', '0.50 %', '3.00 %', '6.00 %', '15.0 %', '20.0 %', '35.0 %', '45.0 %', '55.0 %', '95.0 %'];
var colors = ['#00007f', '#0000fe', '#0160ff', '#01d0ff', '#49ffad', '#a4ff53', '#fbec00', '#fbec00', '#ff8500', '#ff1e00', '#7f0000'];

// Then we make a legend, using the data here, which are Jenks breaks
// This will loop through and create div elements from the above arrays
for (i = 0; i < layers.length; i++) {
  var layer = layers[i];
  var color = colors[i];
  var item = document.createElement('div');
  var key = document.createElement('span');

  key.className = 'legend-key';
  key.style.backgroundColor = color;

  var value = document.createElement('span');

  value.innerHTML = layer;
  item.appendChild(key);
  item.appendChild(value);
  legend.appendChild(item);
}

//Now we create the map, load the data and set up some other details
// The margin and svg elements are empty but will become a bar chart
// Then we use D3 to load the data, before setting up the rest of the map functions
map.on('load', function() {

  //Set the charts dimensions
  var margin = {top: 20, right: 30, bottom: 20, left: 150},
      width = 290 - margin.left - margin.right,
      height = 290 - margin.top - margin.bottom;

  //Use D3 to add the SVG object to the page
  var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //This queue means that the user cannot do anything until the data loads
  //This was important because hovering before the data loads throws an error
  d3.queue()
    //Map data
    .defer(d3.json, "https://ndownloader.figshare.com/files/22397235?private_link=38ff09ae700b294a587c")
    //Movement data
    .defer(d3.csv, "https://ndownloader.figshare.com/files/22429338?private_link=364ff71fa7260b2738cf", function(d) {
      //This just makes it so that this column is numeric
      d.value = +d.value;
      return d
    })
    //Go
    .await(ready);

  //Start the application, for all intents and purposes
  function ready (error, base, data) {

    if (error) throw error;

    //We want to add the counties to the map as  grey basemaps
    //This just generally shows users where we have data
    map.addSource('counties', {
      'type': 'geojson',
      'data': base
    });

    //Now we are going to go through a filter a county, grab its movement data and append it to a geometry
    current = []

    //Filter
    target = data.filter(function(d) {
      return d.origin == '42101'
    });

    //Recast the base in a way that lets us join on fips code
    fips = d3.map(base.features, function(d) { return d.properties.fips; });

    //Join on fips code
    target.forEach(function(move) {
      var county = fips.get(move.destination);
      county.properties.value = move.value;
      current.push(county)
    });

    //Create the geodata
    geodata = {};
    geodata.type = "FeatureCollection";
    geodata.features = current;

    //Add this to the map
    map.addSource('data', {
      'type': 'geojson',
      'data': geodata
    });

    //Along with the base
    map.addLayer({
      'id': 'base-layer',
      'type': 'fill',
      'source': 'counties',
      'paint': {
        'fill-color': '#0f0f0f',
        'fill-opacity': 0.1
      }
    });

    //Style it
    map.addLayer({
      'id': 'counties-layer',
      'type': 'fill',
      'source': 'data',
      'paint': {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0.000004,'#00007f',
          0.006463,'#0000fe',
          0.028308,'#0160ff',
          0.060962,'#01d0ff',
          0.127519,'#49ffad',
          0.217177,'#a4ff53',
          0.347563,'#fbec00',
          0.430454,'#ff8500',
          0.530602,'#ff1e00',
          0.940717,'#7f0000'
        ],
        'fill-opacity': 1
        }

  });

  $('b').text("Hover over county")

  //Now on hovers we want to do a bunch of highlighting
  map.on('mousemove', 'base-layer', function(e) {

    //This does everything as above, but with a new fips
    newdata = []

    //So here we grab that new fips
    source = e.features[0].properties.fips;

    //Filter it again
    target = data.filter(function(d) {
      return d.origin == source
    });

    target.forEach(function(move) {
      var county = fips.get(move.destination);
      county.properties.value = move.value;
      newdata.push(county)
    });

    geodata = {};
    geodata.type = "FeatureCollection";
    geodata.features = newdata;

    map.getSource('data').setData(geodata);

    //We can throw the county name below the title so people know what they are highlighting
    $('b').text(e.features[0].properties.name_o);

    //Because we want to add a summary chart, we use sort to grab the top 10 counties interacting with this one
    topten = geodata.features.sort(function(a, b) {
      return a.properties.value < b.properties.value ? 1 : -1;
    })
    .slice(1, 11);

    //On each mousemove, we want to clear the chart to make way for a new summary
    d3.selectAll("svg").remove();

    //Then build a new one
    var svg = d3.select("#viz")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Here we specify the x axis, no counties really share more than 50% of their users to 0.5 is the limit
    var x = d3.scaleLinear()
      .domain([0, 0.5])
      .range([ 0, width]);

// I like the look without the x axis but here it is
//			svg.append("g")
//			.attr("transform", "translate(0," + height + ")")
//			.call(d3.axisBottom(x))
//			.selectAll("text")
//      .attr("transform", "translate(-10,10)rotate(-90)")
//      .style("text-anchor", "end");

    // Now we specify the Y axis
    var y = d3.scaleBand()
              .range([ 0, height ])
              .domain(topten.map(function(d) { return d.properties.name_o; }))
              .padding(.1);

    svg.append("g").call(d3.axisLeft(y))

    //And now we add the bars
    svg.selectAll("myRect")
          .data(topten)
          .enter()
          .append("rect")
          .attr("x", x(0) )
          .attr("y", function(d) { return y(d.properties.name_o); })
          .attr("width", function(d) { return x(d.properties.value); })
          .attr("height", y.bandwidth() )
          .attr("fill", "#00007f")

  });

  //Finally, we want to make it so that if you zoom out to far, it recenters the map
  map.on('zoom', function() {
    if (map.getZoom() == 4) {
      console.log(map.getZoom());
      map.setCenter([0, 0]);
    }
  });

}

});
