'use client'
import { useRouter } from 'next/navigation';
import React from 'react';
import Link from 'next/link';




export default function Unauthorized() {

  const router = useRouter();
  const { message } = router.query;

  return (
      <><h1 className="text-xl">Access Denied</h1><Link href='/login'>
      {message && <div className="mb-4 text-red-500 text-center">{message}</div>}
    </Link></>
    
  );
}