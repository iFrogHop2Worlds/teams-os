'use client'
import Link from 'next/link';
import React, { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { getError } from '../../utils/error';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function LoginScreen() {

  const { data: session } = useSession();

  const router = useRouter();
  const { redirect } = router;

  useEffect(() => {
    console.log(session)
    if (session?.user) {
      router.push(redirect || '/');
    }
  }, [router, session, redirect]);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();
 
  const submitHandler = async ({ username, password }) => {
    try {
      const result = await signIn('credentials', {
        redirect: true,
        username,
        password,
      });
      if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(getError(err));
    }
  };
  
  return (
  
      <form
        className="mx-auto max-w-screen-md text-white w-7/12 md:w-2/6 mt-12"
        onSubmit={handleSubmit(submitHandler)}
      >
        <p className="mb-4 text-xl text-white">Login</p> 
        <div className="mb-4">
          <label htmlFor="username" className='text-white'>Username</label>
          <input
            type="username"
            {...register('username', {
              required: 'Please enter username',
            })}
            className="w-full bg-blue-100"
            id="username"
            autoFocus
          ></input>
          {errors.username && (
            <div className="text-red-500">{errors.username.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className='text-white'>Password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Please enter password',
              minLength: { value: 6, message: 'password is more than 5 chars' },
            })}
            className="w-full bg-blue-100"
            id="password"
            autoFocus
          ></input>
          {errors.password && (
            <div className="text-red-500 ">{errors.password.message}</div>
          )}
        </div>
        <div className="mb-4 ">
          <button className="bg-white text-black p-3 rounded-xl">Login</button>
        </div>
        <div className="mb-4 text-white">
          Don&apos;t have an account? &nbsp;
          <Link className='border border-white p-2' href={`/register?redirect=${redirect || '/login'}`}>Register</Link>
        </div>
      </form>

  );
}