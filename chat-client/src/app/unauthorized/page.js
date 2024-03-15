import { useRouter } from 'next/router';
import React from 'react';
import RootLayout from '@/components/layout';
import Link from 'next/link';

export default function Unauthorized() {

  const router = useRouter();
  const { message } = router.query;

  return (
    <RootLayout title="Unauthorized Page">
      <h1 className="text-xl">Access Denied</h1>
      <Link href='/login'>
      {message && <div className="mb-4 text-red-500 text-center">{message}</div>}
      </Link>
    
    </RootLayout>
  );
}