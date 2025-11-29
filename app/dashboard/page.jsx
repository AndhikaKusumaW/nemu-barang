'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import dynamic from "next/dynamic"
import CheckLocation from '../components/CheckLocation'
import { getProductsByRadius } from "../../lib/getProductsByRadius"
import Link from 'next/link'

// Icon library (menggunakan SVG inline agar tidak perlu install library tambahan)
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 2.062-5M12 12h9.25" />
  </svg>
)

const MapView = dynamic(() => import("../components/MapView"), { ssr: false })

// Convert POINT format
function parsePointWKT(wkt) {
  if (!wkt || typeof wkt !== "string") return null
  try {
    const cleaned = wkt.replace("POINT(", "").replace(")", "").trim()
    const parts = cleaned.split(" ")
    if (parts.length !== 2) return null

    const lon = parseFloat(parts[0])
    const lat = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lon)) return null

    return { lat, lon }
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [radius, setRadius] = useState(1000)
  const [products, setProducts] = useState([])

  const router = useRouter()

  // Redirect jika penjual
  useEffect(() => {
    if (!profile) return
    if (profile.role === 'penjual') {
      router.push("/dashboard/seller")
    }
  }, [profile])

  // GPS user
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => alert("Tidak dapat mengambil lokasi. Aktifkan GPS!")
    )
  }, [])

  // Load product by radius
  useEffect(() => {
    if (!userPos) return

    async function loadProducts() {
      const [lat, lon] = userPos
      const data = await getProductsByRadius(lat, lon, radius)
      setProducts(data)
    }

    loadProducts()
  }, [userPos, radius])

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user) return router.push("/login")

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(profileData)
    }

    loadProfile()
  }, [])

  if (!profile) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Loading Dashboard...</div>
  if (!userPos) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Mengambil lokasi Anda...</div>

  // === HANDLER UNTUK POPUP BUTTON ===
  function handleDetail(id) {
    router.push(`/product/${id}`)
  }

  function handleRoute(position) {
    window.open(
      `https://www.google.com/maps/dir/${userPos[0]},${userPos[1]}/${position[0]},${position[1]}`,
      "_blank"
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      
      {/* === SIDEBAR (KIRI) === */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-8 z-20 shadow-sm relative">
        
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-12">
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">NemuBarang</h2>
            <p className="text-sm text-gray-500">Temukan Barang Bekas yang Anda Mau</p>
            {/* Menampilkan nama user kecil di bawah tagline jika perlu */}
            <p className="text-xs text-blue-600 mt-1 font-medium">{profile.full_name}</p>
          </div>
        </div>

        {/* Radius Controls */}
        <div className="flex-1">
          <div className="mb-2 flex justify-between items-end">
            <h3 className="font-semibold text-gray-900">Radius Pencarian</h3>
          </div>
          <div className="mt-4">
             <p className="text-sm font-medium text-gray-500 mb-2">{(radius / 1000).toFixed(1)} km</p>
            <input
              type="range"
              min="100"
              max="10000" // Diperbesar sedikit agar slider terasa lebih panjang
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Komponen CheckLocation disembunyikan tapi tetap render logic-nya */}
        <div className="hidden">
           <CheckLocation />
        </div>

        {/* Logout Button */}
        <div className="mt-auto pt-6 border-t border-gray-100">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push("/login")
            }}
            className="flex items-center gap-3 text-red-500 font-medium hover:text-red-700 transition-colors w-full p-2 rounded-md hover:bg-red-50"
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* === MAP AREA (KANAN) === */}
      <main className="flex-1 relative bg-gray-100">
        
        {/* Floating Search Bar (Visual Only sesuai gambar) */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[400] w-full max-w-lg px-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input 
              type="text" 
              placeholder="Cari barang seperti meja, sepeda..." 
              className="block w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-xl text-gray-900 shadow-lg placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-full">
          <MapView
            center={userPos}
            userPosition={userPos}
            markers={products
              .map((p) => {
                const loc = parsePointWKT(p.location)
                if (!loc) return null

                return {
                  id: p.id,
                  position: [loc.lat, loc.lon],
                  text: p.name,
                  // Mengirim data tambahan jika MapView mendukungnya, 
                  // atau text akan menjadi label standar
                  price: p.price, 
                  image: p.image_url 
                }
              })
              .filter(Boolean)}
            onDetail={handleDetail}
            onRoute={handleRoute}
          />
        </div>
        
        {/* Custom Zoom Controls Placeholder (Visual) 
            Note: Biasanya MapView (Leaflet) punya kontrol sendiri, 
            tapi ini untuk meniru gaya tombol bulat putih di pojok kanan bawah gambar */}
        {/* <div className="absolute bottom-8 right-8 z-[400] flex flex-col gap-2">
           <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 font-bold text-xl">+</button>
           <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 font-bold text-xl">-</button>
           <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 mt-2">
             <div className="w-4 h-4 border-2 border-gray-600 rounded-full"></div>
           </button>
        </div> */}

      </main>
    </div>
  )
}