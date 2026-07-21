import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export interface OrgDepartment {
  id: string;
  name: string;
  employeeCount: number;
  criticality: "low" | "medium" | "high" | "critical";
}

export interface OrgEmployee {
  id: string;
  name: string;
  departmentId: string;
  role: string;
  isCompromised: boolean;
}

export interface OrgFirewall {
  id: string;
  label: string;
  status: "active" | "disabled";
  rulesVersion: number;
}

export interface OrgActiveDirectory {
  id: string;
  status: "active" | "compromised";
  compromisedAccounts: string[];
}

export interface OrgMailServer {
  id: string;
  status: "online" | "compromised";
}

export interface OrgDatabaseServer {
  id: string;
  status: "online" | "compromised";
  sensitivityLevel: "low" | "medium" | "high" | "critical";
}

export interface OrgFileServer {
  id: string;
  status: "online" | "compromised";
}

export interface OrgEndpoint {
  id: string;
  ownerEmployeeId: string;
  status: "clean" | "compromised" | "isolated";
}

export interface OrgCloudResource {
  id: string;
  type: string;
  status: "online" | "compromised";
}

export interface OrgSecurityControls {
  firewall: boolean;
  mfa: boolean;
  edr: boolean;
  patchManagement: boolean;
  networkSegmentation: boolean;
  employeeAwareness: boolean;
}

export const virtualOrganizationsTable = pgTable("virtual_organizations", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  departments: jsonb("departments")
    .$type<OrgDepartment[]>()
    .notNull()
    .default([]),
  employees: jsonb("employees").$type<OrgEmployee[]>().notNull().default([]),
  firewalls: jsonb("firewalls").$type<OrgFirewall[]>().notNull().default([]),
  activeDirectory: jsonb("active_directory")
    .$type<OrgActiveDirectory>()
    .notNull()
    .default({ id: "", status: "active", compromisedAccounts: [] }),
  mailServer: jsonb("mail_server")
    .$type<OrgMailServer>()
    .notNull()
    .default({ id: "", status: "online" }),
  databaseServer: jsonb("database_server")
    .$type<OrgDatabaseServer>()
    .notNull()
    .default({ id: "", status: "online", sensitivityLevel: "high" }),
  fileServer: jsonb("file_server")
    .$type<OrgFileServer>()
    .notNull()
    .default({ id: "", status: "online" }),
  endpoints: jsonb("endpoints").$type<OrgEndpoint[]>().notNull().default([]),
  cloudResources: jsonb("cloud_resources")
    .$type<OrgCloudResource[]>()
    .notNull()
    .default([]),
  securityControls: jsonb("security_controls")
    .$type<OrgSecurityControls>()
    .notNull()
    .default({
      firewall: false,
      mfa: false,
      edr: false,
      patchManagement: false,
      networkSegmentation: false,
      employeeAwareness: false,
    }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type VirtualOrganization =
  typeof virtualOrganizationsTable.$inferSelect;
