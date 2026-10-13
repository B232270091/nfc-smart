import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { hasSupabase } from '@/lib/env';
const noCache={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(_:NextRequest,{params}:{params:Promise<{path:string[]}>}){
  const path=(await params).path.join('/');if(!hasSupabase()||!/^[0-9a-f-]{36}\/(branding|menu|pages)\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path))return new NextResponse(null,{status:404,headers:noCache});
  const supabase=await createClient();const {data:published}=await supabase.rpc('get_public_asset',{p_path:path});
  // The signed-in client enforces storage RLS for draft previews. Public reads use the publication gate first.
  const client=published?serviceClient():supabase;if(!client)return new NextResponse(null,{status:503,headers:noCache});
  const {data,error}=await client.storage.from('organization-assets').download(path);if(error||!data)return new NextResponse(null,{status:404,headers:noCache});
  return new NextResponse(data,{headers:{...noCache,'Content-Type':data.type,'Content-Disposition':'inline'}});
}
