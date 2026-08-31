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
export function createMediaLifecycle({imageAuthority,auth,now=()=>Date.now(),random=()=>Math.random()}={}){
  const currentUser=()=>auth?.currentUser??null;
  function authorityFor(target){return target==='product'?'existing-product-writer':target==='store'?'existing-store-settings-writer':target==='profile'?'existing-storage-plus-firebase-auth-profile':'unknown'}
  function bindExisting(event,target,preview){
    if(typeof imageAuthority?.handleImage!=='function') throw new Error('EXISTING_IMAGE_AUTHORITY_UNAVAILABLE');
    return imageAuthority.handleImage(event,target,preview);
  }
  async function saveProfilePhoto(file){
    const valid=validateImageFile(file);if(!valid.ok) throw Object.assign(new Error(valid.reason),{code:valid.reason});
    const user=currentUser();if(!user?.uid||typeof user.updateProfile!=='function') throw new Error('FIREBASE_AUTH_PROFILE_UNAVAILABLE');
    if(typeof imageAuthority?.compressFile!=='function'||typeof imageAuthority?.uploadDataUrl!=='function') throw new Error('EXISTING_IMAGE_STORAGE_AUTHORITY_UNAVAILABLE');
    const data=await imageAuthority.compressFile(file);
    const suffix=Number(random()).toString(36).replace(/^0\./,'').slice(0,7)||'ref01';
    const url=await imageAuthority.uploadDataUrl(data,profilePhotoPath(user.uid,now(),suffix));
    await user.updateProfile({photoURL:url});
    return url;
  }
  async function removeProfilePhoto(){
    const user=currentUser();if(!user||typeof user.updateProfile!=='function') throw new Error('FIREBASE_AUTH_PROFILE_UNAVAILABLE');
    await user.updateProfile({photoURL:null});return null;
  }
  return Object.freeze({validate:validateImageFile,authorityFor,bindExisting,saveProfilePhoto,removeProfilePhoto,currentPhoto:()=>currentUser()?.photoURL??null});
}
