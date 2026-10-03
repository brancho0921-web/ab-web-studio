const nav = document.querySelector('.site-nav');
const menuButton = document.querySelector('.menu-button');
function closeMenu(){menuButton?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open');}
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('is-open',!open);});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('is-open')){closeMenu();menuButton?.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
window.matchMedia('(min-width:761px)').addEventListener('change',closeMenu);

// Real video: no sound, no offscreen playback, no automatic motion when reduced.
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const shopVideo=document.querySelector('#shop-video');
const videoToggle=document.querySelector('.video-toggle');
let wantsPlayback=!motionPreference.matches;
let videoVisible=false;
function syncVideo(){
  if(wantsPlayback&&videoVisible&&!document.hidden){
    shopVideo.play().catch(()=>{wantsPlayback=false;videoToggle.textContent='Reproducir video';});
  }else shopVideo.pause();
}
shopVideo.addEventListener('play',()=>{videoToggle.textContent='Pausar video';});
shopVideo.addEventListener('pause',()=>{videoToggle.textContent='Reproducir video';});
shopVideo.addEventListener('error',()=>{videoToggle.textContent='Video no disponible';videoToggle.disabled=true;});
videoToggle.addEventListener('click',()=>{wantsPlayback=shopVideo.paused;syncVideo();});
if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{videoVisible=entries[0].isIntersecting;syncVideo();},{threshold:.2}).observe(shopVideo);
}else{videoVisible=true;syncVideo();}
document.addEventListener('visibilitychange',()=>{syncVideo();if(document.hidden)document.querySelector('.brand-film video')?.pause();});
motionPreference.addEventListener('change',()=>{if(motionPreference.matches){wantsPlayback=false;shopVideo.pause();}});
const brandVideo=document.querySelector('.brand-film video');
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)brandVideo.pause();}).observe(brandVideo);
const floatingBook=document.querySelector('.floating-book');
const hero=document.querySelector('.hero');
if('IntersectionObserver' in window){
  const floatingStates=new Map();
  const floatingObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>floatingStates.set(entry.target,entry.isIntersecting));
    floatingBook.classList.toggle('is-hidden',[...floatingStates.values()].some(Boolean));
  },{threshold:.08});
  [hero,document.querySelector('#reservar'),document.querySelector('#ubicacion'),document.querySelector('.site-footer')].forEach(section=>floatingObserver.observe(section));
}

// Optional full-frame gallery. Links still open original files without JS.
const photoLinks=[...document.querySelectorAll('.gallery-open')];
const viewer=document.querySelector('.photo-viewer');
const viewerImage=viewer.querySelector('.viewer-image');
const viewerCaption=viewer.querySelector('.viewer-caption');
let selectedPhoto=0;
let returnFocus=null;
let previousOverflow='';
function showPhoto(index){
  selectedPhoto=(index+photoLinks.length)%photoLinks.length;
  const link=photoLinks[selectedPhoto];
  viewerImage.src=link.href;
  viewerImage.alt=link.querySelector('img').alt;
  viewerCaption.textContent=link.closest('figure').querySelector('strong').textContent;
}
photoLinks.forEach((link,index)=>link.addEventListener('click',event=>{
  if(!viewer.showModal||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();returnFocus=link;showPhoto(index);
  previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  viewer.showModal();viewer.querySelector('.viewer-close').focus();
}));
function releaseViewer(){document.body.style.overflow=previousOverflow;returnFocus?.focus({preventScroll:true});}
viewer.querySelector('.viewer-close').addEventListener('click',()=>{releaseViewer();viewer.close();});
viewer.querySelector('.viewer-prev').addEventListener('click',()=>showPhoto(selectedPhoto-1));
viewer.querySelector('.viewer-next').addEventListener('click',()=>showPhoto(selectedPhoto+1));
viewer.addEventListener('click',event=>{if(event.target===viewer){releaseViewer();viewer.close();}});
viewer.addEventListener('cancel',releaseViewer);
viewer.addEventListener('close',releaseViewer);
viewer.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'){event.preventDefault();showPhoto(selectedPhoto+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(selectedPhoto-1);}
});
