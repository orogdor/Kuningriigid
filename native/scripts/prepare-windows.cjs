const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{await fs.cp(path.resolve(__dirname,'../shared'),path.resolve(__dirname,'../windows/shared'),{recursive:true});})();
