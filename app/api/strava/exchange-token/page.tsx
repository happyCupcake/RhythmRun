'use client'
import { redirect } from 'next/navigation'
import { useEffect } from 'react';
export default function About({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    useEffect(() => {
        const code = searchParams.code;
        if (code) {
            localStorage.setItem("strava_code", code as string);
        }
        redirect("/");
    }, []);

  return (
    <div>
      Redirecting...
    </div>
  );
}