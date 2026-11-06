package ee.kuningriigid.webapp;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import androidx.webkit.WebViewAssetLoader;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public final class MainActivity extends Activity {
 private static final String HOST="appassets.androidplatform.net",FEED="https://github.com/orogdor/Kuningriigid/releases/download/webapp-content/manifest.json";
 private final Handler ui=new Handler(Looper.getMainLooper());private final ExecutorService io=Executors.newFixedThreadPool(2);
 private WebView web;private TextView notice;private ContentStore store;private String saveToken;private Runnable afterSave,healthPoll,healthTimeout;
 private boolean pending,alive=true,healthy,savePending;private ValueCallback<Uri[]> chooser;private byte[] exportData;
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);getWindow().getDecorView().setSystemUiVisibility(5894);
  FrameLayout layout=new FrameLayout(this);web=new WebView(this);layout.addView(web,new FrameLayout.LayoutParams(-1,-1));notice=new TextView(this);notice.setTextColor(0xfffae6b4);notice.setBackgroundColor(0xee152428);notice.setPadding(14,8,14,8);notice.setTextSize(12);notice.setVisibility(View.GONE);layout.addView(notice,new FrameLayout.LayoutParams(-2,-2,Gravity.TOP|Gravity.RIGHT));setContentView(layout);
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(false);
  web.addJavascriptInterface(new Bridge(),"KuningriigidNative");
  web.setWebChromeClient(new WebChromeClient(){@Override public boolean onConsoleMessage(ConsoleMessage m){if(m.messageLevel()==ConsoleMessage.MessageLevel.ERROR)android.util.Log.e("KuningriigidNative",m.message());return false;}@Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){if(chooser!=null)chooser.onReceiveValue(null);chooser=cb;try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE),10);}catch(Exception e){cb.onReceiveValue(null);chooser=null;}return true;}});
  notice.setOnClickListener(v->{if(pending)saveThen(this::launch);else notice.setVisibility(View.GONE);});
  io.execute(()->{try{store=new ContentStore(new File(getFilesDir(),"content"),p->getAssets().open("game/"+p));ui.post(()->{client();launch();});}catch(Exception e){message("Kohaliku mängupaki avamine ebaõnnestus: "+e.getMessage(),false);}});
 }
 private void client(){WebViewAssetLoader loader=new WebViewAssetLoader.Builder().setDomain(HOST).addPathHandler("/game/",p->{try{String[] parts=p.split("/",2);if(parts.length!=2)return missing();InputStream in=store.resolve(parts[0],parts[1]);if(in==null)return missing();WebResourceResponse r=new WebResourceResponse(mime(parts[1]),"UTF-8",in);r.setResponseHeaders(Collections.singletonMap("Cache-Control","no-cache"));return r;}catch(Exception e){return missing();}}).build();
  web.setWebViewClient(new WebViewClient(){@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){Uri u=req.getUrl();if("https".equals(u.getScheme())&&HOST.equals(u.getHost())){WebResourceResponse r=loader.shouldInterceptRequest(u);return r!=null?r:missing();}return missing();}
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){Uri u=req.getUrl();return !("https".equals(u.getScheme())&&HOST.equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/game/"));}
   @Override public void onPageFinished(WebView v,String url){if(!url.startsWith("https://"+HOST+"/game/"))return;web.evaluateJavascript("document.addEventListener('click',async e=>{const a=e.target.closest?.('a[download]');if(!a||!a.href.startsWith('blob:'))return;e.preventDefault();const b=await(await fetch(a.href)).blob();if(b.size>67108864)return;const r=new FileReader();r.onload=()=>KuningriigidNative.exportFile(a.download||'kuningriigid.json',String(r.result).split(',')[1]);r.readAsDataURL(b);},true);",null);}
  });
 }
 private static WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private static String mime(String p){String x=p.substring(p.lastIndexOf('.')+1).toLowerCase(Locale.ROOT);switch(x){case "js":case "mjs":return "text/javascript";case "html":return "text/html";case "css":return "text/css";case "json":return "application/json";case "glb":return "model/gltf-binary";case "gltf":return "model/gltf+json";case "png":return "image/png";case "webp":return "image/webp";case "jpg":case "jpeg":return "image/jpeg";case "svg":return "image/svg+xml";case "wasm":return "application/wasm";case "woff2":return "font/woff2";default:return "application/octet-stream";}}
 private void message(String text,boolean ready){ui.post(()->{if(!alive)return;pending=ready;notice.setText(text+(ready?"\nSalvesta ja käivita uuesti  ↻":""));notice.setVisibility(View.VISIBLE);});}
 private void launch(){if(store==null||!alive)return;pending=false;healthy=false;notice.setVisibility(View.GONE);if(healthPoll!=null)ui.removeCallbacks(healthPoll);if(healthTimeout!=null)ui.removeCallbacks(healthTimeout);
  try{JSONObject boot=store.beginLaunch();web.loadUrl("https://"+HOST+"/game/"+boot.getJSONObject("manifest").getString("version")+"/index.html");if(boot.getBoolean("rolledBack"))message("Eelmine toimiv versioon taastatud.",false);}catch(Exception e){message("Mängu käivitamine ebaõnnestus: "+e.getMessage(),false);return;}
  healthPoll=new Runnable(){public void run(){if(!alive||healthy)return;web.evaluateJavascript("!!window.gameDebug && document.getElementById('menu-status')?.hidden===true",v->{if("true".equals(v)){healthy=true;android.util.Log.i("KuningriigidNative","GAME_READY "+web.getUrl());ui.removeCallbacks(healthTimeout);io.execute(()->{try{store.healthy();}catch(Exception ignored){}});}else ui.postDelayed(this,1000);});}};ui.postDelayed(healthPoll,1000);
  healthTimeout=()->{ui.removeCallbacks(healthPoll);io.execute(()->{try{boolean reverted=store.rollback();ui.post(()->{if(reverted)launch();else message("Mängu laadimine võtab kaua aega. Proovi rakendus uuesti avada.",false);});}catch(Exception e){message("Mängu taastamine ebaõnnestus.",false);}});};ui.postDelayed(healthTimeout,120000);
  io.execute(()->{try{JSONObject m;try(InputStream in=open(FEED)){m=new JSONObject(new String(ContentStore.read(in,4194304),StandardCharsets.UTF_8));}final long[] last={0};JSONObject r=store.stage(m,(f,manifest)->{StringBuilder name=new StringBuilder();for(String part:f.getString("path").split("/")){if(name.length()>0)name.append('/');name.append(URLEncoder.encode(part,"UTF-8").replace("+","%20"));}return open("https://raw.githubusercontent.com/orogdor/Kuningriigid/"+manifest.getString("version")+"/"+name);},(bytes,count)->{if(bytes-last[0]>1048576){last[0]=bytes;message("Uuenduse laadimine: "+(bytes/1048576)+" MB",false);}});if("ready".equals(r.getString("status")))message(r.optString("version")+": uuendus valmis ("+String.format(Locale.ROOT,"%.1f",r.getLong("downloaded")/1048576.0)+" MB).",true);}catch(Exception ignored){/* The existing version works offline. */}});
 }
 private static InputStream open(String address)throws Exception{URL url=new URL(address);for(int redirects=0;redirects<6;redirects++){if(!url.getProtocol().equals("https")||!Arrays.asList("github.com","raw.githubusercontent.com","release-assets.githubusercontent.com","objects.githubusercontent.com").contains(url.getHost()))throw new IOException("Unexpected update host");HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(10000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);c.setRequestProperty("Cache-Control","no-cache");int code=c.getResponseCode();if(code>=300&&code<400){String location=c.getHeaderField("Location");c.disconnect();url=new URL(url,location);continue;}if(code!=200){c.disconnect();throw new IOException("HTTP "+code);}return new FilterInputStream(c.getInputStream()){@Override public void close()throws IOException{try{super.close();}finally{c.disconnect();}}};}throw new IOException("Too many redirects");}
 private void saveThen(Runnable done){if(savePending)return;savePending=true;afterSave=done;saveToken=UUID.randomUUID().toString();String token=saveToken;web.evaluateJavascript("(async()=>{try{const ok=!!window.gameDebug?.saveForNativeV1 && await window.gameDebug.saveForNativeV1();KuningriigidNative.saved("+JSONObject.quote(token)+",!!ok);}catch(e){KuningriigidNative.saved("+JSONObject.quote(token)+",false);}})()",null);ui.postDelayed(()->{if(token.equals(saveToken))saveResult(false);},15000);}
 private void saveResult(boolean ok){savePending=false;saveToken=null;Runnable done=afterSave;afterSave=null;if(ok){if(done!=null)done.run();}else message("Mänguseisu ei õnnestunud salvestada. Proovi mängus salvestada ja uuesti.",pending);}
 public final class Bridge {
  @JavascriptInterface public void requestExit(){ui.post(()->{if(alive)MainActivity.this.onBackPressed();});}
  @JavascriptInterface public void saved(String token,boolean ok){ui.post(()->{if(token!=null&&token.equals(saveToken))saveResult(ok);});}
  @JavascriptInterface public void exportFile(String name,String base64){if(base64==null||base64.length()>90000000)return;ui.post(()->{if(exportData!=null)return;try{exportData=android.util.Base64.decode(base64,android.util.Base64.DEFAULT);String clean=name.replaceAll("[^a-zA-Z0-9._-]","_");startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE,clean),11);}catch(Exception e){exportData=null;message("Faili eksport ei õnnestunud.",pending);}});}
 }
 @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(req==10&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);chooser=null;}if(req==11){byte[] bytes=exportData;exportData=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){Uri dest=data.getData();io.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(dest)){if(out==null)throw new IOException("No output");out.write(bytes);}catch(Exception e){message("Salvestuse eksport ebaõnnestus.",pending);}});}}}
 @Override public void onBackPressed(){new AlertDialog.Builder(this).setMessage("Kas salvestada ja mängust väljuda?").setPositiveButton("Salvesta ja välju",(d,w)->saveThen(this::finish)).setNegativeButton("Jätka",null).setNeutralButton("Välju salvestamata",(d,w)->finish()).show();}
 @Override protected void onPause(){if(web!=null)web.evaluateJavascript("window.gameDebug?.saveForNativeV1?.()",null);super.onPause();}
 @Override protected void onDestroy(){alive=false;ui.removeCallbacksAndMessages(null);io.shutdownNow();if(chooser!=null)chooser.onReceiveValue(null);if(web!=null){web.removeJavascriptInterface("KuningriigidNative");web.destroy();}super.onDestroy();}
}
