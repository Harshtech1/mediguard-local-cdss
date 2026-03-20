import React from 'react';

export const ClerkProvider = ({ children }) => <>{children}</>;
export const SignedIn = ({ children }) => <>{children}</>;
export const SignedOut = ({ children }) => null;
export const SignIn = () => null;

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'mock-local-user-id',
    primaryEmailAddress: { emailAddress: 'doctor@demo.local' },
    fullName: 'Dr. Local Demo',
    firstName: 'Demo',
  }
});

export const UserButton = () => (
  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md cursor-pointer border border-indigo-700">
    DM
  </div>
);
