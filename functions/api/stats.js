export async function onRequestGet() {
 try { const r=await fetch("https://pansousuo.com/api/stats",{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(5000)}); if(!r.ok)return json({ok:false},502); const d=await r.json(); return json(d,200,{"Cache-Control":"public, max-age=60, s-maxage=60"}); }
 catch { return json({ok:false},502); }
}
function json(d,status=200,extra={}){return new Response(JSON.stringify(d),{status,headers:{"Content-Type":"application/json; charset=utf-8",...extra}})}