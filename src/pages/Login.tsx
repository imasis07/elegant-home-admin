import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_EMAIL, supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, isAdmin, needsMfa, enableTestBypass } = useAuth();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      setError("This account is not allowed for admin panel.");
      return;
    }
    if (needsMfa) navigate("/mfa", { replace: true });
    else navigate("/", { replace: true });
  }, [user, isAdmin, needsMfa, navigate]);

  const emailAllowed = useMemo(() => email.trim().toLowerCase() === ADMIN_EMAIL, [email]);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!emailAllowed) {
      setError(`Only ${ADMIN_EMAIL} is allowed.`);
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
    setMessage("OTP sent to admin email. Enter 6-digit code.");
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!otp.trim()) {
      setError("Enter OTP code.");
      return;
    }
    setLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: "email",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError("Unauthorized email.");
      return;
    }
    navigate("/mfa", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Cervizo</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Email OTP + mandatory 2FA.</p>

        {step === "email" ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`Admin email (${ADMIN_EMAIL})`}
              className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError("");
                setMessage("");
              }}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              Change email
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={async () => {
            setError("");
            setMessage("");
            await enableTestBypass();
            navigate("/", { replace: true });
          }}
          className="mt-4 h-11 w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10"
        >
          Test bypass to dashboard
        </button>

        <button
          type="button"
          onClick={async () => {
            setError("");
            setMessage("");
            await enableTestBypass();
            navigate("/", { replace: true });
          }}
          className="mt-3 h-11 w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10"
        >
          Another bypass button
        </button>

        {message ? <p className="mt-4 text-xs text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
};

export default Login;

