import {createStore} from './store.js';
import {createApp} from './app.js';
if(process.env.NODE_ENV==='production'&&!process.env.DATABASE_URL)throw Error('DATABASE_URL is required in production.');
if(process.env.NODE_ENV==='production'&&!process.env.WORKSPACE_PASSWORD)throw Error('WORKSPACE_PASSWORD is required in production.');
const store=await createStore();const server=createApp(store).listen(process.env.PORT||3001,'0.0.0.0',()=>console.log('CloudLaunch is running.'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(async()=>{await store.close();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()});
