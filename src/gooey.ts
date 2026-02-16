const SVG_NS = "http://www.w3.org/2000/svg";

let hostSvg: SVGSVGElement | null = null;
const cache = new Map<number, string>();

function ensureHost(): SVGSVGElement {
  if (hostSvg) return hostSvg;

  hostSvg = document.createElementNS(SVG_NS, "svg");
  hostSvg.setAttribute("aria-hidden", "true");
  hostSvg.setAttribute("data-sileo-filters", "");
  hostSvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";

  const defs = document.createElementNS(SVG_NS, "defs");
  hostSvg.append(defs);
  document.body.append(hostSvg);

  return hostSvg;
}

function createFilter(blur: number): string {
  const id = `sileo-gooey-${blur}`;
  const svg = ensureHost();
  const defs = svg.querySelector("defs")!;

  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const feBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
  feBlur.setAttribute("in", "SourceGraphic");
  feBlur.setAttribute("stdDeviation", String(blur));
  feBlur.setAttribute("result", "blur");

  const feMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
  feMatrix.setAttribute("in", "blur");
  feMatrix.setAttribute("mode", "matrix");
  feMatrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10");
  feMatrix.setAttribute("result", "goo");

  const feComposite = document.createElementNS(SVG_NS, "feComposite");
  feComposite.setAttribute("in", "SourceGraphic");
  feComposite.setAttribute("in2", "goo");
  feComposite.setAttribute("operator", "atop");

  filter.append(feBlur, feMatrix, feComposite);
  defs.append(filter);

  return id;
}

export function getFilterId(blur: number): string {
  let id = cache.get(blur);
  if (id) return id;
  id = createFilter(blur);
  cache.set(blur, id);
  return id;
}

/** @internal — for tests only */
export function _resetForTest(): void {
  hostSvg?.remove();
  hostSvg = null;
  cache.clear();
}
