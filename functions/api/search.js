const ALLOWED_PANS = ["quark","baidu","aliyun","xunlei","uc","tianyi","115","123","mobile","other"];
const API = "https://pansousuo.com/api/search";

export async function onRequestGet(context) {
  const u = new URL(context.request.url);
  const q = (u.searchParams.get("q") || "").trim();
  const pan = (u.searchParams.get("pan") || "quark").trim();
  const page = Math.max(1, Math.min(100, Number.parseInt(u.searchParams.get("p") || "1", 10) || 1));
  const wide = u.searchParams.get("wide") === "1";
  if (!q) return json({ok:false,error:"请输入搜索关键词"},400);
  if (q.length > 60) return json({ok:false,error:"关键词最多 60 个字符"},400);
  if (!ALLOWED_PANS.includes(pan)) return json({ok:false,error:"不支持的网盘类型"},400);

  const common = {};
  for (const key of ["cat","sort","mode","year","since","size","quality","tag"]) {
    const value=(u.searchParams.get(key)||"").trim();
    if(value) common[key]=value;
  }
  // Ordinary mode requests one page. Wide mode searches up to three pages and a small,
  // conservative set of keyword variants, with a hard cap to avoid overloading the upstream API.
  const queries = wide ? makeVariants(q).slice(0,3) : [q];
  const pages = wide ? [page, page+1, page+2].filter(p=>p<=100) : [page];
  const jobs = [];
  for (const query of queries) for (const p of pages) jobs.push({query,p});
  try {
    const settled = await Promise.allSettled(jobs.map(job => upstreamSearch(job.query, pan, job.p, common)));
    const good = settled.filter(x=>x.status==="fulfilled").map(x=>x.value);
    if (!good.length) return json({ok:false,error:"上游搜索服务暂时不可用，请稍后重试"},502);
    const allItems = [];
    const seen = new Set();
    for (const result of good) {
      const items = Array.isArray(result.items) ? result.items : [];
      for (const item of items) {
        const key = normalizeUrl(item.share_url || item.url || item.link) || `${item.pan||pan}:${String(item.title||"").toLowerCase().trim()}`;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        allItems.push(item);
      }
    }
    const first = good[0];
    const partial = good.length < jobs.length;
    return json({
      ok:true, source:"pansousuo.com", items:allItems,
      total: Math.max(...good.map(x=>Number(x.total)||0), allItems.length),
      page, pageSize:allItems.length,
      totalPages: Number(first.totalPages)||1,
      expanded:wide, queriesUsed:queries.length, pagesQueried:pages.length,
      partial, sourceCallsSucceeded:good.length, sourceCallsAttempted:jobs.length
    },200,{"Cache-Control":wide?"public, max-age=10, s-maxage=10":"public, max-age=20, s-maxage=20"});
  } catch {
    return json({ok:false,error:"暂时无法连接资源搜索服务，请稍后重试"},502);
  }
}

async function upstreamSearch(q, pan, page, common) {
  const url=new URL(API);
  url.searchParams.set("q",q); url.searchParams.set("pan",pan); url.searchParams.set("p",String(page));
  for(const [k,v] of Object.entries(common)) url.searchParams.set(k,v);
  const response=await fetch(url.toString(),{headers:{"Accept":"application/json","User-Agent":"CloudResourceSearch/3.0"},signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw new Error("upstream");
  const data=await response.json();
  if(!data || typeof data!=="object") throw new Error("invalid");
  return data;
}
function makeVariants(q) {
  const original=q.trim();
  const variants=[original];
  // Remove common quality/version descriptors that can over-constrain title matching.
  const simplified=original.replace(/\b(4k|2160p|1080p|720p|HDR|蓝光|高清|国语|中字|全集|完整版)\b/ig," ").replace(/[【】［］\[\]（）()《》「」"'：:，,。.!！?？]/g," ").replace(/\s+/g," ").trim();
  if(simplified && simplified.toLowerCase()!==original.toLowerCase()) variants.push(simplified);
  // For long multi-term queries, try the first two meaningful chunks as a broad fallback.
  if(original.length>=7) {
    const chunks=original.split(/[\s,，、:：\-_/]+/).map(s=>s.trim()).filter(s=>s.length>=2);
    if(chunks.length>=2) {
      const broad=chunks.slice(0,2).join(" ");
      if(broad && !variants.some(v=>v.toLowerCase()===broad.toLowerCase())) variants.push(broad);
    }
  }
  return [...new Set(variants)];
}
function normalizeUrl(value) {
  if(!value)return "";
  try { const u=new URL(value); return (u.hostname+u.pathname).replace(/\/+$/,"").toLowerCase(); }
  catch { return String(value).trim().toLowerCase(); }
}
function json(data,status=200,extra={}) {
 return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff",...extra}});
}