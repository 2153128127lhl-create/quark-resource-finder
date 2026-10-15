export async function onRequestPost(context) {
 let body; try { body=await context.request.json(); } catch { return json({ok:false,error:"请求格式错误"},400); }
 const type=String(body.type||"other");
 if(!["dead_link","wrong_info","other"].includes(type)) return json({ok:false,error:"不支持的反馈类型"},400);
 const payload={type,content:String(body.content||"用户反馈").slice(0,500)};
 const id=Number(body.resource_id); if(Number.isInteger(id)&&id>0)payload.resource_id=id;
 try { const r=await fetch("https://pansousuo.com/api/feedback",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(6000)}); const d=await r.json().catch(()=>({})); return json({ok:r.ok,...d},r.ok?200:502); }
 catch { return json({ok:false,error:"暂时无法提交反馈"},502); }
}
function json(d,status=200){return new Response(JSON.stringify(d),{status,headers:{"Content-Type":"application/json; charset=utf-8"}})}