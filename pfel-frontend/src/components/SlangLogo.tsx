import React from "react";
import slangLogoUrl from "../assets/slang_logo_theme.svg";

export interface SlangLogoProps {
  className?: string;
  /** Optional explicit color override (defaults to `currentColor` so it follows text/theme colors) */
  color?: string;
  /** Width in px or CSS length (aspect ratio preserved from the 2000:1000 source) */
  width?: number | string;
  label?: string;
}

export const SlangLogo: React.FC<SlangLogoProps> = ({
  className = "",
  color,
  width = 180,
  label = "slang logo",
}) => {
  const numericWidth = typeof width === "number" ? width : undefined;
  const computedHeight = numericWidth ? Math.round(numericWidth / 2) : undefined;

  const maskStyle: React.CSSProperties = {
    display: "inline-block",
    width,
    height: computedHeight ?? "auto",
    aspectRatio: "2 / 1",
    backgroundColor: color ?? "currentColor",
    WebkitMaskImage: `url("${slangLogoUrl}")`,
    maskImage: `url("${slangLogoUrl}")`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    flexShrink: 0,
  };

  return (
    <span
      role="img"
      aria-label={label}
      className={`slang-logo ${className}`.trim()}
      style={maskStyle}
    />
  );
};

export default SlangLogo;
