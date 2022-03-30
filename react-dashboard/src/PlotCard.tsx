import React, { useEffect, } from "react";
import "./App.css";
import { Title, Paper, Group, useMantineTheme, Switch } from "@mantine/core";

import { drawChart } from "./Chart";
import { useWindowSize } from "./customHooks"

interface PlotCardProps {
  title: string,
  recording: boolean,
  svgClassName: string;
  initialData: number[][];
  initialColors: string[];
  switchValue: boolean;
  onSwitchChange: (value: boolean) => void;
  disableSwitch: boolean;
}

const PlotCard: React.FC<PlotCardProps> = ({ title, recording, svgClassName, initialData, initialColors, onSwitchChange, switchValue, disableSwitch }) => {
  const theme = useMantineTheme()
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
          <Switch className="tour-switch" onClick={(e) => e.stopPropagation()} onChange={(event) => onSwitchChange(event.target.checked)} checked={switchValue} disabled={disableSwitch} />
        </Group>
        <Group>
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

export default PlotCard;
