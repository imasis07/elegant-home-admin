import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";

function toSvgDataUrl(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw;

  let svg = raw;
  if (raw.startsWith("%3Csvg")) {
    try {
      svg = decodeURIComponent(raw);
    } catch {
      svg = raw;
    }
  }

  if (!svg.startsWith("<svg")) return "";
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

const MfaSetup = () => {
  const navigate = useNavigate();
  const { user, isAdmin, needsMfa, refresh } = useAuth();
  const [factorId, setFactorId] = useState<string>("");
  const [qrSvg, setQrSvg] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const qrImageSrc = useMemo(() => {
    if (!qrSvg) return "";
    return toSvgDataUrl(qrSvg);
  }, [qrSvg]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    if (!needsMfa) {
      navigate("/", { replace: true });
      return;
    }
    const init = async () => {
      setLoading(true);
      setError("");
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) {
        setError(factorError.message);
        setLoading(false);
        return;
      }
      const factors = data.totp ?? [];
      if (factors.length > 0) {
        const preferred = factors.find((item) => item.status !== "verified") ?? factors[0];
        setFactorId(preferred.id);
        if (preferred.totp?.qr_code) setQrSvg(preferred.totp.qr_code);
        if (preferred.totp?.secret) setSecret(preferred.totp.secret);
        if (preferred.status === "verified") {
          setMessage("Enter authenticator code to complete login.");
        } else if (preferred.totp?.qr_code || preferred.totp?.secret) {
          setMessage("Scan QR and verify code.");
        } else {
          setMessage("2FA already exists. Open your authenticator app and enter the current code.");
        }
        setLoading(false);
        return;
      }

      const { data: enroll, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Cervizo Admin ${new Date().getTime()}`,
      });
      setLoading(false);
      if (enrollError || !enroll) {
        setError(enrollError?.message || "Failed to initialize 2FA.");
        return;
      }
      setFactorId(enroll.id);
      setQrSvg(enroll.totp.qr_code);
      setSecret(enroll.totp.secret);
      setMessage("Scan QR in Google Authenticator / Authy, then enter 6-digit code.");
    };
    init();
  }, [user, isAdmin, needsMfa, navigate]);

  const verifyTotp = async (event: FormEvent) => {
    event.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError("");
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError || !challengeData) {
      setLoading(false);
      setError(challengeError?.message || "Unable to create challenge.");
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.trim(),
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    await refresh();
    navigate("/", { replace: true });
  };

  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-foreground">2FA Verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use authenticator app code to access admin panel.</p>

        {qrImageSrc ? (
          <div className="mt-5 rounded-xl border border-border/60 bg-background p-4">
            <p className="text-xs text-muted-foreground">Scan this QR in Google Authenticator / Authy</p>
            <img src={qrImageSrc} alt="2FA QR" className="mt-3 h-48 w-48 rounded-md bg-white p-2" />
            {secret ? <p className="mt-3 text-xs text-muted-foreground break-all">Manual key: {secret}</p> : null}
          </div>
        ) : null}

        <form onSubmit={verifyTotp} className="mt-5 space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit authenticator code"
            className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
          <button
            type="submit"
            disabled={loading || !factorId}
            className="h-11 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify 2FA"}
          </button>
        </form>

        {message ? <p className="mt-4 text-xs text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
};

export default MfaSetup;
