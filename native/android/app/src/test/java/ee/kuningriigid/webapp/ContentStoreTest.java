package ee.kuningriigid.webapp;
import org.junit.*;import org.json.*;import java.io.*;import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.security.MessageDigest;import java.util.*;
import static org.junit.Assert.*;
public class ContentStoreTest {
 private File root,bundle;private JSONObject base;private ContentStore store;
 private static byte[] b(String s){return s.getBytes(StandardCharsets.UTF_8);}
 private static String hash(String s)throws Exception{StringBuilder out=new StringBuilder();for(byte x:MessageDigest.getInstance("SHA-256").digest(b(s)))out.append(String.format("%02x",x&255));return out.toString();}
 private static JSONObject manifest(int v,Map<String,String> files)throws Exception{JSONArray a=new JSONArray();for(Map.Entry<String,String> e:files.entrySet())a.put(new JSONObject().put("path",e.getKey()).put("size",b(e.getValue()).length).put("sha256",hash(e.getValue())));return new JSONObject().put("schema",1).put("minShell",1).put("sequence",v).put("version",String.format("%040d",v)).put("label","V"+v).put("files",a);}
 @Before public void setup()throws Exception{root=Files.createTempDirectory("kg-native").toFile();bundle=new File(root,"bundle");bundle.mkdirs();Map<String,String> files=Map.of("index.html","ONE","same.glb","MODEL","deleted.js","OLD");base=manifest(1,files);for(Map.Entry<String,String> e:files.entrySet())Files.write(new File(bundle,e.getKey()).toPath(),b(e.getValue()));Files.write(new File(bundle,"_bundle-manifest.json").toPath(),b(base.toString()));store=fresh();store.beginLaunch();}
 private ContentStore fresh()throws Exception{return new ContentStore(new File(root,"content"),p->new FileInputStream(new File(bundle,p)));}
 @Test public void deltaAndAtomicActivation()throws Exception{JSONObject m=manifest(2,Map.of("index.html","TWO","same.glb","MODEL","renamed.glb","MODEL","new.js","NEW"));List<String> calls=new ArrayList<>();JSONObject r=store.stage(m,(f,x)->{calls.add(f.getString("path"));return new ByteArrayInputStream(b(f.getString("path").equals("index.html")?"TWO":"NEW"));},(n,c)->{});assertEquals(2,r.getInt("changed"));assertEquals(2,calls.size());assertNotNull(store.resolve(base.getString("version"),"deleted.js"));JSONObject boot=store.beginLaunch();String v=boot.getJSONObject("manifest").getString("version");assertEquals(m.getString("version"),v);assertNull(store.resolve(v,"deleted.js"));try(InputStream in=store.resolve(v,"index.html")){assertArrayEquals(b("TWO"),ContentStore.read(in,10));}store.healthy();assertEquals(v,fresh().beginLaunch().getJSONObject("manifest").getString("version"));}
 @Test public void corruptNeverActivatesAndFailedBootRollsBack()throws Exception{JSONObject m=manifest(2,Map.of("index.html","TWO"));try{store.stage(m,(f,x)->new ByteArrayInputStream(b("BAD")),(n,c)->{});fail();}catch(IOException expected){}assertEquals(base.getString("version"),store.beginLaunch().getJSONObject("manifest").getString("version"));store.stage(m,(f,x)->new ByteArrayInputStream(b("TWO")),(n,c)->{});assertEquals(m.getString("version"),store.beginLaunch().getJSONObject("manifest").getString("version"));assertTrue(fresh().beginLaunch().getBoolean("rolledBack"));assertFalse(ContentStore.safe("../secret"));assertFalse(ContentStore.safe("%2e%2e/secret"));}
 @Test public void cachedStatePersistsPendingAndReopenStillReadsDisk()throws Exception{
  JSONObject next=manifest(2,Map.of("index.html","TWO","same.glb","MODEL"));
  store.stage(next,(f,m)->new ByteArrayInputStream(b("TWO")),(n,c)->{});
  File stateFile=new File(root,"content/state.json");
  assertTrue(stateFile.delete());
  // A disk reread here would forget pending revision 2 and boot revision 1.
  for(int i=0;i<50;i++)try(InputStream in=store.resolve(base.getString("version"),"index.html")){assertArrayEquals(b("ONE"),ContentStore.read(in,10));}
  assertEquals(next.getString("version"),store.beginLaunch().getJSONObject("manifest").getString("version"));
  assertTrue(stateFile.isFile());
  store.healthy();
  assertEquals(next.getString("version"),fresh().beginLaunch().getJSONObject("manifest").getString("version"));
 }
 @Test public void interruptedDownloadResumesVerifiedObjects()throws Exception{Map<String,String> f=new LinkedHashMap<>();f.put("index.html","TWO");f.put("a.js","A");JSONObject m=manifest(2,f);try{store.stage(m,(file,x)->{if(file.getString("path").equals("a.js"))throw new IOException("offline");return new ByteArrayInputStream(b("TWO"));},(n,c)->{});fail();}catch(IOException expected){}assertEquals(base.getString("version"),store.beginLaunch().getJSONObject("manifest").getString("version"));List<String> calls=new ArrayList<>();store.stage(m,(file,x)->{calls.add(file.getString("path"));return new ByteArrayInputStream(b("A"));},(n,c)->{});assertEquals(Collections.singletonList("a.js"),calls);}

}
