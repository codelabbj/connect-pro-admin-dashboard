"use client"

import { useState } from "react"
import { AlertTriangle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/components/providers/language-provider"

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: "inline" | "full" | "modal"
  className?: string
  showRetry?: boolean
  showDismiss?: boolean
}

// Helper to extract error messages from API responses
export function extractErrorMessages(errorObj: any): string {
  // Handle null/undefined
  if (!errorObj) return "An unknown error occurred"
  
  // Handle strings (already extracted)
  if (typeof errorObj === "string") return errorObj
  
  // Handle non-objects
  if (typeof errorObj !== "object") return String(errorObj)
  
  // Handle arrays
  if (Array.isArray(errorObj)) {
    return errorObj.map(item => extractErrorMessages(item)).join(" ")
  }
  
  // Handle objects - check for common error fields
  if (errorObj.detail) return errorObj.detail
  if (errorObj.message) return errorObj.message
  if (errorObj.error) return errorObj.error
  if (errorObj.msg) return errorObj.msg
  if (errorObj.description) return errorObj.description
  
  // Handle non_field_errors (Django REST framework style)
  if (errorObj.non_field_errors && Array.isArray(errorObj.non_field_errors)) {
    return errorObj.non_field_errors.join(" ")
  }
  
  // Handle field-specific errors (e.g., {"email": ["This field is required"]})
  const fieldErrors = Object.entries(errorObj)
    .filter(([key, value]) => Array.isArray(value) && value.length > 0)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("; ")
  
  if (fieldErrors) return fieldErrors
  
  // Handle other object values
  const values = Object.values(errorObj)
    .map((v) => Array.isArray(v) ? v.join(" ") : String(v))
    .join(" ")
  
  return values || "An unknown error occurred"
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  variant = "inline",
  className = "",
  showRetry = true,
  showDismiss = true
}: ErrorDisplayProps) {
  const { t } = useLanguage()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  if (!error) return null

  const errorMessage = typeof error === "string" ? error : extractErrorMessages(error)

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] space-y-4 ${className}`}>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              {t("common.errorOccurred")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {errorMessage}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.retrying")}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("common.retry")}
                </>
              )}
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              {t("common.dismiss")}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (variant === "modal") {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-background border rounded-lg p-6 max-w-md mx-4 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-full flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-red-600 dark:text-red-400">
                {t("common.errorOccurred")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <div className="flex items-center space-x-2 pt-2">
                {showRetry && onRetry && (
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        {t("common.retrying")}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t("common.retry")}
                      </>
                    )}
                  </Button>
                )}
                {showDismiss && onDismiss && (
                  <Button
                    onClick={onDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("common.dismiss")}
                  </Button>
                )}
              </div>
            </div>
            {showDismiss && onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">{errorMessage}</span>
        <div className="flex items-center space-x-2 ml-4">
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 h-7 px-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  {t("common.retrying")}
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t("common.retry")}
                </>
              )}
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
} 