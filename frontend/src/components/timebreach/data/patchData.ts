/**
 * Patch Data for Defense Toolkit
 *
 * System configurations and patch information for each defender patching objective.
 */

interface PatchConfiguration {
  description: string
  cve: string
  cveName: string
  patchVersion: string
  servers: Array<{
    id: string
    hostname: string
    currentVersion: string
    patchedVersion: string
    criticality: 'production' | 'staging' | 'development'
    status: 'vulnerable' | 'patching' | 'secured'
    progress: number
    lastSeen: string
  }>
}

export const PATCH_DATA: Record<string, PatchConfiguration> = {
  // Equifax 2017 - Emergency Apache Struts patching
  'equifax-2017-obj-defender-patch': {
    description: 'Deploy Apache Struts security patch to all web servers',
    cve: 'CVE-2017-5638',
    cveName: 'Apache Struts 2 Remote Code Execution',
    patchVersion: 'Struts 2.3.32 / 2.5.10.1',
    servers: [
      {
        id: 'equifax-web-01',
        hostname: 'acis-portal-prod-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '5 minutes ago',
      },
      {
        id: 'equifax-web-02',
        hostname: 'acis-portal-prod-02.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '5 minutes ago',
      },
      {
        id: 'equifax-web-03',
        hostname: 'acis-portal-staging-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'staging',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '12 minutes ago',
      },
      {
        id: 'equifax-web-04',
        hostname: 'dispute-api-prod-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '3 minutes ago',
      },
      {
        id: 'equifax-web-05',
        hostname: 'dispute-api-prod-02.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '7 minutes ago',
      },
      {
        id: 'equifax-web-06',
        hostname: 'customer-portal-prod-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '2 minutes ago',
      },
      {
        id: 'equifax-web-07',
        hostname: 'customer-portal-prod-02.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '8 minutes ago',
      },
      {
        id: 'equifax-web-08',
        hostname: 'admin-portal-staging-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'staging',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '15 minutes ago',
      },
      {
        id: 'equifax-web-09',
        hostname: 'reports-api-prod-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '4 minutes ago',
      },
      {
        id: 'equifax-web-10',
        hostname: 'legacy-webapp-dev-01.equifax.com',
        currentVersion: 'Struts 2.3.28',
        patchedVersion: 'Struts 2.3.32',
        criticality: 'development',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '22 minutes ago',
      },
    ],
  },

  // MOVEit 2023 - Emergency MOVEit Transfer patching
  'moveit-2023-obj-defender-patch': {
    description: 'Deploy MOVEit Transfer emergency security patch',
    cve: 'CVE-2023-34362',
    cveName: 'MOVEit Transfer SQL Injection (Zero-Day)',
    patchVersion: 'MOVEit Transfer 2023.0.2',
    servers: [
      {
        id: 'moveit-01',
        hostname: 'transfer-prod-01.company.com',
        currentVersion: 'MOVEit 2023.0.0',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '2 minutes ago',
      },
      {
        id: 'moveit-02',
        hostname: 'transfer-prod-02.company.com',
        currentVersion: 'MOVEit 2023.0.0',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '3 minutes ago',
      },
      {
        id: 'moveit-03',
        hostname: 'transfer-staging-01.company.com',
        currentVersion: 'MOVEit 2023.0.0',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'staging',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '8 minutes ago',
      },
      {
        id: 'moveit-04',
        hostname: 'sftp-gateway-prod-01.company.com',
        currentVersion: 'MOVEit 2023.0.1',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '4 minutes ago',
      },
      {
        id: 'moveit-05',
        hostname: 'sftp-gateway-prod-02.company.com',
        currentVersion: 'MOVEit 2023.0.1',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '5 minutes ago',
      },
      {
        id: 'moveit-06',
        hostname: 'partner-transfer-prod-01.company.com',
        currentVersion: 'MOVEit 2023.0.0',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '6 minutes ago',
      },
      {
        id: 'moveit-07',
        hostname: 'internal-fileshare-staging.company.com',
        currentVersion: 'MOVEit 2022.1.8',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'staging',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '15 minutes ago',
      },
      {
        id: 'moveit-08',
        hostname: 'vendor-portal-dev-01.company.com',
        currentVersion: 'MOVEit 2023.0.0',
        patchedVersion: 'MOVEit 2023.0.2',
        criticality: 'development',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '20 minutes ago',
      },
    ],
  },

  // Capital One 2019 - Remediate WAF & IAM configuration
  'capital-one-2019-obj-defender-patch': {
    description: 'Fix SSRF vulnerability and enforce IMDSv2 on all EC2 instances',
    cve: 'SSRF + IMDSv1',
    cveName: 'AWS WAF SSRF + Metadata Service Vulnerability',
    patchVersion: 'IMDSv2 (Token-based metadata access)',
    servers: [
      {
        id: 'capital-waf-01',
        hostname: 'waf-proxy-prod-01.capitalone.com',
        currentVersion: 'IMDSv1 (Unsecured)',
        patchedVersion: 'IMDSv2 (Secured)',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '1 minute ago',
      },
      {
        id: 'capital-waf-02',
        hostname: 'waf-proxy-prod-02.capitalone.com',
        currentVersion: 'IMDSv1 (Unsecured)',
        patchedVersion: 'IMDSv2 (Secured)',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '2 minutes ago',
      },
      {
        id: 'capital-api-01',
        hostname: 'api-gateway-prod-01.capitalone.com',
        currentVersion: 'IMDSv1 (Unsecured)',
        patchedVersion: 'IMDSv2 (Secured)',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '3 minutes ago',
      },
      {
        id: 'capital-api-02',
        hostname: 'api-gateway-prod-02.capitalone.com',
        currentVersion: 'IMDSv1 (Unsecured)',
        patchedVersion: 'IMDSv2 (Secured)',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '3 minutes ago',
      },
      {
        id: 'capital-web-01',
        hostname: 'web-server-prod-01.capitalone.com',
        currentVersion: 'IMDSv1 (Unsecured)',
        patchedVersion: 'IMDSv2 (Secured)',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '5 minutes ago',
      },
      {
        id: 'capital-web-02',
        hostname: 'web-server-prod-02.capitalone.com',
        currentVersion: 'IMDSv1 (Unsecured)',
        patchedVersion: 'IMDSv2 (Secured)',
        criticality: 'production',
        status: 'vulnerable',
        progress: 0,
        lastSeen: '6 minutes ago',
      },
    ],
  },
}
