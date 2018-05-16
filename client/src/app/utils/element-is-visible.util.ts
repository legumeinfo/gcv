// detects whether or not the given element is visible in the window
export function elementIsVisible(element: any, completely=false): boolean {
    const rec = element.getBoundingClientRect();
    const vp = {width: window.innerWidth, height: window.innerHeight};
    const tViz = rec.top >= 0 && rec.top < vp.height;
    const bViz = rec.bottom > 0 && rec.bottom <= vp.height;
    const lViz = rec.left >= 0 && rec.left < vp.width;
    const rViz = rec.right > 0 && rec.right <= vp.width;
    const vVisible = (completely ? tViz && bViz : tViz || bViz);
    const hVisible = (completely ? lViz && rViz : lViz || rViz);
    if (vVisible && hVisible) {
      return true;
    }
    return false;
}
