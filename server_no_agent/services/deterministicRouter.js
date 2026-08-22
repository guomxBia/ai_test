function normalizePrompt(prompt) {
  return prompt.trim().replace(/\s+/g, " ");
}

function getNumber(text, expression, fallback) {
  const match = text.match(expression);
  return match ? Number(match[1]) : fallback;
}

function getText(text, expression) {
  const match = text.match(expression);
  return match?.groups?.value?.trim() || undefined;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseNiogemsRequest(prompt) {
  const text = normalizePrompt(prompt);
  const lower = text.toLowerCase();

  const args = {
    page: clamp(getNumber(lower, /\bpage\s+(\d+)\b/, 1), 1, 100000),
    pageSize: clamp(
      getNumber(lower, /\b(?:page\s*size|pagesize|show)\s+(\d+)\b/, 25),
      1,
      100
    ),
  };

  const operatorName = getText(
    text,
    /\b(?:operator|operated by|for operator)\s+(?<value>.+?)(?=\s+(?:on|in|with|page|show|status)\b|$)/i
  );
  const leaseName = getText(
    text,
    /\b(?:lease|lease name)\s+(?<value>.+?)(?=\s+(?:on|in|with|page|show|status)\b|$)/i
  );
  const fieldName = getText(
    text,
    /\b(?:field|field name)\s+(?<value>.+?)(?=\s+(?:on|in|with|page|show|status)\b|$)/i
  );
  const wellNumber = getText(
    text,
    /\b(?:well number|well)\s+(?<value>[\w-]+)\b/i
  );

  if (operatorName) args.operatorName = operatorName;
  if (leaseName) args.leaseName = leaseName;
  if (fieldName) args.fieldName = fieldName;
  if (wellNumber) args.wellNumber = wellNumber;

  if (/\bactive\b/i.test(text)) args.status = "active";
  if (/\binactive\b/i.test(text)) args.status = "inactive";

  return {
    type: "tool_call",
    name: "query_niogems_wells",
    args,
    source: "deterministic_router",
  };
}

function parseUsgsRequest(prompt) {
  const text = normalizePrompt(prompt);
  const lower = text.toLowerCase();

  const args = {
    limit: clamp(getNumber(lower, /\blimit\s+(\d+)\b/, 50), 1, 500),
    offset: clamp(getNumber(lower, /\boffset\s+(\d+)\b/, 0), 0, 1000000),
  };

  const state = getText(text, /\b(?:in|state)\s+(?<value>[A-Za-z]{2})\b/i);
  const county = getText(
    text,
    /\bcounty\s+(?<value>.+?)(?=\s+(?:with|over|above|under|below|limit|offset|built|year)\b|$)/i
  );
  const manufacturer = getText(
    text,
    /\b(?:manufacturer|made by)\s+(?<value>.+?)(?=\s+(?:with|over|above|under|below|limit|offset|built|year)\b|$)/i
  );

  const year = getNumber(lower, /\b(?:built in|year)\s+(19\d{2}|20\d{2})\b/, null);
  const capacity = getNumber(
    lower,
    /\b(?:over|above|greater than)\s+(\d+(?:\.\d+)?)\s*(?:mw)?\b/,
    null
  );

  if (state) args.t_state = state.toUpperCase();
  if (county) args.t_county = county;
  if (manufacturer) args.t_manu = manufacturer;
  if (year !== null) args.p_year = year;

  if (capacity !== null) {
    args.cap_operator = "gt";
    args.t_cap = capacity;
  }

  return {
    type: "tool_call",
    name: "query_usgs_turbines",
    args,
    source: "deterministic_router",
  };
}

export function deterministicToolCall(prompt) {
  const lower = normalizePrompt(prompt).toLowerCase();
  const looksLikeUsgs = /\b(usgs|uswtdb|wind|turbine|turbines|megawatt|capacity)\b/.test(lower);

  return looksLikeUsgs ? parseUsgsRequest(prompt) : parseNiogemsRequest(prompt);
}