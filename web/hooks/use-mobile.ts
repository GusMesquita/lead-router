import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * Lê o media query direto da fonte em vez de copiá-lo para um `useState` dentro
 * de um efeito — o que rendia um primeiro render sempre "desktop" e um segundo
 * logo em seguida. No servidor não há `matchMedia`, então o snapshot é `false`.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
