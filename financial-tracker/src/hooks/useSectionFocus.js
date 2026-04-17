import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function resolveSectionId(location) {
  if (location.state?.focusSection) {
    return location.state.focusSection;
  }

  return location.hash ? location.hash.replace(/^#/, "") : "";
}

function useSectionFocus(sectionRefs, options = {}) {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const sectionId = resolveSectionId(location);
    if (!sectionId) {
      return undefined;
    }

    options.onBeforeFocus?.(sectionId);

    let clearHighlightTimeoutId;

    const scrollTimeoutId = window.setTimeout(() => {
      const target = sectionRefs[sectionId]?.current;
      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setActiveSection(sectionId);
      clearHighlightTimeoutId = window.setTimeout(() => {
        setActiveSection("");
      }, 1800);
    }, options.delay ?? 140);

    return () => {
      window.clearTimeout(scrollTimeoutId);
      if (clearHighlightTimeoutId) {
        window.clearTimeout(clearHighlightTimeoutId);
      }
    };
  }, [location.hash, location.key, location.state, sectionRefs]);

  return activeSection;
}

export default useSectionFocus;
