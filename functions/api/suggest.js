export async function onRequestGet(context) {
 const q=(new URL(context.request.url).searchParams.get("q")||"").trim().slice(0,60);
 if(!q) return json([]);
 try { const r=await fetch("https://pansousuo.com/api/suggest?q="+encodeURIComponent(q),{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(5000)}); if(!r.ok)return json([]); const d=await r.json(); return json(d,200,{"Cache-Control":"public, max-age=60, s-maxage=60"}); }
 catch { return json([]); }
}
function json(d,status=200,extra={}){return new Response(JSON.stringify(d),{status,headers:{"Content-Type":"application/json; charset=utf-8",...extra}})}