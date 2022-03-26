//@ts-nocheck
import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import * as d3 from "d3";

interface LineChartProps {
  data: number[][];
  colors: string[];
  margins: { top: number; right: number; bottom: number; left: number };
  svgStyle?: React.CSSProperties;
  yAxisOffset?: number;
}

function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener("resize", updateSize);
      updateSize();
      return () => window.removeEventListener("resize", updateSize);
    }, []);
    return size;
  }
  

const LineChart: React.FC<LineChartProps> = ({ margins, colors, ...props }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const idPrefixRef = useRef<string>();
  const [windowWidth, windowHeight] = useWindowSize();
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setHeight(svgRef.current.clientHeight - margins.top)
    setWidth(svgRef.current.clientWidth )
  }, [windowWidth, windowHeight, margins])

  useEffect(() => {
    idPrefixRef.current = (Math.random() + 1).toString(36).substring(7);
    (async () => {
      const data = props.data.map((arr) => arr.map((e, i) => [i, e]));
      var svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg
        .append("g")
        .attr("transform", `translate(${margins.left},     ${margins.top})`);
  
      // Add X axis and Y axis
      const x = d3
        .scaleLinear()
        .domain(d3.extent(d3.merge(data), (d) => d[0]))
        .range([0, width]);
      const y = d3
        .scaleLinear()
        .domain(d3.extent(d3.merge(data), (d) => d[1]))
        .range([height, 0]);
      svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(0));
      svg.append("g").call(d3.axisLeft(y));
  
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
          .attr("class", `line-${idPrefixRef.current}`)
          .attr("fill", "none")
          .attr("stroke", colors[i])
          .attr("stroke-width", 1.5)
          .attr("id", `line-${i}`)
          .attr("d", valueLine);
      });
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, width, colors, margins]);

  useEffect(() => {
    const data = props.data.map((arr) => arr.map((e, i) => [i, e]));
    const x = d3
      .scaleLinear()
      .domain(d3.extent(d3.merge(data), (d) => d[0]))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(d3.merge(data), (d) => d[1]))
      .range([height - (props.yAxisOffset ?? 1) * 2, 0]);
    var svg = d3.select(svgRef.current);

    var valueLine = d3
      .line()
      .x((d) => {
        return x(d[0]);
      })
      .y((d) => {
        return y(d[1]);
      })
      .curve(d3.curveBasis);

    svg.selectAll(`.line-${idPrefixRef.current}`).each(function (d, i) {
      d3.select(this)
        .data([data[i]])
        .attr("d", valueLine)
        .attr("transform", `translate(0, ${props.yAxisOffset ?? 0})`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data, props.yAxisOffset]);
  return <svg ref={svgRef} style={props.svgStyle} width='100%' height='100%'></svg>;
};

export default LineChart;
