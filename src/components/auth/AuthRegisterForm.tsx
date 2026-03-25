"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingBag, Store } from "lucide-react";
import { cn, slugify } from "@/lib/utils";

type Role = "buyer" | "seller";

export function AuthRegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const setRoleAfterSignup = async (selectedRole: Role) => {
    await fetch("/api/user/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole }),
    });
  };

  const redirectByRole = (selectedRole: Role) => {
    const slug = slugify(name);
    if (selectedRole === "seller") {
      router.push(`/seller/${slug}/dashboard`);
    } else {
      router.push(`/buyer/${slug}/dashboard`);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp.email({
        email,
        password,
        name,
        fetchOptions: {
          onSuccess: async () => {
            await setRoleAfterSignup(role);
            redirectByRole(role);
          },
          onError: (ctx) => {
            alert(ctx.error.message);
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: role === "seller" ? `/seller/${slugify(name || "user")}/dashboard` : `/buyer/${slugify(name || "user")}/dashboard`,
    });
    // Note: Google OAuth role will default to "buyer".
    // Seller Google signup needs post-redirect role update (future enhancement).
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create an Account</h2>
        <p className="text-gray-500">Join Luxe to access premium collections.</p>
      </div>

      {/* Role Selector */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">I want to</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
              role === "buyer"
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="text-sm font-semibold">Buy Products</span>
            <span className="text-xs text-muted-foreground">Shop & order items</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
              role === "seller"
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <Store className="h-6 w-6" />
            <span className="text-sm font-semibold">Sell Products</span>
            <span className="text-xs text-muted-foreground">Manage your store</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <Button
            variant="outline"
            className="w-full h-12 relative flex items-center justify-center border-gray-300 hover:bg-gray-50"
            onClick={handleGoogleSignIn}
        >
          <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-medium text-gray-700">Sign up with Google</span>
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12"
          />
        </div>
        <Button type="submit" className="w-full h-12 font-bold mt-2" disabled={isLoading}>
           {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Create ${role === "seller" ? "Seller" : "Buyer"} Account`}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500">Already have an account? </span>
        <button onClick={onSwitch} className="font-bold text-primary hover:underline">
          Sign in
        </button>
      </div>
    </div>
  );
}
