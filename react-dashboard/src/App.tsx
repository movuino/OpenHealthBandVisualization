import React, {
  useCallback,
} from "react";
import "./App.css";
import {
  MantineProvider,
  ColorScheme,
  ColorSchemeProvider,
} from "@mantine/core";

import { TourProvider } from '@reactour/tour'

import { useLocalStorage } from "@mantine/hooks";



import Dashboard from "./Dashboard";

function App() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
  });


  /** Change the color theme from light to dark and vice-versa */
  const toggleColorScheme = useCallback(
    (value?: ColorScheme) => {
      setColorScheme(value || colorScheme === "dark" ? "light" : "dark");
    },
    [colorScheme, setColorScheme]
  );

  return (
    <TourProvider steps={[]}>
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{
          colorScheme: colorScheme,
          fontFamily: "Nunito",
          headings: { fontFamily: "Nunito" },
          breakpoints: {
            xs: 500,
            sm: 800,
            md: 1000,
            lg: 1200,
            xl: 1400,
          },
        }}
      >
        <Dashboard/>
      </MantineProvider>
    </ColorSchemeProvider>
    </TourProvider>
  );
}

export default App;
