'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import dynamic from "next/dynamic"
import CheckLocation from '../components/CheckLocation'
import { getProductsByRadius } from "../../lib/getProductsByRadius"
import Link from 'next/link'

// Icon Search
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

function parseGeographyWKB(hex) {
  if(!hex || typeof hex !== "string") return null; 

  try {
    const buffer = Buffer.from(hex, "hex"); 
    const littleEndiean = buffer[0]==1; 
    const readFloat64 = (offset) => 
      littleEndiean 
      ? buffer.readDoubleLE(offset)
      : buffer.readDoubleBE(offset) 
    const lon = readFloat64(9); 
    const lat = readFloat64(17) 
    return {lat, lon}
  } catch (error) {
    console.error("Gagal parse geografi:", error)
    return null;
  }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [radius, setRadius] = useState(1000)
  const [products, setProducts] = useState([])
  
  // State untuk Pencarian
  const [searchQuery, setSearchQuery] = useState("")
  
  const [routeTarget, setRouteTarget] = useState(null)
  const [clearRoute, setClearRoute] = useState(null)

  const router = useRouter()

  useEffect(() => {
    if (!profile) return
    if (profile.role === 'penjual') {
      router.push("/dashboard/seller")
    }
  }, [profile])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => alert("Tidak dapat mengambil lokasi. Aktifkan GPS!")
    )
  }, [])

  useEffect(() => {
    if (!userPos) return

    async function loadProducts() {
      const [lat, lon] = userPos
      const data = await getProductsByRadius(lat, lon, radius) 
      setProducts(data)
    }

    loadProducts()
  }, [userPos, radius])

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

  function handleDetail(id) {
    router.push(`/product/${id}`)
  }

  function handleRoute(position) {
    setRouteTarget(position)
  }

  async function onContactSeller(productId) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, profiles:owner_id(full_name, phone)")
      .eq("id", productId)
      .single()

    if (error || !data) {
      router.push("/error")
      return
    }

    const phone = data.profiles?.phone
    if (!phone) {
      router.push("/error")
      return
    }

    const wa = `https://wa.me/${phone}?text=Halo%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(data.name)}`
    window.open(wa, "_blank")
  }

  // LOGIKA FILTER PENCARIAN
  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      
      {/* === SIDEBAR (KIRI) === */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-8 z-20 shadow-sm relative">
        <div className="flex items-center gap-4 mb-12">
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">NemuBarang</h2>
            <p className="text-sm text-gray-500">Temukan Barang Bekas</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">{profile.full_name}</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex justify-between items-end">
            <h3 className="font-semibold text-gray-900">Radius Pencarian</h3>
          </div>
          <div className="mt-4">
             <p className="text-sm font-medium text-gray-500 mb-2">{(radius / 1000).toFixed(1)} km</p>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div className="hidden">
           <CheckLocation />
        </div>



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
        
        {/* === SEARCH BAR INPUT (TERLETAK DI ATAS MAP) === */}
        {/* z-[1000] penting agar input berada DI ATAS peta Leaflet */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-1000 w-full max-w-md px-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang (meja, kursi...)" 
              className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full text-gray-900 shadow-xl placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-full z-0">
          <MapView
            center={userPos}
            userPosition={userPos}
            // Gunakan filteredProducts agar marker berubah sesuai search
            markers={filteredProducts
              .map((p) => {
                const loc = parseGeographyWKB(p.location)
                if (!loc) return null

                return {
                  id: p.id,
                  position: [loc.lat, loc.lon],
                  text: p.name,
                  price: p.price, 
                  image: p.image_url, 
                  waNumber : p.phone
                }
              })
              .filter(Boolean)}
            onDetail={handleDetail}
            onRoute={handleRoute}
            routeTarget={routeTarget}
            clearRoute={clearRoute}
            onContactSeller={onContactSeller}
          />
        </div>

      </main>
    </div>
  )
}