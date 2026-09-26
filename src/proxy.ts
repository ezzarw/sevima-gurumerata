import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 memakai nama `proxy` (pengganti `middleware`).
 * Tugasnya: menyegarkan token sesi Supabase dan menjaga halaman kerja
 * supaya hanya bisa dibuka setelah login.
 */
export async function proxy(permintaan: NextRequest) {
  let respons = NextResponse.next({ request: permintaan });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return permintaan.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => permintaan.cookies.set(name, value));
          respons = NextResponse.next({ request: permintaan });
          cookiesToSet.forEach(({ name, value, options }) =>
            respons.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Jangan menyisipkan logika apa pun di antara pembuatan klien dan getUser():
  // urutan ini yang membuat penyegaran token bisa diandalkan.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = permintaan.nextUrl;
  const halamanPublik = pathname === "/masuk";
  const ruteApi = pathname.startsWith("/api/");

  // Rute API menjawab dengan JSON, bukan pengalihan HTML, supaya pemanggilnya
  // mendapat keterangan yang bisa dibaca. Datanya tetap butuh sesi karena
  // pembacaan lewat RLS Supabase.
  if (!user && ruteApi) {
    return Response.json(
      { galat: "Sesi tidak ditemukan. Masuk lebih dulu untuk memakai asisten." },
      { status: 401 },
    );
  }

  if (!user && !halamanPublik) {
    const url = permintaan.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = pathname === "/" ? "" : `?dari=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && halamanPublik) {
    const url = permintaan.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return respons;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
