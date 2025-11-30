'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // State untuk toggle password
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Navbar / Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="m-5 flex items-center gap-2">
          {/* Logo Icon */}
          <div className="bg-blue-600 p-1 rounded-sm transform rotate-45">
            <div className="w-3 h-3 bg-white"></div>
          </div>
          <span className="text-xl font-bold text-gray-900">NemuBarang</span>
        </div>  
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="pb-17 pl-14 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Image & Hero Text */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-gray-200 rounded-3xl overflow-hidden aspect-square relative shadow-sm">
              <img 
                src="foto-login.jpg" 
                alt="Vintage Camera" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="mb-8">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Selamat Datang di Nemu Barang!</h2>
              <p className="text-gray-500">Masuk untuk menemukan barang di sekitarmu.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input 
                    type="text"
                    placeholder="Masukkan email" 
                    value={email} 
                    onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full pl-10 p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  {/* Logic Type Input Berdasarkan State */}
                  <input 
                    placeholder="Masukkan kata sandi Anda" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                    className="w-full pl-10 pr-10 p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black placeholder-gray-500"
                  />
                  
                  {/* Button Toggle Eye Icon */}
                  <button
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer focus:outline-none"
                  >
                    {showPassword ? (
                      // Icon Mata Coret (Hide)
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      // Icon Mata Normal (Show)
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Lupa Kata Sandi?</a>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 mt-6"
              >
                Login
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-gray-600">
              {/* PERUBAHAN DISINI: Menggunakan Link href="/register" */}
              Belum punya akun? <Link href="/register" className="text-blue-600 font-bold hover:underline">Daftar di sini</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}