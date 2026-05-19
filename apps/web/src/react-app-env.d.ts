/// <reference types="react-scripts" />

import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: React.SVGProps<SVGSVGElement>;
      g: React.SVGProps<SVGGElement>;
      path: React.SVGProps<SVGPathElement>;
      circle: React.SVGProps<SVGCircleElement>;
      rect: React.SVGProps<SVGRectElement>;
      text: React.SVGProps<SVGTextElement>;
      defs: React.SVGProps<SVGDefsElement>;
      filter: React.SVGProps<SVGFilterElement>;
      feDropShadow: React.SVGProps<SVGFEDropShadowElement>;
    }
  }
}
