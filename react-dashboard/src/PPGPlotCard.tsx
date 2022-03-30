import React, { useEffect } from "react";
import { useWindowSize } from "./customHooks";
import "./App.css";
import { Title, Text, Paper, Group, useMantineTheme, Switch } from "@mantine/core";

import { drawChart } from "./Chart";


interface PPGPlotCardProps {
  initialData: number[][];
  initialColors: string[];
  title: string;
  snr: number | null;
  recording: boolean;
  svgClassName: string;
  switchValue: boolean;
  onSwitchChange: (value: boolean) => void;
  disableSwitch: boolean;
}

const PPGPlotCard: React.FC<PPGPlotCardProps> = ({
  initialData,
  initialColors,
  title,
  snr,
  recording,
  svgClassName,
  onSwitchChange,
  switchValue,
  disableSwitch
}) => {
  const theme = useMantineTheme();
  const [windowWidth, windowHeight] = useWindowSize();

  useEffect(() => {
    const elements = document.getElementsByClassName(svgClassName);
    for (let element of elements as any) {
      drawChart(initialData, element, { left: 10, right: 10, top: 10, bottom: 5 }, initialColors)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth, windowHeight])
  return (
    <Paper p="md" className="card clickable" shadow="sm">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Group>
        <Title order={4}>{title}</Title >
          <Switch onClick={(e) => e.stopPropagation()} onChange={(event) => onSwitchChange(event.target.checked)} checked={switchValue} disabled={disableSwitch} />
        </Group>

        <Group>
          <Text>SNR: </Text>
          <Text>{snr}</Text>
          <Text>db</Text>
          {recording && <div style={{ backgroundColor: theme.colors.red[6], width: 15, height: 15, borderRadius: '100%' }} />}
        </Group>
      </div>

      <div style={{ flexGrow: 1 }} dangerouslySetInnerHTML={{
        __html:
          `<svg class="${svgClassName}" style="display: block;margin: auto;" width='100%' height='100%'></svg`
      }}>
      </div>
    </Paper>
  );
};

export default PPGPlotCard;
