/**
 * VirtualOrganizationGenerator
 *
 * Deterministically generates a virtual organization from a simulation ID seed.
 * Same simulationId always produces the same org structure.
 */
import { randomUUID } from "crypto";
import { rngFromSimId, pick } from "./seeded-random.js";
import type {
  OrgDepartment,
  OrgEmployee,
  OrgFirewall,
  OrgActiveDirectory,
  OrgMailServer,
  OrgDatabaseServer,
  OrgFileServer,
  OrgEndpoint,
  OrgCloudResource,
  OrgSecurityControls,
} from "@workspace/db";

export interface VirtualOrg {
  id: string;
  simulationId: string;
  departments: OrgDepartment[];
  employees: OrgEmployee[];
  firewalls: OrgFirewall[];
  activeDirectory: OrgActiveDirectory;
  mailServer: OrgMailServer;
  databaseServer: OrgDatabaseServer;
  fileServer: OrgFileServer;
  endpoints: OrgEndpoint[];
  cloudResources: OrgCloudResource[];
  securityControls: OrgSecurityControls;
}

const DEPT_NAMES = [
  { name: "IT Operations", criticality: "critical" as const },
  { name: "Finance", criticality: "critical" as const },
  { name: "Human Resources", criticality: "medium" as const },
  { name: "Research & Development", criticality: "high" as const },
  { name: "Communications", criticality: "medium" as const },
  { name: "Executive Office", criticality: "critical" as const },
];

const EMPLOYEE_ROLES = [
  "System Administrator",
  "Network Engineer",
  "Database Administrator",
  "Security Analyst",
  "Finance Officer",
  "HR Manager",
  "Developer",
  "IT Manager",
  "Director",
];

const FIRST_NAMES = [
  "Arjun", "Priya", "Vikram", "Ananya", "Rahul",
  "Sunita", "Deepak", "Meera", "Kiran", "Suresh",
];
const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Reddy",
  "Nair", "Gupta", "Verma", "Bhat", "Iyer",
];

const CLOUD_TYPES = [
  "S3 Bucket",
  "EC2 Instance",
  "Azure Blob Storage",
  "GCP Compute Engine",
  "Lambda Function",
];

/**
 * Generate a deterministic virtual org from a simulation ID.
 * Security controls default to all-off unless overrides are provided.
 */
export function generateVirtualOrg(
  simulationId: string,
  controlOverrides?: Partial<OrgSecurityControls>,
): VirtualOrg {
  const rng = rngFromSimId(simulationId);
  const orgId = `org-${simulationId.slice(0, 8)}`;

  // --- Departments (3–5 departments) ---
  const deptCount = 3 + Math.floor(rng() * 3); // 3, 4, or 5
  const departments: OrgDepartment[] = DEPT_NAMES.slice(0, deptCount).map(
    (d, i) => ({
      id: `dept-${i}`,
      name: d.name,
      employeeCount: 10 + Math.floor(rng() * 40),
      criticality: d.criticality,
    }),
  );

  // --- Employees (1–3 per department) ---
  const employees: OrgEmployee[] = [];
  for (const dept of departments) {
    const count = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      employees.push({
        id: `emp-${dept.id}-${i}`,
        name: `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`,
        departmentId: dept.id,
        role: pick(EMPLOYEE_ROLES, rng),
        isCompromised: false,
      });
    }
  }

  // --- Firewalls (1–2) ---
  const firewalls: OrgFirewall[] = Array.from(
    { length: 1 + Math.floor(rng() * 2) },
    (_, i) => ({
      id: `fw-${i}`,
      label: i === 0 ? "Perimeter Firewall" : "Internal Segment Firewall",
      status: "active" as const,
      rulesVersion: 100 + Math.floor(rng() * 50),
    }),
  );

  // --- Active Directory ---
  const activeDirectory: OrgActiveDirectory = {
    id: `ad-${orgId}`,
    status: "active",
    compromisedAccounts: [],
  };

  // --- Servers ---
  const mailServer: OrgMailServer = {
    id: `mail-${orgId}`,
    status: "online",
  };

  const dbSensitivity = pick(
    ["medium", "high", "critical"] as const,
    rng,
  );
  const databaseServer: OrgDatabaseServer = {
    id: `db-${orgId}`,
    status: "online",
    sensitivityLevel: dbSensitivity,
  };

  const fileServer: OrgFileServer = {
    id: `fs-${orgId}`,
    status: "online",
  };

  // --- Endpoints (one per employee) ---
  const endpoints: OrgEndpoint[] = employees.map((e) => ({
    id: `ep-${e.id}`,
    ownerEmployeeId: e.id,
    status: "clean" as const,
  }));

  // --- Cloud Resources (2–4) ---
  const cloudCount = 2 + Math.floor(rng() * 3);
  const cloudResources: OrgCloudResource[] = Array.from(
    { length: cloudCount },
    (_, i) => ({
      id: `cloud-${i}`,
      type: pick(CLOUD_TYPES, rng),
      status: "online" as const,
    }),
  );

  // --- Security Controls (default: all off) ---
  const securityControls: OrgSecurityControls = {
    firewall: false,
    mfa: false,
    edr: false,
    patchManagement: false,
    networkSegmentation: false,
    employeeAwareness: false,
    ...controlOverrides,
  };

  return {
    id: orgId,
    simulationId,
    departments,
    employees,
    firewalls,
    activeDirectory,
    mailServer,
    databaseServer,
    fileServer,
    endpoints,
    cloudResources,
    securityControls,
  };
}
