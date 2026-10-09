const {spawn}=require('child_process');
if(process.env.APP_ENV!=='homologacao' || process.env.NODE_ENV!=='production') throw new Error('This entrypoint is exclusively for homologacao');
// The runtime database provider validates the dedicated database/user and TLS.
const app=spawn(process.execPath,['dist/src/main.js'],{stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>app.kill(signal));
app.on('exit',code=>process.exit(code??1));
if(process.env.SEED_HOMOLOGACAO==='true') {
  (async()=>{
    for(let i=0;i<120;i++) {
      try {
        const r=await fetch(`http://127.0.0.1:${process.env.PORT||10000}/api-json`);
        if(r.ok) {
          const seed=spawn(process.execPath,['scripts/seed-homologacao.cjs'],{stdio:'inherit'});
          seed.on('exit',code=>{if(code!==0){console.error('Homologacao seed failed');app.kill('SIGTERM');process.exitCode=1;}});
          return;
        }
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    console.error('API did not become ready for homologacao seed');app.kill('SIGTERM');
  })();
}
