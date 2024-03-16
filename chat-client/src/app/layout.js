'use client'
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "[0.0.1]friends os",
//   description: "A web client for friends os",
// };

export default function RootLayout({ children }) {
  
  return (
    <html lang="en">
      <SessionProvider>
        {children.auth ? ( 
          <Auth adminOnly={children.auth.adminOnly}>
            <body className={inter.className}>{children}</body>
          </Auth>
          ) : (
            <body className={inter.className}>{children}</body>
          )
        }
      </SessionProvider>
    </html>
  );
}

function Auth({ children, adminOnly }) {
  const router = useRouter();
  const { status, data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/unauthorized?message=login required');
    },
  });
  console.log(session? session : "undefined")
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (adminOnly && !session.user.isAdmin) {
    router.push('/unauthorized?message=admin login required');
  }

  return children;
}