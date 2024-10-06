"use client";
import React, { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./themer-provider";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <SessionProvider>{children}</SessionProvider>
      </ThemeProvider>
    </>
  );
};
