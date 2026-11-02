// Irregular generated atlases can have overlapping bounding rectangles.
// Retain the main connected silhouette so a neighbour's blade never leaks in.
export function keepSilhouette(data,width,height){
 const visited=new Uint8Array(width*height),queue=new Int32Array(width*height);
 let largest=[];
 for(let start=0;start<visited.length;start++){
  if(visited[start]||data[start*4+3]<32)continue;
  let head=0,tail=1;queue[0]=start;visited[start]=1;
  while(head<tail){const p=queue[head++],x=p%width;
   for(const n of [x?p-1:-1,x<width-1?p+1:-1,p-width,p+width]){
    if(n<0||n>=visited.length||visited[n]||data[n*4+3]<32)continue;
    visited[n]=1;queue[tail++]=n;
   }
  }
  if(tail>largest.length)largest=queue.slice(0,tail);
 }
 visited.fill(0);for(const p of largest)visited[p]=1;
 for(let p=0;p<visited.length;p++)if(!visited[p])data[p*4+3]=0;
 return data;
}

export function prepareFrames(image,rows){
 return rows.map(row=>row.map(b=>{
  const canvas=document.createElement('canvas');canvas.width=b.w;canvas.height=b.h;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  c.drawImage(image,b.x,b.y,b.w,b.h,0,0,b.w,b.h);
  const pixels=c.getImageData(0,0,b.w,b.h);
  keepSilhouette(pixels.data,b.w,b.h);c.putImageData(pixels,0,0);
  return canvas;
 }));
}
