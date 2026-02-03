'use client';

import { signIn } from 'next-auth/react';

export default function OAuthButtons() {
    return (
        <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
                <button
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    className="flex w-full items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]"
                >
                    <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    Google
                </button>
            </div>
            <div>
                 <button
                    onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                    className="flex w-full items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f2f2f]"
                >
                    <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/448239/microsoft.svg" alt="Microsoft" />
                    Microsoft
                </button>
            </div>
        </div>
    );
}
