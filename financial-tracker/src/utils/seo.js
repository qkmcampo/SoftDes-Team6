function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

export function applySeoMeta({
  title,
  description,
  keywords,
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
}) {
  if (typeof document === "undefined") {
    return;
  }

  const nextTitle = title || "Financial Tracker";
  const nextDescription =
    description ||
    "Financial Tracker for retail budgeting, expense tracking, inventory planning, and AI-assisted business insights.";
  const nextKeywords =
    keywords ||
    "financial tracker, retail finance dashboard, expense tracking, budget planning, AI assistant, inventory planning";

  document.title = nextTitle;

  upsertMeta('meta[name="description"]', {
    name: "description",
    content: nextDescription,
  });

  upsertMeta('meta[name="keywords"]', {
    name: "keywords",
    content: nextKeywords,
  });

  upsertMeta('meta[property="og:title"]', {
    property: "og:title",
    content: nextTitle,
  });

  upsertMeta('meta[property="og:type"]', {
    property: "og:type",
    content: "website",
  });

  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: nextDescription,
  });

  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: "summary",
  });

  upsertMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: nextTitle,
  });

  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: nextDescription,
  });

  if (typeof window !== "undefined") {
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: `${window.location.origin}${pathname}`,
    });

    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: `${window.location.origin}${pathname}`,
    });
  }
}
