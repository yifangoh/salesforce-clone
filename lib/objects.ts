// Metadata-driven object model: every CRM object is described once here and the
// generic list / detail / form pages render from this config.

export type FieldType =
  | "text" | "email" | "phone" | "url" | "textarea" | "number" | "currency"
  | "percent" | "date" | "select" | "reference" | "boolean";

export type ObjectKey =
  | "accounts" | "contacts" | "leads" | "opportunities" | "cases" | "activities" | "products";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  ref?: ObjectKey;
  readOnly?: boolean;
  full?: boolean;
}

export interface RelatedList {
  object: ObjectKey;
  fk: string;
  title?: string;
  columns: string[];
}

export interface ObjectDef {
  key: ObjectKey;
  label: string;
  plural: string;
  icon: IconName;
  color: string;
  hasOwner: boolean;
  refColumns: string;
  display: (r: Record<string, any> | null | undefined) => string;
  searchColumns: string[];
  listColumns: string[];
  highlights: string[];
  sections: { title: string; fields: Field[] }[];
  defaultSort: { column: string; ascending: boolean };
  filterField?: string;
  related?: RelatedList[];
  activityFk?: string;
}

export type IconName =
  | "Building2" | "Users" | "UserPlus" | "Target" | "LifeBuoy" | "CalendarCheck" | "Package";

export const INDUSTRIES = [
  "Technology", "Manufacturing", "Healthcare", "Financial Services", "Retail", "Education",
  "Energy", "Transportation", "Food & Beverage", "Media", "Government", "Other",
] as const;
export const LEAD_SOURCES = [
  "Web", "Referral", "Partner", "Trade Show", "Advertisement", "Cold Call", "Email Campaign", "Other",
] as const;
export const RATINGS = ["Hot", "Warm", "Cold"] as const;
export const STAGES = [
  "Prospecting", "Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost",
] as const;
export const OPEN_STAGES = STAGES.slice(0, 5);
export const LEAD_STATUSES = ["New", "Working", "Nurturing", "Qualified", "Unqualified", "Converted"] as const;
export const CASE_STATUSES = ["New", "Working", "Escalated", "Closed"] as const;
export const CASE_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export const ACTIVITY_TYPES = ["Task", "Call", "Meeting", "Email"] as const;
export const ACTIVITY_STATUSES = ["Open", "In Progress", "Completed"] as const;

const fullName = (r: any) => (r ? [r.first_name, r.last_name].filter(Boolean).join(" ") : "");

const address = (prefix: string): Field[] => [
  { name: `${prefix}_street`, label: "Street", type: "text", full: true },
  { name: `${prefix}_city`, label: "City", type: "text" },
  { name: `${prefix}_state`, label: "State / Province", type: "text" },
  { name: `${prefix}_postal_code`, label: "Postal Code", type: "text" },
  { name: `${prefix}_country`, label: "Country", type: "text" },
];

export const OBJECTS: Record<ObjectKey, ObjectDef> = {
  accounts: {
    key: "accounts", label: "Account", plural: "Accounts", icon: "Building2", color: "bg-indigo-500",
    hasOwner: true, refColumns: "id, name",
    display: (r) => r?.name ?? "",
    searchColumns: ["name", "industry", "billing_city"],
    listColumns: ["name", "type", "industry", "billing_city", "phone", "owner"],
    highlights: ["type", "industry", "phone", "website", "annual_revenue"],
    filterField: "type",
    defaultSort: { column: "name", ascending: true },
    sections: [
      { title: "Account Information", fields: [
        { name: "name", label: "Account Name", type: "text", required: true },
        { name: "parent_account_id", label: "Parent Account", type: "reference", ref: "accounts" },
        { name: "type", label: "Type", type: "select", options: ["Prospect", "Customer", "Partner", "Reseller", "Competitor", "Other"] },
        { name: "industry", label: "Industry", type: "select", options: INDUSTRIES },
        { name: "rating", label: "Rating", type: "select", options: RATINGS },
        { name: "website", label: "Website", type: "url" },
        { name: "phone", label: "Phone", type: "phone" },
        { name: "annual_revenue", label: "Annual Revenue", type: "currency" },
        { name: "employees", label: "Employees", type: "number" },
      ]},
      { title: "Billing Address", fields: address("billing") },
      { title: "Description", fields: [{ name: "description", label: "Description", type: "textarea", full: true }] },
    ],
    related: [
      { object: "contacts", fk: "account_id", columns: ["name", "title", "email", "phone"] },
      { object: "opportunities", fk: "account_id", columns: ["name", "stage", "amount", "close_date"] },
      { object: "cases", fk: "account_id", columns: ["case_number", "subject", "status", "priority"] },
    ],
    activityFk: "account_id",
  },

  contacts: {
    key: "contacts", label: "Contact", plural: "Contacts", icon: "Users", color: "bg-violet-500",
    hasOwner: true, refColumns: "id, first_name, last_name",
    display: fullName,
    searchColumns: ["first_name", "last_name", "email", "title"],
    listColumns: ["name", "account_id", "title", "email", "phone", "owner"],
    highlights: ["account_id", "title", "email", "phone"],
    defaultSort: { column: "last_name", ascending: true },
    sections: [
      { title: "Contact Information", fields: [
        { name: "first_name", label: "First Name", type: "text" },
        { name: "last_name", label: "Last Name", type: "text", required: true },
        { name: "account_id", label: "Account", type: "reference", ref: "accounts" },
        { name: "title", label: "Title", type: "text" },
        { name: "department", label: "Department", type: "text" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "phone" },
        { name: "mobile", label: "Mobile", type: "phone" },
        { name: "lead_source", label: "Lead Source", type: "select", options: LEAD_SOURCES },
        { name: "birthdate", label: "Birthdate", type: "date" },
      ]},
      { title: "Mailing Address", fields: address("mailing") },
      { title: "Description", fields: [{ name: "description", label: "Description", type: "textarea", full: true }] },
    ],
    related: [
      { object: "opportunities", fk: "contact_id", columns: ["name", "stage", "amount", "close_date"] },
      { object: "cases", fk: "contact_id", columns: ["case_number", "subject", "status", "priority"] },
    ],
    activityFk: "contact_id",
  },

  leads: {
    key: "leads", label: "Lead", plural: "Leads", icon: "UserPlus", color: "bg-amber-500",
    hasOwner: true, refColumns: "id, first_name, last_name, company",
    display: fullName,
    searchColumns: ["first_name", "last_name", "company", "email"],
    listColumns: ["name", "company", "status", "rating", "lead_source", "email", "owner"],
    highlights: ["company", "title", "status", "rating", "email", "phone"],
    filterField: "status",
    defaultSort: { column: "created_at", ascending: false },
    sections: [
      { title: "Lead Information", fields: [
        { name: "first_name", label: "First Name", type: "text" },
        { name: "last_name", label: "Last Name", type: "text", required: true },
        { name: "company", label: "Company", type: "text", required: true },
        { name: "title", label: "Title", type: "text" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "phone" },
        { name: "website", label: "Website", type: "url" },
        { name: "status", label: "Lead Status", type: "select", options: LEAD_STATUSES.filter((s) => s !== "Converted"), required: true },
        { name: "rating", label: "Rating", type: "select", options: RATINGS },
        { name: "lead_source", label: "Lead Source", type: "select", options: LEAD_SOURCES },
        { name: "industry", label: "Industry", type: "select", options: INDUSTRIES },
        { name: "annual_revenue", label: "Annual Revenue", type: "currency" },
        { name: "employees", label: "Employees", type: "number" },
        { name: "city", label: "City", type: "text" },
        { name: "country", label: "Country", type: "text" },
      ]},
      { title: "Description", fields: [{ name: "description", label: "Description", type: "textarea", full: true }] },
    ],
    activityFk: "lead_id",
  },

  opportunities: {
    key: "opportunities", label: "Opportunity", plural: "Opportunities", icon: "Target", color: "bg-orange-500",
    hasOwner: true, refColumns: "id, name",
    display: (r) => r?.name ?? "",
    searchColumns: ["name", "next_step"],
    listColumns: ["name", "account_id", "stage", "amount", "close_date", "probability", "owner"],
    highlights: ["account_id", "amount", "close_date", "probability", "owner"],
    filterField: "stage",
    defaultSort: { column: "close_date", ascending: true },
    sections: [
      { title: "Opportunity Information", fields: [
        { name: "name", label: "Opportunity Name", type: "text", required: true },
        { name: "account_id", label: "Account", type: "reference", ref: "accounts" },
        { name: "contact_id", label: "Primary Contact", type: "reference", ref: "contacts" },
        { name: "stage", label: "Stage", type: "select", options: STAGES, required: true },
        { name: "amount", label: "Amount", type: "currency" },
        { name: "close_date", label: "Close Date", type: "date", required: true },
        { name: "probability", label: "Probability (%)", type: "percent" },
        { name: "type", label: "Type", type: "select", options: ["New Business", "Existing Business", "Renewal", "Upsell"] },
        { name: "lead_source", label: "Lead Source", type: "select", options: LEAD_SOURCES },
        { name: "next_step", label: "Next Step", type: "text" },
      ]},
      { title: "Description", fields: [{ name: "description", label: "Description", type: "textarea", full: true }] },
    ],
    activityFk: "opportunity_id",
  },

  cases: {
    key: "cases", label: "Case", plural: "Cases", icon: "LifeBuoy", color: "bg-rose-500",
    hasOwner: true, refColumns: "id, case_number, subject",
    display: (r) => (r ? `${r.case_number ?? ""} ${r.subject ?? ""}`.trim() : ""),
    searchColumns: ["subject", "case_number"],
    listColumns: ["case_number", "subject", "account_id", "status", "priority", "origin", "owner"],
    highlights: ["account_id", "contact_id", "status", "priority", "origin"],
    filterField: "status",
    defaultSort: { column: "created_at", ascending: false },
    sections: [
      { title: "Case Information", fields: [
        { name: "case_number", label: "Case Number", type: "text", readOnly: true },
        { name: "subject", label: "Subject", type: "text", required: true, full: true },
        { name: "account_id", label: "Account", type: "reference", ref: "accounts" },
        { name: "contact_id", label: "Contact", type: "reference", ref: "contacts" },
        { name: "status", label: "Status", type: "select", options: CASE_STATUSES, required: true },
        { name: "priority", label: "Priority", type: "select", options: CASE_PRIORITIES, required: true },
        { name: "origin", label: "Case Origin", type: "select", options: ["Email", "Phone", "Web", "Chat"] },
        { name: "type", label: "Type", type: "select", options: ["Question", "Problem", "Feature Request"] },
        { name: "closed_at", label: "Closed", type: "date", readOnly: true },
      ]},
      { title: "Description", fields: [{ name: "description", label: "Description", type: "textarea", full: true }] },
    ],
    activityFk: "case_id",
  },

  activities: {
    key: "activities", label: "Activity", plural: "Activities", icon: "CalendarCheck", color: "bg-emerald-500",
    hasOwner: true, refColumns: "id, subject",
    display: (r) => r?.subject ?? "",
    searchColumns: ["subject", "description"],
    listColumns: ["subject", "type", "status", "priority", "due_date", "related", "owner"],
    highlights: ["type", "status", "priority", "due_date"],
    filterField: "status",
    defaultSort: { column: "due_date", ascending: true },
    sections: [
      { title: "Activity Information", fields: [
        { name: "subject", label: "Subject", type: "text", required: true, full: true },
        { name: "type", label: "Type", type: "select", options: ACTIVITY_TYPES, required: true },
        { name: "status", label: "Status", type: "select", options: ACTIVITY_STATUSES, required: true },
        { name: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High"], required: true },
        { name: "due_date", label: "Due Date", type: "date" },
      ]},
      { title: "Related To", fields: [
        { name: "account_id", label: "Account", type: "reference", ref: "accounts" },
        { name: "contact_id", label: "Contact", type: "reference", ref: "contacts" },
        { name: "lead_id", label: "Lead", type: "reference", ref: "leads" },
        { name: "opportunity_id", label: "Opportunity", type: "reference", ref: "opportunities" },
        { name: "case_id", label: "Case", type: "reference", ref: "cases" },
      ]},
      { title: "Comments", fields: [{ name: "description", label: "Comments", type: "textarea", full: true }] },
    ],
  },

  products: {
    key: "products", label: "Product", plural: "Products", icon: "Package", color: "bg-sky-500",
    hasOwner: false, refColumns: "id, name, unit_price",
    display: (r) => r?.name ?? "",
    searchColumns: ["name", "product_code", "family"],
    listColumns: ["name", "product_code", "family", "unit_price", "is_active"],
    highlights: ["product_code", "family", "unit_price", "is_active"],
    defaultSort: { column: "name", ascending: true },
    sections: [
      { title: "Product Information", fields: [
        { name: "name", label: "Product Name", type: "text", required: true },
        { name: "product_code", label: "Product Code", type: "text" },
        { name: "family", label: "Product Family", type: "select", options: ["Licenses", "Services", "Support", "Hardware", "Other"] },
        { name: "unit_price", label: "List Price", type: "currency", required: true },
        { name: "is_active", label: "Active", type: "boolean" },
      ]},
      { title: "Description", fields: [{ name: "description", label: "Description", type: "textarea", full: true }] },
    ],
  },
};

export const NAV_OBJECTS: ObjectKey[] = ["leads", "accounts", "contacts", "opportunities", "cases", "activities", "products"];

export function isObjectKey(k: string): k is ObjectKey {
  return k in OBJECTS;
}

export function allFields(def: ObjectDef): Field[] {
  return def.sections.flatMap((s) => s.fields);
}

export function getField(def: ObjectDef, name: string): Field | undefined {
  if (name === "owner") return { name: "owner", label: "Owner", type: "text", readOnly: true };
  if (name === "name" && (def.key === "contacts" || def.key === "leads")) return { name: "name", label: "Name", type: "text" };
  if (name === "related") return { name: "related", label: "Related To", type: "text" };
  return allFields(def).find((f) => f.name === name);
}

/** PostgREST select string with owner + reference embeds. */
export function selectFor(def: ObjectDef): string {
  const parts = ["*"];
  if (def.hasOwner) parts.push("owner:owner_id(id, full_name, email)");
  for (const f of allFields(def)) {
    if (f.type === "reference" && f.ref) parts.push(`r_${f.name}:${f.name}(${OBJECTS[f.ref].refColumns})`);
  }
  return parts.join(", ");
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tidal CRM";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";

export function formatCurrency(v: number | string | null | undefined, compact = false) {
  if (v === null || v === undefined || v === "") return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: CURRENCY, maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(Number(v));
}

export function formatDate(v: string | null | undefined) {
  if (!v) return "";
  const d = new Date(v.length === 10 ? v + "T00:00:00" : v);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
