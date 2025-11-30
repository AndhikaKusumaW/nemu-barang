'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Import Link untuk navigasi footer

export default function RegisterPage() {
  // State asli
  const [form, setForm] = useState({ email:'', password:'', full_name:'', phone:'', role:'pembeli' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // State tambahan HANYA untuk keperluan UI (agar sesuai gambar)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // CATATAN: Logika validasi confirmPassword dan termsAccepted tidak ditambahkan
    // sesuai instruksi untuk hanya mengubah UI.

    setLoading(true)
    try {
      // 1) daftar ke Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (signUpError) throw signUpError

      // 2) coba sign in agar mendapat user id (untuk dev lokal).
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (signInError) throw signInError

      const userId = signInData.user.id

      // 3) masukkan ke tabel profiles
      const { error: insertError } = await supabase
        .from('profiles')
        // Note: form.phone akan mengirim string kosong jika inputnya dihapus dari UI
        .insert([{ id: userId, full_name: form.full_name, phone: form.phone, role: form.role }])
      if (insertError) throw insertError

      router.push('/dashboard')
    } catch (err) {
      alert(err.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  // Icon Mata (SVG Inline)
  const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )

  // Icon Mata Dicoret (SVG Inline)
  const EyeSlashIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )


  return (
    <div className="pt-20 pb-20 min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-[520px] p-8 bg-white rounded-3xl shadow-sm">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Buat Akun Baru</h2>
          <p className="text-gray-500 text-md leading-relaxed">
            Bergabunglah dengan kami untuk mengelola barang bekas dengan baik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Custom Role Switcher UI */}
          <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'pembeli' })}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                form.role === 'pembeli' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saya Pembeli
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'penjual' })}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                form.role === 'penjual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saya Penjual
            </button>
          </div>
          {/* Hidden select to keep original state logic working if needed */}
          <select className="hidden" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
             <option value="pembeli">Pembeli</option>
             <option value="penjual">Penjual</option>
          </select>


          {/* Nama Lengkap Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">Nama Lengkap</label>
            <input
              required
              placeholder="Masukkan nama lengkap Anda"
              value={form.full_name}
              onChange={e=>setForm({...form, full_name: e.target.value})}
              className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400 text-gray-900"
            />
          </div>

          {/* No. Telepon Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">No. Telepon</label>
            <input
              required
              type="tel"
              inputMode="numeric" 
              placeholder="Contoh: 08123456789"
              
              // [PENTING 1] value harus terikat ke state.
              // Kalau baris ini hilang/salah, filter angka TIDAK AKAN jalan secara visual.
              value={form.phone} 
              
              // [PENTING 2] Logika pengganti karakter
              onChange={(e) => {
                // Ambil apa yang user ketik
                const inputValue = e.target.value;
                
                // Ganti semua yang BUKAN angka (0-9) dengan string kosong
                const numericValue = inputValue.replace(/[^0-9]/g, '');
                
                // Simpan hasil bersih ke state
                setForm({ ...form, phone: numericValue });
              }}
              
              className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400 text-gray-900"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-900">Alamat Email</label>
            <input
              required
              placeholder="contoh@email.com"
              type="email"
              value={form.email}
              onChange={e=>setForm({...form, email: e.target.value})}
              className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400 text-gray-900"
            />
          </div>

           {/* Input Phone DIHAPUS agar sesuai gambar */}
           {/* <input required placeholder="No. Telp" ... /> */}

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">Kata Sandi</label>
            <div className="relative">
              <input
                required
                placeholder="Masukkan kata sandi Anda"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e)=>setForm({...form, password: e.target.value})}
                className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400 text-gray-900 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeIcon className="h-6 w-6" /> : <EyeSlashIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password Input (UI Only) */}
          <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-900">Konfirmasi Kata Sandi</label>
             <div className="relative">
              <input
                // required // Tidak di-required karena tidak ada validasi di handleSubmit asli
                placeholder="Konfirmasi kata sandi Anda"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}
                className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-400 text-gray-900 pr-12"
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeIcon className="h-6 w-6" /> : <EyeSlashIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox (UI Only) */}
          <div className="flex items-center pt-2">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms-checkbox" className="ml-3 block text-sm text-gray-500">
              Saya setuju dengan <a href="#" className="text-blue-600 hover:underline">Syarat Layanan</a> dan <a href="#" className="text-blue-600 hover:underline">Kebijakan Privasi</a>.
            </label>
          </div>

          {/* Submit Button */}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition duration-200 mt-6 text-md"
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>
          
         {/* Footer Link */}
        <p className="text-center mt-8 text-sm text-gray-500">
          Sudah punya akun? <Link href="/login" className="text-blue-700 font-bold hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}