import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

const Title = ({ text }) => {
  const { isDarkMode } = useTheme();
  const contrast = isDarkMode ? "#FFFFFF" : "#000000";

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold py-2" style={{ color: contrast }}>
        {text}
      </h1>
    </div>
  );
};

export default Title;