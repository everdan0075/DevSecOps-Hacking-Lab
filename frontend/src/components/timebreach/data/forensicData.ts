/**
 * Forensic Data for Defense Toolkit
 *
 * Timeline events and IOCs for forensic analysis objectives.
 */

interface ForensicConfiguration {
  description: string
  timeline: Array<{
    id: string
    timestamp: string
    event: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    found: boolean
  }>
  iocs: Array<{
    type: 'ip' | 'domain' | 'hash' | 'file' | 'user'
    value: string
    description: string
    found: boolean
  }>
}

export const FORENSIC_DATA: Record<string, ForensicConfiguration> = {
  // MOVEit 2023 - Forensic analysis & containment
  'moveit-2023-obj-defender-forensics': {
    description: 'Analyze SQL and Windows Event Logs to reconstruct the attack',
    timeline: [
      {
        id: 'moveit-timeline-1',
        timestamp: '2023-05-27 22:47:15',
        event: 'SQL injection exploit - xp_cmdshell execution detected',
        severity: 'critical',
        found: false,
      },
      {
        id: 'moveit-timeline-2',
        timestamp: '2023-05-27 22:47:18',
        event: 'New local admin account created: "clop"',
        severity: 'critical',
        found: false,
      },
      {
        id: 'moveit-timeline-3',
        timestamp: '2023-05-28 03:22:11',
        event: 'LEMURLOOT web shell deployed (machine2.aspx)',
        severity: 'critical',
        found: false,
      },
      {
        id: 'moveit-timeline-4',
        timestamp: '2023-05-28 04:15:33',
        event: 'Database enumeration - SELECT queries on files table',
        severity: 'high',
        found: false,
      },
      {
        id: 'moveit-timeline-5',
        timestamp: '2023-05-29 14:22:08',
        event: 'Exfiltration target list generated (1,847 high-value files)',
        severity: 'high',
        found: false,
      },
      {
        id: 'moveit-timeline-6',
        timestamp: '2023-05-31 02:15:33',
        event: 'Mass data exfiltration begins to Azure Blob Storage',
        severity: 'critical',
        found: false,
      },
    ],
    iocs: [
      {
        type: 'ip',
        value: '185.220.101.47',
        description: 'Tor exit node used for C2 (Russia)',
        found: false,
      },
      {
        type: 'file',
        value: 'machine2.aspx',
        description: 'LEMURLOOT web shell',
        found: false,
      },
      {
        type: 'user',
        value: 'clop',
        description: 'Rogue admin account created via xp_cmdshell',
        found: false,
      },
      {
        type: 'domain',
        value: 'cl0pdata2023.blob.core.windows.net',
        description: 'Azure Blob Storage exfiltration destination',
        found: false,
      },
      {
        type: 'hash',
        value: 'a7b3c9d2e4f5a1b2c3d4e5f6a7b8c9d0',
        description: 'MD5 hash of LEMURLOOT web shell',
        found: false,
      },
    ],
  },

  // Capital One 2019 - Forensic analysis & incident response
  'capital-one-2019-obj-defender-forensics': {
    description: 'Analyze CloudTrail and VPC Flow Logs to determine breach scope',
    timeline: [
      {
        id: 'capital-timeline-1',
        timestamp: '2019-03-22 10:11:47',
        event: 'SSRF exploit - WAF instance queries metadata API',
        severity: 'critical',
        found: false,
      },
      {
        id: 'capital-timeline-2',
        timestamp: '2019-03-22 10:11:47',
        event: 'IAM credentials stolen from metadata service',
        severity: 'critical',
        found: false,
      },
      {
        id: 'capital-timeline-3',
        timestamp: '2019-04-21 09:22:45',
        event: 'First S3 ListBucket API call from attacker IP',
        severity: 'high',
        found: false,
      },
      {
        id: 'capital-timeline-4',
        timestamp: '2019-04-21 09:23:11',
        event: 'Mass S3 GetObject operations begin (credit card apps)',
        severity: 'critical',
        found: false,
      },
      {
        id: 'capital-timeline-5',
        timestamp: '2019-05-12 03:20:00',
        event: 'Attacker posts about breach on GitHub',
        severity: 'high',
        found: false,
      },
      {
        id: 'capital-timeline-6',
        timestamp: '2019-07-17 14:30:00',
        event: 'Breach discovered via responsible disclosure tip',
        severity: 'medium',
        found: false,
      },
    ],
    iocs: [
      {
        type: 'ip',
        value: '98.207.15.143',
        description: 'Attacker home IP (Seattle residential ISP)',
        found: false,
      },
      {
        type: 'user',
        value: 'erratic',
        description: 'GitHub username (Paige Thompson)',
        found: false,
      },
      {
        type: 'ip',
        value: '169.254.169.254',
        description: 'AWS metadata service endpoint (exploited via SSRF)',
        found: false,
      },
      {
        type: 'domain',
        value: 'capitalone-customer-data.s3.amazonaws.com',
        description: 'S3 bucket containing exfiltrated PII',
        found: false,
      },
      {
        type: 'file',
        value: 'WAF-S3-Access-Role',
        description: 'Overprivileged IAM role attached to WAF instance',
        found: false,
      },
    ],
  },
}
