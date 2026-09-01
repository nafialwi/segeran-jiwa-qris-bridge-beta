const MAX_IMAGE_BYTES=8*1024*1024;
export function validateImageFile(file,{maxBytes=MAX_IMAGE_BYTES}={}){
  if(!file||!String(file.type||'').startsWith('image/')) return Object.freeze({ok:false,reason:'IMAGE_TYPE_REQUIRED'});
  if(Number(file.size||0)>maxBytes) return Object.freeze({ok:false,reason:'IMAGE_TOO_LARGE',maxBytes});
  return Object.freeze({ok:true});
}
export function profilePhotoPath(uid,stamp=Date.now(),suffix=Math.random().toString(36).slice(2,7)){
  const safeUid=String(uid||'').replace(/[^a-zA-Z0-9_-]/g,'');
  if(!safeUid) throw new Error('PROFILE_UID_REQUIRED');
  return `profiles/${safeUid}/avatar-${stamp}-${String(suffix).replace(/[^a-zA-Z0-9_-]/g,'')}.jpg`;
}
export function createMediaLifecycle({imageAuthority,auth,avatarStore,now=()=>Date.now()}={}){
  const currentUser=()=>auth?.currentUser??null;
  function authorityFor(target){return target==='product'?'existing-product-writer':target==='store'?'existing-store-settings-writer':target==='profile'?'zero-cost-device-profile-avatar':'unknown'}
  function bindExisting(event,target,preview){
    if(typeof imageAuthority?.handleImage!=='function') throw new Error('EXISTING_IMAGE_AUTHORITY_UNAVAILABLE');
    return imageAuthority.handleImage(event,target,preview);
  }
  function readAvatarState(){try{return avatarStore?.read?.()??null}catch(_){return null}}
  function currentPhoto(){
    const stored=readAvatarState();
    if(stored?.mode==='initials') return null;
    if(stored?.mode==='photo'&&String(stored?.dataUrl||'').startsWith('data:image/')) return stored.dataUrl;
    return currentUser()?.photoURL??null;
  }
  async function compressProfilePhoto(file){
    if(typeof imageAuthority?.compressFileForTarget==='function') return imageAuthority.compressFileForTarget(file,'profile-avatar');
    if(typeof imageAuthority?.compressFile==='function') return imageAuthority.compressFile(file);
    throw new Error('EXISTING_IMAGE_COMPRESSION_AUTHORITY_UNAVAILABLE');
  }
  async function saveProfilePhoto(file){
    const valid=validateImageFile(file);if(!valid.ok) throw Object.assign(new Error(valid.reason),{code:valid.reason});
    if(!avatarStore?.write) throw new Error('PROFILE_AVATAR_STORE_UNAVAILABLE');
    const data=await compressProfilePhoto(file);
    if(!String(data||'').startsWith('data:image/')) throw new Error('PROFILE_AVATAR_IMAGE_INVALID');
    avatarStore.write({version:1,mode:'photo',dataUrl:data,updatedAt:now()});
    return data;
  }
  async function removeProfilePhoto(){
    if(!avatarStore?.write) throw new Error('PROFILE_AVATAR_STORE_UNAVAILABLE');
    avatarStore.write({version:1,mode:'initials',dataUrl:'',updatedAt:now()});
    return null;
  }
  return Object.freeze({validate:validateImageFile,authorityFor,bindExisting,saveProfilePhoto,removeProfilePhoto,currentPhoto});
}
