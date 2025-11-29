'use client'

import { useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AddProductPage() {
  const router = useRouter()

  // State Form
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Elektronik")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  
  // State Gambar
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // State Lokasi (Diubah menjadi terpisah agar bisa di-edit manual)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  
  // Loading States
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)

  // Fungsi ambil lokasi otomatis (GPS)
  const handleGetLocation = () => {
    setLocLoading(true)
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolokasi")
      setLocLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Isi input latitude & longitude otomatis
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocLoading(false)
      },
      (err) => {
        console.error(err)
        alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.")
        setLocLoading(false)
      }
    )
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    // Validasi
    if (!name || !price || !description || !imageFile) {
      alert("Semua field wajib diisi!")
      setLoading(false)
      return
    }

    if (!latitude || !longitude) {
      alert("Latitude dan Longitude wajib diisi!")
      setLoading(false)
      return
    }

    // 1️⃣ Upload gambar
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile)

    if (uploadError) {
      console.error(uploadError)
      alert("Gagal upload gambar")
      setLoading(false)
      return
    }

    const { data: imgUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath)

    // 2️⃣ Ambil user ID
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (!userId) {
      alert("User tidak ditemukan, silakan login ulang.")
      setLoading(false)
      return
    }

    // 3️⃣ Simpan ke database
    const { error: insertError } = await supabase
      .from("products")
      .insert({
        name,
        price: Number(price),
        description,
        image_url: imgUrl.publicUrl,
        seller_id: userId,
        // Format PostGIS: POINT(longitude latitude)
        location: `POINT(${longitude} ${latitude})` 
      })

    if (insertError) {
      console.error(insertError)
      alert("Gagal menyimpan produk")
      setLoading(false)
      return
    }

    alert("Produk berhasil ditambahkan!")
    router.push("/dashboard/seller")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb & Title */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Beranda / <span className="text-gray-900 font-medium">Jual Barang</span></p>
          <h1 className="text-3xl font-bold text-gray-900">Jual Barang Bekasmu</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLOM KIRI: Informasi Produk */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6">Informasi Produk</h2>
                
                <div className="space-y-5">
                  {/* Nama Produk */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Produk</label>
                    <input
                      type="text"
                      placeholder="Contoh: Meja Belajar Kayu Jati"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Kategori & Harga */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Harga</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">Rp</span>
                        <input
                          type="number"
                          placeholder="150.000"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
                    <textarea
                      rows={5}
                      placeholder="Jelaskan kondisi barang, alasan dijual, dll."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: Upload & Lokasi */}
            <div className="space-y-6">
              
              {/* Card Upload Foto */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-2">Unggah Foto Barang</h2>
                <p className="text-sm text-gray-500 mb-4">Unggah minimal 1 foto. Foto pertama akan menjadi foto utama.</p>
                
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-blue-50 p-3 rounded-full mb-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <p className="font-semibold text-gray-900">Klik untuk mengunggah <span className="font-normal text-gray-500">atau tarik dan lepas</span></p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>

                {imagePreview && (
                  <div className="mt-4 flex gap-2">
                    <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                       <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Lokasi (UPDATED: Latitude & Longitude) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-2">Tentukan Lokasi Barang</h2>
                <p className="text-sm text-gray-500 mb-4">Masukkan koordinat lokasi barang atau gunakan tombol otomatis.</p>
                
                <button 
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-lg font-medium transition mb-4"
                >
                  {locLoading ? (
                    <span>Mencari lokasi...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      Gunakan Lokasi Saat Ini
                    </>
                  )}
                </button>

                {/* Input Latitude & Longitude */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
                    <input 
                      type="text" 
                      placeholder="-6.200000"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
                    <input 
                      type="text" 
                      placeholder="106.816666"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Optional: Visual Map Preview */}
                {latitude && longitude && (
                   <div className="mt-4 w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
                      <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          scrolling="no" 
                          marginHeight="0" 
                          marginWidth="0" 
                          src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=id&z=15&output=embed`}
                      ></iframe>
                   </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
            >
              {loading ? "Menyimpan..." : (
                <>
                  Jual Sekarang
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}