const MAX_BODY_BYTES = 900_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"}
  });
}
function clean(v,max=2000){return String(v??"").trim().slice(0,max)}
function answerLabel(q){
  if(!q||q.selectedIndex===undefined||q.selectedIndex===null)return "No answer";
  return ["A","B","C","D"][q.selectedIndex]??"?"+". "+clean(q.selectedAnswer,1000);
}
function summaryEmbed(app){
  const pass=Number(app.score?.percentage||0)>=80;
  return {title:"🌊 NEW COASTAL HORIZON NETWORK MEMBERSHIP APPLICATION",color:pass?0x08d9d6:0xff4d67,fields:[
    {name:"Applicant",value:clean(app.applicant?.displayName,256)||"Not provided",inline:true},
    {name:"Discord",value:clean(app.applicant?.discord,256)||"Not provided",inline:true},
    {name:"Platform",value:clean(app.applicant?.platform,256)||"Not provided",inline:true},
    {name:"Gamer Tag",value:clean(app.applicant?.gamertag,256)||"Not provided",inline:true},
    {name:"Exam Score",value:`**${Number(app.score?.percentage||0)}%** (${Number(app.score?.correct||0)}/${Number(app.score?.total||0)})`,inline:true},
    {name:"Status",value:pass?"✅ **PASSING**":"❌ **NOT PASSING**",inline:true},
    {name:"Why they want to join",value:clean(app.applicant?.why,1000)||"Not provided",inline:false}
  ],timestamp:new Date().toISOString(),footer:{text:"Coastal Horizon Network • Membership Applications"}};
}
function categoryEmbed(c){
  const fields=(c.questions||[]).map((q,i)=>({name:`${i+1}. ${clean(q.question,240)}`,value:`${q.selectedIndex===q.correctIndex?"✅":"❌"} ${answerLabel(q)}`,inline:false}));
  return {title:`📘 ${clean(c.name,240)}`,description:clean(c.description,900),color:0x08d9d6,fields,footer:{text:`CHN Membership Exam • ${fields.length} questions`}};
}
async function sendWebhook(url,payload){
  const r=await fetch(url+"?wait=true",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error("Discord returned "+r.status);
}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"content-type"}});
  if(request.method==="POST"&&url.pathname==="/api/submit-application"){
    if(!env.DISCORD_WEBHOOK_URL)return json({error:"Discord webhook secret is not configured."},500);
    const length=Number(request.headers.get("content-length")||0);
    if(length>MAX_BODY_BYTES)return json({error:"Application payload is too large."},413);
    let app; try{app=await request.json()}catch{return json({error:"Invalid application payload."},400)}
    const categories=Array.isArray(app.categories)?app.categories:[];
    if(!app.applicant||categories.length!==8)return json({error:"Incomplete application."},400);
    let correct=0,count=0;
    for(const c of categories)for(const q of (c.questions||[])){count++;if(Number(q.selectedIndex)===Number(q.correctIndex))correct++}
    if(count!==69)return json({error:"Application question count is invalid."},400);
    app.score={correct,total:69,percentage:Math.round(correct/69*100)};
    try{
      await sendWebhook(env.DISCORD_WEBHOOK_URL,{username:"CHN Membership Applications",allowed_mentions:{parse:[]},embeds:[summaryEmbed(app)]});
      for(const c of categories)await sendWebhook(env.DISCORD_WEBHOOK_URL,{username:"CHN Membership Applications",allowed_mentions:{parse:[]},embeds:[categoryEmbed(c)]});
    }catch(e){console.error(e);return json({error:"The application could not be delivered to Discord."},502)}
    return json({ok:true,score:app.score.percentage});
  }
  return env.ASSETS.fetch(request);
}};