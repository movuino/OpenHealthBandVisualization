import * as d3 from "d3";

export const drawChart = async (dataParam: number[][], svgElement: SVGSVGElement, margins: { left: number; right: number; top: number; bottom: number }, colors: string[]) => {
  const data = dataParam.map((arr) => arr.map((e, i) => [i, e]));
  const svg = d3.select(svgElement);
  const height = svgElement!.clientHeight - margins.top - margins.bottom;
  const width = svgElement!.clientWidth - margins.left - margins.right;
  svg.selectAll("*").remove();
  svg.append("g").attr("transform", `translate(${margins.left}, ${margins.top})`);

  // Add X axis and Y axis
  const x = d3
    .scaleLinear()
    //@ts-ignore
    .domain(d3.extent(d3.merge(data), (d) => d[0]))
    .range([0, width]);
  const y = d3
    .scaleLinear()
    //@ts-ignore
    .domain(d3.extent(d3.merge(data), (d) => d[1]))
    .range([height, 0]);
  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, ${height + margins.top})`)
    .call(d3.axisBottom(x).ticks(0));
  svg.append("g").call(d3.axisLeft(y).ticks(0)).attr("transform", `translate(${margins.left} , ${margins.top})`);

  // add the Line
  var valueLine = d3
    .line()
    .x((d) => {
      return x(d[0]);
    })
    .y((d) => {
      return y(d[1]);
    });

  data.forEach((dataset, i) => {
    svg
      .append("path")
      .data([dataset])
      .attr("class", `line-${svg.attr("class")}`)
      .attr("fill", "none")
      .attr("stroke", colors[i])
      .attr("stroke-width", 1.5)
      .attr("id", `line-${i}`)
      //@ts-ignore
      .attr("d", valueLine)
      .attr("transform", `translate(${margins.left + 1}, ${margins.top})`);
  });
};

export const updateChart = async (dataParam: number[][], svgElement: SVGSVGElement, margins: { left: number; right: number; top: number; bottom: number }, colors: string[]) => {
  const data = dataParam.map((arr) => arr.map((e, i) => [i, e]));
  const svg = d3.select(svgElement);
  const height = svgElement!.clientHeight - margins.top - margins.bottom;
  const width = svgElement!.clientWidth - margins.left - margins.right;

  // Add X axis and Y axis
  const x = d3
    .scaleLinear()
    //@ts-ignore
    .domain(d3.extent(d3.merge(data), (d) => d[0]))
    .range([0, width]);
  const y = d3
    .scaleLinear()
    //@ts-ignore
    .domain(d3.extent(d3.merge(data), (d) => d[1]))
    // .domain([yExtent[0] - 0.01 , yExtent[1] +  0.01])
    .range([height - margins.top - margins.bottom, 0]);

  // add the Line
  var valueLine = d3
    .line()
    .x((d) => {
      return x(d[0]);
    })
    .y((d) => {
      return y(d[1]);
    })
    .curve(d3.curveBasis);

  svg.selectAll(`.line-${svg.attr("class")}`).each(function (d, i) {
    d3.select(this)
      .data([data[i]])
      //@ts-ignore
      .attr("d", valueLine);
  });
};
