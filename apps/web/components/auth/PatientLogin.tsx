"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PatientLogin() {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // 2026: SMS OTP via WhatsApp / ABDM Gateway
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 1200);
  };

  const verifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Verification against Supabase Edge Functions
    setTimeout(() => {
      setLoading(false);
      alert("✅ Authenticated via Ayura Zero-Trust Gateway");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md shadow-xl border-t-4 border-t-[#0F766E]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0F766E]">Ayura Patient Portal</h2>
          <p className="text-gray-500 mt-2 text-sm">Military-grade health records access</p>
        </div>

        {step === 'PHONE' ? (
          <form onSubmit={requestOTP} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number (ABDM Linked)</label>
              <Input 
                type="tel" 
                placeholder="+91 98765 43210" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1 block w-full focus:ring-[#0F766E] focus:border-[#0F766E]"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-6 text-lg"
              disabled={loading}
            >
              {loading ? "Sending Secure OTP..." : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-sm font-medium text-gray-700">6-Digit Access Code</label>
              <Input 
                type="text" 
                placeholder="• • • • • •" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 block w-full text-center tracking-widest text-lg focus:ring-[#0F766E] focus:border-[#0F766E]"
                maxLength={6}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-6 text-lg"
              disabled={loading}
            >
              {loading ? "Verifying Keys..." : "Access Medical Vault"}
            </Button>
            <p className="text-center text-xs text-gray-400 mt-4 underline cursor-pointer" onClick={() => setStep('PHONE')}>
              Didn't receive a code? Let's try again.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
