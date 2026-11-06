export const DIRECTIONS=['E','SE','S','SW','W','NW','N','NE'];

// Map room-grid travel onto the two axes of the illustrated isometric floor.
export function travelVector(from,to){
 const dx=to%4-from%4,dy=Math.floor(to/4)-Math.floor(from/4);
 const x=dx+dy,y=(dy-dx)*.52,length=Math.hypot(x,y)||1;
 return {x:x/length,y:y/length,direction:directionIndex(x,y)};
}
export function directionIndex(x,y){return (Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8;}
export function walkFrame(elapsed,mode='walk'){
 const interval=mode==='sneak'?150:mode==='rush'?75:110;
 return Math.floor(Math.max(0,elapsed)/interval)%4;
}
export function motionFrame(elapsed,durations){
 if(elapsed<0)return-1;
 let end=0;
 for(let i=0;i<durations.length;i++){end+=durations[i];if(elapsed<end)return i;}
 return-1;
}
// Keep the classic four-column map framing while fitting every depth into its canvas.
// Callers without options retain the original 16-room layout.
export function mapLayout(w,h,{roomCount=16,columns=4,paddingX=.13,paddingTop=.14,paddingBottom=.185}={}){
 const count=Math.max(1,Math.floor(roomCount)),cols=Math.max(1,Math.floor(columns)),rows=Math.ceil(count/cols);
 return {roomCount:count,columns:cols,rows,x:w*paddingX,y:h*paddingTop,
  columnGap:cols>1?w*(1-paddingX*2)/ (cols-1):0,
  rowGap:rows>1?h*(1-paddingTop-paddingBottom)/(rows-1):0};
}
export function projectMap(id,w,h,options){
 const grid=mapLayout(w,h,options);
 return {x:grid.x+(id%grid.columns)*grid.columnGap,y:grid.y+Math.floor(id/grid.columns)*grid.rowGap};
}
// Lift passages bend around the intervening floor so they never look connected to its room.
export function mapPassage(from,to,w,h,options){
 const grid=mapLayout(w,h,options),start=projectMap(from,w,h,options),end=projectMap(to,w,h,options);
 const lift=Math.abs(to-from)>grid.columns&&from%grid.columns===to%grid.columns;
 return {start,end,lift,control:lift?{x:start.x+grid.columnGap*.7,y:(start.y+end.y)/2}:null};
}
export function passagePoint(path,t){
 const {start:a,end:b,control:c}=path,u=1-t;
 return c?{x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y}:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
export function hitMapRoom(x,y,w,h,options){
 if(w<=0||h<=0||x<0||y<0||x>w||y>h)return -1;
 const grid=mapLayout(w,h,options),halfWidth=(grid.columnGap||w)*.4,halfHeight=(grid.rowGap||h)*.44;
 let hit=-1,best=Infinity;
 for(let id=0;id<grid.roomCount;id++){
  const p=projectMap(id,w,h,options),dx=Math.abs(x-p.x),dy=Math.abs(y-p.y);
  if(dx<=halfWidth&&dy<=halfHeight){const distance=(dx/halfWidth)**2+(dy/halfHeight)**2;if(distance<best){best=distance;hit=id;}}
 }
 return hit;
}

// Shared normalized anchors for the visible room buttons and floor hit areas.
export function exitAnchor(from,to){
 if(Math.abs(to-from)===8&&from%4===to%4)return {x:.49,y:.65,arrow:'⇵'};
 return ({1:{x:.43,y:.30,arrow:'↗'},4:{x:.81,y:.66,arrow:'↘'},[-1]:{x:.18,y:.66,arrow:'↙'},[-4]:{x:.18,y:.45,arrow:'↖'}})[to-from]??null;
}
export function hitExit(from,ids,x,y){
 return ids.find(id=>{const p=exitAnchor(from,id);return p&&((x-p.x)/.12)**2+((y-p.y)/.09)**2<=1;})??-1;
}
