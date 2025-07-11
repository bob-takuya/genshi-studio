declare module 'svg2pdf.js' {
  import { jsPDF } from 'jspdf';

  interface Svg2PdfOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    useCSS?: boolean;
    compress?: boolean;
  }

  interface jsPDFWithSvg2Pdf extends jsPDF {
    svg(element: Element, options?: Svg2PdfOptions): Promise<jsPDF>;
  }

  function svg2pdf(element: Element, pdf: jsPDF, options?: Svg2PdfOptions): Promise<jsPDF>;

  export = svg2pdf;
}