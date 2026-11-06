package ee.kuningriigid.webapp;

import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;

/** Platform-independent verified content store. Persistent saves never enter this directory. */
public final class ContentStore {
 public interface Bundle { InputStream open(String path) throws Exception; }
 public interface Download { InputStream open(JSONObject file, JSONObject manifest) throws Exception; }
 public interface Progress { void update(long bytes, int changed); }
 public static final int SHELL=1;
 private final File root; private final Bundle bundle; private final JSONObject base;
 private final Map<String,String> baseHashes=new HashMap<>();
 private final Map<String,JSONObject> manifests=new HashMap<>();
 private final Map<String,Map<String,JSONObject>> indexes=new HashMap<>();
 private boolean updating;
 public ContentStore(File root, Bundle bundle) throws Exception {
  this.root=root;this.bundle=bundle;
  try(InputStream in=bundle.open("_bundle-manifest.json")){base=validate(new JSONObject(new String(read(in,4194304),StandardCharsets.UTF_8)));}
  for(JSONObject f:files(base))baseHashes.put(f.getString("sha256"),f.getString("path"));
  new File(root,"objects").mkdirs();cache(base);
 }
 public static byte[] read(InputStream in,int limit)throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[32768];int n,total=0;while((n=in.read(b))!=-1){total+=n;if(total>limit)throw new IOException("Content too large");out.write(b,0,n);}return out.toByteArray();}
 public static boolean safe(String p){if(p==null||p.isEmpty()||p.length()>=500||p.startsWith("/")||p.matches(".*[\\\\:\\u0000%?#].*"))return false;for(String s:p.split("/",-1))if(s.isEmpty()||s.startsWith("."))return false;return true;}
 public static JSONObject validate(JSONObject m)throws Exception{
  if(m.getInt("schema")!=1||!m.getString("version").matches("[0-9a-f]{40}")||m.getLong("sequence")<0||m.getInt("minShell")<1||m.getInt("minShell")>SHELL)throw new IOException("Incompatible content");
  JSONArray fs=m.getJSONArray("files");if(fs.length()==0||fs.length()>20000)throw new IOException("Invalid file count");
  Set<String> paths=new HashSet<>();long total=0;
  for(int i=0;i<fs.length();i++){JSONObject f=fs.getJSONObject(i);String p=f.getString("path");long size=f.getLong("size");if(!safe(p)||!paths.add(p)||!f.getString("sha256").matches("[0-9a-f]{64}")||size<0||size>134217728)throw new IOException("Invalid file");total+=size;}
  if(!paths.contains("index.html")||total>2147483648L)throw new IOException("Incomplete game");return m;
 }
 private static List<JSONObject> files(JSONObject m)throws Exception{List<JSONObject> out=new ArrayList<>();JSONArray fs=m.getJSONArray("files");for(int i=0;i<fs.length();i++)out.add(fs.getJSONObject(i));return out;}
 private synchronized void cache(JSONObject m)throws Exception{String v=m.getString("version");manifests.put(v,m);Map<String,JSONObject> idx=new HashMap<>();for(JSONObject f:files(m))idx.put(f.getString("path"),f);indexes.put(v,idx);}
 private synchronized JSONObject manifest(String v)throws Exception{if(manifests.containsKey(v))return manifests.get(v);if(!v.matches("[0-9a-f]{40}"))throw new IOException("Invalid revision");JSONObject m=validate(new JSONObject(new String(Files.readAllBytes(new File(root,"manifests/"+v+".json").toPath()),StandardCharsets.UTF_8)));if(!m.getString("version").equals(v))throw new IOException("Revision mismatch");cache(m);return m;}
 private synchronized JSONObject state()throws Exception{try{return new JSONObject(new String(Files.readAllBytes(new File(root,"state.json").toPath()),StandardCharsets.UTF_8));}catch(Exception e){return new JSONObject().put("active",base.getString("version")).put("previous",JSONObject.NULL).put("pending",JSONObject.NULL).put("blocked",JSONObject.NULL).put("booting",false);}}
 private static void atomic(File dest,byte[] data)throws Exception{dest.getParentFile().mkdirs();File tmp=new File(dest.getParentFile(),dest.getName()+"."+UUID.randomUUID()+".tmp");try(FileOutputStream out=new FileOutputStream(tmp)){out.write(data);out.getFD().sync();}try{Files.move(tmp.toPath(),dest.toPath(),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}catch(AtomicMoveNotSupportedException e){Files.move(tmp.toPath(),dest.toPath(),StandardCopyOption.REPLACE_EXISTING);}finally{tmp.delete();}}
 private void writeState(JSONObject s)throws Exception{atomic(new File(root,"state.json"),s.toString().getBytes(StandardCharsets.UTF_8));}
 public synchronized JSONObject beginLaunch()throws Exception{JSONObject s=state();boolean reverted=false;if(s.optBoolean("booting")){s.put("blocked",s.getString("active"));s.put("active",s.optString("previous",base.getString("version")));s.put("pending",JSONObject.NULL).put("booting",false);reverted=true;}else if(!s.isNull("pending")){s.put("previous",s.getString("active")).put("active",s.getString("pending")).put("pending",JSONObject.NULL).put("booting",true);}
  JSONObject m;try{m=manifest(s.getString("active"));}catch(Exception e){s.put("active",base.getString("version")).put("booting",false);m=base;}writeState(s);return new JSONObject().put("manifest",m).put("rolledBack",reverted);
 }
 public synchronized void healthy()throws Exception{JSONObject s=state();s.put("booting",false);writeState(s);}
 public synchronized boolean rollback()throws Exception{JSONObject s=state();if(s.isNull("previous")||s.getString("active").equals(s.getString("previous")))return false;s.put("blocked",s.getString("active")).put("active",s.getString("previous")).put("pending",JSONObject.NULL).put("booting",false);writeState(s);return true;}
 private static String hash(InputStream in,long size)throws Exception{MessageDigest digest=MessageDigest.getInstance("SHA-256");byte[] b=new byte[32768];long total=0;int n;while((n=in.read(b))!=-1){total+=n;if(total>size)throw new IOException("Oversize file");digest.update(b,0,n);}if(total!=size)throw new IOException("Truncated file");StringBuilder s=new StringBuilder();for(byte x:digest.digest())s.append(String.format(Locale.ROOT,"%02x",x&255));return s.toString();}
 public JSONObject stage(JSONObject input,Download download,Progress progress)throws Exception{
  JSONObject m=validate(input);String v=m.getString("version");synchronized(this){if(updating)return new JSONObject().put("status","busy");JSONObject s=state(),active=manifest(s.getString("active"));if(v.equals(s.getString("active"))||v.equals(s.optString("pending")))return new JSONObject().put("status","current");if(m.getLong("sequence")<active.getLong("sequence")||v.equals(s.optString("blocked")))return new JSONObject().put("status","ignored");updating=true;}
  long downloaded=0;int changed=0;
  try{for(JSONObject f:files(m)){String h=f.getString("sha256");long size=f.getLong("size");if(baseHashes.containsKey(h))continue;File dest=new File(root,"objects/"+h);boolean valid=false;if(dest.isFile())try(InputStream in=new FileInputStream(dest)){valid=hash(in,size).equals(h);}catch(Exception ignored){}if(valid)continue;
   File tmp=new File(root,"objects/"+h+".tmp");try{MessageDigest md=MessageDigest.getInstance("SHA-256");long total=0;try(InputStream in=download.open(f,m);FileOutputStream out=new FileOutputStream(tmp)){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1){total+=n;if(total>size)throw new IOException("Oversize download");md.update(b,0,n);out.write(b,0,n);}out.getFD().sync();}
    StringBuilder actual=new StringBuilder();for(byte x:md.digest())actual.append(String.format(Locale.ROOT,"%02x",x&255));if(total!=size||!actual.toString().equals(h))throw new IOException("Content verification failed: "+f.getString("path"));Files.move(tmp.toPath(),dest.toPath(),StandardCopyOption.REPLACE_EXISTING);downloaded+=total;changed++;progress.update(downloaded,changed);
   }finally{tmp.delete();}}
   synchronized(this){atomic(new File(root,"manifests/"+v+".json"),m.toString().getBytes(StandardCharsets.UTF_8));cache(m);JSONObject s=state();s.put("pending",v);writeState(s);collect();}
   return new JSONObject().put("status","ready").put("downloaded",downloaded).put("changed",changed).put("version",m.optString("label",v.substring(0,8)));
  }finally{synchronized(this){updating=false;}}
 }
 private void collect()throws Exception{JSONObject s=state();Set<String> keep=new HashSet<>();for(String key:new String[]{"active","previous","pending"})if(!s.isNull(key))for(JSONObject f:files(manifest(s.getString(key))))keep.add(f.getString("sha256"));File[] objects=new File(root,"objects").listFiles();if(objects!=null)for(File f:objects)if(f.getName().matches("[0-9a-f]{64}")&&!keep.contains(f.getName()))f.delete();}
 public synchronized InputStream resolve(String revision,String resource)throws Exception{if(!safe(resource))return null;JSONObject s=state();if(!revision.equals(base.getString("version"))&&!revision.equals(s.optString("active"))&&!revision.equals(s.optString("previous")))return null;manifest(revision);JSONObject f=indexes.get(revision).get(resource);if(f==null)return null;String h=f.getString("sha256"),p=baseHashes.get(h);return p!=null?bundle.open(p):new FileInputStream(new File(root,"objects/"+h));}
}
