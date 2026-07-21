import { db, entitiesTable, alertsTable, campaignsTable, playbooksTable, vulnerabilitiesTable, auditLogTable } from "@workspace/db";

async function seed() {
  console.log("Seeding Cyttack mock data...");

  // Clear existing data
  await db.delete(auditLogTable);
  await db.delete(playbooksTable);
  await db.delete(alertsTable);
  await db.delete(vulnerabilitiesTable);
  await db.delete(campaignsTable);
  await db.delete(entitiesTable);

  // --- ENTITIES ---
  const entities = [
    { id: "ent-01", name: "AIIMS-DB-01", type: "server", criticality: "critical", status: "anomalous", baselineScore: 18, currentScore: 87, ipAddress: "10.1.4.22", location: "New Delhi DC-Alpha" },
    { id: "ent-02", name: "CBSE-ExamPortal-Server", type: "server", criticality: "critical", status: "anomalous", baselineScore: 12, currentScore: 72, ipAddress: "10.2.1.5", location: "Noida DC-Beta" },
    { id: "ent-03", name: "PowerGrid-SCADA-Node-3", type: "ot-device", criticality: "critical", status: "anomalous", baselineScore: 8, currentScore: 91, ipAddress: "192.168.50.3", location: "Mumbai Grid Control" },
    { id: "ent-04", name: "Finance-Regulator-VM-7", type: "server", criticality: "high", status: "normal", baselineScore: 15, currentScore: 19, ipAddress: "172.16.10.7", location: "RBI Data Center" },
    { id: "ent-05", name: "UIDAI-Auth-Gateway-02", type: "server", criticality: "critical", status: "contained", baselineScore: 22, currentScore: 22, ipAddress: "10.5.0.2", location: "Bengaluru Auth Hub" },
    { id: "ent-06", name: "User-Analyst-Ranjit.Kumar", type: "user", criticality: "medium", status: "anomalous", baselineScore: 30, currentScore: 68, ipAddress: "10.1.100.45", location: "SOC Terminal" },
    { id: "ent-07", name: "MOD-IntelNet-Router-9", type: "network-segment", criticality: "critical", status: "normal", baselineScore: 5, currentScore: 7, ipAddress: "10.0.0.9", location: "South Block NOC" },
    { id: "ent-08", name: "NIC-CloudGateway-01", type: "server", criticality: "high", status: "normal", baselineScore: 20, currentScore: 24, ipAddress: "103.20.14.1", location: "NIC Cloud" },
    { id: "ent-09", name: "DRDO-ResearchWS-14", type: "workstation", criticality: "high", status: "contained", baselineScore: 25, currentScore: 25, ipAddress: "10.3.14.88", location: "DRDO Hyderabad" },
    { id: "ent-10", name: "User-Admin-Priya.Sharma", type: "user", criticality: "high", status: "normal", baselineScore: 28, currentScore: 31, ipAddress: "10.1.100.12", location: "CERT-In HQ" },
  ];

  await db.insert(entitiesTable).values(entities);
  console.log("✓ Entities seeded");

  // --- CAMPAIGNS ---
  const campaigns = [
    {
      id: "campaign-silent-ledger",
      name: "Silent Ledger",
      matchConfidence: 72,
      targetSectors: ["Financial Regulation", "Government Banking", "Tax Administration"],
      associatedTTPs: ["T1078", "T1021.001", "T1486", "T1041", "T1059.001"],
      description: "State-sponsored group targeting financial regulators and government fiscal databases. Known for slow, low-noise exfiltration campaigns lasting 6-18 months before discovery. Uses legitimate admin tooling to blend into normal traffic.",
      originRegion: "East Asia",
      active: true,
    },
    {
      id: "campaign-phantom-circuit",
      name: "Phantom Circuit",
      matchConfidence: 58,
      targetSectors: ["Power Grid", "Water Treatment", "OT/SCADA Infrastructure"],
      associatedTTPs: ["T1190", "T1055", "T1499", "T1565.003", "T1489"],
      description: "Advanced threat cluster specializing in critical infrastructure disruption. Targets OT/ICS environments with custom implants designed for Siemens and ABB SCADA platforms. Goal is pre-positioned access for kinetic-effect operations.",
      originRegion: "Eastern Europe",
      active: true,
    },
    {
      id: "campaign-cobalt-monsoon",
      name: "Cobalt Monsoon",
      matchConfidence: 41,
      targetSectors: ["Defense Research", "Aerospace", "Government IT"],
      associatedTTPs: ["T1566.002", "T1071.001", "T1105", "T1027", "T1036"],
      description: "Espionage-focused collective targeting defense R&D and strategic intelligence assets. Uses trojanized software updates and supply chain compromise. Long dwell times with minimal lateral movement to avoid detection.",
      originRegion: "South Asia",
      active: false,
    },
  ];

  await db.insert(campaignsTable).values(campaigns);
  console.log("✓ Campaigns seeded");

  // --- ALERTS ---
  const now = new Date();
  const hAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  const alerts = [
    {
      id: "alert-001",
      entityId: "ent-03",
      entityName: "PowerGrid-SCADA-Node-3",
      anomalyScore: 94,
      severity: "critical",
      status: "investigating",
      attackStage: "exfiltration",
      description: "Anomalous outbound traffic burst: 3.4 GB to 185.220.101.47 over encrypted tunnel port 443. SCADA process memory anomaly detected — rogue thread injection pattern matches Phantom Circuit ICS implant signatures.",
      mitreTechniques: [
        { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
        { id: "T1055", name: "Process Injection", tactic: "Defense Evasion" },
        { id: "T1499", name: "Endpoint Denial of Service", tactic: "Impact" },
      ],
      campaignId: "campaign-phantom-circuit",
      campaignName: "Phantom Circuit",
      matchConfidence: 67,
      timestamp: new Date(hAgo(1)),
    },
    {
      id: "alert-002",
      entityId: "ent-01",
      entityName: "AIIMS-DB-01",
      anomalyScore: 88,
      severity: "critical",
      status: "new",
      attackStage: "lateral_movement",
      description: "Unauthorized RDP session initiated from internal workstation DRDO-ResearchWS-14. Credential usage outside baseline hours (02:17 IST). Patient record schema accessed via privileged service account — volume 4.2x above baseline.",
      mitreTechniques: [
        { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "Lateral Movement" },
        { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion" },
        { id: "T1003.001", name: "LSASS Memory", tactic: "Credential Access" },
      ],
      campaignId: "campaign-silent-ledger",
      campaignName: "Silent Ledger",
      matchConfidence: 72,
      timestamp: new Date(hAgo(2)),
    },
    {
      id: "alert-003",
      entityId: "ent-02",
      entityName: "CBSE-ExamPortal-Server",
      anomalyScore: 79,
      severity: "high",
      status: "investigating",
      attackStage: "initial_access",
      description: "SQL injection attempt sequence detected against exam portal authentication endpoint. 847 failed login attempts from rotating proxies (TOR exit nodes). Subsequent successful login from anomalous geolocation — Minsk, Belarus.",
      mitreTechniques: [
        { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
        { id: "T1078", name: "Valid Accounts", tactic: "Persistence" },
      ],
      campaignId: null,
      campaignName: null,
      matchConfidence: null,
      timestamp: new Date(hAgo(3)),
    },
    {
      id: "alert-004",
      entityId: "ent-06",
      entityName: "User-Analyst-Ranjit.Kumar",
      anomalyScore: 71,
      severity: "high",
      status: "new",
      attackStage: "recon",
      description: "Insider threat indicators: AD enumeration queries 18x above baseline, scheduled task creation on 3 servers, access to classified incident reports outside job function. Behavior consistent with data staging prior to exfiltration.",
      mitreTechniques: [
        { id: "T1087.002", name: "Domain Account Discovery", tactic: "Discovery" },
        { id: "T1053.005", name: "Scheduled Task", tactic: "Persistence" },
      ],
      campaignId: null,
      campaignName: null,
      matchConfidence: null,
      timestamp: new Date(hAgo(4)),
    },
    {
      id: "alert-005",
      entityId: "ent-05",
      entityName: "UIDAI-Auth-Gateway-02",
      anomalyScore: 85,
      severity: "critical",
      status: "contained",
      attackStage: "impact",
      description: "Mass authentication failure cascade — 2.3M authentication requests per hour from botnet (confirmed: Mirai variant). Auth gateway CPU at 98%. Auto-containment triggered: rate limiting enforced, DDoS mitigation engaged. Contained successfully.",
      mitreTechniques: [
        { id: "T1498", name: "Network Denial of Service", tactic: "Impact" },
        { id: "T1110.003", name: "Password Spraying", tactic: "Credential Access" },
      ],
      campaignId: null,
      campaignName: null,
      matchConfidence: null,
      timestamp: new Date(hAgo(6)),
    },
    {
      id: "alert-006",
      entityId: "ent-09",
      entityName: "DRDO-ResearchWS-14",
      anomalyScore: 82,
      severity: "critical",
      status: "contained",
      attackStage: "lateral_movement",
      description: "Lateral movement pivot point identified. Workstation used as springboard to access AIIMS-DB-01 via stolen credentials. Cobalt Strike beacon artifact found in %APPDATA% — C2 callback to known Cobalt Monsoon infrastructure.",
      mitreTechniques: [
        { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "Lateral Movement" },
        { id: "T1105", name: "Ingress Tool Transfer", tactic: "Command and Control" },
        { id: "T1059.003", name: "Windows Command Shell", tactic: "Execution" },
      ],
      campaignId: "campaign-cobalt-monsoon",
      campaignName: "Cobalt Monsoon",
      matchConfidence: 41,
      timestamp: new Date(hAgo(8)),
    },
    {
      id: "alert-007",
      entityId: "ent-04",
      entityName: "Finance-Regulator-VM-7",
      anomalyScore: 63,
      severity: "high",
      status: "investigating",
      attackStage: "recon",
      description: "Unusual internal port scan originating from Finance-Regulator-VM-7. SMB enumeration across 14 subnets. No data access detected yet — reconnaissance phase suspected. Pattern consistent with Silent Ledger pre-operation mapping.",
      mitreTechniques: [
        { id: "T1046", name: "Network Service Discovery", tactic: "Discovery" },
        { id: "T1135", name: "Network Share Discovery", tactic: "Discovery" },
      ],
      campaignId: "campaign-silent-ledger",
      campaignName: "Silent Ledger",
      matchConfidence: 55,
      timestamp: new Date(hAgo(12)),
    },
    {
      id: "alert-008",
      entityId: "ent-08",
      entityName: "NIC-CloudGateway-01",
      anomalyScore: 56,
      severity: "medium",
      status: "new",
      attackStage: "initial_access",
      description: "Misconfigured S3-equivalent bucket discovered with public read access. 47 internal policy documents exposed. Automated scanner access logged from 3 distinct IPs. Possible opportunistic exfiltration of configuration files.",
      mitreTechniques: [
        { id: "T1530", name: "Data from Cloud Storage", tactic: "Collection" },
        { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
      ],
      campaignId: null,
      campaignName: null,
      matchConfidence: null,
      timestamp: new Date(hAgo(16)),
    },
    {
      id: "alert-009",
      entityId: "ent-07",
      entityName: "MOD-IntelNet-Router-9",
      anomalyScore: 44,
      severity: "medium",
      status: "resolved",
      attackStage: "recon",
      description: "BGP route injection attempt detected. Unauthorized AS path prepending from upstream ISP peering session. Traffic briefly redirected through anomalous AS path — corrected within 4 minutes by automated BGP policy enforcement.",
      mitreTechniques: [
        { id: "T1557", name: "Adversary-in-the-Middle", tactic: "Collection" },
      ],
      campaignId: null,
      campaignName: null,
      matchConfidence: null,
      timestamp: new Date(hAgo(24)),
    },
    {
      id: "alert-010",
      entityId: "ent-10",
      entityName: "User-Admin-Priya.Sharma",
      anomalyScore: 38,
      severity: "low",
      status: "resolved",
      attackStage: "recon",
      description: "Admin account accessed from unregistered device (iPhone, Jaipur geolocation). MFA challenge issued and passed. No subsequent anomalous actions. Flagged for review — device registered after session. Likely legitimate travel.",
      mitreTechniques: [
        { id: "T1078", name: "Valid Accounts", tactic: "Initial Access" },
      ],
      campaignId: null,
      campaignName: null,
      matchConfidence: null,
      timestamp: new Date(hAgo(36)),
    },
    {
      id: "alert-011",
      entityId: "ent-01",
      entityName: "AIIMS-DB-01",
      anomalyScore: 91,
      severity: "critical",
      status: "resolved",
      attackStage: "exfiltration",
      description: "Previous exfiltration incident on AIIMS-DB-01. 1.2 GB of anonymized patient demographic records staged in temp directory. Exfiltration blocked at DLP gateway. Root cause: unpatched CVE-2024-1709 (ScreenConnect) used for initial access.",
      mitreTechniques: [
        { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
        { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" },
      ],
      campaignId: "campaign-silent-ledger",
      campaignName: "Silent Ledger",
      matchConfidence: 69,
      timestamp: new Date(hAgo(72)),
    },
    {
      id: "alert-012",
      entityId: "ent-03",
      entityName: "PowerGrid-SCADA-Node-3",
      anomalyScore: 77,
      severity: "high",
      status: "resolved",
      attackStage: "initial_access",
      description: "VPN credential compromise on SCADA jump server. Attacker gained initial foothold via credential stuffing attack using breached credential list. Anomalous login at 03:42 IST from Netherlands exit node. Credentials revoked within 22 minutes.",
      mitreTechniques: [
        { id: "T1110.004", name: "Credential Stuffing", tactic: "Credential Access" },
        { id: "T1133", name: "External Remote Services", tactic: "Initial Access" },
      ],
      campaignId: "campaign-phantom-circuit",
      campaignName: "Phantom Circuit",
      matchConfidence: 44,
      timestamp: new Date(hAgo(96)),
    },
  ];

  await db.insert(alertsTable).values(alerts);
  console.log("✓ Alerts seeded");

  // --- PLAYBOOKS ---
  const playbooks = [
    {
      id: "pb-001",
      name: "SCADA Exfiltration Containment",
      linkedIncidentId: "alert-001",
      overallStatus: "idle",
      steps: [
        { step: 0, action: "Isolate PowerGrid-SCADA-Node-3 from WAN segment", requiresApproval: false, status: "pending" },
        { step: 1, action: "Block outbound traffic to 185.220.101.0/24 at perimeter firewall", requiresApproval: false, status: "pending" },
        { step: 2, action: "Terminate suspicious processes and kill rogue threads in SCADA process space", requiresApproval: true, status: "pending" },
        { step: 3, action: "Capture memory dump for forensic analysis (preserve evidence chain)", requiresApproval: false, status: "pending" },
        { step: 4, action: "Notify Ministry of Power CISO and CERT-In — mandatory 6-hour incident report", requiresApproval: true, status: "pending" },
      ],
    },
    {
      id: "pb-002",
      name: "Lateral Movement Containment — Hospital Network",
      linkedIncidentId: "alert-002",
      overallStatus: "idle",
      steps: [
        { step: 0, action: "Terminate active RDP session from DRDO-ResearchWS-14 to AIIMS-DB-01", requiresApproval: false, status: "pending" },
        { step: 1, action: "Reset service account 'svc_db_admin' and revoke all active sessions", requiresApproval: true, status: "pending" },
        { step: 2, action: "Quarantine AIIMS-DB-01 — block all non-approved inbound connections", requiresApproval: false, status: "pending" },
        { step: 3, action: "Snapshot VM state before remediation (forensic preservation)", requiresApproval: false, status: "pending" },
        { step: 4, action: "Force audit of all queries executed by svc_db_admin in past 72h", requiresApproval: false, status: "pending" },
      ],
    },
    {
      id: "pb-003",
      name: "Exam Portal Breach Response",
      linkedIncidentId: "alert-003",
      overallStatus: "idle",
      steps: [
        { step: 0, action: "Revoke compromised session tokens and force re-authentication for all active users", requiresApproval: false, status: "pending" },
        { step: 1, action: "Enable enhanced WAF rules — block TOR exit nodes and anomalous user agents", requiresApproval: false, status: "pending" },
        { step: 2, action: "Notify CBSE officials — potential exam data exposure assessment required", requiresApproval: true, status: "pending" },
        { step: 3, action: "Trigger CAPTCHA enforcement and geo-blocking for high-risk regions", requiresApproval: false, status: "pending" },
      ],
    },
  ];

  await db.insert(playbooksTable).values(playbooks);
  console.log("✓ Playbooks seeded");

  // --- VULNERABILITIES ---
  const vulnerabilities = [
    { id: "vuln-01", assetId: "ent-01", assetName: "AIIMS-DB-01", cveId: "CVE-2024-1709", cvssScore: 10.0, exploitabilityScore: 9.8, businessCriticality: "critical", recommendedAction: "patch_now", patchStatus: "in_progress", description: "Authentication bypass vulnerability in ConnectWise ScreenConnect — unauthenticated RCE. Actively exploited in the wild. Patch available since Feb 2024." },
    { id: "vuln-02", assetId: "ent-03", assetName: "PowerGrid-SCADA-Node-3", cveId: "CVE-2024-21887", cvssScore: 9.1, exploitabilityScore: 9.4, businessCriticality: "critical", recommendedAction: "patch_now", patchStatus: "unpatched", description: "Command injection in Ivanti Connect Secure — exploited by Volt Typhoon. Allows unauthenticated command execution as root on VPN appliance." },
    { id: "vuln-03", assetId: "ent-02", assetName: "CBSE-ExamPortal-Server", cveId: "CVE-2024-3400", cvssScore: 10.0, exploitabilityScore: 9.9, businessCriticality: "critical", recommendedAction: "patch_now", patchStatus: "unpatched", description: "OS command injection in PAN-OS GlobalProtect — CVSSv4 10.0. Pre-auth RCE on perimeter firewall. Targeted by nation-state actors targeting education infrastructure." },
    { id: "vuln-04", assetId: "ent-04", assetName: "Finance-Regulator-VM-7", cveId: "CVE-2024-6387", cvssScore: 8.1, exploitabilityScore: 7.8, businessCriticality: "high", recommendedAction: "patch_now", patchStatus: "unpatched", description: "OpenSSH regreSSHion — remote unauthenticated code execution via race condition in signal handler. Affects OpenSSH < 9.8p1. Complex exploit but PoC available." },
    { id: "vuln-05", assetId: "ent-08", assetName: "NIC-CloudGateway-01", cveId: "CVE-2024-23897", cvssScore: 9.8, exploitabilityScore: 9.5, businessCriticality: "high", recommendedAction: "patch_now", patchStatus: "in_progress", description: "Jenkins arbitrary file read — unauthenticated LFI via CLI parser. Can expose secrets and credential files stored in Jenkins workspace. Actively exploited." },
    { id: "vuln-06", assetId: "ent-05", assetName: "UIDAI-Auth-Gateway-02", cveId: "CVE-2024-27198", cvssScore: 9.8, exploitabilityScore: 8.9, businessCriticality: "critical", recommendedAction: "patch_now", patchStatus: "patched", description: "Authentication bypass in JetBrains TeamCity — full server takeover. Patched on gateway after CERT-In advisory. Verified patched — monitoring for exploitation attempts." },
    { id: "vuln-07", assetId: "ent-07", assetName: "MOD-IntelNet-Router-9", cveId: "CVE-2024-20399", cvssScore: 6.7, exploitabilityScore: 6.2, businessCriticality: "high", recommendedAction: "patch_later", patchStatus: "unpatched", description: "Cisco IOS XE CLI arbitrary command injection — requires local admin access but allows privilege escalation. Risk elevated due to nation-state targeting of network infrastructure." },
    { id: "vuln-08", assetId: "ent-09", assetName: "DRDO-ResearchWS-14", cveId: "CVE-2024-30051", cvssScore: 7.8, exploitabilityScore: 7.5, businessCriticality: "high", recommendedAction: "patch_now", patchStatus: "in_progress", description: "Windows DWM Core Library privilege escalation — exploited as zero-day by QakBot operators. LPE to SYSTEM. Patch deployed via WSUS, pending reboot." },
    { id: "vuln-09", assetId: "ent-06", assetName: "User-Analyst-Ranjit.Kumar", cveId: "CVE-2024-38213", cvssScore: 6.5, exploitabilityScore: 6.0, businessCriticality: "medium", recommendedAction: "patch_later", patchStatus: "unpatched", description: "Windows SmartScreen security feature bypass — allows execution of malicious files without MotW prompt. Phishing vector particularly relevant for analyst workstations." },
    { id: "vuln-10", assetId: "ent-10", assetName: "User-Admin-Priya.Sharma", cveId: "CVE-2024-1086", cvssScore: 7.8, exploitabilityScore: 7.2, businessCriticality: "high", recommendedAction: "patch_now", patchStatus: "unpatched", description: "Linux kernel netfilter use-after-free — local privilege escalation to root. PoC public since March 2024. Admin workstation running unpatched Ubuntu 22.04 LTS." },
    { id: "vuln-11", assetId: "ent-01", assetName: "AIIMS-DB-01", cveId: "CVE-2024-2961", cvssScore: 8.8, exploitabilityScore: 8.2, businessCriticality: "critical", recommendedAction: "monitor", patchStatus: "unpatched", description: "glibc iconv buffer overflow — potential RCE via crafted PHP application. Exploitability requires specific conditions not yet confirmed on this host. Monitor and assess." },
    { id: "vuln-12", assetId: "ent-04", assetName: "Finance-Regulator-VM-7", cveId: "CVE-2024-4577", cvssScore: 9.8, exploitabilityScore: 9.6, businessCriticality: "high", recommendedAction: "patch_now", patchStatus: "unpatched", description: "PHP CGI argument injection on Windows — unauthenticated RCE. Affects PHP 8.x on Windows with CGI mode. Actively exploited by multiple threat groups since June 2024." },
  ];

  await db.insert(vulnerabilitiesTable).values(vulnerabilities);
  console.log("✓ Vulnerabilities seeded");

  // --- AUDIT LOG ---
  const dAgo = (d: number, h: number = 0) => new Date(now.getTime() - d * 86400000 - h * 3600000);

  const auditEntries = [
    { id: "log-001", actor: "system", actionType: "DETECTION_EVENT", description: "Behavioral anomaly detected on PowerGrid-SCADA-Node-3. Anomaly score threshold 90 exceeded. Alert auto-generated: alert-001.", relatedIncidentId: "alert-001", timestamp: dAgo(0, 1) },
    { id: "log-002", actor: "system", actionType: "ALERT_ESCALATED", description: "Alert alert-001 auto-escalated to CRITICAL severity based on entity criticality multiplier and attack stage (exfiltration).", relatedIncidentId: "alert-001", timestamp: dAgo(0, 1) },
    { id: "log-003", actor: "analyst", actionType: "ALERT_STATUS_CHANGED", description: "Analyst changed alert-001 status from NEW to INVESTIGATING. Assigned to Threat Hunt Team Alpha.", relatedIncidentId: "alert-001", timestamp: dAgo(0, 1) },
    { id: "log-004", actor: "system", actionType: "DETECTION_EVENT", description: "Lateral movement detected from DRDO-ResearchWS-14 to AIIMS-DB-01 via RDP. Credential anomaly flagged. Alert auto-generated: alert-002.", relatedIncidentId: "alert-002", timestamp: dAgo(0, 2) },
    { id: "log-005", actor: "system", actionType: "MITRE_MAPPING_COMPLETED", description: "ATT&CK framework mapping completed for alert-002. Techniques identified: T1021.001, T1078, T1003.001. Campaign correlation: Silent Ledger (72%).", relatedIncidentId: "alert-002", timestamp: dAgo(0, 2) },
    { id: "log-006", actor: "system", actionType: "PLAYBOOK_RECOMMENDED", description: "Playbook 'Lateral Movement Containment — Hospital Network' recommended for alert-002 based on ATT&CK pattern matching.", relatedIncidentId: "alert-002", timestamp: dAgo(0, 2) },
    { id: "log-007", actor: "analyst", actionType: "PLAYBOOK_STEP_STARTED", description: "Initiated playbook step: Terminate active RDP session from DRDO-ResearchWS-14 to AIIMS-DB-01. Execution log: session AIIMS\\svc_db_admin terminated at 02:31:44 IST.", relatedIncidentId: "alert-002", timestamp: dAgo(0, 2) },
    { id: "log-008", actor: "ciso", actionType: "PLAYBOOK_STEP_APPROVED", description: "CISO approved high-impact playbook step: Reset service account svc_db_admin and revoke all active sessions. Authorization code: CISO-2024-0847.", relatedIncidentId: "alert-002", timestamp: dAgo(0, 2) },
    { id: "log-009", actor: "system", actionType: "CONTAINMENT_EXECUTED", description: "Automated containment executed on UIDAI-Auth-Gateway-02. DDoS mitigation engaged. Rate limiting: 100 req/s per IP. Null-route applied to botnet C2 IPs.", relatedIncidentId: "alert-005", timestamp: dAgo(0, 6) },
    { id: "log-010", actor: "system", actionType: "ENTITY_STATUS_CHANGED", description: "Entity UIDAI-Auth-Gateway-02 status updated from ANOMALOUS to CONTAINED. Containment verified by network telemetry normalization.", relatedIncidentId: "alert-005", timestamp: dAgo(0, 6) },
    { id: "log-011", actor: "analyst", actionType: "DETECTION_EVENT", description: "DRDO-ResearchWS-14 confirmed as lateral movement staging host. Cobalt Strike beacon artifact isolated. Host quarantined.", relatedIncidentId: "alert-006", timestamp: dAgo(0, 8) },
    { id: "log-012", actor: "system", actionType: "THREAT_INTEL_UPDATED", description: "Threat intelligence correlation updated. New Phantom Circuit IoCs added to detection rules: 14 IP addresses, 3 domain patterns, 2 file hashes.", relatedIncidentId: null, timestamp: dAgo(1) },
    { id: "log-013", actor: "ciso", actionType: "REPORT_GENERATED", description: "CISO generated weekly cyber posture report. Distribution: DG-CERT-In, Ministry of Electronics. Classification: RESTRICTED.", relatedIncidentId: null, timestamp: dAgo(2) },
    { id: "log-014", actor: "system", actionType: "VULNERABILITY_SCAN_COMPLETED", description: "Scheduled vulnerability scan completed across all 10 monitored entities. 12 new CVEs identified. Priority queue updated.", relatedIncidentId: null, timestamp: dAgo(3) },
    { id: "log-015", actor: "analyst", actionType: "PATCH_DEPLOYED", description: "Emergency patch CVE-2024-27198 deployed to UIDAI-Auth-Gateway-02 via automated patch management. Verification scan confirmed remediation.", relatedIncidentId: null, timestamp: dAgo(4) },
    { id: "log-016", actor: "system", actionType: "DETECTION_EVENT", description: "Previous exfiltration attempt on AIIMS-DB-01 blocked at DLP gateway. 1.2 GB patient data staging interrupted. Alert auto-generated: alert-011.", relatedIncidentId: "alert-011", timestamp: dAgo(5) },
    { id: "log-017", actor: "system", actionType: "BASELINE_RECALCULATED", description: "Behavioral baselines recalculated for all entities following 7-day observation window. 3 entities show drift requiring threshold adjustment.", relatedIncidentId: null, timestamp: dAgo(7) },
    { id: "log-018", actor: "analyst", actionType: "ALERT_RESOLVED", description: "Alert alert-009 marked RESOLVED. BGP route injection self-corrected within 4 minutes. Root cause: misconfigured upstream peering policy. Vendor notified.", relatedIncidentId: "alert-009", timestamp: dAgo(8) },
    { id: "log-019", actor: "ciso", actionType: "POLICY_UPDATED", description: "Zero-trust network access policy updated for all critical infrastructure entities. MFA enforcement extended to all privileged accounts. Effective immediately.", relatedIncidentId: null, timestamp: dAgo(10) },
    { id: "log-020", actor: "system", actionType: "CERT_IN_NOTIFIED", description: "CERT-In notified per mandatory reporting requirements — SCADA anomaly on PowerGrid-SCADA-Node-3. Report ID: CERTIN-2024-3847. 6-hour window met.", relatedIncidentId: "alert-001", timestamp: dAgo(0, 1) },
    { id: "log-021", actor: "analyst", actionType: "THREAT_HUNT_INITIATED", description: "Proactive threat hunt initiated for Silent Ledger campaign IoCs across financial sector entities. Scope: Finance-Regulator-VM-7, NIC-CloudGateway-01.", relatedIncidentId: null, timestamp: dAgo(14) },
    { id: "log-022", actor: "system", actionType: "DETECTION_RULE_DEPLOYED", description: "12 new YARA detection rules deployed from CERT-In advisory CA-2024-0392. Coverage: PowerGrid-SCADA-Node-3, MOD-IntelNet-Router-9.", relatedIncidentId: null, timestamp: dAgo(15) },
    { id: "log-023", actor: "analyst", actionType: "INCIDENT_REPORT_SUBMITTED", description: "Formal incident report IR-2024-0088 submitted for AIIMS-DB-01 exfiltration attempt. Submitted to Ministry of Health CISO and NCSC portal.", relatedIncidentId: "alert-011", timestamp: dAgo(6) },
    { id: "log-024", actor: "ciso", actionType: "DRILL_COMPLETED", description: "Quarterly red-team drill completed. MTTD: 4.2h (target: 6h — exceeded). MTTR: 18.7h (target: 24h — exceeded). Playbook coverage: 94%.", relatedIncidentId: null, timestamp: dAgo(20) },
    { id: "log-025", actor: "system", actionType: "SYSTEM_HEALTH_CHECK", description: "Scheduled system health check completed. All 10 entity collectors operational. Telemetry pipeline latency: 847ms (within SLA). No collector gaps.", relatedIncidentId: null, timestamp: dAgo(0, 0) },
  ];

  await db.insert(auditLogTable).values(auditEntries);
  console.log("✓ Audit log seeded");

  console.log("\nCyttack seed complete. All mock data loaded.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
