var layers = ['0.10 %', '0.50 %', '3.00 %', '6.00 %', '15.0 %', '20.0 %', '35.0 %', '45.0 %', '55.0 %', '95.0 %'];
var colors = ['#00007f', '#0000fe', '#0160ff', '#01d0ff', '#49ffad', '#a4ff53', '#fbec00', '#fbec00', '#ff8500', '#ff1e00', '#7f0000'];

mapboxgl.accessToken = 'pk.eyJ1IjoiYXNyZW5uaW5nZXIiLCJhIjoiY2szMGV1OG9jMDM4aTNkbnphNXpzcm1wYyJ9.UnnfQkiXT3y4ALqIjzHnNw';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/asrenninger/ck94zj6re187o1jo5r4n5r7q5',
  center: [0, 0],
  zoom: 4,
  minZoom: 4,
  maxZoom: 15,
  maxBounds: [[-32.21921, -25.45054], [30.71495, 22.76302]]
});

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

map.on('load', function() {

  var margin = {top: 20, right: 30, bottom: 20, left: 150},
      width = 290 - margin.left - margin.right,
      height = 290 - margin.top - margin.bottom;

  var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.queue()
    .defer(d3.json, "https://ndownloader.figshare.com/files/22397235?private_link=38ff09ae700b294a587c")
    .defer(d3.csv, "https://ndownloader.figshare.com/files/22429338?private_link=364ff71fa7260b2738cf", function(d) {
      d.value = +d.value;
      return d
    })
    .await(ready);

  function ready (error, base, data) {

    if (error) throw error;

    map.addSource('counties', {
      'type': 'geojson',
      'data': base
    });

    current = []

    target = data.filter(function(d) {
      return d.origin == '42101'
    });

    fips = d3.map(base.features, function(d) { return d.properties.fips; });

    target.forEach(function(move) {
      var county = fips.get(move.destination);
      county.properties.value = move.value;
      current.push(county)
    });

    geodata = {};
    geodata.type = "FeatureCollection";
    geodata.features = current;

    topten = geodata.features.sort(function(a, b) {
      return a.properties.value < b.properties.value ? 1 : -1;
    })
    .slice(1, 11);

    map.addSource('data', {
      'type': 'geojson',
      'data': geodata
    });

    map.addLayer({
      'id': 'base-layer',
      'type': 'fill',
      'source': 'counties',
      'paint': {
        'fill-color': '#0f0f0f',
        'fill-opacity': 0.1
      }
    });

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

  map.on('mousemove', 'base-layer', function(e) {

    newdata = []

    source = e.features[0].properties.fips;

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

    topten = geodata.features.sort(function(a, b) {
      return a.properties.value < b.properties.value ? 1 : -1;
    })
    .slice(1, 11);

    map.getSource('data').setData(geodata);

    $('b').text(e.features[0].properties.name_o);

    values = topten.map(function(x) { return x.properties.value })
    names = topten.map(function(x) {
      var temp = x.properties.name_o;
      return  temp.split(', ').join('\n');
    });

    d3.selectAll("svg").remove();

    var svg = d3.select("#viz")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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

    // Y axis
    var y = d3.scaleBand()
              .range([ 0, height ])
              .domain(topten.map(function(d) { return d.properties.name_o; }))
              .padding(.1);

    svg.append("g").call(d3.axisLeft(y))

    //Bars
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

  map.on('zoom', function() {
    if (map.getZoom() == 4) {
      console.log(map.getZoom());
      map.setCenter([0, 0]);
    }
  });

}

});
