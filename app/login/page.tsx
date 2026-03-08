"use client";

import { useState } from "react";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = "Email is required";
    } else if (!email.includes("@") || !email.includes(".edu")) {
      e.email = "Please use a university email (.edu)";
    }
    if (!password.trim()) {
      e.password = "Password is required";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    login();
    router.push("/");
  };

  const handleSSO = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    login();
    router.push("/");
  };

  return (
    <div className="min-h-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1A3C6E] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1A3C6E]/20">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-[#1A3C6E] dark:text-white">UniRide</h1>
          <p className="text-muted-foreground text-[14px] mt-1">
            {isSignup ? "Create your account" : "Welcome back, student!"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-3xl shadow-lg border border-border p-6 space-y-4">
          {/* Email */}
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="University email (.edu)"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: "" }));
                }}
                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border ${
                  errors.email ? "border-red-400" : "border-border"
                } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all placeholder:text-muted-foreground`}
              />
            </div>
            {errors.email && (
              <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: "" }));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={`w-full pl-11 pr-12 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border ${
                  errors.password ? "border-red-400" : "border-border"
                } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all placeholder:text-muted-foreground`}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </div>

          {!isSignup && (
            <div className="text-right">
              <button className="text-[13px] text-[#00C9B1] hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1A3C6E]/20 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignup ? "Sign Up" : "Log In"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[12px] text-muted-foreground">or</span>
            </div>
          </div>

          {/* SSO Button */}
          <button
            onClick={handleSSO}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#00C9B1] text-white font-semibold hover:bg-[#00C9B1]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <GraduationCap className="w-5 h-5" />
            Login with University SSO
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-[13px] text-muted-foreground mt-6">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setErrors({});
            }}
            className="text-[#00C9B1] font-semibold hover:underline"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
