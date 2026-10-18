import { messages } from '@/lib/messages/mn';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_IMAGE_BYTES } from '@/lib/upload-limits';
export function assetUrl(path:string|null|undefined){return path?`/api/assets/${path.split('/').map(encodeURIComponent).join('/')}`:'';}
export function imageType(bytes:Uint8Array):'png'|'jpg'|'webp'|null {
  if(bytes.length<12)return null;
  if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'png';
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';
  return null;
}
export async function uploadAsset(supabase:SupabaseClient,orgId:string,file:File,scope:'branding'|'menu'|'pages'='menu'):Promise<string>{
  if(file.size===0||file.size>MAX_IMAGE_BYTES)throw new Error(messages.libStorage.message);
  const bytes=new Uint8Array(await file.arrayBuffer());const extension=imageType(bytes);const mime={png:'image/png',jpg:'image/jpeg',webp:'image/webp'};
  if(!extension||file.type!==mime[extension])throw new Error(messages.libStorage.message2);
  const path=`${orgId}/${scope}/${crypto.randomUUID()}.${extension}`;
  const {error}=await supabase.storage.from('organization-assets').upload(path,bytes,{contentType:mime[extension],upsert:false});if(error)throw new Error(messages.libStorage.message3);return path;
}
