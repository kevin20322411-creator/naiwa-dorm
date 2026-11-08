(function(){
  'use strict';

  if(typeof document.addEventListener!=='function'||typeof getComputedStyle!=='function')return;

  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const customMotion='.campus-place, .major-word, [data-button-feedback="off"]';
  const existingLift='.canteen-dish, .major-start, .school-open, .major-option';
  const surfaces=new Map();

  function eligibleButton(target){
    const button=target?.closest?.('button');
    if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return null;
    if(button.matches(customMotion)||button.closest('[inert]'))return null;
    return button;
  }

  function prepare(button){
    if(button.classList.contains('button-feedback'))return;
    const appearance=getComputedStyle(button);
    button.classList.add('button-feedback');
    if(appearance.position==='static')button.classList.add('button-touch-host');
    // Existing map and card transforms keep their own geometry and animation.
    if(!button.matches(existingLift)&&appearance.transform==='none'){
      button.classList.add('button-feedback-lift');
    }
    if(!button.matches('.canteen-dish'))button.classList.add('button-feedback-press');
  }

  function clearRipple(button,expectedSurface){
    const current=surfaces.get(button);
    if(!current||expectedSurface&&current.element!==expectedSurface)return;
    clearTimeout(current.timer);
    current.element.remove();
    surfaces.delete(button);
  }

  function ripple(button,event){
    if(reducedMotion?.matches)return;
    const bounds=button.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    clearRipple(button);

    const surface=document.createElement('span');
    surface.className='button-touch-surface';
    surface.setAttribute('aria-hidden','true');
    const wave=document.createElement('span');
    wave.className='button-touch-wave';
    const diameter=Math.ceil(Math.hypot(bounds.width,bounds.height)*2);
    const keyboard=event.type==='click';
    const x=keyboard?bounds.width/2:event.clientX-bounds.left;
    const y=keyboard?bounds.height/2:event.clientY-bounds.top;
    Object.assign(wave.style,{
      width:diameter+'px',height:diameter+'px',
      left:(x-diameter/2)+'px',top:(y-diameter/2)+'px'
    });
    surface.append(wave);
    button.append(surface);
    const timer=setTimeout(()=>clearRipple(button,surface),550);
    surfaces.set(button,{element:surface,timer});
    wave.addEventListener('animationend',()=>clearRipple(button,surface),{once:true});
  }

  document.addEventListener('pointerover',event=>{
    const button=eligibleButton(event.target);
    if(button)prepare(button);
  },{passive:true});

  document.addEventListener('focusin',event=>{
    const button=eligibleButton(event.target);
    if(button)prepare(button);
  });

  document.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.isPrimary===false)return;
    const button=eligibleButton(event.target);
    if(!button)return;
    prepare(button);
    ripple(button,event);
  },{passive:true});

  document.addEventListener('click',event=>{
    if(event.detail!==0)return;
    const button=eligibleButton(event.target);
    if(!button)return;
    prepare(button);
    ripple(button,event);
  },{capture:true,passive:true});

  document.addEventListener('pointercancel',event=>{
    const button=event.target?.closest?.('button');
    if(button)clearRipple(button);
  },{passive:true});

  reducedMotion?.addEventListener?.('change',()=>{
    if(reducedMotion.matches)for(const button of surfaces.keys())clearRipple(button);
  });
})();
