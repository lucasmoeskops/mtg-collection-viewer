'use client';

import { AccountContext } from "@/context/AccountContextProvider";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";


export default function LogOutComponent() {
  const { logout, accountName } = useContext(AccountContext);
  const router = useRouter();
  
  useEffect(() => {
    router.push('/');
  }, [logout, router, accountName]);

  return <div>
    Logging out...
  </div>;
}