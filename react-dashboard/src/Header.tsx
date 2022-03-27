import React, {
  useCallback,
} from "react";
import "./App.css";
import {
  Button,
  Header,
  Title,
  Code,
  Group,
  useMantineTheme,
  useMantineColorScheme
} from "@mantine/core";
import { useTour } from "@reactour/tour";

import { BrandGithub, Moon, Sun, QuestionMark } from "tabler-icons-react";

interface AppHeaderProps {
  version: string;
}

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const { setIsOpen, setCurrentStep } = useTour()
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const onColorSchemeButton = useCallback(() => {
    toggleColorScheme();
  }, [toggleColorScheme])

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, [setCurrentStep, setIsOpen])

  return (
    <Header
      height={60}
      p="xs"
      px="md"
      sx={(theme) => ({
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[7] : "default",
      })}
    >
      <Group className="tour-step-0">
        <Title
          order={1}
          style={{ color: colorScheme === "dark" ? "#FFF" : "inherit"}}
        >
          Movuino
        </Title>
        <Title
          order={2}
          style={{ fontWeight: "normal", color: colorScheme === "dark" ? "#FFF" : "inherit" }}
        >
          Open Health Band
        </Title>
        <Code>{props.version}</Code>
      </Group>
      <Group>
      <Button
          style={{ width: 34, height: 34 }}
          variant="default"
          p={0}
          color="#DDD"
          onClick={startTour}
        >
          <QuestionMark/>
        </Button>
      <Button
          className="tour-step-7"
          style={{ width: 34, height: 34 }}
          variant="default"
          p={0}
          color="#DDD"
          onClick={onColorSchemeButton}
        >
          {theme.colorScheme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <a href="https://github.com/movuino/OpenHealthBandFirmware">
          <Button
            style={{ width: 34, height: 34 }}
            variant="default"
            p={0}
            color="#DDD"
          >
            <BrandGithub />
          </Button>
        </a>
      </Group>
    </Header>
  );
};

export default AppHeader;
