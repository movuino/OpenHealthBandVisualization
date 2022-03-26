import React, {
  MouseEvent,
  useEffect,
  useState,
} from "react";
import "./App.css";
import {
  Overlay,
  useMantineTheme,
} from "@mantine/core";

interface ZoomOverlayOnClickProps {}

const ZoomOverlayOnClick: React.FC<ZoomOverlayOnClickProps> = ({
  children,
}) => {
  const theme = useMantineTheme();
  const [isOverlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (isOverlayVisible) {
      document.onclick = (e) => {
        setOverlayVisible(false);
      };
      document.onkeydown = (e) => {
        if (e.key === "Escape") setOverlayVisible(false);
      };
    } else {
      document.onclick = null;
      document.onkeydown = null;
    }
  }, [isOverlayVisible]);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOverlayVisible(true);
  };

  return (
    <>
      <div onClick={handleClick} style={{ height: "100%", width: "100%" }}>
        {children}
      </div>
      {isOverlayVisible && (
        <Overlay
          color={
            theme.colorScheme === "dark"
              ? theme.colors.dark[9]
              : theme.colors.dark[3]
          }
          style={{ padding: "5%" }}
          opacity={0.94}
        >
          {children}
        </Overlay>
      )}
    </>
  );
};

export default ZoomOverlayOnClick;
