'use strict';
const $=id=>document.getElementById(id),docs=window.DOCS;
const state={category:'全部资料',query:'',month:'',sort:'asc',active:null,font:18,match:0,view:'directory',searchView:'passages',expanded:{},readerMode:'study',catalogScroll:0};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=Object.fromEntries('問问 覺觉 類类 錯错 誤误 識识 義义 維维 規规 則则 學学 習习 體体 鎖锁 間间 書书 認认 應应 與与 敗败 總总 無无 為为 創创 長长 課课 見见 觀观 眾众 點点 評评 實实 進进 開开 關关 時时 對对 發发 現现 從从 這这 個个 說说 話话 經经 驗验 裡里 讓让 產产 業业 優优 勢势 機机 會会 獲获 後后 聖圣 靈灵 緣缘 財财 論论 討讨 級级 過过 還还 們们 動动 轉转 變变 幾几 麼么 價价 選选 擇择 處处 種种 數数 據据 達达 標标 頭头 腦脑 結结 構构 資资 網网 頁页 詢询 鍵键 詞词 夢梦 願愿 豐丰 滿满'.split(' ').map(p=>[p[0],p[1]]));
const norm=s=>[...s.normalize('NFKC').toLowerCase()].map(c=>fold[c]||c).join('');
const terms=q=>q.trim().split(/\s+/).filter(Boolean);
const searchIndex=new Map(docs.map(d=>[d.id,norm(d.title+' '+d.keywords.join(' ')+' '+d.text)]));
const segmentIndex=new Map(docs.map(d=>[d.id,d.segments.map(s=>norm(d.text.slice(s.start,s.end)))]));
const categories=['全部资料',...new Set(docs.map(d=>d.category))];
const link=(d,mode='study',seg='',query='')=>'#'+d.id+'/'+mode+(seg?'/'+seg:'')+(query?'?q='+encodeURIComponent(query):'');
const sourceLabel=(d,s)=>s.time?'原文 '+s.time:(d.segments.some(x=>x.time)?'原文记录信息':'原文第 '+(d.segments.indexOf(s)+1)+' 段');
function highlightTerms(s,q){const ts=terms(q);if(!ts.length)return escape(s);const n=norm(s),ranges=[];for(const t of ts){let offset=0,i;while((i=n.indexOf(norm(t),offset))>=0){ranges.push([i,i+t.length]);offset=i+t.length;}}ranges.sort((a,b)=>a[0]-b[0]);const merged=[];for(const r of ranges){const last=merged[merged.length-1];if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r);}let out='',at=0;for(const [a,b] of merged){out+=escape(s.slice(at,a))+'<mark>'+escape(s.slice(a,b))+'</mark>';at=b;}return out+escape(s.slice(at));}
function sorted(list){return list.slice().sort((a,b)=>state.sort==='asc'?(a.date||'9999').localeCompare(b.date||'9999'):(b.date||'0000').localeCompare(a.date||'0000'));}
function filtered(){return sorted(docs.filter(d=>(state.category==='全部资料'||d.category===state.category)&&(!state.month||(state.month==='undated'?!d.date:d.date.startsWith(state.month)))&&(!state.query||terms(state.query).every(t=>searchIndex.get(d.id).includes(norm(t))))));}
function hitSegments(d){const ts=terms(state.query).map(norm);if(!ts.length)return [];return d.segments.filter((s,i)=>ts.every(t=>segmentIndex.get(d.id)[i].includes(t)));}
function snippet(d,s){const t=d.text.slice(s.start,s.end),n=norm(t);let hit=-1;for(const term of terms(state.query)){const i=n.indexOf(norm(term));if(i>=0&&(hit<0||i<hit))hit=i;}const start=Math.max(0,hit-65),end=Math.min(t.length,start+240);return (start?'…':'')+t.slice(start,end).replace(/\s*\n\s*/g,' ')+(end<t.length?'…':'');}
function resultSnippet(d,s){return '<div class="passage"><a class="time-link" href="'+link(d,'raw',s.id,state.query)+'">'+sourceLabel(d,s)+' ↗</a><p>'+highlightTerms(snippet(d,s),state.query)+'</p><a class="text-link" href="'+link(d,'raw',s.id,state.query)+'">定位这段原文 →</a></div>';}
function documentLinks(d){return '<div class="document-actions"><a href="'+link(d)+'">看重点</a><a href="'+link(d,'raw')+'">读原文</a></div>';}
function renderDirectory(list){$('directory').innerHTML='<div class="directory-caption"><span>共20份资料 · 点标题进入</span><span>看重点 / 读原文</span></div>'+list.map((d,i)=>'<div class="directory-row"><span class="row-number">'+String(i+1).padStart(2,'0')+'</span><div class="row-main"><span class="row-date">'+(d.date||'文件名未标日期')+'</span><a class="row-title" href="'+link(d)+'">'+escape(d.title)+'</a><span class="row-category">'+escape(d.category)+'</span></div>'+documentLinks(d)+'</div>').join('');}
function renderCards(list){$('cards').innerHTML=list.map(d=>'<section class="card"><div class="meta"><span class="tag">'+escape(d.category)+'</span><span>'+(d.date||'文件名未标日期')+'</span></div><h3><a href="'+link(d)+'">'+escape(d.title)+'</a></h3><p>'+escape(d.guide.overview)+'</p><div class="bottom"><span>3 条重点 · 可核对原文</span>'+documentLinks(d)+'</div></section>').join('');}
function renderSearch(list){let total=0;$('searchResults').innerHTML=list.map(d=>{const hits=hitSegments(d);total+=hits.length;const visible=state.searchView==='files'?1:(state.expanded[d.id]||3);const content=hits.length?hits.slice(0,visible).map(s=>resultSnippet(d,s)).join(''):'<p class="cross-match">关键词出现在文件标题、关键词或不同段落中。打开整篇原文，可逐个查找。</p>';return '<section class="result-group"><div class="result-head"><div><span class="row-date">'+(d.date?'课程日期：'+d.date:'文件名未标课程日期')+'</span><h3><a href="'+link(d,'raw','',state.query)+'">'+highlightTerms(d.title,state.query)+'</a></h3><span class="row-category">'+escape(d.category)+' · '+(hits.length?hits.length+' 个匹配段落':'文件匹配')+'</span></div>'+documentLinks(d)+'</div>'+content+(hits.length>visible?'<button class="more-passages" data-more="'+d.id+'">再看 '+Math.min(5,hits.length-visible)+' 段（还有 '+(hits.length-visible)+' 段）</button>':'')+'</section>';}).join('');$('searchStatus').textContent='搜索“'+state.query+'”：'+list.length+' 份文件，'+total+' 个同段匹配。'+(state.searchView==='files'?'按文件显示，点标题看完整原文。':'点击时间或“定位这段原文”直接跳转。');}
function render(){const list=filtered(),searching=!!state.query;$('sectionTitle').textContent=searching?'搜索结果':state.category;$('resultCount').textContent='共 '+list.length+' 份';document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===state.category));$('catalogControls').hidden=searching;$('searchControls').hidden=!searching;$('directory').hidden=searching||state.view!=='directory';$('cards').hidden=searching||state.view!=='cards';$('searchResults').hidden=!searching;for(const [id,active] of [['directoryView',state.view==='directory'],['cardView',state.view==='cards'],['passageView',state.searchView==='passages'],['fileView',state.searchView==='files']])$(id).setAttribute('aria-pressed',String(active));$('empty').hidden=list.length!==0;if(searching)renderSearch(list);else{$('searchStatus').textContent='';renderDirectory(list);renderCards(list);}}
function closeMenu(){$('sidebar').classList.remove('open');$('menu').setAttribute('aria-expanded','false');}
function renderToc(){$('tocList').innerHTML=sorted(docs).map((d,i)=>'<div class="toc-row"><span>'+String(i+1).padStart(2,'0')+'</span><div><small>'+(d.date||'文件名未标日期')+' · '+escape(d.category)+'</small><a href="'+link(d)+'">'+escape(d.title)+'</a><a class="toc-raw" href="'+link(d,'raw')+'">读原文</a></div></div>').join('');}
function openToc(){renderToc();$('tocPanel').hidden=false;$('tocToggle').setAttribute('aria-expanded','true');document.body.classList.add('toc-open');}
function closeToc(){$('tocPanel').hidden=true;$('tocToggle').setAttribute('aria-expanded','false');document.body.classList.remove('toc-open');}
function showCatalog(){state.active=null;$('reader').hidden=true;$('catalog').hidden=false;closeMenu();render();requestAnimationFrame(()=>window.scrollTo(0,state.catalogScroll));}
function renderGuide(d){const source=p=>{if(!p.segment)return '';const s=d.segments.find(s=>s.id===p.segment);return s?'<a class="text-link" href="'+link(d,'raw',p.segment)+'">核对出处 · '+sourceLabel(d,s)+' →</a>':'';};$('guide').innerHTML='<div class="guide-overview"><h2>这一课的主线</h2><p>'+escape(d.guide.overview)+'</p></div><div class="core-question"><span>核心问题</span><p>'+escape(d.guide.coreQuestion)+'</p></div><h2 class="guide-section-heading">六个重点 · 前三条可直接核对出处</h2>'+d.guide.points.map((p,i)=>'<section class="guide-point"><span class="point-number">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+escape(p.title)+'</h3><p>'+escape(p.body)+'</p>'+source(p)+'</div></section>').join('')+'<section class="study-block"><h2>本课逻辑链</h2><ol class="logic-chain">'+d.guide.logic.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ol></section><section class="study-block caution"><h2>易混淆处</h2><ul>'+d.guide.misunderstandings.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul></section><section class="practice-box"><span>行动练习</span><p>'+escape(d.guide.practice)+'</p></section><section class="study-block"><h2>复习题</h2><ol>'+d.guide.reviewQuestions.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ol></section><div class="review-box"><span>快速复习提示</span><p>'+escape(d.guide.review)+'</p></div><a class="read-all" href="'+link(d,'raw')+'">读完整原文 →</a>';}
function articleSearch(){if(!state.active)return;const d=state.active,q=$('inSearch').value.trim();$('article').innerHTML=d.segments.map(s=>'<section class="raw-segment" id="raw-'+s.id+'"><a class="segment-position" href="'+link(d,'raw',s.id,q)+'">'+sourceLabel(d,s)+'</a><p>'+highlightTerms(d.text.slice(s.start,s.end),q)+'</p></section>').join('');state.match=0;updateMatches(false);}
function updateMatches(scroll=true){const marks=[...$('article').querySelectorAll('mark')];marks.forEach(m=>m.classList.remove('current'));$('matches').textContent=marks.length?(state.match+1)+' / '+marks.length:($('inSearch').value?'无匹配':'');$('prevMatch').disabled=$('nextMatch').disabled=!marks.length;if(marks.length){marks[state.match].classList.add('current');if(scroll)marks[state.match].scrollIntoView({behavior:'smooth',block:'center'});}}
function selectReaderMode(mode){state.readerMode=mode;$('study').hidden=mode!=='study';$('raw').hidden=mode!=='raw';$('studyTab').setAttribute('aria-pressed',String(mode==='study'));$('rawTab').setAttribute('aria-pressed',String(mode==='raw'));}
function openDoc(id,mode='study',target='',q=state.query){const d=docs.find(x=>x.id===id);if(!d){showCatalog();return;}const changed=state.active!==d;if(!state.active)state.catalogScroll=window.scrollY||0;state.active=d;$('catalog').hidden=true;$('reader').hidden=false;$('readerTitle').textContent=d.title;$('readerCategory').textContent=d.category;$('readerMeta').textContent=(d.date?'文件名课程日期：'+d.date:'原文件名未标课程日期')+(d.recordDate?' · 原文记录日期：'+d.recordDate:'')+' · '+d.text.length.toLocaleString()+' 字符';$('readerSources').textContent=d.sources.join('；');renderGuide(d);if(changed||$('inSearch').value!==q){$('inSearch').value=q;articleSearch();}$('article').style.setProperty('--size',state.font+'px');selectReaderMode(mode);const i=docs.indexOf(d);$('prevDoc').disabled=i===0;$('nextDoc').disabled=i===docs.length-1;const related=docs.filter(x=>x.id!==d.id&&x.category===d.category);$('related').innerHTML=related.length?'<div class="related-label">同主题继续读</div>'+related.map(x=>'<a href="'+link(x)+'">'+escape(x.title)+' →</a>').join(''):'';closeMenu();if(target){requestAnimationFrame(()=>{const el=$('raw-'+target);if(el){document.querySelectorAll('.target-segment').forEach(s=>s.classList.remove('target-segment'));el.scrollIntoView({block:'start'});el.classList.add('target-segment');}});}else{window.scrollTo(0,0);if(mode==='raw'&&q)requestAnimationFrame(()=>updateMatches());}}
function route(){closeToc();const hash=location.hash.slice(1),[path,params='']=hash.split('?');if(!path){showCatalog();return;}const [id,mode='study',target='']=path.split('/');const q=new URLSearchParams(params).get('q');openDoc(id,mode==='raw'?'raw':'study',target,q===null?state.query:q);}
function navigate(hash){if(location.hash===hash)route();else location.hash=hash;}
function runSearch(){state.query=$('search').value.trim();state.expanded={};if(state.query){state.category='全部资料';state.month='';$('month').value='';}render();}
let searchTimer,composing=false;
function queueSearch(){clearTimeout(searchTimer);if(!composing)searchTimer=setTimeout(runSearch,160);}
function clearSearch(){clearTimeout(searchTimer);$('search').value='';state.query='';state.category='全部资料';state.month='';state.expanded={};$('month').value='';render();}
$('count').textContent=docs.length;
$('categories').innerHTML=categories.map(c=>'<button data-category="'+escape(c)+'">'+escape(c)+'<span>'+docs.filter(d=>c==='全部资料'||d.category===c).length+'</span></button>').join('');
const months=[...new Set(docs.filter(d=>d.date).map(d=>d.date.slice(0,7)))].sort();
$('month').innerHTML+='<option value="undated">未标日期</option>'+months.map(m=>'<option value="'+m+'">'+m.replace('-','年')+'月</option>').join('');
window.addEventListener('hashchange',route);
$('categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;clearTimeout(searchTimer);state.catalogScroll=0;state.category=b.dataset.category;state.query='';$('search').value='';navigate('');showCatalog();});
$('search').addEventListener('input',queueSearch);
$('search').addEventListener('compositionstart',()=>{composing=true;clearTimeout(searchTimer);});
$('search').addEventListener('compositionend',()=>{composing=false;queueSearch();});
$('search').addEventListener('search',runSearch);
$('search').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();clearTimeout(searchTimer);runSearch();}});
$('searchButton').onclick=()=>{clearTimeout(searchTimer);runSearch();};
$('clearSearch').onclick=clearSearch;
$('month').addEventListener('change',e=>{state.month=e.target.value;render();});
$('sort').addEventListener('change',e=>{state.sort=e.target.value;render();});
$('directoryView').onclick=()=>{state.view='directory';render();};
$('cardView').onclick=()=>{state.view='cards';render();};
$('passageView').onclick=()=>{state.searchView='passages';render();};
$('fileView').onclick=()=>{state.searchView='files';render();};
$('searchResults').addEventListener('click',e=>{const b=e.target.closest('[data-more]');if(!b)return;state.expanded[b.dataset.more]=(state.searchView==='files'?1:(state.expanded[b.dataset.more]||3))+5;state.searchView='passages';render();});
$('back').onclick=()=>navigate('');
$('home').onclick=()=>{state.catalogScroll=0;clearSearch();state.view='directory';navigate('');showCatalog();window.scrollTo(0,0);};
$('tocToggle').onclick=openToc;
$('tocClose').onclick=closeToc;
$('tocBackdrop').onclick=closeToc;
$('tocList').addEventListener('click',e=>{if(e.target.closest('a'))closeToc();});
$('menu').onclick=()=>{const open=$('sidebar').classList.toggle('open');$('menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();closeToc();}});
$('studyTab').onclick=()=>navigate(link(state.active));
$('rawTab').onclick=()=>navigate(link(state.active,'raw','',$('inSearch').value));
$('find').onclick=()=>{articleSearch();updateMatches();};
let articleTimer;
$('inSearch').addEventListener('input',()=>{clearTimeout(articleTimer);articleTimer=setTimeout(articleSearch,180);});
$('inSearch').addEventListener('search',articleSearch);
$('inSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(articleTimer);$('find').click();}});
for(const [id,step] of [['prevMatch',-1],['nextMatch',1]])$(id).onclick=()=>{const count=$('article').querySelectorAll('mark').length;if(count){state.match=(state.match+step+count)%count;updateMatches();}};
for(const [id,step] of [['smaller',-1],['larger',1]])$(id).onclick=()=>{state.font=Math.max(14,Math.min(26,state.font+step));$('article').style.setProperty('--size',state.font+'px');};
$('prevDoc').onclick=()=>navigate(link(docs[docs.indexOf(state.active)-1],state.readerMode));
$('nextDoc').onclick=()=>navigate(link(docs[docs.indexOf(state.active)+1],state.readerMode));
$('top').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
render();route();
