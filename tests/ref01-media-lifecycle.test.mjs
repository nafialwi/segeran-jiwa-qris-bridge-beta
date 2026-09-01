import test from 'node:test';
import assert from 'node:assert/strict';
import { createMediaLifecycle, validateImageFile, profilePhotoPath } from '../src/ui/media-lifecycle.js';

function file(type='image/jpeg',size=1024){return {type,size,name:'photo.jpg'}}

test('REF-01 image validation accepts normal images and rejects non-image/oversized input',()=>{
  assert.equal(validateImageFile(file()).ok,true);
  assert.equal(validateImageFile(file('application/pdf')).reason,'IMAGE_TYPE_REQUIRED');
  assert.equal(validateImageFile(file('image/jpeg',9*1024*1024)).reason,'IMAGE_TOO_LARGE');
});

test('REF-01 media lifecycle delegates product/store images to existing authority',async()=>{
  const calls=[];
  const authority={handleImage:(event,target,preview)=>{calls.push([event,target,preview]);return 'delegated'}};
  const media=createMediaLifecycle({imageAuthority:authority,auth:{currentUser:{uid:'u1'}}});
  assert.equal(media.bindExisting({x:1},'edit-m-i','edit-img-preview'),'delegated');
  assert.deepEqual(calls,[[{x:1},'edit-m-i','edit-img-preview']]);
  assert.equal(media.authorityFor('product'),'existing-product-writer');
  assert.equal(media.authorityFor('store'),'existing-store-settings-writer');
});

test('REF-01 profile photo uses zero-cost device persistence and never requires Firebase Storage or RTDB',async()=>{
  const calls=[];let stored=null;
  const avatarStore={read(){return stored},write(value){stored={...value};calls.push(['store',value.mode]);return value},clear(){stored=null}};
  const user={uid:'uid-7',photoURL:null,async updateProfile(){calls.push(['updateProfile']);throw new Error('must not write auth profile')}};
  const authority={
    async compressFile(f){calls.push(['compress',f.name]);return 'data:image/jpeg;base64,abc'},
    async uploadDataUrl(){calls.push(['upload']);throw new Error('storage disabled')}
  };
  const media=createMediaLifecycle({imageAuthority:authority,auth:{currentUser:user},avatarStore,now:()=>1700000000000});
  const photo=await media.saveProfilePhoto(file());
  assert.equal(photo,'data:image/jpeg;base64,abc');
  assert.equal(media.currentPhoto(),photo);
  assert.equal(calls.some(x=>x[0]==='upload'||x[0]==='updateProfile'),false);
  const recreated=createMediaLifecycle({imageAuthority:authority,auth:{currentUser:user},avatarStore,now:()=>1700000001000});
  assert.equal(recreated.currentPhoto(),photo,'avatar survives lifecycle recreation on the same browser store');
  await recreated.removeProfilePhoto();
  assert.equal(recreated.currentPhoto(),null);
  assert.equal(stored.mode,'initials');
});

test('REF-01 profile media path is user-scoped and never stores credential/session data',()=>{
  const path=profilePhotoPath('abc',1234,'xyz');
  assert.equal(path,'profiles/abc/avatar-1234-xyz.jpg');
  assert.doesNotMatch(path,/pin|password|session/i);
});
