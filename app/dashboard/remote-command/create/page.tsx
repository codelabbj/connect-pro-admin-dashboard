"use client"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
// import { WebSocketProvider, useWebSocket } from "@/components/providers/websocket-provider"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function RemoteCommandCreatePage() {
  const [command, setCommand] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [parameters, setParameters] = useState("{}")
  const [priority, setPriority] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([])
  // const { sendRemoteCommand } = useWebSocket();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/stats/devices/`)
        setDevices(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        setDevices([])
      }
    }
    fetchDevices()
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    let paramsObj = {}
    try {
      paramsObj = JSON.parse(parameters)
    } catch {
      setError(t("remoteCommand.parametersMustBeValidJson"))
      toast({
        title: t("remoteCommand.failed"),
        description: t("remoteCommand.parametersMustBeValidJson"),
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    try {
      // Send remote command via WebSocket - COMMENTED OUT
      // sendRemoteCommand(deviceId, command, paramsObj, priority === 1 ? "normal" : String(priority));
      // setSuccess(t("remoteCommand.commandSentSuccessfully"))
      // toast({
      //   title: t("remoteCommand.success"),
      //   description: t("remoteCommand.commandSentSuccessfully"),
      // })
      
      // Use API instead of WebSocket
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/remote-command/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, device_id: deviceId, parameters: paramsObj, priority })
      })
      setSuccess(data.status || t("remoteCommand.commandSentSuccessfully"))
      toast({
        title: t("remoteCommand.success"),
        description: data.status || t("remoteCommand.commandSentSuccessfully"),
      })
    } catch (err: any) {
      const backendError = extractErrorMessages(err) || t("remoteCommand.failedToCreate")
      setError(backendError)
      toast({
        title: t("remoteCommand.failed"),
        description: backendError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("remoteCommand.sending")}</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("remoteCommand.create")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>{t("remoteCommand.command")}</label>
            <Input value={command} onChange={e => setCommand(e.target.value)} required />
          </div>
          <div>
            <label>{t("remoteCommand.deviceId")}</label>
            <div className="relative">
              <select
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                required
                className="w-full h-10 px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>{t("remoteCommand.selectDeviceId") || "Select a device"}</option>
                {devices.map((device: any) => (
                  <option key={device.device_id || device.uid} value={device.device_id || device.uid}>
                    {device.device_id || device.uid} {device.name ? `- ${device.name}` : ""}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div>
            <label>{t("remoteCommand.parameters")}</label>
            <Input value={parameters} onChange={e => setParameters(e.target.value)} required />
          </div>
          <div>
            <label>{t("remoteCommand.priority")}</label>
            <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} required />
          </div>
          {error && (
            <ErrorDisplay
              error={error}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          )}
          {success && <div className="text-green-600">{success}</div>}
          <Button type="submit" disabled={loading}>{loading ? t("remoteCommand.sending") : t("remoteCommand.sendCommand")}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function RemoteCommandCreatePageWrapper() {
  // WebSocket provider commented out
  // const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  return (
    // <WebSocketProvider token={token}>
      <RemoteCommandCreatePage />
    // </WebSocketProvider>
  );
}