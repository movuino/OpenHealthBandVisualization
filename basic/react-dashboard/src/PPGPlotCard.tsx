import React from "react";
import "./App.css";
import { Text, Paper, Group, useMantineTheme } from "@mantine/core";

import LineChart from "./LineChart";

interface PPGPlotCardProps {
  data: number[][];
  colors: string[];
  title: string;
  snr: number | null;
  recording: boolean;
}

const PPGPlotCard: React.FC<PPGPlotCardProps> = ({
  data,
  colors,
  title,
  snr,
  recording,
}) => {
    const theme = useMantineTheme();
  return (
    <Paper p="md" className="card clickable" shadow="sm">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text>{title}</Text>
        <Group>
          <Text>SNR: </Text>
          <Text>{snr}</Text>
          <Text>db</Text>
          {recording && <div style={{backgroundColor: theme.colors.red[6], width: 15, height: 15, borderRadius: '100%'}}/>}
        </Group>
      </div>

      <div style={{ flexGrow: 1 }}>
        <LineChart
          yAxisOffset={20}
          data={data}
          margins={{ left: 10, right: 10, top: 5, bottom: 5 }}
          colors={colors}
          svgStyle={{ display: "block", margin: "auto" }}
        />
      </div>
    </Paper>
  );
};

export default PPGPlotCard;
