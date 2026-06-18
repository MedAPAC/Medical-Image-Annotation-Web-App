import i18n from "../i18n";

export const LANGUAGE_OPTIONS = [
  { code: "en", flag: "\uD83C\uDDEC\uD83C\uDDE7", label: "English" },
  { code: "fa", flag: "\uD83C\uDDEE\uD83C\uDDF7", label: "\u0641\u0627\u0631\u0633\u06cc" },
  { code: "nl", flag: "\uD83C\uDDF3\uD83C\uDDF1", label: "Nederlands" },
  { code: "de", flag: "\uD83C\uDDE9\uD83C\uDDEA", label: "Deutsch" },
];

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
const languageCode = (language) => String(language || "en").split("-")[0];

const translateExact = (value, language) => {
  const lang = languageCode(language);
  if (lang === "en") return value;
  const translator = i18n.getFixedT(lang, "ui");
  return translator(value, { defaultValue: value });
};

const translateCount = (count, singular, plural, language) => {
  const key = count === "1" ? singular : plural;
  return `${count} ${translateExact(key, language)}`;
};

const translatePattern = (text, language) => {
  let match = text.match(/^(\d+)\s+(project|projects)$/i);
  if (match) return translateCount(match[1], "project", "projects", language);

  match = text.match(/^(\d+)\s+(task|tasks)$/i);
  if (match) return translateCount(match[1], "task", "tasks", language);

  match = text.match(/^(\d+)\s+(member|members)$/i);
  if (match) return translateCount(match[1], "member", "members", language);

  match = text.match(/^(\d+)\s+(file|files)$/i);
  if (match) return translateCount(match[1], "file", "files", language);

  match = text.match(/^(\d+)\s+active assignee(s?)$/i);
  if (match) return translateCount(match[1], "active assignee", "active assignees", language);

  match = text.match(/^(\d+)\s+total slices$/i);
  if (match) return `${match[1]} ${translateExact("total slices", language)}`;

  match = text.match(/^(\d+) file\(s\) uploaded\.$/i);
  if (match) return `${match[1]} ${translateExact("file(s) uploaded.", language)}`;

  match = text.match(/^\+(\d+)\s+more$/i);
  if (match) return `+${match[1]} ${translateExact("more", language)}`;

  match = text.match(/^Labels \((\d+)\)$/i);
  if (match) return `${translateExact("Labels", language)} (${match[1]})`;

  match = text.match(/^Attributes \((\d+)\)$/i);
  if (match) return `${translateExact("Attributes", language)} (${match[1]})`;

  match = text.match(/^Files \((\d+)\)$/i);
  if (match) return `${translateExact("Files", language)} (${match[1]})`;

  match = text.match(/^Selected Files \((\d+)\)$/i);
  if (match) return `${translateExact("Selected Files", language)} (${match[1]})`;

  match = text.match(/^Slice\s+(\d+)$/i);
  if (match) return `${translateExact("Slice", language)} ${match[1]}`;

  match = text.match(/^(.+)\s+(?:\u2022|\u00e2\u20ac\u00a2|\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2)\s+Slice\s+(\d+)$/i);
  if (match) return `${match[1]} • ${translateExact("Slice", language)} ${match[2]}`;

  match = text.match(/^Classification \(Slice (\d+)\):$/i);
  if (match) return `${translateExact("Classification", language)} (${translateExact("Slice", language)} ${match[1]}):`;

  match = text.match(/^Selected:\s+(.+)$/i);
  if (match) return `${translateExact("Selected", language)}: ${match[1]}`;

  match = text.match(/^Type:\s+(.+)$/i);
  if (match) return `${translateExact("Type", language)}: ${translateUIText(match[1], language)}`;

  match = text.match(/^Values:\s+(.+)$/i);
  if (match) return `${translateExact("Values", language)}: ${match[1]}`;

  match = text.match(/^(Low|Medium|High) Priority$/i);
  if (match) {
    const priority = translateUIText(match[1][0].toUpperCase() + match[1].slice(1).toLowerCase(), language);
    return translateExact("{{priority}} Priority", language).replace("{{priority}}", priority);
  }

  match = text.match(/^Are you sure you want to delete "(.+)"\?\n\nThis action cannot be undone\.$/);
  if (match) {
    return `${translateExact("Are you sure you want to delete", language)} "${match[1]}"?\n\n${translateExact("This action cannot be undone.", language)}`;
  }

  match = text.match(/^Reassign task "(.+)"\nCurrent assignee: (.+)\n\nEnter new assignee email \(leave empty to unassign\):$/);
  if (match) {
    const assignee = match[2] === "None" ? translateExact("None", language) : match[2];
    return `${translateExact("Reassign task", language)} "${match[1]}"\n${translateExact("Current assignee", language)}: ${assignee}\n\n${translateExact("Enter new assignee email (leave empty to unassign):", language)}`;
  }

  match = text.match(/^Owner (.+) removed successfully\.$/);
  if (match) return `${translateExact("Owner", language)} ${match[1]} ${translateExact("removed successfully.", language)}`;

  match = text.match(/^Failed to upload files: (.+)$/);
  if (match) return `${translateExact("Failed to upload files:", language)} ${match[1]}`;

  match = text.match(/^Task created successfully, but file upload failed: (.+)$/);
  if (match) return `${translateExact("Task created successfully, but file upload failed:", language)} ${match[1]}`;

  return text;
};

export const translateUIText = (value, language) => {
  const original = String(value ?? "");
  if (languageCode(language) === "en" || !original.trim()) return original;

  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  const normalized = normalize(original);
  const clean = normalized.replace(/^[\u2713\u2714]\s*/, "").replace(/^[\u2717\u00d7]\s*/, "");
  const prefix = normalized !== clean ? normalized.slice(0, normalized.indexOf(clean)) : "";

  const exact = translateExact(clean, language);
  if (exact !== clean) {
    return `${leading}${prefix}${exact}${trailing}`;
  }

  const patterned = translatePattern(clean, language);
  if (patterned !== clean) {
    return `${leading}${prefix}${patterned}${trailing}`;
  }

  return original;
};

export const isRtlLanguage = (language) => languageCode(language) === "fa";
