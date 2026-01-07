import React, { createContext, useState, useContext } from "react";

const LabelContext = createContext();

export const LabelProvider = ({ children }) => {
  const [labelsData, setLabelsData] = useState([]);

  // Function to update labels
  const updateLabels = (labels) => {
    setLabelsData(labels);
  };

  return (
    <LabelContext.Provider value={{ labelsData, updateLabels }}>
      {children}
    </LabelContext.Provider>
  );
};

// Custom hook for easy usage
export const useLabels = () => useContext(LabelContext);
