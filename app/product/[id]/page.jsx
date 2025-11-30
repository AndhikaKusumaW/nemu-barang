// 'use client'

// import { useParams, useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
// import dynamic from "next/dynamic"
// import { supabase } from "../../../lib/supabaseClient"

// // Dynamic imports...
// const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false })
// const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
// const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })

// import "leaflet/dist/leaflet.css"

// // === PARSE WKB GEOGRAPHY ===
// function parseGeographyWKB(hex) {
//   if (!hex || typeof hex !== "string") return null;
//   try {
//     const buffer = Buffer.from(hex, "hex");
//     const littleEndian = buffer[0] === 1;

//     const readFloat64 = (offset) =>
//       littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);

//     const lon = readFloat64(9);
//     const lat = readFloat64(17);

//     return { lat, lon };
//   } catch (err) {
//     console.error("Gagal parse lokasi:", err);
//     return null;
//   }
// }

// export default function ProductDetail() {

//   const params = useParams();         // ← FIX DI SINI
//   const id = params?.id;              // ← FIX DI SINI

//   const router = useRouter();
//   const [product, setProduct] = useState(null);

//   useEffect(() => {
//     if (!id) return;        // ← ID belum siap

//     async function loadProduct() {
//       console.log("Load product ID:", id);

//       const { data, error } = await supabase
//         .from("products")
//         .select("*")
//         .eq("id", id)
//         .single();

//       if (error || !data) {
//         console.error("Supabase error:", error);
//         alert("Produk tidak ditemukan");
//         router.push("/dashboard");
//         return;
//       }

//       console.log("Produk ditemukan:", data);
//       setProduct(data);
//     }

//     loadProduct();
//   }, [id]);

//   if (!product) return <div className="p-6">Memuat detail produk...</div>;

//   const loc = parseGeographyWKB(product.location);

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold">{product.name}</h1>
//       <p className="text-lg font-semibold">Rp {product.price}</p>

//       <img src={product.image_url} className="w-full max-w-md rounded shadow" />

//       <p className="text-gray-700">{product.description}</p>

//       <div>
//         <h2 className="font-bold mb-2">Lokasi Produk</h2>

//         {loc ? (
//           <MapContainer
//             center={[loc.lat, loc.lon]}
//             zoom={15}
//             style={{ height: "300px", width: "100%" }}
//           >
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//             <Marker position={[loc.lat, loc.lon]} />
//           </MapContainer>
//         ) : (
//           <div className="p-4 text-gray-600">Lokasi tidak valid...</div>
//         )}
//       </div>

//       <button
//         className="p-3 bg-blue-600 text-white rounded"
//         onClick={() => router.push(`/route/${id}`)}
//       >
//         Lihat Rute ke Lokasi
//       </button>

//       <button className="p-2 bg-gray-300 rounded" onClick={() => router.back()}>
//         Kembali
//       </button>
//     </div>
//   );
// }
'use client'

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { supabase } from "../../../lib/supabaseClient"
import "leaflet/dist/leaflet.css"

// Dynamic import Leaflet pieces (Next.js client)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
)

// Robust parser: coba beberapa format lokasi yang mungkin dikembalikan DB
function parsePointWKT(wkt) {
  if (!wkt || typeof wkt !== "string") return null
  try {
    const cleaned = wkt.replace("POINT(", "").replace(")", "").trim()
    const parts = cleaned.split(/\s+/)
    if (parts.length !== 2) return null
    const lon = parseFloat(parts[0])
    const lat = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}

// Parse WKB hex geography (PostGIS geography type stored as hex string)
// Implementation expects typical PostGIS WKB layout used earlier in project
function parseGeographyWKB(hex) {
  if (!hex || typeof hex !== "string") return null
  // if it's already like "0101000020..." or contains letters — try hex decode
  try {
    // Browser Buffer support sometimes present via webpack polyfill; if not, fallback:
    const _Buffer = typeof Buffer !== "undefined" ? Buffer : (window && window.Buffer)
    if (!_Buffer) {
      console.warn("Buffer not available in this environment, cannot parse WKB")
      return null
    }
    const buffer = _Buffer.from(hex, "hex")

    // PostGIS WKB: byte order in first byte (1 = little endian)
    const littleEndian = buffer[0] === 1
    const readDouble = (offset) =>
      littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset)

    // Offsets: typical PostGIS geometry header: 1 byte byteorder, 4 bytes wkbType (uint32),
    // then if it's geography with SRID it may have SRID present (but many stored as just 2 doubles).
    // Empirically used offsets 9 and 17 in previous code — keep that with try/catch.
    const lon = readDouble(9)
    const lat = readDouble(17)
    if (isNaN(lat) || isNaN(lon)) return null
    return { lat, lon }
  } catch (err) {
    console.error("parseGeographyWKB failed:", err)
    return null
  }
}

// Accept multiple known representations
function resolveLocation(loc) {
  // 1) If loc is object like GeoJSON { type: 'Point', coordinates: [lon, lat] }
  if (loc && typeof loc === "object") {
    if (loc.type === "Point" && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      return { lat: Number(loc.coordinates[1]), lon: Number(loc.coordinates[0]) }
    }
    // Supabase might return { coordinates: [lon, lat] } in some cases
    if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      return { lat: Number(loc.coordinates[1]), lon: Number(loc.coordinates[0]) }
    }
  }

  // 2) If loc is string WKT "POINT(lon lat)"
  if (typeof loc === "string") {
    // maybe it's WKT
    const wkt = parsePointWKT(loc)
    if (wkt) return { lat: wkt.lat, lon: wkt.lon }

    // maybe it's hex WKB
    const hexParsed = parseGeographyWKB(loc)
    if (hexParsed) return { lat: hexParsed.lat, lon: hexParsed.lon }
  }

  // 3) If loc has a .coordinates as numbers directly (some driver)
  if (loc && loc.coordinates && Array.isArray(loc.coordinates)) {
    return { lat: Number(loc.coordinates[1]), lon: Number(loc.coordinates[0]) }
  }

  return null
}

export default function ProductDetail(props) {
  // Next.js App Router: params may be a Promise -> use() unwraps it
  const { id } = use(props.params)
  const router = useRouter()
  const productId = Number(id)

  const [product, setProduct] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loc, setLoc] = useState(null)

  useEffect(() => {
    async function loadProduct() {
      if (!productId || Number.isNaN(productId)) {
        alert("ID produk tidak valid")
        router.push("/dashboard")
        return
      }

      // Ambil produk (pakai supabase rest/select)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      console.log("Hasil Query:", { data, error })

      if (error || !data) {
        console.error("Produk load error:", error)
        alert("Produk tidak ditemukan")
        router.push("/dashboard")
        return
      }

      setProduct(data)

      // resolve location fleksibel
      const resolved = resolveLocation(data.location)
      if (resolved) {
        // Leaflet expects [lat, lon]
        setLoc([resolved.lat, resolved.lon])
      } else {
        console.warn("Lokasi produk tidak dapat di-parse:", data.location)
      }

      // Ambil data penjual (fetch terpisah supaya tidak bergantung pada relasi DB)
      try {
        if (data.seller_id) {
          const { data: userData, error: userErr } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", data.seller_id)
            .single()

          if (userErr) {
            console.warn("Gagal ambil profile penjual:", userErr)
          } else {
            setSeller(userData)
          }
        } else {
          console.warn("Produk tidak memiliki seller_id")
        }
      } catch (err) {
        console.error("Error fetch seller:", err)
      }

      setLoading(false)
    }

    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  if (loading) return <div className="p-6">Memuat detail produk...</div>
  if (!product) return <div className="p-6">Produk tidak ditemukan.</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-lg font-semibold">Rp {product.price}</p>

      {/* Gambar (jika ada) */}
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-full max-w-md rounded shadow" />
      ) : (
        <div className="w-full max-w-md rounded shadow bg-gray-100 p-6 text-gray-500">Tidak ada gambar</div>
      )}

      {/* Deskripsi */}
      {product.description && <p className="text-gray-700">{product.description}</p>}

      {/* Info penjual */}
      <div className="mt-4">
        <h3 className="font-semibold">Penjual</h3>
        {seller ? (
          <div>
            <p className="text-sm font-medium">{seller.full_name}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Informasi penjual tidak tersedia</p>
        )}
      </div>

      {/* Peta lokasi */}
      <div>
        <h2 className="font-bold mb-2">Lokasi Produk</h2>

        {loc ? (
          <div style={{ height: 300, width: "100%" }}>
            <MapContainer center={loc} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={loc} />
            </MapContainer>
          </div>
        ) : (
          <div className="p-4 text-gray-600">Lokasi tidak valid atau tidak tersedia.</div>
        )}
      </div>

      {/* Tombol Kembali */}
      <div className="flex gap-3">
        <button onClick={() => router.back()} className="p-2 bg-gray-300 rounded">Kembali</button>

        {/* Jika mau tetap ada tombol view route (dinonaktifkan sesuai permintaan) */}
        {/* <button className="p-2 bg-blue-600 text-white rounded" onClick={() => router.push(`/route/${product.id}`)}>Lihat Rute</button> */}
      </div>
    </div>
  )
}

