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
export function projectMap(id,w,h){return {x:w*.13+(id%4)*w*.246,y:h*.14+Math.floor(id/4)*h*.225};}
