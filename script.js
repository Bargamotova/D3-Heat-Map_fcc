/**
 * created by Anna Bargamotova Samoilenko
 */
const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

const space = { top: 100, right: 20, bottom: 30, left: 60 };
let w = 1500,
  h = 500;

const svg =
  d3.select('#map_container')
    .append('svg')
    .attr('width', w + space.left + space.right)
    .attr('height', h + space.top + space.bottom);

const colorSet = [
  "#264CFF",
  "#3FA0FF",
  "#72D8FF",
  "#AAF7FF",
  "#E0FFFF",
  "#FFFFBF",
  "#FFE099",
  "#FFAD72",
  "#F76D5E",
  "#D82632",
  "#A50021"
]

d3.json(url)
  .then(data => {
    const tooltip = d3.select('#tooltip').style('opacity', 0);

    const dataset = data.monthlyVariance;
    const baseTemp = data.baseTemperature;
    const minYear = d3.min(dataset, d => d.year);
    const maxYear = d3.max(dataset, d => d.year);

    // title and description
    const header = d3.select('#title_box');
    header
      .append('h1')
      .attr("id", 'title')
      .style('font-size', '24px')
      .style("font-weight", 'bold')
      .style('text-align', 'center')
      .text('Monthly Global Land-Surface Temperature');

    header
      .append('p')
      .attr("id", 'description')
      .style('font-size', '16px')
      .style('text-align', 'center')
      .style('font-style', 'italic')
      .text(`${minYear}-${maxYear}:base temperature ${baseTemp}℃`);

    // text description
    svg.append('text')
      .text("Months")
      .attr('x', -(h / 2))
      .attr('y', 10)
      .style("transform", "rotate(-90deg)")
      .style("font-weight", 100)
      .style("font-size", 14)
      .style("font-style", 'italic')
      .style("font-weight", '200');

    svg.append('text')
      .text("Years")
      .attr('x', w / 2)
      .attr('y', h + 130)
      .style("font-weight", 100)
      .style("font-size", 14)
      .style("font-style", 'italic')
      .style("font-weight", '200');

    //colors map 
    const variance = dataset.map((val) => val.variance);
    const minTemp = baseTemp + Math.min.apply(null, variance);
    const maxTemp = baseTemp + Math.max.apply(null, variance);

    const colorThreshold =
      d3
        .scaleThreshold()
        .domain(
          (function (min, max, count) {
            const array = [];
            const step = (max - min) / count;
            const base = min;
            for (let i = 1; i < count; i++) {
              array.push(base + i * step);
            }
            return array;
          })(minTemp, maxTemp, colorSet.length)
        )
        .range(colorSet);

    // lines x and y
    const xScale =
      d3.scaleBand()
        .domain(dataset.map(val => val.year))
        .range([0, w]);

    const months =
      dataset
        .map(val => val.month)
        .slice(0, 12)
        .map(val => val - 1);

    const yScale =
      d3.scaleBand()
        .domain(months)
        .range([0, h])
        .paddingInner(0.05);

    const xAxis =
      d3.axisBottom(xScale)
        .tickValues(xScale.domain().filter((year) => year % 10 === 0))
        .tickSize(5, 1);

    const yAxis =
      d3.axisLeft()
        .scale(yScale)
        .tickValues(yScale.domain())
        .tickFormat(formatDate)

    // axis x and y for cells map
    const axisGroup =
      svg.append('g')
        .attr('class', 'axises')
        .attr('transform', `translate(${space.left} ,  ${space.top})`);
    axisGroup
      .append('g')
      .attr("id", 'x-axis')
      .attr("transform", `translate(0, ${h - 5})`)
      .call(xAxis);
    axisGroup
      .append('g')
      .attr("id", 'y-axis')
      .attr("transform", `translate(0, ${-5})`)
      .call(yAxis);

    // cells
    const cellMap =
      svg.append('g')
        .attr('class', 'map')
        .attr('transform', `translate(${space.left + 1} ,${space.top - 2})`);

    cellMap
      .selectAll('.cell')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d.month))
      .attr('width', (d) => Math.floor(xScale.bandwidth(d.year)))
      .attr('height', Math.floor(yScale.bandwidth()))
      .attr('data-month', (d) => d.month)
      .attr('data-year', (d) => d.year)
      .attr('data-temp', (d) => baseTemp + d.variance)
      .style("fill", (d) => colorThreshold(baseTemp + d.variance))

      .on("mouseover", showTooltip)
      .on('mouseout', hideTooltip)

    // labels
    const legendBox =
      svg.append('g')
        .attr('id', 'legend');

    let legend = legendBox
      .selectAll('#legend')
      .data(colorSet)
      .enter()
      .append('rect')
      .attr('transform', (_, i) => `translate( ${i * 26}, 10)`)

    legend
      .attr('x', 60)
      .attr('width', 25)
      .attr('height', 25)
      .style('fill', (d) => d);

    // legend axiosX
    const legendXScale =
      d3.scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, 26 * colorSet.length]);

    const legendXAxis =
      d3.axisBottom()
        .scale(legendXScale)
        .tickSize(5, 0)
        .tickValues(colorThreshold.domain())
        .tickFormat(d3.format('.1f'));

    legendBox
      .append('g')
      .attr('transform', `translate( 60, ${35})`)
      .call(legendXAxis);

    // for event functions 
    function showTooltip(d) {
      tooltip
        .style('opacity', 0.9)
        .style("left", d3.event.pageX - 40 + 'px')
        .style("top", d3.event.pageY - 100 + 'px')
        .style("transition", "all 0.3")
        .attr('data-year', `${d.year}`)
        .attr('data-month', `${formatDate(d.month)}`)
        .html(`${d.year} • ${formatDate(d.month)}<br>${(baseTemp + d.variance).toFixed(2)}&#8451;<br> ${d3.format('+.1f')(d.variance)}&#8451;`);
    }
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }
    function formatDate(month) {
      const date = new Date(0);
      date.setUTCMonth(month);
      const format = d3.utcFormat('%B');
      return format(date);
    }
  }).catch(e => console.log(e));





