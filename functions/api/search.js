const ALLOWED_PANS = ["quark","baidu","aliyun","xunlei","uc","tianyi","115","123","mobile","other"];
export async function onRequestGet(context) {
  const u = new URL(context.request.url);
  const q = (u.searchParams.get("q") || "").trim();
  const pan = (u.searchParams.get("pan") || "quark").trim();
  const page = Math.max(1, Math.min(100, Number.parseInt(u.searchParams.get("p") || "1", 10) || 1));
  if (!q) return json({ok:false,error:"请输入搜索关键词"},400);
  if (q.length > 60) return json({ok:false,error:"关键词最多 60 个字符"},400);
  if (!ALLOWED_PANS.includes(pan)) return json({ok:false,error:"不支持的网盘类型"},400);
  const upstream = new URL("https://pansousuo.com/api/search");
  const passthrough = ["cat","sort","mode","year","since","size","quality","tag"];
  upstream.searchParams.set("q",q); upstream.searchParams.set("pan",pan); upstream.searchParams.set("p",String(page));
  for (const key of passthrough) {
    const value = (u.searchParams.get(key)||"").trim();
    if (value) upstream.searchParams.set(key,value);
  }
  try {
    const response = await fetch(upstream.toString(), {headers:{"Accept":"application/json","User-Agent":"CloudResourceSearch/2.0"},signal:AbortSignal.timeout(12000)});
    if (!response.ok) return json({ok:false,error:`上游搜索服务返回 HTTP ${response.status}`},502);
    let data; try { data=await response.json(); } catch { return json({ok:false,error:"上游服务返回了非 JSON 内容"},502); }
    return json({ok:true,source:"pansousuo.com",...data},200,{"Cache-Control":"public, max-age=20, s-maxage=20"});
  } catch { return json({ok:false,error:"暂时无法连接资源搜索服务，请稍后重试"},502); }
}
function json(data,status=200,extra={}) { return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff",...extra}}); }