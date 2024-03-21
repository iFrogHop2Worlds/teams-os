'use client'
import React from 'react';
import RoomList from '@/components/RoomList';
import Link from 'next/link';

export default function ChatList() {
  return (
    <div className='grid h-screen mr-4'>
        <RoomList />
        <Link href='/'>
          <button className='text-white place-self-start ml-4 mb-1 p-3 -translate-y-20 border border-emerald-600 rounded-xl'>back</button>
        </Link>
    </div>
  )
}
