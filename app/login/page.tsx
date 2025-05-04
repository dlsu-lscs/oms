"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex w-1/2 relative">
        <Image
          src="/placeholder.svg"
          alt="Login"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGoogleLogin}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
} 