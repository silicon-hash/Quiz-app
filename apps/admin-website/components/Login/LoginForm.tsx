"use client";
import React, { useState } from "react";
import { CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createAdmin } from "@/src/lib/actions";

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.ok) {
      toast.success("Loggein Success");
      router.push("/");
    } else if (result?.error) {
      toast.error("something went wrong while logging in");
    }
  };

  return (
    <CardContent>
      <form className="grid gap-4" onSubmit={handleLogin}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-2 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
      <button
        onClick={async () => {
          await createAdmin("test2@gmail.com", "12");
        }}
      >
        Create
      </button>
    </CardContent>
  );
}

export default LoginCard;
