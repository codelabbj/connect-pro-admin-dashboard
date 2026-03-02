import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIdentifier?: string;
  onSuccess?: (msg: string) => void;
}

export default function PasswordResetModal({ open, onOpenChange, initialIdentifier = "", onSuccess }: PasswordResetModalProps) {
  const [step, setStep] = useState<"init"|"code">("init");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Simulate API call
  const fakeApi = (payload: any, response: any, delay = 800) => new Promise(res => setTimeout(() => res(response), delay));

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const resp = await fakeApi(
        { identifier },
        {
          message: "Code de réinitialisation en cours d'envoi par email.",
          status: "sending",
          contact_method: "email",
          task_id: "c6c19cec-c243-48e7-981c-c4442b632636"
        }
      );
      setMessage((resp as any).message);
      setTaskId((resp as any).task_id);
      setStep("code");
    } catch (e) {
      setError("Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const resp = await fakeApi(
        { identifier, code, new_password: newPassword },
        { message: "Mot de passe réinitialisé avec succès." }
      );
      setMessage((resp as any).message);
      if (onSuccess) onSuccess((resp as any).message);
      setTimeout(() => {
        onOpenChange(false);
        setStep("init");
        setIdentifier(initialIdentifier);
        setCode("");
        setNewPassword("");
        setMessage("");
        setError("");
      }, 1200);
    } catch (e) {
      setError("Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("init");
      setIdentifier(initialIdentifier);
      setCode("");
      setNewPassword("");
      setMessage("");
      setError("");
      setTaskId("");
    }
  }, [open, initialIdentifier]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => onOpenChange(false)}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        {step === "init" && (
          <form onSubmit={handleInitiate} className="space-y-4">
            <input
              className="w-full p-2 border rounded"
              placeholder="Email or Username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}
        {step === "code" && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <input
              className="w-full p-2 border rounded"
              placeholder="Reset Code"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
            <div className="relative">
              <input
                className="w-full p-2 border rounded pr-10"
                placeholder="New Password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        {message && <div className="mt-4 text-green-700 dark:text-green-400">{message}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
} 