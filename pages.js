// Fixed-size pages keep every choice reachable without scrolling a game surface.
export function pageOf(items, requested=0, size=4){
 const pages=Math.max(1,Math.ceil(items.length/size));
 const page=Math.max(0,Math.min(pages-1,Math.trunc(Number(requested)||0)));
 return {items:items.slice(page*size,(page+1)*size),page,pages,total:items.length,start:page*size};
}
export function pager(view,action,extra=''){
 return `<nav class="page-controls" aria-label="목록 페이지"><button data-act="${action}" data-page="${view.page-1}" ${extra} ${view.page===0?'disabled':''} aria-label="이전 페이지">←</button><span>${view.page+1} / ${view.pages}</span><button data-act="${action}" data-page="${view.page+1}" ${extra} ${view.page===view.pages-1?'disabled':''} aria-label="다음 페이지">→</button></nav>`;
}
