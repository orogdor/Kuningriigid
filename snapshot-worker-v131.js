self.onmessage=({data})=>{try{self.postMessage({id:data.id,json:JSON.stringify(data.snapshot)})}catch(error){self.postMessage({id:data.id,error:error.message})}};
