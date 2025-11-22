"use client";

import { AccountContext } from "@/context/AccountContextProvider";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef } from "react";

export default function LogOutComponent() {
  const { logout, accountName } = useContext(AccountContext);
  const router = useRouter();
  const calledRef = useRef(false);

  useEffect(() => {
    if (!calledRef.current) {
      calledRef.current = true;
      logout();
      router.push("/");
    }
  }, [logout, router, accountName]);

  return <div>Logging out...</div>;
}
