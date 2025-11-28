import React, { useCallback, useEffect, useState, useRef } from "react";

// referenced https://codesandbox.io/p/sandbox/multi-range-slider-react-js-6rzv0f

export function DualRangeSlider({ label, value = [0, 100], onValueCommit, min = 0, max = 100, step = 1 }) {
  const displayLabel = (v) => (typeof label === 'function' ? label(v) : v);
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);
  const range = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);

  // Update state when external value prop changes
  useEffect(() => {
    if (Array.isArray(value)) {
      setMinVal(value[0]);
      setMaxVal(value[1]);
      minValRef.current = value[0];
      maxValRef.current = value[1];
    }
  }, [value]);

  const getPercent = useCallback(
    (val) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  const handleMouseDown = (thumb) => {
    setIsDragging(thumb);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newVal = Math.round(min + percent * (max - min) / step) * step;
      const clampedVal = Math.max(min, Math.min(newVal, max));

      if (isDragging === "min") {
        const constrainedVal = Math.min(clampedVal, maxValRef.current - step);
        setMinVal(constrainedVal);
        minValRef.current = constrainedVal;
      } else if (isDragging === "max") {
        const constrainedVal = Math.max(clampedVal, minValRef.current + step);
        setMaxVal(constrainedVal);
        maxValRef.current = constrainedVal;
      }
    }
  }, [isDragging, min, max, step]);

  const handleMouseUp = useCallback(() => {
    // Only call onValueCommit when drag ends
    if (onValueCommit) {
      onValueCommit([minValRef.current, maxValRef.current]);
    }
    setIsDragging(null);
  }, [onValueCommit]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "12px", color: "white" }}>
        <span>{displayLabel(minVal)}</span>
        <span>{displayLabel(maxVal)}</span>
      </div>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "6px",
          borderRadius: "3px",
          backgroundColor: "lavender-grey-500",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          ref={range}
          style={{
            position: "absolute",
            height: "100%",
            borderRadius: "3px",
            backgroundColor: "white",
            left: "0",
            width: "0",
          }}
        />
        
        {/* Left thumb */}
        <div
          onMouseDown={() => handleMouseDown("min")}
          style={{
            position: "absolute",
            height: "16px",
            width: "16px",
            backgroundColor: "white",
            border: "2px solid #DC2626",
            borderRadius: "50%",
            left: `${getPercent(minVal)}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            cursor: "grab",
            zIndex: isDragging === "min" ? "5" : "3",
            userSelect: "none",
          }}
        />
        
        {/* Right thumb */}
        <div
          onMouseDown={() => handleMouseDown("max")}
          style={{
            position: "absolute",
            height: "16px",
            width: "16px",
            backgroundColor: "white",
            border: "2px solid #DC2626",
            borderRadius: "50%",
            left: `${getPercent(maxVal)}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            cursor: "grab",
            zIndex: "4",
            userSelect: "none",
          }}
        />
      </div>
    </div>
  );
}

export default DualRangeSlider;
