import{r as Pi,s as Ai,U as Li,t as ue,v as z,c as D,w as Ii,B as bi,V as g,Q as A,n as Pe,d as fe,x as Ci,G as Vt,y as Ke,z as X,F as se,H as Ui,E as et,o as C,I as Dt,D as Bt,J as Ft,K as Ce,W as tt,X as U,Y as Oi,Z as Y,_ as Ni,$ as Ae,a0 as Vi}from"./three-dWqUxecu.js";import"./react-vendor-BoJ_KTUm.js";import"./animation-MOF9A5il.js";/*!
 * @pixiv/three-vrm v3.4.4
 * VRM file loader for three.js.
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */var xe=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())}),P=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())}),Ht=class extends Pe{constructor(e){super(),this.weight=0,this.isBinary=!1,this.overrideBlink="none",this.overrideLookAt="none",this.overrideMouth="none",this._binds=[],this.name=`VRMExpression_${e}`,this.expressionName=e,this.type="VRMExpression",this.visible=!1}get binds(){return this._binds}get overrideBlinkAmount(){return this.overrideBlink==="block"?0<this.outputWeight?1:0:this.overrideBlink==="blend"?this.outputWeight:0}get overrideLookAtAmount(){return this.overrideLookAt==="block"?0<this.outputWeight?1:0:this.overrideLookAt==="blend"?this.outputWeight:0}get overrideMouthAmount(){return this.overrideMouth==="block"?0<this.outputWeight?1:0:this.overrideMouth==="blend"?this.outputWeight:0}get outputWeight(){return this.isBinary?this.weight>.5?1:0:this.weight}addBind(e){this._binds.push(e)}deleteBind(e){const t=this._binds.indexOf(e);t>=0&&this._binds.splice(t,1)}applyWeight(e){var t;let n=this.outputWeight;n*=(t=e==null?void 0:e.multiplier)!=null?t:1,this.isBinary&&n<1&&(n=0),this._binds.forEach(i=>i.applyWeight(n))}clearAppliedWeight(){this._binds.forEach(e=>e.clearAppliedWeight())}};function wn(e,t,n){var i,r;const o=e.parser.json,a=(i=o.nodes)==null?void 0:i[t];if(a==null)return console.warn(`extractPrimitivesInternal: Attempt to use nodes[${t}] of glTF but the node doesn't exist`),null;const l=a.mesh;if(l==null)return null;const s=(r=o.meshes)==null?void 0:r[l];if(s==null)return console.warn(`extractPrimitivesInternal: Attempt to use meshes[${l}] of glTF but the mesh doesn't exist`),null;const u=s.primitives.length,h=[];return n.traverse(d=>{h.length<u&&d.isMesh&&h.push(d)}),h}function kt(e,t){return P(this,null,function*(){const n=yield e.parser.getDependency("node",t);return wn(e,t,n)})}function Wt(e){return P(this,null,function*(){const t=yield e.parser.getDependencies("node"),n=new Map;return t.forEach((i,r)=>{const o=wn(e,r,i);o!=null&&n.set(r,o)}),n})}var Ge={Aa:"aa",Ih:"ih",Ou:"ou",Ee:"ee",Oh:"oh",Blink:"blink",Happy:"happy",Angry:"angry",Sad:"sad",Relaxed:"relaxed",LookUp:"lookUp",Surprised:"surprised",LookDown:"lookDown",LookLeft:"lookLeft",LookRight:"lookRight",BlinkLeft:"blinkLeft",BlinkRight:"blinkRight",Neutral:"neutral"};function Tn(e){return Math.max(Math.min(e,1),0)}var zt=class Sn{constructor(){this.blinkExpressionNames=["blink","blinkLeft","blinkRight"],this.lookAtExpressionNames=["lookLeft","lookRight","lookUp","lookDown"],this.mouthExpressionNames=["aa","ee","ih","oh","ou"],this._expressions=[],this._expressionMap={}}get expressions(){return this._expressions.concat()}get expressionMap(){return Object.assign({},this._expressionMap)}get presetExpressionMap(){const t={},n=new Set(Object.values(Ge));return Object.entries(this._expressionMap).forEach(([i,r])=>{n.has(i)&&(t[i]=r)}),t}get customExpressionMap(){const t={},n=new Set(Object.values(Ge));return Object.entries(this._expressionMap).forEach(([i,r])=>{n.has(i)||(t[i]=r)}),t}copy(t){return this._expressions.concat().forEach(i=>{this.unregisterExpression(i)}),t._expressions.forEach(i=>{this.registerExpression(i)}),this.blinkExpressionNames=t.blinkExpressionNames.concat(),this.lookAtExpressionNames=t.lookAtExpressionNames.concat(),this.mouthExpressionNames=t.mouthExpressionNames.concat(),this}clone(){return new Sn().copy(this)}getExpression(t){var n;return(n=this._expressionMap[t])!=null?n:null}registerExpression(t){this._expressions.push(t),this._expressionMap[t.expressionName]=t}unregisterExpression(t){const n=this._expressions.indexOf(t);n===-1&&console.warn("VRMExpressionManager: The specified expressions is not registered"),this._expressions.splice(n,1),delete this._expressionMap[t.expressionName]}getValue(t){var n;const i=this.getExpression(t);return(n=i==null?void 0:i.weight)!=null?n:null}setValue(t,n){const i=this.getExpression(t);i&&(i.weight=Tn(n))}resetValues(){this._expressions.forEach(t=>{t.weight=0})}getExpressionTrackName(t){const n=this.getExpression(t);return n?`${n.name}.weight`:null}update(){const t=this._calculateWeightMultipliers();this._expressions.forEach(n=>{n.clearAppliedWeight()}),this._expressions.forEach(n=>{let i=1;const r=n.expressionName;this.blinkExpressionNames.indexOf(r)!==-1&&(i*=t.blink),this.lookAtExpressionNames.indexOf(r)!==-1&&(i*=t.lookAt),this.mouthExpressionNames.indexOf(r)!==-1&&(i*=t.mouth),n.applyWeight({multiplier:i})})}_calculateWeightMultipliers(){let t=1,n=1,i=1;return this._expressions.forEach(r=>{t-=r.overrideBlinkAmount,n-=r.overrideLookAtAmount,i-=r.overrideMouthAmount}),t=Math.max(0,t),n=Math.max(0,n),i=Math.max(0,i),{blink:t,lookAt:n,mouth:i}}},de={Color:"color",EmissionColor:"emissionColor",ShadeColor:"shadeColor",MatcapColor:"matcapColor",RimColor:"rimColor",OutlineColor:"outlineColor"},Di={_Color:de.Color,_EmissionColor:de.EmissionColor,_ShadeColor:de.ShadeColor,_RimColor:de.RimColor,_OutlineColor:de.OutlineColor},Bi=new D,En=class Pn{constructor({material:t,type:n,targetValue:i,targetAlpha:r}){this.material=t,this.type=n,this.targetValue=i,this.targetAlpha=r??1;const o=this._initColorBindState(),a=this._initAlphaBindState();this._state={color:o,alpha:a}}applyWeight(t){const{color:n,alpha:i}=this._state;if(n!=null){const{propertyName:r,deltaValue:o}=n,a=this.material[r];a!=null&&a.add(Bi.copy(o).multiplyScalar(t))}if(i!=null){const{propertyName:r,deltaValue:o}=i;this.material[r]!=null&&(this.material[r]+=o*t)}}clearAppliedWeight(){const{color:t,alpha:n}=this._state;if(t!=null){const{propertyName:i,initialValue:r}=t,o=this.material[i];o!=null&&o.copy(r)}if(n!=null){const{propertyName:i,initialValue:r}=n;this.material[i]!=null&&(this.material[i]=r)}}_initColorBindState(){var t,n,i;const{material:r,type:o,targetValue:a}=this,l=this._getPropertyNameMap(),s=(n=(t=l==null?void 0:l[o])==null?void 0:t[0])!=null?n:null;if(s==null)return console.warn(`Tried to add a material color bind to the material ${(i=r.name)!=null?i:"(no name)"}, the type ${o} but the material or the type is not supported.`),null;const h=r[s].clone(),d=new D(a.r-h.r,a.g-h.g,a.b-h.b);return{propertyName:s,initialValue:h,deltaValue:d}}_initAlphaBindState(){var t,n,i;const{material:r,type:o,targetAlpha:a}=this,l=this._getPropertyNameMap(),s=(n=(t=l==null?void 0:l[o])==null?void 0:t[1])!=null?n:null;if(s==null&&a!==1)return console.warn(`Tried to add a material alpha bind to the material ${(i=r.name)!=null?i:"(no name)"}, the type ${o} but the material or the type does not support alpha.`),null;if(s==null)return null;const u=r[s],h=a-u;return{propertyName:s,initialValue:u,deltaValue:h}}_getPropertyNameMap(){var t,n;return(n=(t=Object.entries(Pn._propertyNameMapMap).find(([i])=>this.material[i]===!0))==null?void 0:t[1])!=null?n:null}};En._propertyNameMapMap={isMeshStandardMaterial:{color:["color","opacity"],emissionColor:["emissive",null]},isMeshBasicMaterial:{color:["color","opacity"]},isMToonMaterial:{color:["color","opacity"],emissionColor:["emissive",null],outlineColor:["outlineColorFactor",null],matcapColor:["matcapFactor",null],rimColor:["parametricRimColorFactor",null],shadeColor:["shadeColorFactor",null]}};var jt=En,Le=class{constructor({primitives:e,index:t,weight:n}){this.primitives=e,this.index=t,this.weight=n}applyWeight(e){this.primitives.forEach(t=>{var n;((n=t.morphTargetInfluences)==null?void 0:n[this.index])!=null&&(t.morphTargetInfluences[this.index]+=this.weight*e)})}clearAppliedWeight(){this.primitives.forEach(e=>{var t;((t=e.morphTargetInfluences)==null?void 0:t[this.index])!=null&&(e.morphTargetInfluences[this.index]=0)})}},Xt=new fe,An=class Ln{constructor({material:t,scale:n,offset:i}){var r,o;this.material=t,this.scale=n,this.offset=i;const a=(r=Object.entries(Ln._propertyNamesMap).find(([l])=>t[l]===!0))==null?void 0:r[1];a==null?(console.warn(`Tried to add a texture transform bind to the material ${(o=t.name)!=null?o:"(no name)"} but the material is not supported.`),this._properties=[]):(this._properties=[],a.forEach(l=>{var s;const u=(s=t[l])==null?void 0:s.clone();if(!u)return null;t[l]=u;const h=u.offset.clone(),d=u.repeat.clone(),c=i.clone().sub(h),p=n.clone().sub(d);this._properties.push({name:l,initialOffset:h,deltaOffset:c,initialScale:d,deltaScale:p})}))}applyWeight(t){this._properties.forEach(n=>{const i=this.material[n.name];i!==void 0&&(i.offset.add(Xt.copy(n.deltaOffset).multiplyScalar(t)),i.repeat.add(Xt.copy(n.deltaScale).multiplyScalar(t)))})}clearAppliedWeight(){this._properties.forEach(t=>{const n=this.material[t.name];n!==void 0&&(n.offset.copy(t.initialOffset),n.repeat.copy(t.initialScale))})}};An._propertyNamesMap={isMeshStandardMaterial:["map","emissiveMap","bumpMap","normalMap","displacementMap","roughnessMap","metalnessMap","alphaMap"],isMeshBasicMaterial:["map","specularMap","alphaMap"],isMToonMaterial:["map","normalMap","emissiveMap","shadeMultiplyTexture","rimMultiplyTexture","outlineWidthMultiplyTexture","uvAnimationMaskTexture"]};var Yt=An,Fi=new Set(["1.0","1.0-beta"]),In=class bn{get name(){return"VRMExpressionLoaderPlugin"}constructor(t){this.parser=t}afterRoot(t){return P(this,null,function*(){t.userData.vrmExpressionManager=yield this._import(t)})}_import(t){return P(this,null,function*(){const n=yield this._v1Import(t);if(n)return n;const i=yield this._v0Import(t);return i||null})}_v1Import(t){return P(this,null,function*(){var n,i;const r=this.parser.json;if(!(((n=r.extensionsUsed)==null?void 0:n.indexOf("VRMC_vrm"))!==-1))return null;const a=(i=r.extensions)==null?void 0:i.VRMC_vrm;if(!a)return null;const l=a.specVersion;if(!Fi.has(l))return console.warn(`VRMExpressionLoaderPlugin: Unknown VRMC_vrm specVersion "${l}"`),null;const s=a.expressions;if(!s)return null;const u=new Set(Object.values(Ge)),h=new Map;s.preset!=null&&Object.entries(s.preset).forEach(([c,p])=>{if(p!=null){if(!u.has(c)){console.warn(`VRMExpressionLoaderPlugin: Unknown preset name "${c}" detected. Ignoring the expression`);return}h.set(c,p)}}),s.custom!=null&&Object.entries(s.custom).forEach(([c,p])=>{if(u.has(c)){console.warn(`VRMExpressionLoaderPlugin: Custom expression cannot have preset name "${c}". Ignoring the expression`);return}h.set(c,p)});const d=new zt;return yield Promise.all(Array.from(h.entries()).map(c=>P(this,[c],function*([p,f]){var m,_,x,R,S,v,M;const y=new Ht(p);if(t.scene.add(y),y.isBinary=(m=f.isBinary)!=null?m:!1,y.overrideBlink=(_=f.overrideBlink)!=null?_:"none",y.overrideLookAt=(x=f.overrideLookAt)!=null?x:"none",y.overrideMouth=(R=f.overrideMouth)!=null?R:"none",(S=f.morphTargetBinds)==null||S.forEach(w=>P(this,null,function*(){var T;if(w.node===void 0||w.index===void 0)return;const I=yield kt(t,w.node),E=w.index;if(!I.every(L=>Array.isArray(L.morphTargetInfluences)&&E<L.morphTargetInfluences.length)){console.warn(`VRMExpressionLoaderPlugin: ${f.name} attempts to index morph #${E} but not found.`);return}y.addBind(new Le({primitives:I,index:E,weight:(T=w.weight)!=null?T:1}))})),f.materialColorBinds||f.textureTransformBinds){const w=[];t.scene.traverse(T=>{const I=T.material;I&&(Array.isArray(I)?w.push(...I):w.push(I))}),(v=f.materialColorBinds)==null||v.forEach(T=>P(this,null,function*(){w.filter(E=>{var L;const b=(L=this.parser.associations.get(E))==null?void 0:L.materials;return T.material===b}).forEach(E=>{y.addBind(new jt({material:E,type:T.type,targetValue:new D().fromArray(T.targetValue),targetAlpha:T.targetValue[3]}))})})),(M=f.textureTransformBinds)==null||M.forEach(T=>P(this,null,function*(){w.filter(E=>{var L;const b=(L=this.parser.associations.get(E))==null?void 0:L.materials;return T.material===b}).forEach(E=>{var L,b;y.addBind(new Yt({material:E,offset:new fe().fromArray((L=T.offset)!=null?L:[0,0]),scale:new fe().fromArray((b=T.scale)!=null?b:[1,1])}))})}))}d.registerExpression(y)}))),d})}_v0Import(t){return P(this,null,function*(){var n;const i=this.parser.json,r=(n=i.extensions)==null?void 0:n.VRM;if(!r)return null;const o=r.blendShapeMaster;if(!o)return null;const a=new zt,l=o.blendShapeGroups;if(!l)return a;const s=new Set;return yield Promise.all(l.map(u=>P(this,null,function*(){var h;const d=u.presetName,c=d!=null&&bn.v0v1PresetNameMap[d]||null,p=c??u.name;if(p==null){console.warn("VRMExpressionLoaderPlugin: One of custom expressions has no name. Ignoring the expression");return}if(s.has(p)){console.warn(`VRMExpressionLoaderPlugin: An expression preset ${d} has duplicated entries. Ignoring the expression`);return}s.add(p);const f=new Ht(p);t.scene.add(f),f.isBinary=(h=u.isBinary)!=null?h:!1,u.binds&&u.binds.forEach(_=>P(this,null,function*(){var x;if(_.mesh===void 0||_.index===void 0)return;const R=[];(x=i.nodes)==null||x.forEach((v,M)=>{v.mesh===_.mesh&&R.push(M)});const S=_.index;yield Promise.all(R.map(v=>P(this,null,function*(){var M;const y=yield kt(t,v);if(!y.every(w=>Array.isArray(w.morphTargetInfluences)&&S<w.morphTargetInfluences.length)){console.warn(`VRMExpressionLoaderPlugin: ${u.name} attempts to index ${S}th morph but not found.`);return}f.addBind(new Le({primitives:y,index:S,weight:.01*((M=_.weight)!=null?M:100)}))})))}));const m=u.materialValues;m&&m.length!==0&&m.forEach(_=>{if(_.materialName===void 0||_.propertyName===void 0||_.targetValue===void 0)return;const x=[];t.scene.traverse(S=>{if(S.material){const v=S.material;Array.isArray(v)?x.push(...v.filter(M=>(M.name===_.materialName||M.name===_.materialName+" (Outline)")&&x.indexOf(M)===-1)):v.name===_.materialName&&x.indexOf(v)===-1&&x.push(v)}});const R=_.propertyName;x.forEach(S=>{if(R==="_MainTex_ST"){const M=new fe(_.targetValue[0],_.targetValue[1]),y=new fe(_.targetValue[2],_.targetValue[3]);y.y=1-y.y-M.y,f.addBind(new Yt({material:S,scale:M,offset:y}));return}const v=Di[R];if(v){f.addBind(new jt({material:S,type:v,targetValue:new D().fromArray(_.targetValue),targetAlpha:_.targetValue[3]}));return}console.warn(R+" is not supported")})}),a.registerExpression(f)}))),a})}};In.v0v1PresetNameMap={a:"aa",e:"ee",i:"ih",o:"oh",u:"ou",blink:"blink",joy:"happy",angry:"angry",sorrow:"sad",fun:"relaxed",lookup:"lookUp",lookdown:"lookDown",lookleft:"lookLeft",lookright:"lookRight",blink_l:"blinkLeft",blink_r:"blinkRight",neutral:"neutral"};var Cn=In,Ho={None:"none",Block:"block",Blend:"blend"},nt=class re{constructor(t,n){this._firstPersonOnlyLayer=re.DEFAULT_FIRSTPERSON_ONLY_LAYER,this._thirdPersonOnlyLayer=re.DEFAULT_THIRDPERSON_ONLY_LAYER,this._initializedLayers=!1,this.humanoid=t,this.meshAnnotations=n}copy(t){if(this.humanoid!==t.humanoid)throw new Error("VRMFirstPerson: humanoid must be same in order to copy");return this.meshAnnotations=t.meshAnnotations.map(n=>({meshes:n.meshes.concat(),type:n.type})),this}clone(){return new re(this.humanoid,this.meshAnnotations).copy(this)}get firstPersonOnlyLayer(){return this._firstPersonOnlyLayer}get thirdPersonOnlyLayer(){return this._thirdPersonOnlyLayer}setup({firstPersonOnlyLayer:t=re.DEFAULT_FIRSTPERSON_ONLY_LAYER,thirdPersonOnlyLayer:n=re.DEFAULT_THIRDPERSON_ONLY_LAYER}={}){this._initializedLayers||(this._firstPersonOnlyLayer=t,this._thirdPersonOnlyLayer=n,this.meshAnnotations.forEach(i=>{i.meshes.forEach(r=>{i.type==="firstPersonOnly"?(r.layers.set(this._firstPersonOnlyLayer),r.traverse(o=>o.layers.set(this._firstPersonOnlyLayer))):i.type==="thirdPersonOnly"?(r.layers.set(this._thirdPersonOnlyLayer),r.traverse(o=>o.layers.set(this._thirdPersonOnlyLayer))):i.type==="auto"&&this._createHeadlessModel(r)})}),this._initializedLayers=!0)}_excludeTriangles(t,n,i,r){let o=0;if(n!=null&&n.length>0)for(let a=0;a<t.length;a+=3){const l=t[a],s=t[a+1],u=t[a+2],h=n[l],d=i[l];if(h[0]>0&&r.includes(d[0])||h[1]>0&&r.includes(d[1])||h[2]>0&&r.includes(d[2])||h[3]>0&&r.includes(d[3]))continue;const c=n[s],p=i[s];if(c[0]>0&&r.includes(p[0])||c[1]>0&&r.includes(p[1])||c[2]>0&&r.includes(p[2])||c[3]>0&&r.includes(p[3]))continue;const f=n[u],m=i[u];f[0]>0&&r.includes(m[0])||f[1]>0&&r.includes(m[1])||f[2]>0&&r.includes(m[2])||f[3]>0&&r.includes(m[3])||(t[o++]=l,t[o++]=s,t[o++]=u)}return o}_createErasedMesh(t,n){const i=new Ci(t.geometry.clone(),t.material);i.name=`${t.name}(erase)`,i.frustumCulled=t.frustumCulled,i.layers.set(this._firstPersonOnlyLayer);const r=i.geometry,o=r.getAttribute("skinIndex"),a=o instanceof Vt?[]:o.array,l=[];for(let m=0;m<a.length;m+=4)l.push([a[m],a[m+1],a[m+2],a[m+3]]);const s=r.getAttribute("skinWeight"),u=s instanceof Vt?[]:s.array,h=[];for(let m=0;m<u.length;m+=4)h.push([u[m],u[m+1],u[m+2],u[m+3]]);const d=r.getIndex();if(!d)throw new Error("The geometry doesn't have an index buffer");const c=Array.from(d.array),p=this._excludeTriangles(c,h,l,n),f=[];for(let m=0;m<p;m++)f[m]=c[m];return r.setIndex(f),t.onBeforeRender&&(i.onBeforeRender=t.onBeforeRender),i.bind(new Ke(t.skeleton.bones,t.skeleton.boneInverses),new X),i}_createHeadlessModelForSkinnedMesh(t,n){const i=[];if(n.skeleton.bones.forEach((o,a)=>{this._isEraseTarget(o)&&i.push(a)}),!i.length){n.layers.enable(this._thirdPersonOnlyLayer),n.layers.enable(this._firstPersonOnlyLayer);return}n.layers.set(this._thirdPersonOnlyLayer);const r=this._createErasedMesh(n,i);t.add(r)}_createHeadlessModel(t){if(t.type==="Group")if(t.layers.set(this._thirdPersonOnlyLayer),this._isEraseTarget(t))t.traverse(n=>n.layers.set(this._thirdPersonOnlyLayer));else{const n=new se;n.name=`_headless_${t.name}`,n.layers.set(this._firstPersonOnlyLayer),t.parent.add(n),t.children.filter(i=>i.type==="SkinnedMesh").forEach(i=>{const r=i;this._createHeadlessModelForSkinnedMesh(n,r)})}else if(t.type==="SkinnedMesh"){const n=t;this._createHeadlessModelForSkinnedMesh(t.parent,n)}else this._isEraseTarget(t)&&(t.layers.set(this._thirdPersonOnlyLayer),t.traverse(n=>n.layers.set(this._thirdPersonOnlyLayer)))}_isEraseTarget(t){return t===this.humanoid.getRawBoneNode("head")?!0:t.parent?this._isEraseTarget(t.parent):!1}};nt.DEFAULT_FIRSTPERSON_ONLY_LAYER=9;nt.DEFAULT_THIRDPERSON_ONLY_LAYER=10;var Gt=nt,Hi=new Set(["1.0","1.0-beta"]),Un=class{get name(){return"VRMFirstPersonLoaderPlugin"}constructor(e){this.parser=e}afterRoot(e){return P(this,null,function*(){const t=e.userData.vrmHumanoid;if(t!==null){if(t===void 0)throw new Error("VRMFirstPersonLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first");e.userData.vrmFirstPerson=yield this._import(e,t)}})}_import(e,t){return P(this,null,function*(){if(t==null)return null;const n=yield this._v1Import(e,t);if(n)return n;const i=yield this._v0Import(e,t);return i||null})}_v1Import(e,t){return P(this,null,function*(){var n,i;const r=this.parser.json;if(!(((n=r.extensionsUsed)==null?void 0:n.indexOf("VRMC_vrm"))!==-1))return null;const a=(i=r.extensions)==null?void 0:i.VRMC_vrm;if(!a)return null;const l=a.specVersion;if(!Hi.has(l))return console.warn(`VRMFirstPersonLoaderPlugin: Unknown VRMC_vrm specVersion "${l}"`),null;const s=a.firstPerson,u=[],h=yield Wt(e);return Array.from(h.entries()).forEach(([d,c])=>{var p,f;const m=(p=s==null?void 0:s.meshAnnotations)==null?void 0:p.find(_=>_.node===d);u.push({meshes:c,type:(f=m==null?void 0:m.type)!=null?f:"auto"})}),new Gt(t,u)})}_v0Import(e,t){return P(this,null,function*(){var n;const i=this.parser.json,r=(n=i.extensions)==null?void 0:n.VRM;if(!r)return null;const o=r.firstPerson;if(!o)return null;const a=[],l=yield Wt(e);return Array.from(l.entries()).forEach(([s,u])=>{const h=i.nodes[s],d=o.meshAnnotations?o.meshAnnotations.find(c=>c.mesh===h.mesh):void 0;a.push({meshes:u,type:this._convertV0FlagToV1Type(d==null?void 0:d.firstPersonFlag)})}),new Gt(t,a)})}_convertV0FlagToV1Type(e){return e==="FirstPersonOnly"?"firstPersonOnly":e==="ThirdPersonOnly"?"thirdPersonOnly":e==="Both"?"both":"auto"}},ko={Auto:"auto",Both:"both",ThirdPersonOnly:"thirdPersonOnly",FirstPersonOnly:"firstPersonOnly"},qt=new g,Qt=new g,ki=new A,$t=class extends se{constructor(e){super(),this.vrmHumanoid=e,this._boneAxesMap=new Map,Object.values(e.humanBones).forEach(t=>{const n=new Ui(1);n.matrixAutoUpdate=!1,n.material.depthTest=!1,n.material.depthWrite=!1,this.add(n),this._boneAxesMap.set(t,n)})}dispose(){Array.from(this._boneAxesMap.values()).forEach(e=>{e.geometry.dispose(),e.material.dispose()})}updateMatrixWorld(e){Array.from(this._boneAxesMap.entries()).forEach(([t,n])=>{t.node.updateWorldMatrix(!0,!1),t.node.matrixWorld.decompose(qt,ki,Qt);const i=qt.set(.1,.1,.1).divide(Qt);n.matrix.copy(t.node.matrixWorld).scale(i)}),super.updateMatrixWorld(e)}},Ne=["hips","spine","chest","upperChest","neck","head","leftEye","rightEye","jaw","leftUpperLeg","leftLowerLeg","leftFoot","leftToes","rightUpperLeg","rightLowerLeg","rightFoot","rightToes","leftShoulder","leftUpperArm","leftLowerArm","leftHand","rightShoulder","rightUpperArm","rightLowerArm","rightHand","leftThumbMetacarpal","leftThumbProximal","leftThumbDistal","leftIndexProximal","leftIndexIntermediate","leftIndexDistal","leftMiddleProximal","leftMiddleIntermediate","leftMiddleDistal","leftRingProximal","leftRingIntermediate","leftRingDistal","leftLittleProximal","leftLittleIntermediate","leftLittleDistal","rightThumbMetacarpal","rightThumbProximal","rightThumbDistal","rightIndexProximal","rightIndexIntermediate","rightIndexDistal","rightMiddleProximal","rightMiddleIntermediate","rightMiddleDistal","rightRingProximal","rightRingIntermediate","rightRingDistal","rightLittleProximal","rightLittleIntermediate","rightLittleDistal"],Wo={Hips:"hips",Spine:"spine",Chest:"chest",UpperChest:"upperChest",Neck:"neck",Head:"head",LeftEye:"leftEye",RightEye:"rightEye",Jaw:"jaw",LeftUpperLeg:"leftUpperLeg",LeftLowerLeg:"leftLowerLeg",LeftFoot:"leftFoot",LeftToes:"leftToes",RightUpperLeg:"rightUpperLeg",RightLowerLeg:"rightLowerLeg",RightFoot:"rightFoot",RightToes:"rightToes",LeftShoulder:"leftShoulder",LeftUpperArm:"leftUpperArm",LeftLowerArm:"leftLowerArm",LeftHand:"leftHand",RightShoulder:"rightShoulder",RightUpperArm:"rightUpperArm",RightLowerArm:"rightLowerArm",RightHand:"rightHand",LeftThumbMetacarpal:"leftThumbMetacarpal",LeftThumbProximal:"leftThumbProximal",LeftThumbDistal:"leftThumbDistal",LeftIndexProximal:"leftIndexProximal",LeftIndexIntermediate:"leftIndexIntermediate",LeftIndexDistal:"leftIndexDistal",LeftMiddleProximal:"leftMiddleProximal",LeftMiddleIntermediate:"leftMiddleIntermediate",LeftMiddleDistal:"leftMiddleDistal",LeftRingProximal:"leftRingProximal",LeftRingIntermediate:"leftRingIntermediate",LeftRingDistal:"leftRingDistal",LeftLittleProximal:"leftLittleProximal",LeftLittleIntermediate:"leftLittleIntermediate",LeftLittleDistal:"leftLittleDistal",RightThumbMetacarpal:"rightThumbMetacarpal",RightThumbProximal:"rightThumbProximal",RightThumbDistal:"rightThumbDistal",RightIndexProximal:"rightIndexProximal",RightIndexIntermediate:"rightIndexIntermediate",RightIndexDistal:"rightIndexDistal",RightMiddleProximal:"rightMiddleProximal",RightMiddleIntermediate:"rightMiddleIntermediate",RightMiddleDistal:"rightMiddleDistal",RightRingProximal:"rightRingProximal",RightRingIntermediate:"rightRingIntermediate",RightRingDistal:"rightRingDistal",RightLittleProximal:"rightLittleProximal",RightLittleIntermediate:"rightLittleIntermediate",RightLittleDistal:"rightLittleDistal"},Wi={hips:null,spine:"hips",chest:"spine",upperChest:"chest",neck:"upperChest",head:"neck",leftEye:"head",rightEye:"head",jaw:"head",leftUpperLeg:"hips",leftLowerLeg:"leftUpperLeg",leftFoot:"leftLowerLeg",leftToes:"leftFoot",rightUpperLeg:"hips",rightLowerLeg:"rightUpperLeg",rightFoot:"rightLowerLeg",rightToes:"rightFoot",leftShoulder:"upperChest",leftUpperArm:"leftShoulder",leftLowerArm:"leftUpperArm",leftHand:"leftLowerArm",rightShoulder:"upperChest",rightUpperArm:"rightShoulder",rightLowerArm:"rightUpperArm",rightHand:"rightLowerArm",leftThumbMetacarpal:"leftHand",leftThumbProximal:"leftThumbMetacarpal",leftThumbDistal:"leftThumbProximal",leftIndexProximal:"leftHand",leftIndexIntermediate:"leftIndexProximal",leftIndexDistal:"leftIndexIntermediate",leftMiddleProximal:"leftHand",leftMiddleIntermediate:"leftMiddleProximal",leftMiddleDistal:"leftMiddleIntermediate",leftRingProximal:"leftHand",leftRingIntermediate:"leftRingProximal",leftRingDistal:"leftRingIntermediate",leftLittleProximal:"leftHand",leftLittleIntermediate:"leftLittleProximal",leftLittleDistal:"leftLittleIntermediate",rightThumbMetacarpal:"rightHand",rightThumbProximal:"rightThumbMetacarpal",rightThumbDistal:"rightThumbProximal",rightIndexProximal:"rightHand",rightIndexIntermediate:"rightIndexProximal",rightIndexDistal:"rightIndexIntermediate",rightMiddleProximal:"rightHand",rightMiddleIntermediate:"rightMiddleProximal",rightMiddleDistal:"rightMiddleIntermediate",rightRingProximal:"rightHand",rightRingIntermediate:"rightRingProximal",rightRingDistal:"rightRingIntermediate",rightLittleProximal:"rightHand",rightLittleIntermediate:"rightLittleProximal",rightLittleDistal:"rightLittleIntermediate"};function On(e){return e.invert?e.invert():e.inverse(),e}var $=new g,Z=new A,qe=class{constructor(e){this.humanBones=e,this.restPose=this.getAbsolutePose()}getAbsolutePose(){const e={};return Object.keys(this.humanBones).forEach(t=>{const n=t,i=this.getBoneNode(n);i&&($.copy(i.position),Z.copy(i.quaternion),e[n]={position:$.toArray(),rotation:Z.toArray()})}),e}getPose(){const e={};return Object.keys(this.humanBones).forEach(t=>{const n=t,i=this.getBoneNode(n);if(!i)return;$.set(0,0,0),Z.identity();const r=this.restPose[n];r!=null&&r.position&&$.fromArray(r.position).negate(),r!=null&&r.rotation&&On(Z.fromArray(r.rotation)),$.add(i.position),Z.premultiply(i.quaternion),e[n]={position:$.toArray(),rotation:Z.toArray()}}),e}setPose(e){Object.entries(e).forEach(([t,n])=>{const i=t,r=this.getBoneNode(i);if(!r)return;const o=this.restPose[i];o&&(n!=null&&n.position&&(r.position.fromArray(n.position),o.position&&r.position.add($.fromArray(o.position))),n!=null&&n.rotation&&(r.quaternion.fromArray(n.rotation),o.rotation&&r.quaternion.multiply(Z.fromArray(o.rotation))))})}resetPose(){Object.entries(this.restPose).forEach(([e,t])=>{const n=this.getBoneNode(e);n&&(t!=null&&t.position&&n.position.fromArray(t.position),t!=null&&t.rotation&&n.quaternion.fromArray(t.rotation))})}getBone(e){var t;return(t=this.humanBones[e])!=null?t:void 0}getBoneNode(e){var t,n;return(n=(t=this.humanBones[e])==null?void 0:t.node)!=null?n:null}},Ve=new g,zi=new A,ji=new g,Zt=class Nn extends qe{static _setupTransforms(t){const n=new Pe;n.name="VRMHumanoidRig";const i={},r={},o={};Ne.forEach(l=>{var s;const u=t.getBoneNode(l);if(u){const h=new g,d=new A;u.updateWorldMatrix(!0,!1),u.matrixWorld.decompose(h,d,Ve),i[l]=h,r[l]=u.quaternion.clone();const c=new A;(s=u.parent)==null||s.matrixWorld.decompose(Ve,c,Ve),o[l]=c}});const a={};return Ne.forEach(l=>{var s;const u=t.getBoneNode(l);if(u){const h=i[l];let d=l,c;for(;c==null&&(d=Wi[d],d!=null);)c=i[d];const p=new Pe;p.name="Normalized_"+u.name,(d?(s=a[d])==null?void 0:s.node:n).add(p),p.position.copy(h),c&&p.position.sub(c),a[l]={node:p}}}),{rigBones:a,root:n,parentWorldRotations:o,boneRotations:r}}constructor(t){const{rigBones:n,root:i,parentWorldRotations:r,boneRotations:o}=Nn._setupTransforms(t);super(n),this.original=t,this.root=i,this._parentWorldRotations=r,this._boneRotations=o}update(){Ne.forEach(t=>{const n=this.original.getBoneNode(t);if(n!=null){const i=this.getBoneNode(t),r=this._parentWorldRotations[t],o=zi.copy(r).invert(),a=this._boneRotations[t];if(n.quaternion.copy(i.quaternion).multiply(r).premultiply(o).multiply(a),t==="hips"){const l=i.getWorldPosition(ji);n.parent.updateWorldMatrix(!0,!1);const s=n.parent.matrixWorld,u=l.applyMatrix4(s.invert());n.position.copy(u)}}})}},Jt=class Vn{get restPose(){return console.warn("VRMHumanoid: restPose is deprecated. Use either rawRestPose or normalizedRestPose instead."),this.rawRestPose}get rawRestPose(){return this._rawHumanBones.restPose}get normalizedRestPose(){return this._normalizedHumanBones.restPose}get humanBones(){return this._rawHumanBones.humanBones}get rawHumanBones(){return this._rawHumanBones.humanBones}get normalizedHumanBones(){return this._normalizedHumanBones.humanBones}get normalizedHumanBonesRoot(){return this._normalizedHumanBones.root}constructor(t,n){var i;this.autoUpdateHumanBones=(i=n==null?void 0:n.autoUpdateHumanBones)!=null?i:!0,this._rawHumanBones=new qe(t),this._normalizedHumanBones=new Zt(this._rawHumanBones)}copy(t){return this.autoUpdateHumanBones=t.autoUpdateHumanBones,this._rawHumanBones=new qe(t.humanBones),this._normalizedHumanBones=new Zt(this._rawHumanBones),this}clone(){return new Vn(this.humanBones,{autoUpdateHumanBones:this.autoUpdateHumanBones}).copy(this)}getAbsolutePose(){return console.warn("VRMHumanoid: getAbsolutePose() is deprecated. Use either getRawAbsolutePose() or getNormalizedAbsolutePose() instead."),this.getRawAbsolutePose()}getRawAbsolutePose(){return this._rawHumanBones.getAbsolutePose()}getNormalizedAbsolutePose(){return this._normalizedHumanBones.getAbsolutePose()}getPose(){return console.warn("VRMHumanoid: getPose() is deprecated. Use either getRawPose() or getNormalizedPose() instead."),this.getRawPose()}getRawPose(){return this._rawHumanBones.getPose()}getNormalizedPose(){return this._normalizedHumanBones.getPose()}setPose(t){return console.warn("VRMHumanoid: setPose() is deprecated. Use either setRawPose() or setNormalizedPose() instead."),this.setRawPose(t)}setRawPose(t){return this._rawHumanBones.setPose(t)}setNormalizedPose(t){return this._normalizedHumanBones.setPose(t)}resetPose(){return console.warn("VRMHumanoid: resetPose() is deprecated. Use either resetRawPose() or resetNormalizedPose() instead."),this.resetRawPose()}resetRawPose(){return this._rawHumanBones.resetPose()}resetNormalizedPose(){return this._normalizedHumanBones.resetPose()}getBone(t){return console.warn("VRMHumanoid: getBone() is deprecated. Use either getRawBone() or getNormalizedBone() instead."),this.getRawBone(t)}getRawBone(t){return this._rawHumanBones.getBone(t)}getNormalizedBone(t){return this._normalizedHumanBones.getBone(t)}getBoneNode(t){return console.warn("VRMHumanoid: getBoneNode() is deprecated. Use either getRawBoneNode() or getNormalizedBoneNode() instead."),this.getRawBoneNode(t)}getRawBoneNode(t){return this._rawHumanBones.getBoneNode(t)}getNormalizedBoneNode(t){return this._normalizedHumanBones.getBoneNode(t)}update(){this.autoUpdateHumanBones&&this._normalizedHumanBones.update()}},Xi={Hips:"hips",Spine:"spine",Head:"head",LeftUpperLeg:"leftUpperLeg",LeftLowerLeg:"leftLowerLeg",LeftFoot:"leftFoot",RightUpperLeg:"rightUpperLeg",RightLowerLeg:"rightLowerLeg",RightFoot:"rightFoot",LeftUpperArm:"leftUpperArm",LeftLowerArm:"leftLowerArm",LeftHand:"leftHand",RightUpperArm:"rightUpperArm",RightLowerArm:"rightLowerArm",RightHand:"rightHand"},Yi=new Set(["1.0","1.0-beta"]),Kt={leftThumbProximal:"leftThumbMetacarpal",leftThumbIntermediate:"leftThumbProximal",rightThumbProximal:"rightThumbMetacarpal",rightThumbIntermediate:"rightThumbProximal"},Dn=class{get name(){return"VRMHumanoidLoaderPlugin"}constructor(e,t){this.parser=e,this.helperRoot=t==null?void 0:t.helperRoot,this.autoUpdateHumanBones=t==null?void 0:t.autoUpdateHumanBones}afterRoot(e){return P(this,null,function*(){e.userData.vrmHumanoid=yield this._import(e)})}_import(e){return P(this,null,function*(){const t=yield this._v1Import(e);if(t)return t;const n=yield this._v0Import(e);return n||null})}_v1Import(e){return P(this,null,function*(){var t,n;const i=this.parser.json;if(!(((t=i.extensionsUsed)==null?void 0:t.indexOf("VRMC_vrm"))!==-1))return null;const o=(n=i.extensions)==null?void 0:n.VRMC_vrm;if(!o)return null;const a=o.specVersion;if(!Yi.has(a))return console.warn(`VRMHumanoidLoaderPlugin: Unknown VRMC_vrm specVersion "${a}"`),null;const l=o.humanoid;if(!l)return null;const s=l.humanBones.leftThumbIntermediate!=null||l.humanBones.rightThumbIntermediate!=null,u={};l.humanBones!=null&&(yield Promise.all(Object.entries(l.humanBones).map(d=>P(this,[d],function*([c,p]){let f=c;const m=p.node;if(s){const x=Kt[f];x!=null&&(f=x)}const _=yield this.parser.getDependency("node",m);if(_==null){console.warn(`A glTF node bound to the humanoid bone ${f} (index = ${m}) does not exist`);return}u[f]={node:_}}))));const h=new Jt(this._ensureRequiredBonesExist(u),{autoUpdateHumanBones:this.autoUpdateHumanBones});if(e.scene.add(h.normalizedHumanBonesRoot),this.helperRoot){const d=new $t(h);this.helperRoot.add(d),d.renderOrder=this.helperRoot.renderOrder}return h})}_v0Import(e){return P(this,null,function*(){var t;const i=(t=this.parser.json.extensions)==null?void 0:t.VRM;if(!i)return null;const r=i.humanoid;if(!r)return null;const o={};r.humanBones!=null&&(yield Promise.all(r.humanBones.map(l=>P(this,null,function*(){const s=l.bone,u=l.node;if(s==null||u==null)return;const h=yield this.parser.getDependency("node",u);if(h==null){console.warn(`A glTF node bound to the humanoid bone ${s} (index = ${u}) does not exist`);return}const d=Kt[s],c=d??s;if(o[c]!=null){console.warn(`Multiple bone entries for ${c} detected (index = ${u}), ignoring duplicated entries.`);return}o[c]={node:h}}))));const a=new Jt(this._ensureRequiredBonesExist(o),{autoUpdateHumanBones:this.autoUpdateHumanBones});if(e.scene.add(a.normalizedHumanBonesRoot),this.helperRoot){const l=new $t(a);this.helperRoot.add(l),l.renderOrder=this.helperRoot.renderOrder}return a})}_ensureRequiredBonesExist(e){const t=Object.values(Xi).filter(n=>e[n]==null);if(t.length>0)throw new Error(`VRMHumanoidLoaderPlugin: These humanoid bones are required but not exist: ${t.join(", ")}`);return e}},en=class extends Y{constructor(){super(),this._currentTheta=0,this._currentRadius=0,this.theta=0,this.radius=0,this._currentTheta=0,this._currentRadius=0,this._attrPos=new U(new Float32Array(195),3),this.setAttribute("position",this._attrPos),this._attrIndex=new U(new Uint16Array(189),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let e=!1;this._currentTheta!==this.theta&&(this._currentTheta=this.theta,e=!0),this._currentRadius!==this.radius&&(this._currentRadius=this.radius,e=!0),e&&this._buildPosition()}_buildPosition(){this._attrPos.setXYZ(0,0,0,0);for(let e=0;e<64;e++){const t=e/63*this._currentTheta;this._attrPos.setXYZ(e+1,this._currentRadius*Math.sin(t),0,this._currentRadius*Math.cos(t))}this._attrPos.needsUpdate=!0}_buildIndex(){for(let e=0;e<63;e++)this._attrIndex.setXYZ(e*3,0,e+1,e+2);this._attrIndex.needsUpdate=!0}},Gi=class extends Y{constructor(){super(),this.radius=0,this._currentRadius=0,this.tail=new g,this._currentTail=new g,this._attrPos=new U(new Float32Array(294),3),this.setAttribute("position",this._attrPos),this._attrIndex=new U(new Uint16Array(194),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let e=!1;this._currentRadius!==this.radius&&(this._currentRadius=this.radius,e=!0),this._currentTail.equals(this.tail)||(this._currentTail.copy(this.tail),e=!0),e&&this._buildPosition()}_buildPosition(){for(let e=0;e<32;e++){const t=e/16*Math.PI;this._attrPos.setXYZ(e,Math.cos(t),Math.sin(t),0),this._attrPos.setXYZ(32+e,0,Math.cos(t),Math.sin(t)),this._attrPos.setXYZ(64+e,Math.sin(t),0,Math.cos(t))}this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.setXYZ(96,0,0,0),this._attrPos.setXYZ(97,this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let e=0;e<32;e++){const t=(e+1)%32;this._attrIndex.setXY(e*2,e,t),this._attrIndex.setXY(64+e*2,32+e,32+t),this._attrIndex.setXY(128+e*2,64+e,64+t)}this._attrIndex.setXY(192,96,97),this._attrIndex.needsUpdate=!0}},ye=new A,tn=new A,he=new g,nn=new g,rn=Math.sqrt(2)/2,qi=new A(0,0,-rn,rn),Qi=new g(0,1,0),$i=class extends se{constructor(e){super(),this.matrixAutoUpdate=!1,this.vrmLookAt=e;{const t=new en;t.radius=.5;const n=new Dt({color:65280,transparent:!0,opacity:.5,side:Bt,depthTest:!1,depthWrite:!1});this._meshPitch=new Ft(t,n),this.add(this._meshPitch)}{const t=new en;t.radius=.5;const n=new Dt({color:16711680,transparent:!0,opacity:.5,side:Bt,depthTest:!1,depthWrite:!1});this._meshYaw=new Ft(t,n),this.add(this._meshYaw)}{const t=new Gi;t.radius=.1;const n=new Ce({color:16777215,depthTest:!1,depthWrite:!1});this._lineTarget=new tt(t,n),this._lineTarget.frustumCulled=!1,this.add(this._lineTarget)}}dispose(){this._meshYaw.geometry.dispose(),this._meshYaw.material.dispose(),this._meshPitch.geometry.dispose(),this._meshPitch.material.dispose(),this._lineTarget.geometry.dispose(),this._lineTarget.material.dispose()}updateMatrixWorld(e){const t=C.DEG2RAD*this.vrmLookAt.yaw;this._meshYaw.geometry.theta=t,this._meshYaw.geometry.update();const n=C.DEG2RAD*this.vrmLookAt.pitch;this._meshPitch.geometry.theta=n,this._meshPitch.geometry.update(),this.vrmLookAt.getLookAtWorldPosition(he),this.vrmLookAt.getLookAtWorldQuaternion(ye),ye.multiply(this.vrmLookAt.getFaceFrontQuaternion(tn)),this._meshYaw.position.copy(he),this._meshYaw.quaternion.copy(ye),this._meshPitch.position.copy(he),this._meshPitch.quaternion.copy(ye),this._meshPitch.quaternion.multiply(tn.setFromAxisAngle(Qi,t)),this._meshPitch.quaternion.multiply(qi);const{target:i,autoUpdate:r}=this.vrmLookAt;i!=null&&r&&(i.getWorldPosition(nn).sub(he),this._lineTarget.geometry.tail.copy(nn),this._lineTarget.geometry.update(),this._lineTarget.position.copy(he)),super.updateMatrixWorld(e)}},Zi=new g,Ji=new g;function Qe(e,t){return e.matrixWorld.decompose(Zi,t,Ji),t}function Te(e){return[Math.atan2(-e.z,e.x),Math.atan2(e.y,Math.sqrt(e.x*e.x+e.z*e.z))]}function on(e){const t=Math.round(e/2/Math.PI);return e-2*Math.PI*t}var sn=new g(0,0,1),Ki=new g,er=new g,tr=new g,nr=new A,De=new A,an=new A,ir=new A,Be=new et,Bn=class Fn{constructor(t,n){this.offsetFromHeadBone=new g,this.autoUpdate=!0,this.faceFront=new g(0,0,1),this.humanoid=t,this.applier=n,this._yaw=0,this._pitch=0,this._needsUpdate=!0,this._restHeadWorldQuaternion=this.getLookAtWorldQuaternion(new A)}get yaw(){return this._yaw}set yaw(t){this._yaw=t,this._needsUpdate=!0}get pitch(){return this._pitch}set pitch(t){this._pitch=t,this._needsUpdate=!0}get euler(){return console.warn("VRMLookAt: euler is deprecated. use getEuler() instead."),this.getEuler(new et)}getEuler(t){return t.set(C.DEG2RAD*this._pitch,C.DEG2RAD*this._yaw,0,"YXZ")}copy(t){if(this.humanoid!==t.humanoid)throw new Error("VRMLookAt: humanoid must be same in order to copy");return this.offsetFromHeadBone.copy(t.offsetFromHeadBone),this.applier=t.applier,this.autoUpdate=t.autoUpdate,this.target=t.target,this.faceFront.copy(t.faceFront),this}clone(){return new Fn(this.humanoid,this.applier).copy(this)}reset(){this._yaw=0,this._pitch=0,this._needsUpdate=!0}getLookAtWorldPosition(t){const n=this.humanoid.getRawBoneNode("head");return t.copy(this.offsetFromHeadBone).applyMatrix4(n.matrixWorld)}getLookAtWorldQuaternion(t){const n=this.humanoid.getRawBoneNode("head");return Qe(n,t)}getFaceFrontQuaternion(t){if(this.faceFront.distanceToSquared(sn)<.01)return t.copy(this._restHeadWorldQuaternion).invert();const[n,i]=Te(this.faceFront);return Be.set(0,.5*Math.PI+n,i,"YZX"),t.setFromEuler(Be).premultiply(ir.copy(this._restHeadWorldQuaternion).invert())}getLookAtWorldDirection(t){return this.getLookAtWorldQuaternion(De),this.getFaceFrontQuaternion(an),t.copy(sn).applyQuaternion(De).applyQuaternion(an).applyEuler(this.getEuler(Be))}lookAt(t){const n=nr.copy(this._restHeadWorldQuaternion).multiply(On(this.getLookAtWorldQuaternion(De))),i=this.getLookAtWorldPosition(er),r=tr.copy(t).sub(i).applyQuaternion(n).normalize(),[o,a]=Te(this.faceFront),[l,s]=Te(r),u=on(l-o),h=on(a-s);this._yaw=C.RAD2DEG*u,this._pitch=C.RAD2DEG*h,this._needsUpdate=!0}update(t){this.target!=null&&this.autoUpdate&&this.lookAt(this.target.getWorldPosition(Ki)),this._needsUpdate&&(this._needsUpdate=!1,this.applier.applyYawPitch(this._yaw,this._pitch))}};Bn.EULER_ORDER="YXZ";var rr=Bn,or=new g(0,0,1),H=new A,te=new A,V=new et(0,0,0,"YXZ"),Se=class{constructor(e,t,n,i,r){this.humanoid=e,this.rangeMapHorizontalInner=t,this.rangeMapHorizontalOuter=n,this.rangeMapVerticalDown=i,this.rangeMapVerticalUp=r,this.faceFront=new g(0,0,1),this._restQuatLeftEye=new A,this._restQuatRightEye=new A,this._restLeftEyeParentWorldQuat=new A,this._restRightEyeParentWorldQuat=new A;const o=this.humanoid.getRawBoneNode("leftEye"),a=this.humanoid.getRawBoneNode("rightEye");o&&(this._restQuatLeftEye.copy(o.quaternion),Qe(o.parent,this._restLeftEyeParentWorldQuat)),a&&(this._restQuatRightEye.copy(a.quaternion),Qe(a.parent,this._restRightEyeParentWorldQuat))}applyYawPitch(e,t){const n=this.humanoid.getRawBoneNode("leftEye"),i=this.humanoid.getRawBoneNode("rightEye"),r=this.humanoid.getNormalizedBoneNode("leftEye"),o=this.humanoid.getNormalizedBoneNode("rightEye");n&&(t<0?V.x=-C.DEG2RAD*this.rangeMapVerticalDown.map(-t):V.x=C.DEG2RAD*this.rangeMapVerticalUp.map(t),e<0?V.y=-C.DEG2RAD*this.rangeMapHorizontalInner.map(-e):V.y=C.DEG2RAD*this.rangeMapHorizontalOuter.map(e),H.setFromEuler(V),this._getWorldFaceFrontQuat(te),r.quaternion.copy(te).multiply(H).multiply(te.invert()),H.copy(this._restLeftEyeParentWorldQuat),n.quaternion.copy(r.quaternion).multiply(H).premultiply(H.invert()).multiply(this._restQuatLeftEye)),i&&(t<0?V.x=-C.DEG2RAD*this.rangeMapVerticalDown.map(-t):V.x=C.DEG2RAD*this.rangeMapVerticalUp.map(t),e<0?V.y=-C.DEG2RAD*this.rangeMapHorizontalOuter.map(-e):V.y=C.DEG2RAD*this.rangeMapHorizontalInner.map(e),H.setFromEuler(V),this._getWorldFaceFrontQuat(te),o.quaternion.copy(te).multiply(H).multiply(te.invert()),H.copy(this._restRightEyeParentWorldQuat),i.quaternion.copy(o.quaternion).multiply(H).premultiply(H.invert()).multiply(this._restQuatRightEye))}lookAt(e){console.warn("VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.");const t=C.RAD2DEG*e.y,n=C.RAD2DEG*e.x;this.applyYawPitch(t,n)}_getWorldFaceFrontQuat(e){if(this.faceFront.distanceToSquared(or)<.01)return e.identity();const[t,n]=Te(this.faceFront);return V.set(0,.5*Math.PI+t,n,"YZX"),e.setFromEuler(V)}};Se.type="bone";var $e=class{constructor(e,t,n,i,r){this.expressions=e,this.rangeMapHorizontalInner=t,this.rangeMapHorizontalOuter=n,this.rangeMapVerticalDown=i,this.rangeMapVerticalUp=r}applyYawPitch(e,t){t<0?(this.expressions.setValue("lookDown",0),this.expressions.setValue("lookUp",this.rangeMapVerticalUp.map(-t))):(this.expressions.setValue("lookUp",0),this.expressions.setValue("lookDown",this.rangeMapVerticalDown.map(t))),e<0?(this.expressions.setValue("lookLeft",0),this.expressions.setValue("lookRight",this.rangeMapHorizontalOuter.map(-e))):(this.expressions.setValue("lookRight",0),this.expressions.setValue("lookLeft",this.rangeMapHorizontalOuter.map(e)))}lookAt(e){console.warn("VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.");const t=C.RAD2DEG*e.y,n=C.RAD2DEG*e.x;this.applyYawPitch(t,n)}};$e.type="expression";var ln=class{constructor(e,t){this.inputMaxValue=e,this.outputScale=t}map(e){return this.outputScale*Tn(e/this.inputMaxValue)}},sr=new Set(["1.0","1.0-beta"]),Re=.01,Hn=class{get name(){return"VRMLookAtLoaderPlugin"}constructor(e,t){this.parser=e,this.helperRoot=t==null?void 0:t.helperRoot}afterRoot(e){return P(this,null,function*(){const t=e.userData.vrmHumanoid;if(t===null)return;if(t===void 0)throw new Error("VRMLookAtLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first");const n=e.userData.vrmExpressionManager;if(n!==null){if(n===void 0)throw new Error("VRMLookAtLoaderPlugin: vrmExpressionManager is undefined. VRMExpressionLoaderPlugin have to be used first");e.userData.vrmLookAt=yield this._import(e,t,n)}})}_import(e,t,n){return P(this,null,function*(){if(t==null||n==null)return null;const i=yield this._v1Import(e,t,n);if(i)return i;const r=yield this._v0Import(e,t,n);return r||null})}_v1Import(e,t,n){return P(this,null,function*(){var i,r,o;const a=this.parser.json;if(!(((i=a.extensionsUsed)==null?void 0:i.indexOf("VRMC_vrm"))!==-1))return null;const s=(r=a.extensions)==null?void 0:r.VRMC_vrm;if(!s)return null;const u=s.specVersion;if(!sr.has(u))return console.warn(`VRMLookAtLoaderPlugin: Unknown VRMC_vrm specVersion "${u}"`),null;const h=s.lookAt;if(!h)return null;const d=h.type==="expression"?1:10,c=this._v1ImportRangeMap(h.rangeMapHorizontalInner,d),p=this._v1ImportRangeMap(h.rangeMapHorizontalOuter,d),f=this._v1ImportRangeMap(h.rangeMapVerticalDown,d),m=this._v1ImportRangeMap(h.rangeMapVerticalUp,d);let _;h.type==="expression"?_=new $e(n,c,p,f,m):_=new Se(t,c,p,f,m);const x=this._importLookAt(t,_);return x.offsetFromHeadBone.fromArray((o=h.offsetFromHeadBone)!=null?o:[0,.06,0]),x})}_v1ImportRangeMap(e,t){var n,i;let r=(n=e==null?void 0:e.inputMaxValue)!=null?n:90;const o=(i=e==null?void 0:e.outputScale)!=null?i:t;return r<Re&&(console.warn("VRMLookAtLoaderPlugin: inputMaxValue of a range map is too small. Consider reviewing the range map!"),r=Re),new ln(r,o)}_v0Import(e,t,n){return P(this,null,function*(){var i,r,o,a;const s=(i=this.parser.json.extensions)==null?void 0:i.VRM;if(!s)return null;const u=s.firstPerson;if(!u)return null;const h=u.lookAtTypeName==="BlendShape"?1:10,d=this._v0ImportDegreeMap(u.lookAtHorizontalInner,h),c=this._v0ImportDegreeMap(u.lookAtHorizontalOuter,h),p=this._v0ImportDegreeMap(u.lookAtVerticalDown,h),f=this._v0ImportDegreeMap(u.lookAtVerticalUp,h);let m;u.lookAtTypeName==="BlendShape"?m=new $e(n,d,c,p,f):m=new Se(t,d,c,p,f);const _=this._importLookAt(t,m);return u.firstPersonBoneOffset?_.offsetFromHeadBone.set((r=u.firstPersonBoneOffset.x)!=null?r:0,(o=u.firstPersonBoneOffset.y)!=null?o:.06,-((a=u.firstPersonBoneOffset.z)!=null?a:0)):_.offsetFromHeadBone.set(0,.06,0),_.faceFront.set(0,0,-1),m instanceof Se&&m.faceFront.set(0,0,-1),_})}_v0ImportDegreeMap(e,t){var n,i;const r=e==null?void 0:e.curve;JSON.stringify(r)!=="[0,0,0,1,1,1,1,0]"&&console.warn("Curves of LookAtDegreeMap defined in VRM 0.0 are not supported");let o=(n=e==null?void 0:e.xRange)!=null?n:90;const a=(i=e==null?void 0:e.yRange)!=null?i:t;return o<Re&&(console.warn("VRMLookAtLoaderPlugin: xRange of a degree map is too small. Consider reviewing the degree map!"),o=Re),new ln(o,a)}_importLookAt(e,t){const n=new rr(e,t);if(this.helperRoot){const i=new $i(n);this.helperRoot.add(i),i.renderOrder=this.helperRoot.renderOrder}return n}},zo={Bone:"bone",Expression:"expression"};function ar(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}var lr=new Set(["1.0","1.0-beta"]),kn=class{get name(){return"VRMMetaLoaderPlugin"}constructor(e,t){var n,i,r;this.parser=e,this.needThumbnailImage=(n=t==null?void 0:t.needThumbnailImage)!=null?n:!1,this.acceptLicenseUrls=(i=t==null?void 0:t.acceptLicenseUrls)!=null?i:["https://vrm.dev/licenses/1.0/"],this.acceptV0Meta=(r=t==null?void 0:t.acceptV0Meta)!=null?r:!0}afterRoot(e){return P(this,null,function*(){e.userData.vrmMeta=yield this._import(e)})}_import(e){return P(this,null,function*(){const t=yield this._v1Import(e);if(t!=null)return t;const n=yield this._v0Import(e);return n??null})}_v1Import(e){return P(this,null,function*(){var t,n,i;const r=this.parser.json;if(!(((t=r.extensionsUsed)==null?void 0:t.indexOf("VRMC_vrm"))!==-1))return null;const a=(n=r.extensions)==null?void 0:n.VRMC_vrm;if(a==null)return null;const l=a.specVersion;if(!lr.has(l))return console.warn(`VRMMetaLoaderPlugin: Unknown VRMC_vrm specVersion "${l}"`),null;const s=a.meta;if(!s)return null;const u=s.licenseUrl;if(!new Set(this.acceptLicenseUrls).has(u))throw new Error(`VRMMetaLoaderPlugin: The license url "${u}" is not accepted`);let d;return this.needThumbnailImage&&s.thumbnailImage!=null&&(d=(i=yield this._extractGLTFImage(s.thumbnailImage))!=null?i:void 0),{metaVersion:"1",name:s.name,version:s.version,authors:s.authors,copyrightInformation:s.copyrightInformation,contactInformation:s.contactInformation,references:s.references,thirdPartyLicenses:s.thirdPartyLicenses,thumbnailImage:d,licenseUrl:s.licenseUrl,avatarPermission:s.avatarPermission,allowExcessivelyViolentUsage:s.allowExcessivelyViolentUsage,allowExcessivelySexualUsage:s.allowExcessivelySexualUsage,commercialUsage:s.commercialUsage,allowPoliticalOrReligiousUsage:s.allowPoliticalOrReligiousUsage,allowAntisocialOrHateUsage:s.allowAntisocialOrHateUsage,creditNotation:s.creditNotation,allowRedistribution:s.allowRedistribution,modification:s.modification,otherLicenseUrl:s.otherLicenseUrl}})}_v0Import(e){return P(this,null,function*(){var t;const i=(t=this.parser.json.extensions)==null?void 0:t.VRM;if(!i)return null;const r=i.meta;if(!r)return null;if(!this.acceptV0Meta)throw new Error("VRMMetaLoaderPlugin: Attempted to load VRM0.0 meta but acceptV0Meta is false");let o;return this.needThumbnailImage&&r.texture!=null&&r.texture!==-1&&(o=yield this.parser.getDependency("texture",r.texture)),{metaVersion:"0",allowedUserName:r.allowedUserName,author:r.author,commercialUssageName:r.commercialUssageName,contactInformation:r.contactInformation,licenseName:r.licenseName,otherLicenseUrl:r.otherLicenseUrl,otherPermissionUrl:r.otherPermissionUrl,reference:r.reference,sexualUssageName:r.sexualUssageName,texture:o??void 0,title:r.title,version:r.version,violentUssageName:r.violentUssageName}})}_extractGLTFImage(e){return P(this,null,function*(){var t;const i=(t=this.parser.json.images)==null?void 0:t[e];if(i==null)return console.warn(`VRMMetaLoaderPlugin: Attempt to use images[${e}] of glTF as a thumbnail but the image doesn't exist`),null;let r=i.uri;if(i.bufferView!=null){const a=yield this.parser.getDependency("bufferView",i.bufferView),l=new Blob([a],{type:i.mimeType});r=URL.createObjectURL(l)}return r==null?(console.warn(`VRMMetaLoaderPlugin: Attempt to use images[${e}] of glTF as a thumbnail but the image couldn't load properly`),null):yield new Vi().loadAsync(ar(r,this.parser.options.path)).catch(a=>(console.error(a),console.warn("VRMMetaLoaderPlugin: Failed to load a thumbnail image"),null))})}},Wn=class{constructor(e){this.scene=e.scene,this.meta=e.meta,this.humanoid=e.humanoid,this.expressionManager=e.expressionManager,this.firstPerson=e.firstPerson,this.lookAt=e.lookAt}update(e){this.humanoid.update(),this.lookAt&&this.lookAt.update(e),this.expressionManager&&this.expressionManager.update()}},jo=class{get name(){return"VRMC_vrm"}constructor(e,t){var n,i,r,o,a;this.parser=e;const l=t==null?void 0:t.helperRoot,s=t==null?void 0:t.autoUpdateHumanBones;this.expressionPlugin=(n=t==null?void 0:t.expressionPlugin)!=null?n:new Cn(e),this.firstPersonPlugin=(i=t==null?void 0:t.firstPersonPlugin)!=null?i:new Un(e),this.humanoidPlugin=(r=t==null?void 0:t.humanoidPlugin)!=null?r:new Dn(e,{helperRoot:l,autoUpdateHumanBones:s}),this.lookAtPlugin=(o=t==null?void 0:t.lookAtPlugin)!=null?o:new Hn(e,{helperRoot:l}),this.metaPlugin=(a=t==null?void 0:t.metaPlugin)!=null?a:new kn(e)}afterRoot(e){return P(this,null,function*(){yield this.metaPlugin.afterRoot(e),yield this.humanoidPlugin.afterRoot(e),yield this.expressionPlugin.afterRoot(e),yield this.lookAtPlugin.afterRoot(e),yield this.firstPersonPlugin.afterRoot(e);const t=e.userData.vrmMeta,n=e.userData.vrmHumanoid;if(t&&n){const i=new Wn({scene:e.scene,expressionManager:e.userData.vrmExpressionManager,firstPerson:e.userData.vrmFirstPerson,humanoid:n,lookAt:e.userData.vrmLookAt,meta:t});e.userData.vrmCore=i}})}},ur=class extends Wn{constructor(e){super(e),this.materials=e.materials,this.springBoneManager=e.springBoneManager,this.nodeConstraintManager=e.nodeConstraintManager}update(e){super.update(e),this.nodeConstraintManager&&this.nodeConstraintManager.update(),this.springBoneManager&&this.springBoneManager.update(e),this.materials&&this.materials.forEach(t=>{t.update&&t.update(e)})}},dr=Object.defineProperty,un=Object.getOwnPropertySymbols,hr=Object.prototype.hasOwnProperty,cr=Object.prototype.propertyIsEnumerable,dn=(e,t,n)=>t in e?dr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,hn=(e,t)=>{for(var n in t||(t={}))hr.call(t,n)&&dn(e,n,t[n]);if(un)for(var n of un(t))cr.call(t,n)&&dn(e,n,t[n]);return e},K=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())}),pr={"":3e3,srgb:3001};function mr(e,t){parseInt(Ae,10)>=152?e.colorSpace=t:e.encoding=pr[t]}var fr=class{get pending(){return Promise.all(this._pendings)}constructor(e,t){this._parser=e,this._materialParams=t,this._pendings=[]}assignPrimitive(e,t){t!=null&&(this._materialParams[e]=t)}assignColor(e,t,n){if(t!=null){const i=new D().fromArray(t);n&&i.convertSRGBToLinear(),this._materialParams[e]=i}}assignTexture(e,t,n){return K(this,null,function*(){const i=K(this,null,function*(){t!=null&&(yield this._parser.assignTexture(this._materialParams,e,t),n&&mr(this._materialParams[e],"srgb"))});return this._pendings.push(i),i})}assignTextureByIndex(e,t,n){return K(this,null,function*(){return this.assignTexture(e,t!=null?{index:t}:void 0,n)})}},_r=`// #define PHONG

varying vec3 vViewPosition;

#ifndef FLAT_SHADED
  varying vec3 vNormal;
#endif

#include <common>

// #include <uv_pars_vertex>
#ifdef MTOON_USE_UV
  varying vec2 vUv;

  // COMPAT: pre-r151 uses a common uvTransform
  #if THREE_VRM_THREE_REVISION < 151
    uniform mat3 uvTransform;
  #endif
#endif

// #include <uv2_pars_vertex>
// COMAPT: pre-r151 uses uv2 for lightMap and aoMap
#if THREE_VRM_THREE_REVISION < 151
  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
    attribute vec2 uv2;
    varying vec2 vUv2;
    uniform mat3 uv2Transform;
  #endif
#endif

// #include <displacementmap_pars_vertex>
// #include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE
  uniform sampler2D outlineWidthMultiplyTexture;
  uniform mat3 outlineWidthMultiplyTextureUvTransform;
#endif

uniform float outlineWidthFactor;

void main() {

  // #include <uv_vertex>
  #ifdef MTOON_USE_UV
    // COMPAT: pre-r151 uses a common uvTransform
    #if THREE_VRM_THREE_REVISION >= 151
      vUv = uv;
    #else
      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
    #endif
  #endif

  // #include <uv2_vertex>
  // COMAPT: pre-r151 uses uv2 for lightMap and aoMap
  #if THREE_VRM_THREE_REVISION < 151
    #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
      vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
    #endif
  #endif

  #include <color_vertex>

  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>

  // we need this to compute the outline properly
  objectNormal = normalize( objectNormal );

  #include <defaultnormal_vertex>

  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
    vNormal = normalize( transformedNormal );
  #endif

  #include <begin_vertex>

  #include <morphtarget_vertex>
  #include <skinning_vertex>
  // #include <displacementmap_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>

  vViewPosition = - mvPosition.xyz;

  #ifdef OUTLINE
    float worldNormalLength = length( transformedNormal );
    vec3 outlineOffset = outlineWidthFactor * worldNormalLength * objectNormal;

    #ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE
      vec2 outlineWidthMultiplyTextureUv = ( outlineWidthMultiplyTextureUvTransform * vec3( vUv, 1 ) ).xy;
      float outlineTex = texture2D( outlineWidthMultiplyTexture, outlineWidthMultiplyTextureUv ).g;
      outlineOffset *= outlineTex;
    #endif

    #ifdef OUTLINE_WIDTH_SCREEN
      outlineOffset *= vViewPosition.z / projectionMatrix[ 1 ].y;
    #endif

    gl_Position = projectionMatrix * modelViewMatrix * vec4( outlineOffset + transformed, 1.0 );

    gl_Position.z += 1E-6 * gl_Position.w; // anti-artifact magic
  #endif

  #include <worldpos_vertex>
  // #include <envmap_vertex>
  #include <shadowmap_vertex>
  #include <fog_vertex>

}`,gr=`// #define PHONG

uniform vec3 litFactor;

uniform float opacity;

uniform vec3 shadeColorFactor;
#ifdef USE_SHADEMULTIPLYTEXTURE
  uniform sampler2D shadeMultiplyTexture;
  uniform mat3 shadeMultiplyTextureUvTransform;
#endif

uniform float shadingShiftFactor;
uniform float shadingToonyFactor;

#ifdef USE_SHADINGSHIFTTEXTURE
  uniform sampler2D shadingShiftTexture;
  uniform mat3 shadingShiftTextureUvTransform;
  uniform float shadingShiftTextureScale;
#endif

uniform float giEqualizationFactor;

uniform vec3 parametricRimColorFactor;
#ifdef USE_RIMMULTIPLYTEXTURE
  uniform sampler2D rimMultiplyTexture;
  uniform mat3 rimMultiplyTextureUvTransform;
#endif
uniform float rimLightingMixFactor;
uniform float parametricRimFresnelPowerFactor;
uniform float parametricRimLiftFactor;

#ifdef USE_MATCAPTEXTURE
  uniform vec3 matcapFactor;
  uniform sampler2D matcapTexture;
  uniform mat3 matcapTextureUvTransform;
#endif

uniform vec3 emissive;
uniform float emissiveIntensity;

uniform vec3 outlineColorFactor;
uniform float outlineLightingMixFactor;

#ifdef USE_UVANIMATIONMASKTEXTURE
  uniform sampler2D uvAnimationMaskTexture;
  uniform mat3 uvAnimationMaskTextureUvTransform;
#endif

uniform float uvAnimationScrollXOffset;
uniform float uvAnimationScrollYOffset;
uniform float uvAnimationRotationPhase;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>

// #include <uv_pars_fragment>
#if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )
  varying vec2 vUv;
#endif

// #include <uv2_pars_fragment>
// COMAPT: pre-r151 uses uv2 for lightMap and aoMap
#if THREE_VRM_THREE_REVISION < 151
  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
    varying vec2 vUv2;
  #endif
#endif

#include <map_pars_fragment>

#ifdef USE_MAP
  uniform mat3 mapUvTransform;
#endif

// #include <alphamap_pars_fragment>

#include <alphatest_pars_fragment>

#include <aomap_pars_fragment>
// #include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>

#ifdef USE_EMISSIVEMAP
  uniform mat3 emissiveMapUvTransform;
#endif

// #include <envmap_common_pars_fragment>
// #include <envmap_pars_fragment>
// #include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>

// #include <bsdfs>
// COMPAT: pre-r151 doesn't have BRDF_Lambert in <common>
#if THREE_VRM_THREE_REVISION < 151
  vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
    return RECIPROCAL_PI * diffuseColor;
  }
#endif

#include <lights_pars_begin>

#include <normal_pars_fragment>

// #include <lights_phong_pars_fragment>
varying vec3 vViewPosition;

struct MToonMaterial {
  vec3 diffuseColor;
  vec3 shadeColor;
  float shadingShift;
};

float linearstep( float a, float b, float t ) {
  return clamp( ( t - a ) / ( b - a ), 0.0, 1.0 );
}

/**
 * Convert NdotL into toon shading factor using shadingShift and shadingToony
 */
float getShading(
  const in float dotNL,
  const in float shadow,
  const in float shadingShift
) {
  float shading = dotNL;
  shading = shading + shadingShift;
  shading = linearstep( -1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading );
  shading *= shadow;
  return shading;
}

/**
 * Mix diffuseColor and shadeColor using shading factor and light color
 */
vec3 getDiffuse(
  const in MToonMaterial material,
  const in float shading,
  in vec3 lightColor
) {
  #ifdef DEBUG_LITSHADERATE
    return vec3( BRDF_Lambert( shading * lightColor ) );
  #endif

  vec3 col = lightColor * BRDF_Lambert( mix( material.shadeColor, material.diffuseColor, shading ) );

  // The "comment out if you want to PBR absolutely" line
  #ifdef V0_COMPAT_SHADE
    col = min( col, material.diffuseColor );
  #endif

  return col;
}

// COMPAT: pre-r156 uses a struct GeometricContext
#if THREE_VRM_THREE_REVISION >= 157
  void RE_Direct_MToon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {
    float dotNL = clamp( dot( geometryNormal, directLight.direction ), -1.0, 1.0 );
    vec3 irradiance = directLight.color;

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;

    irradiance *= dotNL;

    float shading = getShading( dotNL, shadow, material.shadingShift );

    // toon shaded diffuse
    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );
  }

  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {
    // indirect diffuse will use diffuseColor, no shadeColor involved
    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;
  }
#else
  void RE_Direct_MToon( const in IncidentLight directLight, const in GeometricContext geometry, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {
    float dotNL = clamp( dot( geometry.normal, directLight.direction ), -1.0, 1.0 );
    vec3 irradiance = directLight.color;

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;

    irradiance *= dotNL;

    float shading = getShading( dotNL, shadow, material.shadingShift );

    // toon shaded diffuse
    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );
  }

  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in GeometricContext geometry, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {
    // indirect diffuse will use diffuseColor, no shadeColor involved
    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;
  }
#endif

#define RE_Direct RE_Direct_MToon
#define RE_IndirectDiffuse RE_IndirectDiffuse_MToon
#define Material_LightProbeLOD( material ) (0)

#include <shadowmap_pars_fragment>
// #include <bumpmap_pars_fragment>

// #include <normalmap_pars_fragment>
#ifdef USE_NORMALMAP

  uniform sampler2D normalMap;
  uniform mat3 normalMapUvTransform;
  uniform vec2 normalScale;

#endif

// COMPAT: pre-r151
// USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151
#if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )

  uniform mat3 normalMatrix;

#endif

// COMPAT: pre-r151
// USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( TANGENTSPACE_NORMALMAP ) )

  // Per-Pixel Tangent Space Normal Mapping
  // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html

  // three-vrm specific change: it requires \`uv\` as an input in order to support uv scrolls

  // Temporary compat against shader change @ Three.js r126, r151
  #if THREE_VRM_THREE_REVISION >= 151

    mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {

      vec3 q0 = dFdx( eye_pos.xyz );
      vec3 q1 = dFdy( eye_pos.xyz );
      vec2 st0 = dFdx( uv.st );
      vec2 st1 = dFdy( uv.st );

      vec3 N = surf_norm;

      vec3 q1perp = cross( q1, N );
      vec3 q0perp = cross( N, q0 );

      vec3 T = q1perp * st0.x + q0perp * st1.x;
      vec3 B = q1perp * st0.y + q0perp * st1.y;

      float det = max( dot( T, T ), dot( B, B ) );
      float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

      return mat3( T * scale, B * scale, N );

    }

  #else

    vec3 perturbNormal2Arb( vec2 uv, vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {

      vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
      vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
      vec2 st0 = dFdx( uv.st );
      vec2 st1 = dFdy( uv.st );

      vec3 N = normalize( surf_norm );

      vec3 q1perp = cross( q1, N );
      vec3 q0perp = cross( N, q0 );

      vec3 T = q1perp * st0.x + q0perp * st1.x;
      vec3 B = q1perp * st0.y + q0perp * st1.y;

      // three-vrm specific change: Workaround for the issue that happens when delta of uv = 0.0
      // TODO: Is this still required? Or shall I make a PR about it?
      if ( length( T ) == 0.0 || length( B ) == 0.0 ) {
        return surf_norm;
      }

      float det = max( dot( T, T ), dot( B, B ) );
      float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );

      return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );

    }

  #endif

#endif

// #include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

// == post correction ==========================================================
void postCorrection() {
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
  #include <premultiplied_alpha_fragment>
  #include <dithering_fragment>
}

// == main procedure ===========================================================
void main() {
  #include <clipping_planes_fragment>

  vec2 uv = vec2(0.5, 0.5);

  #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )
    uv = vUv;

    float uvAnimMask = 1.0;
    #ifdef USE_UVANIMATIONMASKTEXTURE
      vec2 uvAnimationMaskTextureUv = ( uvAnimationMaskTextureUvTransform * vec3( uv, 1 ) ).xy;
      uvAnimMask = texture2D( uvAnimationMaskTexture, uvAnimationMaskTextureUv ).b;
    #endif

    float uvRotCos = cos( uvAnimationRotationPhase * uvAnimMask );
    float uvRotSin = sin( uvAnimationRotationPhase * uvAnimMask );
    uv = mat2( uvRotCos, -uvRotSin, uvRotSin, uvRotCos ) * ( uv - 0.5 ) + 0.5;
    uv = uv + vec2( uvAnimationScrollXOffset, uvAnimationScrollYOffset ) * uvAnimMask;
  #endif

  #ifdef DEBUG_UV
    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )
      gl_FragColor = vec4( uv, 0.0, 1.0 );
    #endif
    return;
  #endif

  vec4 diffuseColor = vec4( litFactor, opacity );
  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  vec3 totalEmissiveRadiance = emissive * emissiveIntensity;

  #include <logdepthbuf_fragment>

  // #include <map_fragment>
  #ifdef USE_MAP
    vec2 mapUv = ( mapUvTransform * vec3( uv, 1 ) ).xy;
    vec4 sampledDiffuseColor = texture2D( map, mapUv );
    #ifdef DECODE_VIDEO_TEXTURE
      sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
    #endif
    diffuseColor *= sampledDiffuseColor;
  #endif

  // #include <color_fragment>
  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )
    diffuseColor.rgb *= vColor;
  #endif

  // #include <alphamap_fragment>

  #include <alphatest_fragment>

  // #include <specularmap_fragment>

  // #include <normal_fragment_begin>
  float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

  #ifdef FLAT_SHADED

    vec3 fdx = dFdx( vViewPosition );
    vec3 fdy = dFdy( vViewPosition );
    vec3 normal = normalize( cross( fdx, fdy ) );

  #else

    vec3 normal = normalize( vNormal );

    #ifdef DOUBLE_SIDED

      normal *= faceDirection;

    #endif

  #endif

  #ifdef USE_NORMALMAP

    vec2 normalMapUv = ( normalMapUvTransform * vec3( uv, 1 ) ).xy;

  #endif

  #ifdef USE_NORMALMAP_TANGENTSPACE

    #ifdef USE_TANGENT

      mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

    #else

      mat3 tbn = getTangentFrame( - vViewPosition, normal, normalMapUv );

    #endif

    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )

      tbn[0] *= faceDirection;
      tbn[1] *= faceDirection;

    #endif

  #endif

  #ifdef USE_CLEARCOAT_NORMALMAP

    #ifdef USE_TANGENT

      mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

    #else

      mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );

    #endif

    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )

      tbn2[0] *= faceDirection;
      tbn2[1] *= faceDirection;

    #endif

  #endif

  // non perturbed normal for clearcoat among others

  vec3 nonPerturbedNormal = normal;

  #ifdef OUTLINE
    normal *= -1.0;
  #endif

  // #include <normal_fragment_maps>

  // COMPAT: pre-r151
  // USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151
  #if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )

    normal = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

    #ifdef FLIP_SIDED

      normal = - normal;

    #endif

    #ifdef DOUBLE_SIDED

      normal = normal * faceDirection;

    #endif

    normal = normalize( normalMatrix * normal );

  // COMPAT: pre-r151
  // USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151
  #elif defined( USE_NORMALMAP_TANGENTSPACE ) || defined( TANGENTSPACE_NORMALMAP )

    vec3 mapN = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0;
    mapN.xy *= normalScale;

    // COMPAT: pre-r151
    #if THREE_VRM_THREE_REVISION >= 151 || defined( USE_TANGENT )

      normal = normalize( tbn * mapN );

    #else

      normal = perturbNormal2Arb( uv, -vViewPosition, normal, mapN, faceDirection );

    #endif

  #endif

  // #include <emissivemap_fragment>
  #ifdef USE_EMISSIVEMAP
    vec2 emissiveMapUv = ( emissiveMapUvTransform * vec3( uv, 1 ) ).xy;
    totalEmissiveRadiance *= texture2D( emissiveMap, emissiveMapUv ).rgb;
  #endif

  #ifdef DEBUG_NORMAL
    gl_FragColor = vec4( 0.5 + 0.5 * normal, 1.0 );
    return;
  #endif

  // -- MToon: lighting --------------------------------------------------------
  // accumulation
  // #include <lights_phong_fragment>
  MToonMaterial material;

  material.diffuseColor = diffuseColor.rgb;

  material.shadeColor = shadeColorFactor;
  #ifdef USE_SHADEMULTIPLYTEXTURE
    vec2 shadeMultiplyTextureUv = ( shadeMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;
    material.shadeColor *= texture2D( shadeMultiplyTexture, shadeMultiplyTextureUv ).rgb;
  #endif

  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )
    material.shadeColor.rgb *= vColor;
  #endif

  material.shadingShift = shadingShiftFactor;
  #ifdef USE_SHADINGSHIFTTEXTURE
    vec2 shadingShiftTextureUv = ( shadingShiftTextureUvTransform * vec3( uv, 1 ) ).xy;
    material.shadingShift += texture2D( shadingShiftTexture, shadingShiftTextureUv ).r * shadingShiftTextureScale;
  #endif

  // #include <lights_fragment_begin>

  // MToon Specific changes:
  // Since we want to take shadows into account of shading instead of irradiance,
  // we had to modify the codes that multiplies the results of shadowmap into color of direct lights.

  // COMPAT: pre-r156 uses a struct GeometricContext
  #if THREE_VRM_THREE_REVISION >= 157
    vec3 geometryPosition = - vViewPosition;
    vec3 geometryNormal = normal;
    vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

    vec3 geometryClearcoatNormal;

    #ifdef USE_CLEARCOAT

      geometryClearcoatNormal = clearcoatNormal;

    #endif
  #else
    GeometricContext geometry;

    geometry.position = - vViewPosition;
    geometry.normal = normal;
    geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

    #ifdef USE_CLEARCOAT

      geometry.clearcoatNormal = clearcoatNormal;

    #endif
  #endif

  IncidentLight directLight;

  // since these variables will be used in unrolled loop, we have to define in prior
  float shadow;

  #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

    PointLight pointLight;
    #if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
    PointLightShadow pointLightShadow;
    #endif

    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

      pointLight = pointLights[ i ];

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        getPointLightInfo( pointLight, geometryPosition, directLight );
      #else
        getPointLightInfo( pointLight, geometry, directLight );
      #endif

      shadow = 1.0;
      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
      pointLightShadow = pointLightShadows[ i ];
      // COMPAT: pre-r166
      // r166 introduced shadowIntensity
      #if THREE_VRM_THREE_REVISION >= 166
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
      #else
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
      #endif
      #endif

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );
      #else
        RE_Direct( directLight, geometry, material, shadow, reflectedLight );
      #endif

    }
    #pragma unroll_loop_end

  #endif

  #if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

    SpotLight spotLight;
    #if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
    SpotLightShadow spotLightShadow;
    #endif

    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

      spotLight = spotLights[ i ];

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        getSpotLightInfo( spotLight, geometryPosition, directLight );
      #else
        getSpotLightInfo( spotLight, geometry, directLight );
      #endif

      shadow = 1.0;
      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
      spotLightShadow = spotLightShadows[ i ];
      // COMPAT: pre-r166
      // r166 introduced shadowIntensity
      #if THREE_VRM_THREE_REVISION >= 166
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
      #else
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
      #endif
      #endif

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );
      #else
        RE_Direct( directLight, geometry, material, shadow, reflectedLight );
      #endif

    }
    #pragma unroll_loop_end

  #endif

  #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

    DirectionalLight directionalLight;
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    DirectionalLightShadow directionalLightShadow;
    #endif

    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

      directionalLight = directionalLights[ i ];

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        getDirectionalLightInfo( directionalLight, directLight );
      #else
        getDirectionalLightInfo( directionalLight, geometry, directLight );
      #endif

      shadow = 1.0;
      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
      directionalLightShadow = directionalLightShadows[ i ];
      // COMPAT: pre-r166
      // r166 introduced shadowIntensity
      #if THREE_VRM_THREE_REVISION >= 166
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
      #else
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
      #endif
      #endif

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );
      #else
        RE_Direct( directLight, geometry, material, shadow, reflectedLight );
      #endif

    }
    #pragma unroll_loop_end

  #endif

  // #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

  //   RectAreaLight rectAreaLight;

  //   #pragma unroll_loop_start
  //   for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

  //     rectAreaLight = rectAreaLights[ i ];
  //     RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );

  //   }
  //   #pragma unroll_loop_end

  // #endif

  #if defined( RE_IndirectDiffuse )

    vec3 iblIrradiance = vec3( 0.0 );

    vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

    // COMPAT: pre-r156 uses a struct GeometricContext
    // COMPAT: pre-r156 doesn't have a define USE_LIGHT_PROBES
    #if THREE_VRM_THREE_REVISION >= 157
      #if defined( USE_LIGHT_PROBES )
        irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
      #endif
    #else
      irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
    #endif

    #if ( NUM_HEMI_LIGHTS > 0 )

      #pragma unroll_loop_start
      for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

        // COMPAT: pre-r156 uses a struct GeometricContext
        #if THREE_VRM_THREE_REVISION >= 157
          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
        #else
          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
        #endif

      }
      #pragma unroll_loop_end

    #endif

  #endif

  // #if defined( RE_IndirectSpecular )

  //   vec3 radiance = vec3( 0.0 );
  //   vec3 clearcoatRadiance = vec3( 0.0 );

  // #endif

  #include <lights_fragment_maps>
  #include <lights_fragment_end>

  // modulation
  #include <aomap_fragment>

  vec3 col = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;

  #ifdef DEBUG_LITSHADERATE
    gl_FragColor = vec4( col, diffuseColor.a );
    postCorrection();
    return;
  #endif

  // -- MToon: rim lighting -----------------------------------------
  vec3 viewDir = normalize( vViewPosition );

  #ifndef PHYSICALLY_CORRECT_LIGHTS
    reflectedLight.directSpecular /= PI;
  #endif
  vec3 rimMix = mix( vec3( 1.0 ), reflectedLight.directSpecular, 1.0 );

  vec3 rim = parametricRimColorFactor * pow( saturate( 1.0 - dot( viewDir, normal ) + parametricRimLiftFactor ), parametricRimFresnelPowerFactor );

  #ifdef USE_MATCAPTEXTURE
    {
      vec3 x = normalize( vec3( viewDir.z, 0.0, -viewDir.x ) );
      vec3 y = cross( viewDir, x ); // guaranteed to be normalized
      vec2 sphereUv = 0.5 + 0.5 * vec2( dot( x, normal ), -dot( y, normal ) );
      sphereUv = ( matcapTextureUvTransform * vec3( sphereUv, 1 ) ).xy;
      vec3 matcap = texture2D( matcapTexture, sphereUv ).rgb;
      rim += matcapFactor * matcap;
    }
  #endif

  #ifdef USE_RIMMULTIPLYTEXTURE
    vec2 rimMultiplyTextureUv = ( rimMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;
    rim *= texture2D( rimMultiplyTexture, rimMultiplyTextureUv ).rgb;
  #endif

  col += rimMix * rim;

  // -- MToon: Emission --------------------------------------------------------
  col += totalEmissiveRadiance;

  // #include <envmap_fragment>

  // -- Almost done! -----------------------------------------------------------
  #if defined( OUTLINE )
    col = outlineColorFactor.rgb * mix( vec3( 1.0 ), col, outlineLightingMixFactor );
  #endif

  #ifdef OPAQUE
    diffuseColor.a = 1.0;
  #endif

  gl_FragColor = vec4( col, diffuseColor.a );
  postCorrection();
}
`,vr={None:"none",Normal:"normal",LitShadeRate:"litShadeRate",UV:"uv"},cn={None:"none",WorldCoordinates:"worldCoordinates",ScreenCoordinates:"screenCoordinates"},Mr={3e3:"",3001:"srgb"};function Fe(e){return parseInt(Ae,10)>=152?e.colorSpace:Mr[e.encoding]}var xr=class extends Pi{constructor(e={}){var t;super({vertexShader:_r,fragmentShader:gr}),this.uvAnimationScrollXSpeedFactor=0,this.uvAnimationScrollYSpeedFactor=0,this.uvAnimationRotationSpeedFactor=0,this.fog=!0,this.normalMapType=Ai,this._ignoreVertexColor=!0,this._v0CompatShade=!1,this._debugMode=vr.None,this._outlineWidthMode=cn.None,this._isOutline=!1,e.transparentWithZWrite&&(e.depthWrite=!0),delete e.transparentWithZWrite,e.fog=!0,e.lights=!0,e.clipping=!0,this.uniforms=Li.merge([ue.common,ue.normalmap,ue.emissivemap,ue.fog,ue.lights,{litFactor:{value:new D(1,1,1)},mapUvTransform:{value:new z},colorAlpha:{value:1},normalMapUvTransform:{value:new z},shadeColorFactor:{value:new D(0,0,0)},shadeMultiplyTexture:{value:null},shadeMultiplyTextureUvTransform:{value:new z},shadingShiftFactor:{value:0},shadingShiftTexture:{value:null},shadingShiftTextureUvTransform:{value:new z},shadingShiftTextureScale:{value:1},shadingToonyFactor:{value:.9},giEqualizationFactor:{value:.9},matcapFactor:{value:new D(1,1,1)},matcapTexture:{value:null},matcapTextureUvTransform:{value:new z},parametricRimColorFactor:{value:new D(0,0,0)},rimMultiplyTexture:{value:null},rimMultiplyTextureUvTransform:{value:new z},rimLightingMixFactor:{value:1},parametricRimFresnelPowerFactor:{value:5},parametricRimLiftFactor:{value:0},emissive:{value:new D(0,0,0)},emissiveIntensity:{value:1},emissiveMapUvTransform:{value:new z},outlineWidthMultiplyTexture:{value:null},outlineWidthMultiplyTextureUvTransform:{value:new z},outlineWidthFactor:{value:0},outlineColorFactor:{value:new D(0,0,0)},outlineLightingMixFactor:{value:1},uvAnimationMaskTexture:{value:null},uvAnimationMaskTextureUvTransform:{value:new z},uvAnimationScrollXOffset:{value:0},uvAnimationScrollYOffset:{value:0},uvAnimationRotationPhase:{value:0}},(t=e.uniforms)!=null?t:{}]),this.setValues(e),this._uploadUniformsWorkaround(),this.customProgramCacheKey=()=>[...Object.entries(this._generateDefines()).map(([n,i])=>`${n}:${i}`),this.matcapTexture?`matcapTextureColorSpace:${Fe(this.matcapTexture)}`:"",this.shadeMultiplyTexture?`shadeMultiplyTextureColorSpace:${Fe(this.shadeMultiplyTexture)}`:"",this.rimMultiplyTexture?`rimMultiplyTextureColorSpace:${Fe(this.rimMultiplyTexture)}`:""].join(","),this.onBeforeCompile=n=>{const i=parseInt(Ae,10),r=Object.entries(hn(hn({},this._generateDefines()),this.defines)).filter(([o,a])=>!!a).map(([o,a])=>`#define ${o} ${a}`).join(`
`)+`
`;n.vertexShader=r+n.vertexShader,n.fragmentShader=r+n.fragmentShader,i<154&&(n.fragmentShader=n.fragmentShader.replace("#include <colorspace_fragment>","#include <encodings_fragment>"))}}get color(){return this.uniforms.litFactor.value}set color(e){this.uniforms.litFactor.value=e}get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}get normalMap(){return this.uniforms.normalMap.value}set normalMap(e){this.uniforms.normalMap.value=e}get normalScale(){return this.uniforms.normalScale.value}set normalScale(e){this.uniforms.normalScale.value=e}get emissive(){return this.uniforms.emissive.value}set emissive(e){this.uniforms.emissive.value=e}get emissiveIntensity(){return this.uniforms.emissiveIntensity.value}set emissiveIntensity(e){this.uniforms.emissiveIntensity.value=e}get emissiveMap(){return this.uniforms.emissiveMap.value}set emissiveMap(e){this.uniforms.emissiveMap.value=e}get shadeColorFactor(){return this.uniforms.shadeColorFactor.value}set shadeColorFactor(e){this.uniforms.shadeColorFactor.value=e}get shadeMultiplyTexture(){return this.uniforms.shadeMultiplyTexture.value}set shadeMultiplyTexture(e){this.uniforms.shadeMultiplyTexture.value=e}get shadingShiftFactor(){return this.uniforms.shadingShiftFactor.value}set shadingShiftFactor(e){this.uniforms.shadingShiftFactor.value=e}get shadingShiftTexture(){return this.uniforms.shadingShiftTexture.value}set shadingShiftTexture(e){this.uniforms.shadingShiftTexture.value=e}get shadingShiftTextureScale(){return this.uniforms.shadingShiftTextureScale.value}set shadingShiftTextureScale(e){this.uniforms.shadingShiftTextureScale.value=e}get shadingToonyFactor(){return this.uniforms.shadingToonyFactor.value}set shadingToonyFactor(e){this.uniforms.shadingToonyFactor.value=e}get giEqualizationFactor(){return this.uniforms.giEqualizationFactor.value}set giEqualizationFactor(e){this.uniforms.giEqualizationFactor.value=e}get matcapFactor(){return this.uniforms.matcapFactor.value}set matcapFactor(e){this.uniforms.matcapFactor.value=e}get matcapTexture(){return this.uniforms.matcapTexture.value}set matcapTexture(e){this.uniforms.matcapTexture.value=e}get parametricRimColorFactor(){return this.uniforms.parametricRimColorFactor.value}set parametricRimColorFactor(e){this.uniforms.parametricRimColorFactor.value=e}get rimMultiplyTexture(){return this.uniforms.rimMultiplyTexture.value}set rimMultiplyTexture(e){this.uniforms.rimMultiplyTexture.value=e}get rimLightingMixFactor(){return this.uniforms.rimLightingMixFactor.value}set rimLightingMixFactor(e){this.uniforms.rimLightingMixFactor.value=e}get parametricRimFresnelPowerFactor(){return this.uniforms.parametricRimFresnelPowerFactor.value}set parametricRimFresnelPowerFactor(e){this.uniforms.parametricRimFresnelPowerFactor.value=e}get parametricRimLiftFactor(){return this.uniforms.parametricRimLiftFactor.value}set parametricRimLiftFactor(e){this.uniforms.parametricRimLiftFactor.value=e}get outlineWidthMultiplyTexture(){return this.uniforms.outlineWidthMultiplyTexture.value}set outlineWidthMultiplyTexture(e){this.uniforms.outlineWidthMultiplyTexture.value=e}get outlineWidthFactor(){return this.uniforms.outlineWidthFactor.value}set outlineWidthFactor(e){this.uniforms.outlineWidthFactor.value=e}get outlineColorFactor(){return this.uniforms.outlineColorFactor.value}set outlineColorFactor(e){this.uniforms.outlineColorFactor.value=e}get outlineLightingMixFactor(){return this.uniforms.outlineLightingMixFactor.value}set outlineLightingMixFactor(e){this.uniforms.outlineLightingMixFactor.value=e}get uvAnimationMaskTexture(){return this.uniforms.uvAnimationMaskTexture.value}set uvAnimationMaskTexture(e){this.uniforms.uvAnimationMaskTexture.value=e}get uvAnimationScrollXOffset(){return this.uniforms.uvAnimationScrollXOffset.value}set uvAnimationScrollXOffset(e){this.uniforms.uvAnimationScrollXOffset.value=e}get uvAnimationScrollYOffset(){return this.uniforms.uvAnimationScrollYOffset.value}set uvAnimationScrollYOffset(e){this.uniforms.uvAnimationScrollYOffset.value=e}get uvAnimationRotationPhase(){return this.uniforms.uvAnimationRotationPhase.value}set uvAnimationRotationPhase(e){this.uniforms.uvAnimationRotationPhase.value=e}get ignoreVertexColor(){return this._ignoreVertexColor}set ignoreVertexColor(e){this._ignoreVertexColor=e,this.needsUpdate=!0}get v0CompatShade(){return this._v0CompatShade}set v0CompatShade(e){this._v0CompatShade=e,this.needsUpdate=!0}get debugMode(){return this._debugMode}set debugMode(e){this._debugMode=e,this.needsUpdate=!0}get outlineWidthMode(){return this._outlineWidthMode}set outlineWidthMode(e){this._outlineWidthMode=e,this.needsUpdate=!0}get isOutline(){return this._isOutline}set isOutline(e){this._isOutline=e,this.needsUpdate=!0}get isMToonMaterial(){return!0}update(e){this._uploadUniformsWorkaround(),this._updateUVAnimation(e)}copy(e){return super.copy(e),this.map=e.map,this.normalMap=e.normalMap,this.emissiveMap=e.emissiveMap,this.shadeMultiplyTexture=e.shadeMultiplyTexture,this.shadingShiftTexture=e.shadingShiftTexture,this.matcapTexture=e.matcapTexture,this.rimMultiplyTexture=e.rimMultiplyTexture,this.outlineWidthMultiplyTexture=e.outlineWidthMultiplyTexture,this.uvAnimationMaskTexture=e.uvAnimationMaskTexture,this.normalMapType=e.normalMapType,this.uvAnimationScrollXSpeedFactor=e.uvAnimationScrollXSpeedFactor,this.uvAnimationScrollYSpeedFactor=e.uvAnimationScrollYSpeedFactor,this.uvAnimationRotationSpeedFactor=e.uvAnimationRotationSpeedFactor,this.ignoreVertexColor=e.ignoreVertexColor,this.v0CompatShade=e.v0CompatShade,this.debugMode=e.debugMode,this.outlineWidthMode=e.outlineWidthMode,this.isOutline=e.isOutline,this.needsUpdate=!0,this}_updateUVAnimation(e){this.uniforms.uvAnimationScrollXOffset.value+=e*this.uvAnimationScrollXSpeedFactor,this.uniforms.uvAnimationScrollYOffset.value+=e*this.uvAnimationScrollYSpeedFactor,this.uniforms.uvAnimationRotationPhase.value+=e*this.uvAnimationRotationSpeedFactor,this.uniforms.alphaTest.value=this.alphaTest,this.uniformsNeedUpdate=!0}_uploadUniformsWorkaround(){this.uniforms.opacity.value=this.opacity,this._updateTextureMatrix(this.uniforms.map,this.uniforms.mapUvTransform),this._updateTextureMatrix(this.uniforms.normalMap,this.uniforms.normalMapUvTransform),this._updateTextureMatrix(this.uniforms.emissiveMap,this.uniforms.emissiveMapUvTransform),this._updateTextureMatrix(this.uniforms.shadeMultiplyTexture,this.uniforms.shadeMultiplyTextureUvTransform),this._updateTextureMatrix(this.uniforms.shadingShiftTexture,this.uniforms.shadingShiftTextureUvTransform),this._updateTextureMatrix(this.uniforms.matcapTexture,this.uniforms.matcapTextureUvTransform),this._updateTextureMatrix(this.uniforms.rimMultiplyTexture,this.uniforms.rimMultiplyTextureUvTransform),this._updateTextureMatrix(this.uniforms.outlineWidthMultiplyTexture,this.uniforms.outlineWidthMultiplyTextureUvTransform),this._updateTextureMatrix(this.uniforms.uvAnimationMaskTexture,this.uniforms.uvAnimationMaskTextureUvTransform),this.uniformsNeedUpdate=!0}_generateDefines(){const e=parseInt(Ae,10),t=this.outlineWidthMultiplyTexture!==null,n=this.map!==null||this.normalMap!==null||this.emissiveMap!==null||this.shadeMultiplyTexture!==null||this.shadingShiftTexture!==null||this.rimMultiplyTexture!==null||this.uvAnimationMaskTexture!==null;return{THREE_VRM_THREE_REVISION:e,OUTLINE:this._isOutline,MTOON_USE_UV:t||n,MTOON_UVS_VERTEX_ONLY:t&&!n,V0_COMPAT_SHADE:this._v0CompatShade,USE_SHADEMULTIPLYTEXTURE:this.shadeMultiplyTexture!==null,USE_SHADINGSHIFTTEXTURE:this.shadingShiftTexture!==null,USE_MATCAPTEXTURE:this.matcapTexture!==null,USE_RIMMULTIPLYTEXTURE:this.rimMultiplyTexture!==null,USE_OUTLINEWIDTHMULTIPLYTEXTURE:this._isOutline&&this.outlineWidthMultiplyTexture!==null,USE_UVANIMATIONMASKTEXTURE:this.uvAnimationMaskTexture!==null,IGNORE_VERTEX_COLOR:this._ignoreVertexColor===!0,DEBUG_NORMAL:this._debugMode==="normal",DEBUG_LITSHADERATE:this._debugMode==="litShadeRate",DEBUG_UV:this._debugMode==="uv",OUTLINE_WIDTH_SCREEN:this._isOutline&&this._outlineWidthMode===cn.ScreenCoordinates}}_updateTextureMatrix(e,t){e.value&&(e.value.matrixAutoUpdate&&e.value.updateMatrix(),t.value.copy(e.value.matrix))}},yr=new Set(["1.0","1.0-beta"]),zn=class Ee{get name(){return Ee.EXTENSION_NAME}constructor(t,n={}){var i,r,o,a;this.parser=t,this.materialType=(i=n.materialType)!=null?i:xr,this.renderOrderOffset=(r=n.renderOrderOffset)!=null?r:0,this.v0CompatShade=(o=n.v0CompatShade)!=null?o:!1,this.debugMode=(a=n.debugMode)!=null?a:"none",this._mToonMaterialSet=new Set}beforeRoot(){return K(this,null,function*(){this._removeUnlitExtensionIfMToonExists()})}afterRoot(t){return K(this,null,function*(){t.userData.vrmMToonMaterials=Array.from(this._mToonMaterialSet)})}getMaterialType(t){return this._getMToonExtension(t)?this.materialType:null}extendMaterialParams(t,n){const i=this._getMToonExtension(t);return i?this._extendMaterialParams(i,n):null}loadMesh(t){return K(this,null,function*(){var n;const i=this.parser,o=(n=i.json.meshes)==null?void 0:n[t];if(o==null)throw new Error(`MToonMaterialLoaderPlugin: Attempt to use meshes[${t}] of glTF but the mesh doesn't exist`);const a=o.primitives,l=yield i.loadMesh(t);if(a.length===1){const s=l,u=a[0].material;u!=null&&this._setupPrimitive(s,u)}else{const s=l;for(let u=0;u<a.length;u++){const h=s.children[u],d=a[u].material;d!=null&&this._setupPrimitive(h,d)}}return l})}_removeUnlitExtensionIfMToonExists(){const i=this.parser.json.materials;i==null||i.map((r,o)=>{var a;this._getMToonExtension(o)&&((a=r.extensions)!=null&&a.KHR_materials_unlit)&&delete r.extensions.KHR_materials_unlit})}_getMToonExtension(t){var n,i;const a=(n=this.parser.json.materials)==null?void 0:n[t];if(a==null){console.warn(`MToonMaterialLoaderPlugin: Attempt to use materials[${t}] of glTF but the material doesn't exist`);return}const l=(i=a.extensions)==null?void 0:i[Ee.EXTENSION_NAME];if(l==null)return;const s=l.specVersion;if(!yr.has(s)){console.warn(`MToonMaterialLoaderPlugin: Unknown ${Ee.EXTENSION_NAME} specVersion "${s}"`);return}return l}_extendMaterialParams(t,n){return K(this,null,function*(){var i;delete n.metalness,delete n.roughness;const r=new fr(this.parser,n);r.assignPrimitive("transparentWithZWrite",t.transparentWithZWrite),r.assignColor("shadeColorFactor",t.shadeColorFactor),r.assignTexture("shadeMultiplyTexture",t.shadeMultiplyTexture,!0),r.assignPrimitive("shadingShiftFactor",t.shadingShiftFactor),r.assignTexture("shadingShiftTexture",t.shadingShiftTexture,!0),r.assignPrimitive("shadingShiftTextureScale",(i=t.shadingShiftTexture)==null?void 0:i.scale),r.assignPrimitive("shadingToonyFactor",t.shadingToonyFactor),r.assignPrimitive("giEqualizationFactor",t.giEqualizationFactor),r.assignColor("matcapFactor",t.matcapFactor),r.assignTexture("matcapTexture",t.matcapTexture,!0),r.assignColor("parametricRimColorFactor",t.parametricRimColorFactor),r.assignTexture("rimMultiplyTexture",t.rimMultiplyTexture,!0),r.assignPrimitive("rimLightingMixFactor",t.rimLightingMixFactor),r.assignPrimitive("parametricRimFresnelPowerFactor",t.parametricRimFresnelPowerFactor),r.assignPrimitive("parametricRimLiftFactor",t.parametricRimLiftFactor),r.assignPrimitive("outlineWidthMode",t.outlineWidthMode),r.assignPrimitive("outlineWidthFactor",t.outlineWidthFactor),r.assignTexture("outlineWidthMultiplyTexture",t.outlineWidthMultiplyTexture,!1),r.assignColor("outlineColorFactor",t.outlineColorFactor),r.assignPrimitive("outlineLightingMixFactor",t.outlineLightingMixFactor),r.assignTexture("uvAnimationMaskTexture",t.uvAnimationMaskTexture,!1),r.assignPrimitive("uvAnimationScrollXSpeedFactor",t.uvAnimationScrollXSpeedFactor),r.assignPrimitive("uvAnimationScrollYSpeedFactor",t.uvAnimationScrollYSpeedFactor),r.assignPrimitive("uvAnimationRotationSpeedFactor",t.uvAnimationRotationSpeedFactor),r.assignPrimitive("v0CompatShade",this.v0CompatShade),r.assignPrimitive("debugMode",this.debugMode),yield r.pending})}_setupPrimitive(t,n){const i=this._getMToonExtension(n);if(i){const r=this._parseRenderOrder(i);t.renderOrder=r+this.renderOrderOffset,this._generateOutline(t),this._addToMaterialSet(t);return}}_shouldGenerateOutline(t){return typeof t.outlineWidthMode=="string"&&t.outlineWidthMode!=="none"&&typeof t.outlineWidthFactor=="number"&&t.outlineWidthFactor>0}_generateOutline(t){const n=t.material;if(!(n instanceof Ii)||!this._shouldGenerateOutline(n))return;t.material=[n];const i=n.clone();i.name+=" (Outline)",i.isOutline=!0,i.side=bi,t.material.push(i);const r=t.geometry,o=r.index?r.index.count:r.attributes.position.count/3;r.addGroup(0,o,0),r.addGroup(0,o,1)}_addToMaterialSet(t){const n=t.material,i=new Set;Array.isArray(n)?n.forEach(r=>i.add(r)):i.add(n);for(const r of i)this._mToonMaterialSet.add(r)}_parseRenderOrder(t){var n;return(t.transparentWithZWrite?0:19)+((n=t.renderQueueOffsetNumber)!=null?n:0)}};zn.EXTENSION_NAME="VRMC_materials_mtoon";var Rr=zn,wr=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())}),jn=class Ze{get name(){return Ze.EXTENSION_NAME}constructor(t){this.parser=t}extendMaterialParams(t,n){return wr(this,null,function*(){const i=this._getHDREmissiveMultiplierExtension(t);if(i==null)return;console.warn("VRMMaterialsHDREmissiveMultiplierLoaderPlugin: `VRMC_materials_hdr_emissiveMultiplier` is archived. Use `KHR_materials_emissive_strength` instead.");const r=i.emissiveMultiplier;n.emissiveIntensity=r})}_getHDREmissiveMultiplierExtension(t){var n,i;const a=(n=this.parser.json.materials)==null?void 0:n[t];if(a==null){console.warn(`VRMMaterialsHDREmissiveMultiplierLoaderPlugin: Attempt to use materials[${t}] of glTF but the material doesn't exist`);return}const l=(i=a.extensions)==null?void 0:i[Ze.EXTENSION_NAME];if(l!=null)return l}};jn.EXTENSION_NAME="VRMC_materials_hdr_emissiveMultiplier";var Tr=jn,Sr=Object.defineProperty,Er=Object.defineProperties,Pr=Object.getOwnPropertyDescriptors,pn=Object.getOwnPropertySymbols,Ar=Object.prototype.hasOwnProperty,Lr=Object.prototype.propertyIsEnumerable,mn=(e,t,n)=>t in e?Sr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,k=(e,t)=>{for(var n in t||(t={}))Ar.call(t,n)&&mn(e,n,t[n]);if(pn)for(var n of pn(t))Lr.call(t,n)&&mn(e,n,t[n]);return e},fn=(e,t)=>Er(e,Pr(t)),Ir=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())});function ne(e){return Math.pow(e,2.2)}var br=class{get name(){return"VRMMaterialsV0CompatPlugin"}constructor(e){var t;this.parser=e,this._renderQueueMapTransparent=new Map,this._renderQueueMapTransparentZWrite=new Map;const n=this.parser.json;n.extensionsUsed=(t=n.extensionsUsed)!=null?t:[],n.extensionsUsed.indexOf("KHR_texture_transform")===-1&&n.extensionsUsed.push("KHR_texture_transform")}beforeRoot(){return Ir(this,null,function*(){var e;const t=this.parser.json,n=(e=t.extensions)==null?void 0:e.VRM,i=n==null?void 0:n.materialProperties;i&&(this._populateRenderQueueMap(i),i.forEach((r,o)=>{var a,l;const s=(a=t.materials)==null?void 0:a[o];if(s==null){console.warn(`VRMMaterialsV0CompatPlugin: Attempt to use materials[${o}] of glTF but the material doesn't exist`);return}if(r.shader==="VRM/MToon"){const u=this._parseV0MToonProperties(r,s);t.materials[o]=u}else if((l=r.shader)!=null&&l.startsWith("VRM/Unlit")){const u=this._parseV0UnlitProperties(r,s);t.materials[o]=u}else r.shader==="VRM_USE_GLTFSHADER"||console.warn(`VRMMaterialsV0CompatPlugin: Unknown shader: ${r.shader}`)}))})}_parseV0MToonProperties(e,t){var n,i,r,o,a,l,s,u,h,d,c,p,f,m,_,x,R,S,v,M,y,w,T,I,E,L,b,N,q,B,j,F,ee,le,O,ot,st,at,lt,ut,dt,ht,ct,pt,mt,ft,_t,gt,vt,Mt,xt,yt,Rt,wt,Tt;const St=(i=(n=e.keywordMap)==null?void 0:n._ALPHABLEND_ON)!=null?i:!1,Zn=((r=e.floatProperties)==null?void 0:r._ZWrite)===1&&St,Jn=this._v0ParseRenderQueue(e),Et=(a=(o=e.keywordMap)==null?void 0:o._ALPHATEST_ON)!=null?a:!1,Kn=St?"BLEND":Et?"MASK":"OPAQUE",ei=Et?(s=(l=e.floatProperties)==null?void 0:l._Cutoff)!=null?s:.5:void 0,ti=((h=(u=e.floatProperties)==null?void 0:u._CullMode)!=null?h:2)===0,Q=this._portTextureTransform(e),ni=((c=(d=e.vectorProperties)==null?void 0:d._Color)!=null?c:[1,1,1,1]).map((Nt,Ei)=>Ei===3?Nt:ne(Nt)),Pt=(p=e.textureProperties)==null?void 0:p._MainTex,ii=Pt!=null?{index:Pt,extensions:k({},Q)}:void 0,ri=(m=(f=e.floatProperties)==null?void 0:f._BumpScale)!=null?m:1,At=(_=e.textureProperties)==null?void 0:_._BumpMap,oi=At!=null?{index:At,scale:ri,extensions:k({},Q)}:void 0,si=((R=(x=e.vectorProperties)==null?void 0:x._EmissionColor)!=null?R:[0,0,0,1]).map(ne),Lt=(S=e.textureProperties)==null?void 0:S._EmissionMap,ai=Lt!=null?{index:Lt,extensions:k({},Q)}:void 0,li=((M=(v=e.vectorProperties)==null?void 0:v._ShadeColor)!=null?M:[.97,.81,.86,1]).map(ne),It=(y=e.textureProperties)==null?void 0:y._ShadeTexture,ui=It!=null?{index:It,extensions:k({},Q)}:void 0;let ge=(T=(w=e.floatProperties)==null?void 0:w._ShadeShift)!=null?T:0,ve=(E=(I=e.floatProperties)==null?void 0:I._ShadeToony)!=null?E:.9;ve=C.lerp(ve,1,.5+.5*ge),ge=-ge-(1-ve);const bt=(b=(L=e.floatProperties)==null?void 0:L._IndirectLightIntensity)!=null?b:.1,di=bt?1-bt:void 0,Ue=(N=e.textureProperties)==null?void 0:N._SphereAdd,hi=Ue!=null?[1,1,1]:void 0,ci=Ue!=null?{index:Ue}:void 0,pi=(B=(q=e.floatProperties)==null?void 0:q._RimLightingMix)!=null?B:0,Ct=(j=e.textureProperties)==null?void 0:j._RimTexture,mi=Ct!=null?{index:Ct,extensions:k({},Q)}:void 0,fi=((ee=(F=e.vectorProperties)==null?void 0:F._RimColor)!=null?ee:[0,0,0,1]).map(ne),_i=(O=(le=e.floatProperties)==null?void 0:le._RimFresnelPower)!=null?O:1,gi=(st=(ot=e.floatProperties)==null?void 0:ot._RimLift)!=null?st:0,vi=["none","worldCoordinates","screenCoordinates"][(lt=(at=e.floatProperties)==null?void 0:at._OutlineWidthMode)!=null?lt:0];let Oe=(dt=(ut=e.floatProperties)==null?void 0:ut._OutlineWidth)!=null?dt:0;Oe=.01*Oe;const Ut=(ht=e.textureProperties)==null?void 0:ht._OutlineWidthTexture,Mi=Ut!=null?{index:Ut,extensions:k({},Q)}:void 0,xi=((pt=(ct=e.vectorProperties)==null?void 0:ct._OutlineColor)!=null?pt:[0,0,0]).map(ne),yi=((ft=(mt=e.floatProperties)==null?void 0:mt._OutlineColorMode)!=null?ft:0)===1?(gt=(_t=e.floatProperties)==null?void 0:_t._OutlineLightingMix)!=null?gt:1:0,Ot=(vt=e.textureProperties)==null?void 0:vt._UvAnimMaskTexture,Ri=Ot!=null?{index:Ot,extensions:k({},Q)}:void 0,wi=(xt=(Mt=e.floatProperties)==null?void 0:Mt._UvAnimScrollX)!=null?xt:0;let Me=(Rt=(yt=e.floatProperties)==null?void 0:yt._UvAnimScrollY)!=null?Rt:0;Me!=null&&(Me=-Me);const Ti=(Tt=(wt=e.floatProperties)==null?void 0:wt._UvAnimRotation)!=null?Tt:0,Si={specVersion:"1.0",transparentWithZWrite:Zn,renderQueueOffsetNumber:Jn,shadeColorFactor:li,shadeMultiplyTexture:ui,shadingShiftFactor:ge,shadingToonyFactor:ve,giEqualizationFactor:di,matcapFactor:hi,matcapTexture:ci,rimLightingMixFactor:pi,rimMultiplyTexture:mi,parametricRimColorFactor:fi,parametricRimFresnelPowerFactor:_i,parametricRimLiftFactor:gi,outlineWidthMode:vi,outlineWidthFactor:Oe,outlineWidthMultiplyTexture:Mi,outlineColorFactor:xi,outlineLightingMixFactor:yi,uvAnimationMaskTexture:Ri,uvAnimationScrollXSpeedFactor:wi,uvAnimationScrollYSpeedFactor:Me,uvAnimationRotationSpeedFactor:Ti};return fn(k({},t),{pbrMetallicRoughness:{baseColorFactor:ni,baseColorTexture:ii},normalTexture:oi,emissiveTexture:ai,emissiveFactor:si,alphaMode:Kn,alphaCutoff:ei,doubleSided:ti,extensions:{VRMC_materials_mtoon:Si}})}_parseV0UnlitProperties(e,t){var n,i,r,o,a;const l=e.shader==="VRM/UnlitTransparentZWrite",s=e.shader==="VRM/UnlitTransparent"||l,u=this._v0ParseRenderQueue(e),h=e.shader==="VRM/UnlitCutout",d=s?"BLEND":h?"MASK":"OPAQUE",c=h?(i=(n=e.floatProperties)==null?void 0:n._Cutoff)!=null?i:.5:void 0,p=this._portTextureTransform(e),f=((o=(r=e.vectorProperties)==null?void 0:r._Color)!=null?o:[1,1,1,1]).map(ne),m=(a=e.textureProperties)==null?void 0:a._MainTex,_=m!=null?{index:m,extensions:k({},p)}:void 0,x={specVersion:"1.0",transparentWithZWrite:l,renderQueueOffsetNumber:u,shadeColorFactor:f,shadeMultiplyTexture:_};return fn(k({},t),{pbrMetallicRoughness:{baseColorFactor:f,baseColorTexture:_},alphaMode:d,alphaCutoff:c,extensions:{VRMC_materials_mtoon:x}})}_portTextureTransform(e){var t,n,i,r,o;const a=(t=e.vectorProperties)==null?void 0:t._MainTex;if(a==null)return{};const l=[(n=a==null?void 0:a[0])!=null?n:0,(i=a==null?void 0:a[1])!=null?i:0],s=[(r=a==null?void 0:a[2])!=null?r:1,(o=a==null?void 0:a[3])!=null?o:1];return l[1]=1-s[1]-l[1],{KHR_texture_transform:{offset:l,scale:s}}}_v0ParseRenderQueue(e){var t,n;const i=e.shader==="VRM/UnlitTransparentZWrite",r=((t=e.keywordMap)==null?void 0:t._ALPHABLEND_ON)!=null||e.shader==="VRM/UnlitTransparent"||i,o=((n=e.floatProperties)==null?void 0:n._ZWrite)===1||i;let a=0;if(r){const l=e.renderQueue;l!=null&&(o?a=this._renderQueueMapTransparentZWrite.get(l):a=this._renderQueueMapTransparent.get(l))}return a}_populateRenderQueueMap(e){const t=new Set,n=new Set;e.forEach(i=>{var r,o;const a=i.shader==="VRM/UnlitTransparentZWrite",l=((r=i.keywordMap)==null?void 0:r._ALPHABLEND_ON)!=null||i.shader==="VRM/UnlitTransparent"||a,s=((o=i.floatProperties)==null?void 0:o._ZWrite)===1||a;if(l){const u=i.renderQueue;u!=null&&(s?n.add(u):t.add(u))}}),t.size>10&&console.warn(`VRMMaterialsV0CompatPlugin: This VRM uses ${t.size} render queues for Transparent materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`),n.size>10&&console.warn(`VRMMaterialsV0CompatPlugin: This VRM uses ${n.size} render queues for TransparentZWrite materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`),Array.from(t).sort().forEach((i,r)=>{const o=Math.min(Math.max(r-t.size+1,-9),0);this._renderQueueMapTransparent.set(i,o)}),Array.from(n).sort().forEach((i,r)=>{const o=Math.min(Math.max(r,0),9);this._renderQueueMapTransparentZWrite.set(i,o)})}},_n=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())}),G=new g,He=class extends se{constructor(e){super(),this._attrPosition=new U(new Float32Array([0,0,0,0,0,0]),3),this._attrPosition.setUsage(Oi);const t=new Y;t.setAttribute("position",this._attrPosition);const n=new Ce({color:16711935,depthTest:!1,depthWrite:!1});this._line=new Ni(t,n),this.add(this._line),this.constraint=e}updateMatrixWorld(e){G.setFromMatrixPosition(this.constraint.destination.matrixWorld),this._attrPosition.setXYZ(0,G.x,G.y,G.z),this.constraint.source&&G.setFromMatrixPosition(this.constraint.source.matrixWorld),this._attrPosition.setXYZ(1,G.x,G.y,G.z),this._attrPosition.needsUpdate=!0,super.updateMatrixWorld(e)}};function gn(e,t){return t.set(e.elements[12],e.elements[13],e.elements[14])}var Cr=new g,Ur=new g;function Or(e,t){return e.decompose(Cr,t,Ur),t}function Ie(e){return e.invert?e.invert():e.inverse(),e}var it=class{constructor(e,t){this.destination=e,this.source=t,this.weight=1}},Nr=new g,Vr=new g,Dr=new g,Br=new A,Fr=new A,Hr=new A,kr=class extends it{get aimAxis(){return this._aimAxis}set aimAxis(e){this._aimAxis=e,this._v3AimAxis.set(e==="PositiveX"?1:e==="NegativeX"?-1:0,e==="PositiveY"?1:e==="NegativeY"?-1:0,e==="PositiveZ"?1:e==="NegativeZ"?-1:0)}get dependencies(){const e=new Set([this.source]);return this.destination.parent&&e.add(this.destination.parent),e}constructor(e,t){super(e,t),this._aimAxis="PositiveX",this._v3AimAxis=new g(1,0,0),this._dstRestQuat=new A}setInitState(){this._dstRestQuat.copy(this.destination.quaternion)}update(){this.destination.updateWorldMatrix(!0,!1),this.source.updateWorldMatrix(!0,!1);const e=Br.identity(),t=Fr.identity();this.destination.parent&&(Or(this.destination.parent.matrixWorld,e),Ie(t.copy(e)));const n=Nr.copy(this._v3AimAxis).applyQuaternion(this._dstRestQuat).applyQuaternion(e),i=gn(this.source.matrixWorld,Vr).sub(gn(this.destination.matrixWorld,Dr)).normalize(),r=Hr.setFromUnitVectors(n,i).premultiply(t).multiply(e).multiply(this._dstRestQuat);this.destination.quaternion.copy(this._dstRestQuat).slerp(r,this.weight)}};function Wr(e,t){const n=[e];let i=e.parent;for(;i!==null;)n.unshift(i),i=i.parent;n.forEach(r=>{t(r)})}var zr=class{constructor(){this._constraints=new Set,this._objectConstraintsMap=new Map}get constraints(){return this._constraints}addConstraint(e){this._constraints.add(e);let t=this._objectConstraintsMap.get(e.destination);t==null&&(t=new Set,this._objectConstraintsMap.set(e.destination,t)),t.add(e)}deleteConstraint(e){this._constraints.delete(e),this._objectConstraintsMap.get(e.destination).delete(e)}setInitState(){const e=new Set,t=new Set;for(const n of this._constraints)this._processConstraint(n,e,t,i=>i.setInitState())}update(){const e=new Set,t=new Set;for(const n of this._constraints)this._processConstraint(n,e,t,i=>i.update())}_processConstraint(e,t,n,i){if(n.has(e))return;if(t.has(e))throw new Error("VRMNodeConstraintManager: Circular dependency detected while updating constraints");t.add(e);const r=e.dependencies;for(const o of r)Wr(o,a=>{const l=this._objectConstraintsMap.get(a);if(l)for(const s of l)this._processConstraint(s,t,n,i)});i(e),n.add(e)}},jr=new A,Xr=new A,Yr=class extends it{get dependencies(){return new Set([this.source])}constructor(e,t){super(e,t),this._dstRestQuat=new A,this._invSrcRestQuat=new A}setInitState(){this._dstRestQuat.copy(this.destination.quaternion),Ie(this._invSrcRestQuat.copy(this.source.quaternion))}update(){const e=jr.copy(this._invSrcRestQuat).multiply(this.source.quaternion),t=Xr.copy(this._dstRestQuat).multiply(e);this.destination.quaternion.copy(this._dstRestQuat).slerp(t,this.weight)}},Gr=new g,qr=new A,Qr=new A,$r=class extends it{get rollAxis(){return this._rollAxis}set rollAxis(e){this._rollAxis=e,this._v3RollAxis.set(e==="X"?1:0,e==="Y"?1:0,e==="Z"?1:0)}get dependencies(){return new Set([this.source])}constructor(e,t){super(e,t),this._rollAxis="X",this._v3RollAxis=new g(1,0,0),this._dstRestQuat=new A,this._invDstRestQuat=new A,this._invSrcRestQuatMulDstRestQuat=new A}setInitState(){this._dstRestQuat.copy(this.destination.quaternion),Ie(this._invDstRestQuat.copy(this._dstRestQuat)),Ie(this._invSrcRestQuatMulDstRestQuat.copy(this.source.quaternion)).multiply(this._dstRestQuat)}update(){const e=qr.copy(this._invDstRestQuat).multiply(this.source.quaternion).multiply(this._invSrcRestQuatMulDstRestQuat),t=Gr.copy(this._v3RollAxis).applyQuaternion(e),i=Qr.setFromUnitVectors(t,this._v3RollAxis).premultiply(this._dstRestQuat).multiply(e);this.destination.quaternion.copy(this._dstRestQuat).slerp(i,this.weight)}},Zr=new Set(["1.0","1.0-beta"]),Xn=class _e{get name(){return _e.EXTENSION_NAME}constructor(t,n){this.parser=t,this.helperRoot=n==null?void 0:n.helperRoot}afterRoot(t){return _n(this,null,function*(){t.userData.vrmNodeConstraintManager=yield this._import(t)})}_import(t){return _n(this,null,function*(){var n;const i=this.parser.json;if(!(((n=i.extensionsUsed)==null?void 0:n.indexOf(_e.EXTENSION_NAME))!==-1))return null;const o=new zr,a=yield this.parser.getDependencies("node");return a.forEach((l,s)=>{var u;const h=i.nodes[s],d=(u=h==null?void 0:h.extensions)==null?void 0:u[_e.EXTENSION_NAME];if(d==null)return;const c=d.specVersion;if(!Zr.has(c)){console.warn(`VRMNodeConstraintLoaderPlugin: Unknown ${_e.EXTENSION_NAME} specVersion "${c}"`);return}const p=d.constraint;if(p.roll!=null){const f=this._importRollConstraint(l,a,p.roll);o.addConstraint(f)}else if(p.aim!=null){const f=this._importAimConstraint(l,a,p.aim);o.addConstraint(f)}else if(p.rotation!=null){const f=this._importRotationConstraint(l,a,p.rotation);o.addConstraint(f)}}),t.scene.updateMatrixWorld(),o.setInitState(),o})}_importRollConstraint(t,n,i){const{source:r,rollAxis:o,weight:a}=i,l=n[r],s=new $r(t,l);if(o!=null&&(s.rollAxis=o),a!=null&&(s.weight=a),this.helperRoot){const u=new He(s);this.helperRoot.add(u)}return s}_importAimConstraint(t,n,i){const{source:r,aimAxis:o,weight:a}=i,l=n[r],s=new kr(t,l);if(o!=null&&(s.aimAxis=o),a!=null&&(s.weight=a),this.helperRoot){const u=new He(s);this.helperRoot.add(u)}return s}_importRotationConstraint(t,n,i){const{source:r,weight:o}=i,a=n[r],l=new Yr(t,a);if(o!=null&&(l.weight=o),this.helperRoot){const s=new He(l);this.helperRoot.add(s)}return l}};Xn.EXTENSION_NAME="VRMC_node_constraint";var Jr=Xn,we=(e,t,n)=>new Promise((i,r)=>{var o=s=>{try{l(n.next(s))}catch(u){r(u)}},a=s=>{try{l(n.throw(s))}catch(u){r(u)}},l=s=>s.done?i(s.value):Promise.resolve(s.value).then(o,a);l((n=n.apply(e,t)).next())}),rt=class{},ke=new g,J=new g,Yn=class extends rt{get type(){return"capsule"}constructor(e){var t,n,i,r;super(),this.offset=(t=e==null?void 0:e.offset)!=null?t:new g(0,0,0),this.tail=(n=e==null?void 0:e.tail)!=null?n:new g(0,0,0),this.radius=(i=e==null?void 0:e.radius)!=null?i:0,this.inside=(r=e==null?void 0:e.inside)!=null?r:!1}calculateCollision(e,t,n,i){ke.setFromMatrixPosition(e),J.subVectors(this.tail,this.offset).applyMatrix4(e),J.sub(ke);const r=J.lengthSq();i.copy(t).sub(ke);const o=J.dot(i);o<=0||(r<=o||J.multiplyScalar(o/r),i.sub(J));const a=i.length(),l=this.inside?this.radius-n-a:a-n-this.radius;return l<0&&(i.multiplyScalar(1/a),this.inside&&i.negate()),l}},We=new g,vn=new z,Gn=class extends rt{get type(){return"plane"}constructor(e){var t,n;super(),this.offset=(t=e==null?void 0:e.offset)!=null?t:new g(0,0,0),this.normal=(n=e==null?void 0:e.normal)!=null?n:new g(0,0,1)}calculateCollision(e,t,n,i){i.setFromMatrixPosition(e),i.negate().add(t),vn.getNormalMatrix(e),We.copy(this.normal).applyNormalMatrix(vn).normalize();const r=i.dot(We)-n;return i.copy(We),r}},Kr=new g,qn=class extends rt{get type(){return"sphere"}constructor(e){var t,n,i;super(),this.offset=(t=e==null?void 0:e.offset)!=null?t:new g(0,0,0),this.radius=(n=e==null?void 0:e.radius)!=null?n:0,this.inside=(i=e==null?void 0:e.inside)!=null?i:!1}calculateCollision(e,t,n,i){i.subVectors(t,Kr.setFromMatrixPosition(e));const r=i.length(),o=this.inside?this.radius-n-r:r-n-this.radius;return o<0&&(i.multiplyScalar(1/r),this.inside&&i.negate()),o}},W=new g,eo=class extends Y{constructor(e){super(),this.worldScale=1,this._currentRadius=0,this._currentOffset=new g,this._currentTail=new g,this._shape=e,this._attrPos=new U(new Float32Array(396),3),this.setAttribute("position",this._attrPos),this._attrIndex=new U(new Uint16Array(264),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let e=!1;const t=this._shape.radius/this.worldScale;this._currentRadius!==t&&(this._currentRadius=t,e=!0),this._currentOffset.equals(this._shape.offset)||(this._currentOffset.copy(this._shape.offset),e=!0);const n=W.copy(this._shape.tail).divideScalar(this.worldScale);this._currentTail.distanceToSquared(n)>1e-10&&(this._currentTail.copy(n),e=!0),e&&this._buildPosition()}_buildPosition(){W.copy(this._currentTail).sub(this._currentOffset);const e=W.length()/this._currentRadius;for(let i=0;i<=16;i++){const r=i/16*Math.PI;this._attrPos.setXYZ(i,-Math.sin(r),-Math.cos(r),0),this._attrPos.setXYZ(17+i,e+Math.sin(r),Math.cos(r),0),this._attrPos.setXYZ(34+i,-Math.sin(r),0,-Math.cos(r)),this._attrPos.setXYZ(51+i,e+Math.sin(r),0,Math.cos(r))}for(let i=0;i<32;i++){const r=i/16*Math.PI;this._attrPos.setXYZ(68+i,0,Math.sin(r),Math.cos(r)),this._attrPos.setXYZ(100+i,e,Math.sin(r),Math.cos(r))}const t=Math.atan2(W.y,Math.sqrt(W.x*W.x+W.z*W.z)),n=-Math.atan2(W.z,W.x);this.rotateZ(t),this.rotateY(n),this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentOffset.x,this._currentOffset.y,this._currentOffset.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let e=0;e<34;e++){const t=(e+1)%34;this._attrIndex.setXY(e*2,e,t),this._attrIndex.setXY(68+e*2,34+e,34+t)}for(let e=0;e<32;e++){const t=(e+1)%32;this._attrIndex.setXY(136+e*2,68+e,68+t),this._attrIndex.setXY(200+e*2,100+e,100+t)}this._attrIndex.needsUpdate=!0}},to=class extends Y{constructor(e){super(),this.worldScale=1,this._currentOffset=new g,this._currentNormal=new g,this._shape=e,this._attrPos=new U(new Float32Array(18),3),this.setAttribute("position",this._attrPos),this._attrIndex=new U(new Uint16Array(10),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let e=!1;this._currentOffset.equals(this._shape.offset)||(this._currentOffset.copy(this._shape.offset),e=!0),this._currentNormal.equals(this._shape.normal)||(this._currentNormal.copy(this._shape.normal),e=!0),e&&this._buildPosition()}_buildPosition(){this._attrPos.setXYZ(0,-.5,-.5,0),this._attrPos.setXYZ(1,.5,-.5,0),this._attrPos.setXYZ(2,.5,.5,0),this._attrPos.setXYZ(3,-.5,.5,0),this._attrPos.setXYZ(4,0,0,0),this._attrPos.setXYZ(5,0,0,.25),this.translate(this._currentOffset.x,this._currentOffset.y,this._currentOffset.z),this.lookAt(this._currentNormal),this._attrPos.needsUpdate=!0}_buildIndex(){this._attrIndex.setXY(0,0,1),this._attrIndex.setXY(2,1,2),this._attrIndex.setXY(4,2,3),this._attrIndex.setXY(6,3,0),this._attrIndex.setXY(8,4,5),this._attrIndex.needsUpdate=!0}},no=class extends Y{constructor(e){super(),this.worldScale=1,this._currentRadius=0,this._currentOffset=new g,this._shape=e,this._attrPos=new U(new Float32Array(288),3),this.setAttribute("position",this._attrPos),this._attrIndex=new U(new Uint16Array(192),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let e=!1;const t=this._shape.radius/this.worldScale;this._currentRadius!==t&&(this._currentRadius=t,e=!0),this._currentOffset.equals(this._shape.offset)||(this._currentOffset.copy(this._shape.offset),e=!0),e&&this._buildPosition()}_buildPosition(){for(let e=0;e<32;e++){const t=e/16*Math.PI;this._attrPos.setXYZ(e,Math.cos(t),Math.sin(t),0),this._attrPos.setXYZ(32+e,0,Math.cos(t),Math.sin(t)),this._attrPos.setXYZ(64+e,Math.sin(t),0,Math.cos(t))}this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentOffset.x,this._currentOffset.y,this._currentOffset.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let e=0;e<32;e++){const t=(e+1)%32;this._attrIndex.setXY(e*2,e,t),this._attrIndex.setXY(64+e*2,32+e,32+t),this._attrIndex.setXY(128+e*2,64+e,64+t)}this._attrIndex.needsUpdate=!0}},io=new g,ze=class extends se{constructor(e){if(super(),this.matrixAutoUpdate=!1,this.collider=e,this.collider.shape instanceof qn)this._geometry=new no(this.collider.shape);else if(this.collider.shape instanceof Yn)this._geometry=new eo(this.collider.shape);else if(this.collider.shape instanceof Gn)this._geometry=new to(this.collider.shape);else throw new Error("VRMSpringBoneColliderHelper: Unknown collider shape type detected");const t=new Ce({color:16711935,depthTest:!1,depthWrite:!1});this._line=new tt(this._geometry,t),this.add(this._line)}dispose(){this._geometry.dispose()}updateMatrixWorld(e){this.collider.updateWorldMatrix(!0,!1),this.matrix.copy(this.collider.matrixWorld);const t=this.matrix.elements;this._geometry.worldScale=io.set(t[0],t[1],t[2]).length(),this._geometry.update(),super.updateMatrixWorld(e)}},ro=class extends Y{constructor(e){super(),this.worldScale=1,this._currentRadius=0,this._currentTail=new g,this._springBone=e,this._attrPos=new U(new Float32Array(294),3),this.setAttribute("position",this._attrPos),this._attrIndex=new U(new Uint16Array(194),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let e=!1;const t=this._springBone.settings.hitRadius/this.worldScale;this._currentRadius!==t&&(this._currentRadius=t,e=!0),this._currentTail.equals(this._springBone.initialLocalChildPosition)||(this._currentTail.copy(this._springBone.initialLocalChildPosition),e=!0),e&&this._buildPosition()}_buildPosition(){for(let e=0;e<32;e++){const t=e/16*Math.PI;this._attrPos.setXYZ(e,Math.cos(t),Math.sin(t),0),this._attrPos.setXYZ(32+e,0,Math.cos(t),Math.sin(t)),this._attrPos.setXYZ(64+e,Math.sin(t),0,Math.cos(t))}this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.setXYZ(96,0,0,0),this._attrPos.setXYZ(97,this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let e=0;e<32;e++){const t=(e+1)%32;this._attrIndex.setXY(e*2,e,t),this._attrIndex.setXY(64+e*2,32+e,32+t),this._attrIndex.setXY(128+e*2,64+e,64+t)}this._attrIndex.setXY(192,96,97),this._attrIndex.needsUpdate=!0}},oo=new g,so=class extends se{constructor(e){super(),this.matrixAutoUpdate=!1,this.springBone=e,this._geometry=new ro(this.springBone);const t=new Ce({color:16776960,depthTest:!1,depthWrite:!1});this._line=new tt(this._geometry,t),this.add(this._line)}dispose(){this._geometry.dispose()}updateMatrixWorld(e){this.springBone.bone.updateWorldMatrix(!0,!1),this.matrix.copy(this.springBone.bone.matrixWorld);const t=this.matrix.elements;this._geometry.worldScale=oo.set(t[0],t[1],t[2]).length(),this._geometry.update(),super.updateMatrixWorld(e)}},je=class extends Pe{constructor(e){super(),this.colliderMatrix=new X,this.shape=e}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),ao(this.colliderMatrix,this.matrixWorld,this.shape.offset)}};function ao(e,t,n){const i=t.elements;e.copy(t),n&&(e.elements[12]=i[0]*n.x+i[4]*n.y+i[8]*n.z+i[12],e.elements[13]=i[1]*n.x+i[5]*n.y+i[9]*n.z+i[13],e.elements[14]=i[2]*n.x+i[6]*n.y+i[10]*n.z+i[14])}var lo=new X;function uo(e){return e.invert?e.invert():e.getInverse(lo.copy(e)),e}var ho=class{constructor(e){this._inverseCache=new X,this._shouldUpdateInverse=!0,this.matrix=e;const t={set:(n,i,r)=>(this._shouldUpdateInverse=!0,n[i]=r,!0)};this._originalElements=e.elements,e.elements=new Proxy(e.elements,t)}get inverse(){return this._shouldUpdateInverse&&(uo(this._inverseCache.copy(this.matrix)),this._shouldUpdateInverse=!1),this._inverseCache}revert(){this.matrix.elements=this._originalElements}},Xe=new X,ie=new g,ce=new g,pe=new g,me=new g,co=new X,po=class{constructor(e,t,n={},i=[]){this._currentTail=new g,this._prevTail=new g,this._boneAxis=new g,this._worldSpaceBoneLength=0,this._center=null,this._initialLocalMatrix=new X,this._initialLocalRotation=new A,this._initialLocalChildPosition=new g;var r,o,a,l,s,u;this.bone=e,this.bone.matrixAutoUpdate=!1,this.child=t,this.settings={hitRadius:(r=n.hitRadius)!=null?r:0,stiffness:(o=n.stiffness)!=null?o:1,gravityPower:(a=n.gravityPower)!=null?a:0,gravityDir:(s=(l=n.gravityDir)==null?void 0:l.clone())!=null?s:new g(0,-1,0),dragForce:(u=n.dragForce)!=null?u:.4},this.colliderGroups=i}get dependencies(){const e=new Set,t=this.bone.parent;t&&e.add(t);for(let n=0;n<this.colliderGroups.length;n++)for(let i=0;i<this.colliderGroups[n].colliders.length;i++)e.add(this.colliderGroups[n].colliders[i]);return e}get center(){return this._center}set center(e){var t;(t=this._center)!=null&&t.userData.inverseCacheProxy&&(this._center.userData.inverseCacheProxy.revert(),delete this._center.userData.inverseCacheProxy),this._center=e,this._center&&(this._center.userData.inverseCacheProxy||(this._center.userData.inverseCacheProxy=new ho(this._center.matrixWorld)))}get initialLocalChildPosition(){return this._initialLocalChildPosition}get _parentMatrixWorld(){return this.bone.parent?this.bone.parent.matrixWorld:Xe}setInitState(){this._initialLocalMatrix.copy(this.bone.matrix),this._initialLocalRotation.copy(this.bone.quaternion),this.child?this._initialLocalChildPosition.copy(this.child.position):this._initialLocalChildPosition.copy(this.bone.position).normalize().multiplyScalar(.07);const e=this._getMatrixWorldToCenter();this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(e),this._prevTail.copy(this._currentTail),this._boneAxis.copy(this._initialLocalChildPosition).normalize()}reset(){this.bone.quaternion.copy(this._initialLocalRotation),this.bone.updateMatrix(),this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld,this.bone.matrix);const e=this._getMatrixWorldToCenter();this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(e),this._prevTail.copy(this._currentTail)}update(e){if(e<=0)return;this._calcWorldSpaceBoneLength();const t=ce.copy(this._boneAxis).transformDirection(this._initialLocalMatrix).transformDirection(this._parentMatrixWorld);me.copy(this._currentTail).add(ie.subVectors(this._currentTail,this._prevTail).multiplyScalar(1-this.settings.dragForce)).applyMatrix4(this._getMatrixCenterToWorld()).addScaledVector(t,this.settings.stiffness*e).addScaledVector(this.settings.gravityDir,this.settings.gravityPower*e),pe.setFromMatrixPosition(this.bone.matrixWorld),me.sub(pe).normalize().multiplyScalar(this._worldSpaceBoneLength).add(pe),this._collision(me),this._prevTail.copy(this._currentTail),this._currentTail.copy(me).applyMatrix4(this._getMatrixWorldToCenter());const n=co.multiplyMatrices(this._parentMatrixWorld,this._initialLocalMatrix).invert();this.bone.quaternion.setFromUnitVectors(this._boneAxis,ie.copy(me).applyMatrix4(n).normalize()).premultiply(this._initialLocalRotation),this.bone.updateMatrix(),this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld,this.bone.matrix)}_collision(e){for(let t=0;t<this.colliderGroups.length;t++)for(let n=0;n<this.colliderGroups[t].colliders.length;n++){const i=this.colliderGroups[t].colliders[n],r=i.shape.calculateCollision(i.colliderMatrix,e,this.settings.hitRadius,ie);if(r<0){e.addScaledVector(ie,-r),e.sub(pe);const o=e.length();e.multiplyScalar(this._worldSpaceBoneLength/o).add(pe)}}}_calcWorldSpaceBoneLength(){ie.setFromMatrixPosition(this.bone.matrixWorld),this.child?ce.setFromMatrixPosition(this.child.matrixWorld):(ce.copy(this._initialLocalChildPosition),ce.applyMatrix4(this.bone.matrixWorld)),this._worldSpaceBoneLength=ie.sub(ce).length()}_getMatrixCenterToWorld(){return this._center?this._center.matrixWorld:Xe}_getMatrixWorldToCenter(){return this._center?this._center.userData.inverseCacheProxy.inverse:Xe}};function mo(e,t){const n=[];let i=e;for(;i!==null;)n.unshift(i),i=i.parent;n.forEach(r=>{t(r)})}function Je(e,t){e.children.forEach(n=>{t(n)||Je(n,t)})}function fo(e){var t;const n=new Map;for(const i of e){let r=i;do{const o=((t=n.get(r))!=null?t:0)+1;if(o===e.size)return r;n.set(r,o),r=r.parent}while(r!==null)}return null}var Mn=class{constructor(){this._joints=new Set,this._sortedJoints=[],this._hasWarnedCircularDependency=!1,this._ancestors=[],this._objectSpringBonesMap=new Map,this._isSortedJointsDirty=!1,this._relevantChildrenUpdated=this._relevantChildrenUpdated.bind(this)}get joints(){return this._joints}get springBones(){return console.warn("VRMSpringBoneManager: springBones is deprecated. use joints instead."),this._joints}get colliderGroups(){const e=new Set;return this._joints.forEach(t=>{t.colliderGroups.forEach(n=>{e.add(n)})}),Array.from(e)}get colliders(){const e=new Set;return this.colliderGroups.forEach(t=>{t.colliders.forEach(n=>{e.add(n)})}),Array.from(e)}addJoint(e){this._joints.add(e);let t=this._objectSpringBonesMap.get(e.bone);t==null&&(t=new Set,this._objectSpringBonesMap.set(e.bone,t)),t.add(e),this._isSortedJointsDirty=!0}addSpringBone(e){console.warn("VRMSpringBoneManager: addSpringBone() is deprecated. use addJoint() instead."),this.addJoint(e)}deleteJoint(e){this._joints.delete(e),this._objectSpringBonesMap.get(e.bone).delete(e),this._isSortedJointsDirty=!0}deleteSpringBone(e){console.warn("VRMSpringBoneManager: deleteSpringBone() is deprecated. use deleteJoint() instead."),this.deleteJoint(e)}setInitState(){this._sortJoints();for(let e=0;e<this._sortedJoints.length;e++){const t=this._sortedJoints[e];t.bone.updateMatrix(),t.bone.updateWorldMatrix(!1,!1),t.setInitState()}}reset(){this._sortJoints();for(let e=0;e<this._sortedJoints.length;e++){const t=this._sortedJoints[e];t.bone.updateMatrix(),t.bone.updateWorldMatrix(!1,!1),t.reset()}}update(e){this._sortJoints();for(let t=0;t<this._ancestors.length;t++)this._ancestors[t].updateWorldMatrix(t===0,!1);for(let t=0;t<this._sortedJoints.length;t++){const n=this._sortedJoints[t];n.bone.updateMatrix(),n.bone.updateWorldMatrix(!1,!1),n.update(e),Je(n.bone,this._relevantChildrenUpdated)}}_sortJoints(){if(!this._isSortedJointsDirty)return;const e=[],t=new Set,n=new Set,i=new Set;for(const o of this._joints)this._insertJointSort(o,t,n,e,i);this._sortedJoints=e;const r=fo(i);this._ancestors=[],r&&(this._ancestors.push(r),Je(r,o=>{var a,l;return((l=(a=this._objectSpringBonesMap.get(o))==null?void 0:a.size)!=null?l:0)>0?!0:(this._ancestors.push(o),!1)})),this._isSortedJointsDirty=!1}_insertJointSort(e,t,n,i,r){if(n.has(e))return;if(t.has(e)){this._hasWarnedCircularDependency||(console.warn("VRMSpringBoneManager: Circular dependency detected"),this._hasWarnedCircularDependency=!0);return}t.add(e);const o=e.dependencies;for(const a of o){let l=!1,s=null;mo(a,u=>{const h=this._objectSpringBonesMap.get(u);if(h)for(const d of h)l=!0,this._insertJointSort(d,t,n,i,r);else l||(s=u)}),s&&r.add(s)}i.push(e),n.add(e)}_relevantChildrenUpdated(e){var t,n;return((n=(t=this._objectSpringBonesMap.get(e))==null?void 0:t.size)!=null?n:0)>0?!0:(e.updateWorldMatrix(!1,!1),!1)}},xn="VRMC_springBone_extended_collider",_o=new Set(["1.0","1.0-beta"]),go=new Set(["1.0"]),Qn=class oe{get name(){return oe.EXTENSION_NAME}constructor(t,n){var i;this.parser=t,this.jointHelperRoot=n==null?void 0:n.jointHelperRoot,this.colliderHelperRoot=n==null?void 0:n.colliderHelperRoot,this.useExtendedColliders=(i=n==null?void 0:n.useExtendedColliders)!=null?i:!0}afterRoot(t){return we(this,null,function*(){t.userData.vrmSpringBoneManager=yield this._import(t)})}_import(t){return we(this,null,function*(){const n=yield this._v1Import(t);if(n!=null)return n;const i=yield this._v0Import(t);return i??null})}_v1Import(t){return we(this,null,function*(){var n,i,r,o,a;const l=t.parser.json;if(!(((n=l.extensionsUsed)==null?void 0:n.indexOf(oe.EXTENSION_NAME))!==-1))return null;const u=new Mn,h=yield t.parser.getDependencies("node"),d=(i=l.extensions)==null?void 0:i[oe.EXTENSION_NAME];if(!d)return null;const c=d.specVersion;if(!_o.has(c))return console.warn(`VRMSpringBoneLoaderPlugin: Unknown ${oe.EXTENSION_NAME} specVersion "${c}"`),null;const p=(r=d.colliders)==null?void 0:r.map((m,_)=>{var x,R,S,v,M,y,w,T,I,E,L,b,N,q,B;const j=h[m.node];if(j==null)return console.warn(`VRMSpringBoneLoaderPlugin: The collider #${_} attempted to use the node #${m.node} but not found`),null;const F=m.shape,ee=(x=m.extensions)==null?void 0:x[xn];if(this.useExtendedColliders&&ee!=null){const le=ee.specVersion;if(!go.has(le))console.warn(`VRMSpringBoneLoaderPlugin: Unknown ${xn} specVersion "${le}". Fallbacking to the ${oe.EXTENSION_NAME} definition`);else{const O=ee.shape;if(O.sphere)return this._importSphereCollider(j,{offset:new g().fromArray((R=O.sphere.offset)!=null?R:[0,0,0]),radius:(S=O.sphere.radius)!=null?S:0,inside:(v=O.sphere.inside)!=null?v:!1});if(O.capsule)return this._importCapsuleCollider(j,{offset:new g().fromArray((M=O.capsule.offset)!=null?M:[0,0,0]),radius:(y=O.capsule.radius)!=null?y:0,tail:new g().fromArray((w=O.capsule.tail)!=null?w:[0,0,0]),inside:(T=O.capsule.inside)!=null?T:!1});if(O.plane)return this._importPlaneCollider(j,{offset:new g().fromArray((I=O.plane.offset)!=null?I:[0,0,0]),normal:new g().fromArray((E=O.plane.normal)!=null?E:[0,0,1])})}}if(F.sphere)return this._importSphereCollider(j,{offset:new g().fromArray((L=F.sphere.offset)!=null?L:[0,0,0]),radius:(b=F.sphere.radius)!=null?b:0,inside:!1});if(F.capsule)return this._importCapsuleCollider(j,{offset:new g().fromArray((N=F.capsule.offset)!=null?N:[0,0,0]),radius:(q=F.capsule.radius)!=null?q:0,tail:new g().fromArray((B=F.capsule.tail)!=null?B:[0,0,0]),inside:!1});throw new Error(`VRMSpringBoneLoaderPlugin: The collider #${_} has no valid shape`)}),f=(o=d.colliderGroups)==null?void 0:o.map((m,_)=>{var x;return{colliders:((x=m.colliders)!=null?x:[]).flatMap(S=>{const v=p==null?void 0:p[S];return v??(console.warn(`VRMSpringBoneLoaderPlugin: The colliderGroup #${_} attempted to use a collider #${S} but not found`),[])}),name:m.name}});return(a=d.springs)==null||a.forEach((m,_)=>{var x;const R=m.joints,S=(x=m.colliderGroups)==null?void 0:x.map(y=>{const w=f==null?void 0:f[y];if(w==null)throw new Error(`VRMSpringBoneLoaderPlugin: The spring #${_} attempted to use a colliderGroup ${y} but not found`);return w}),v=m.center!=null?h[m.center]:void 0;let M;R.forEach(y=>{if(M){const w=M.node,T=h[w],I=y.node,E=h[I],L={hitRadius:M.hitRadius,dragForce:M.dragForce,gravityPower:M.gravityPower,stiffness:M.stiffness,gravityDir:M.gravityDir!=null?new g().fromArray(M.gravityDir):void 0},b=this._importJoint(T,E,L,S);v&&(b.center=v),u.addJoint(b)}M=y})}),u.setInitState(),u})}_v0Import(t){return we(this,null,function*(){var n,i,r;const o=t.parser.json;if(!(((n=o.extensionsUsed)==null?void 0:n.indexOf("VRM"))!==-1))return null;const l=(i=o.extensions)==null?void 0:i.VRM,s=l==null?void 0:l.secondaryAnimation;if(!s)return null;const u=s==null?void 0:s.boneGroups;if(!u)return null;const h=new Mn,d=yield t.parser.getDependencies("node"),c=(r=s.colliderGroups)==null?void 0:r.map(p=>{var f;const m=d[p.node];return{colliders:((f=p.colliders)!=null?f:[]).map((x,R)=>{var S,v,M;const y=new g(0,0,0);return x.offset&&y.set((S=x.offset.x)!=null?S:0,(v=x.offset.y)!=null?v:0,x.offset.z?-x.offset.z:0),this._importSphereCollider(m,{offset:y,radius:(M=x.radius)!=null?M:0,inside:!1})})}});return u==null||u.forEach((p,f)=>{const m=p.bones;m&&m.forEach(_=>{var x,R,S,v;const M=d[_],y=new g;p.gravityDir?y.set((x=p.gravityDir.x)!=null?x:0,(R=p.gravityDir.y)!=null?R:0,(S=p.gravityDir.z)!=null?S:0):y.set(0,-1,0);const w=p.center!=null?d[p.center]:void 0,T={hitRadius:p.hitRadius,dragForce:p.dragForce,gravityPower:p.gravityPower,stiffness:p.stiffiness,gravityDir:y},I=(v=p.colliderGroups)==null?void 0:v.map(E=>{const L=c==null?void 0:c[E];if(L==null)throw new Error(`VRMSpringBoneLoaderPlugin: The spring #${f} attempted to use a colliderGroup ${E} but not found`);return L});M.traverse(E=>{var L;const b=(L=E.children[0])!=null?L:null,N=this._importJoint(E,b,T,I);w&&(N.center=w),h.addJoint(N)})})}),t.scene.updateMatrixWorld(),h.setInitState(),h})}_importJoint(t,n,i,r){const o=new po(t,n,i,r);if(this.jointHelperRoot){const a=new so(o);this.jointHelperRoot.add(a),a.renderOrder=this.jointHelperRoot.renderOrder}return o}_importSphereCollider(t,n){const i=new qn(n),r=new je(i);if(t.add(r),this.colliderHelperRoot){const o=new ze(r);this.colliderHelperRoot.add(o),o.renderOrder=this.colliderHelperRoot.renderOrder}return r}_importCapsuleCollider(t,n){const i=new Yn(n),r=new je(i);if(t.add(r),this.colliderHelperRoot){const o=new ze(r);this.colliderHelperRoot.add(o),o.renderOrder=this.colliderHelperRoot.renderOrder}return r}_importPlaneCollider(t,n){const i=new Gn(n),r=new je(i);if(t.add(r),this.colliderHelperRoot){const o=new ze(r);this.colliderHelperRoot.add(o),o.renderOrder=this.colliderHelperRoot.renderOrder}return r}};Qn.EXTENSION_NAME="VRMC_springBone";var vo=Qn,Xo=class{get name(){return"VRMLoaderPlugin"}constructor(e,t){var n,i,r,o,a,l,s,u,h,d;this.parser=e;const c=t==null?void 0:t.helperRoot,p=t==null?void 0:t.autoUpdateHumanBones;this.expressionPlugin=(n=t==null?void 0:t.expressionPlugin)!=null?n:new Cn(e),this.firstPersonPlugin=(i=t==null?void 0:t.firstPersonPlugin)!=null?i:new Un(e),this.humanoidPlugin=(r=t==null?void 0:t.humanoidPlugin)!=null?r:new Dn(e,{helperRoot:c,autoUpdateHumanBones:p}),this.lookAtPlugin=(o=t==null?void 0:t.lookAtPlugin)!=null?o:new Hn(e,{helperRoot:c}),this.metaPlugin=(a=t==null?void 0:t.metaPlugin)!=null?a:new kn(e),this.mtoonMaterialPlugin=(l=t==null?void 0:t.mtoonMaterialPlugin)!=null?l:new Rr(e),this.materialsHDREmissiveMultiplierPlugin=(s=t==null?void 0:t.materialsHDREmissiveMultiplierPlugin)!=null?s:new Tr(e),this.materialsV0CompatPlugin=(u=t==null?void 0:t.materialsV0CompatPlugin)!=null?u:new br(e),this.springBonePlugin=(h=t==null?void 0:t.springBonePlugin)!=null?h:new vo(e,{colliderHelperRoot:c,jointHelperRoot:c}),this.nodeConstraintPlugin=(d=t==null?void 0:t.nodeConstraintPlugin)!=null?d:new Jr(e,{helperRoot:c})}beforeRoot(){return xe(this,null,function*(){yield this.materialsV0CompatPlugin.beforeRoot(),yield this.mtoonMaterialPlugin.beforeRoot()})}loadMesh(e){return xe(this,null,function*(){return yield this.mtoonMaterialPlugin.loadMesh(e)})}getMaterialType(e){const t=this.mtoonMaterialPlugin.getMaterialType(e);return t??null}extendMaterialParams(e,t){return xe(this,null,function*(){yield this.materialsHDREmissiveMultiplierPlugin.extendMaterialParams(e,t),yield this.mtoonMaterialPlugin.extendMaterialParams(e,t)})}afterRoot(e){return xe(this,null,function*(){yield this.metaPlugin.afterRoot(e),yield this.humanoidPlugin.afterRoot(e),yield this.expressionPlugin.afterRoot(e),yield this.lookAtPlugin.afterRoot(e),yield this.firstPersonPlugin.afterRoot(e),yield this.springBonePlugin.afterRoot(e),yield this.nodeConstraintPlugin.afterRoot(e),yield this.mtoonMaterialPlugin.afterRoot(e);const t=e.userData.vrmMeta,n=e.userData.vrmHumanoid;if(t&&n){const i=new ur({scene:e.scene,expressionManager:e.userData.vrmExpressionManager,firstPerson:e.userData.vrmFirstPerson,humanoid:n,lookAt:e.userData.vrmLookAt,meta:t,materials:e.userData.vrmMToonMaterials,springBoneManager:e.userData.vrmSpringBoneManager,nodeConstraintManager:e.userData.vrmNodeConstraintManager});e.userData.vrm=i}})}};function Mo(e){const t=new Set;return e.traverse(n=>{if(!n.isMesh)return;const i=n;t.add(i)}),t}function yn(e,t,n){if(t.size===1){const a=t.values().next().value;if(a.weight===1)return e[a.index]}const i=new Float32Array(e[0].count*3);let r=0;if(n)r=1;else for(const a of t)r+=a.weight;for(const a of t){const l=e[a.index],s=a.weight/r;for(let u=0;u<l.count;u++)i[u*3+0]+=l.getX(u)*s,i[u*3+1]+=l.getY(u)*s,i[u*3+2]+=l.getZ(u)*s}return new U(i,3)}function xo(e){var t;const n=Mo(e.scene),i=new Map,r=(t=e.expressionManager)==null?void 0:t.expressionMap;if(r!=null)for(const[o,a]of Object.entries(r)){const l=new Set;for(const s of a.binds)if(s instanceof Le){if(s.weight!==0)for(const u of s.primitives){let h=i.get(u);h==null&&(h=new Map,i.set(u,h));let d=h.get(o);d==null&&(d=new Set,h.set(o,d)),d.add(s)}l.add(s)}for(const s of l)a.deleteBind(s)}for(const o of n){const a=i.get(o);if(a==null)continue;const l=o.geometry.morphAttributes;o.geometry.morphAttributes={};const s=o.geometry.clone();o.geometry=s;const u=s.morphTargetsRelative,h=l.position!=null,d=l.normal!=null,c={},p={},f=[];if(h||d){h&&(c.position=[]),d&&(c.normal=[]);let m=0;for(const[_,x]of a)h&&(c.position[m]=yn(l.position,x,u)),d&&(c.normal[m]=yn(l.normal,x,u)),r==null||r[_].addBind(new Le({index:m,weight:1,primitives:[o]})),p[_]=m,f.push(0),m++}s.morphAttributes=c,o.morphTargetDictionary=p,o.morphTargetInfluences=f}}function be(e,t,n){if(e.getComponent)return e.getComponent(t,n);{let i=e.array[t*e.itemSize+n];return e.normalized&&(i=C.denormalize(i,e.array)),i}}function $n(e,t,n,i){e.setComponent?e.setComponent(t,n,i):(e.normalized&&(i=C.normalize(i,e.array)),e.array[t*e.itemSize+n]=i)}function yo(e){var t;const n=Ro(e),i=new Set;for(const d of n)i.has(d.geometry)&&(d.geometry=Ao(d.geometry)),i.add(d.geometry);const r=new Map;for(const d of i){const c=d.getAttribute("skinIndex"),p=(t=r.get(c))!=null?t:new Map;r.set(c,p);const f=d.getAttribute("skinWeight"),m=wo(c,f);p.set(f,m)}const o=new Map;for(const d of n){const c=To(d,r);o.set(d,c)}const a=[];for(const[d,c]of o){let p=!1;for(const f of a)if(So(c,f.boneInverseMap)){p=!0,f.meshes.add(d);for(const[_,x]of c)f.boneInverseMap.set(_,x);break}p||a.push({boneInverseMap:c,meshes:new Set([d])})}const l=new Map,s=new Ye,u=new Ye,h=new Ye;for(const d of a){const{boneInverseMap:c,meshes:p}=d,f=Array.from(c.keys()),m=Array.from(c.values()),_=new Ke(f,m),x=u.getOrCreate(_);for(const R of p){const S=R.geometry.getAttribute("skinIndex"),v=s.getOrCreate(S),M=R.skeleton.bones,y=M.map(I=>h.getOrCreate(I)).join(","),w=`${v};${x};${y}`;let T=l.get(w);T==null&&(T=S.clone(),Eo(T,M,f),l.set(w,T)),R.geometry.setAttribute("skinIndex",T)}for(const R of p)R.bind(_,new X)}}function Ro(e){const t=new Set;return e.traverse(n=>{if(!n.isSkinnedMesh)return;const i=n;t.add(i)}),t}function wo(e,t){const n=new Set;for(let i=0;i<e.count;i++)for(let r=0;r<e.itemSize;r++){const o=be(e,i,r);be(t,i,r)!==0&&n.add(o)}return n}function To(e,t){const n=new Map,i=e.skeleton,r=e.geometry,o=r.getAttribute("skinIndex"),a=r.getAttribute("skinWeight"),l=t.get(o),s=l==null?void 0:l.get(a);if(!s)throw new Error("Unreachable. attributeUsedIndexSetMap does not know the skin index attribute or the skin weight attribute.");for(const u of s)n.set(i.bones[u],i.boneInverses[u]);return n}function So(e,t){for(const[n,i]of e.entries()){const r=t.get(n);if(r!=null&&!Po(i,r))return!1}return!0}function Eo(e,t,n){const i=new Map;for(const o of t)i.set(o,i.size);const r=new Map;for(const[o,a]of n.entries()){const l=i.get(a);r.set(l,o)}for(let o=0;o<e.count;o++)for(let a=0;a<e.itemSize;a++){const l=be(e,o,a),s=r.get(l);$n(e,o,a,s)}e.needsUpdate=!0}function Po(e,t,n){if(n=n||1e-4,e.elements.length!=t.elements.length)return!1;for(let i=0,r=e.elements.length;i<r;i++)if(Math.abs(e.elements[i]-t.elements[i])>n)return!1;return!0}var Ye=class{constructor(){this._objectIndexMap=new Map,this._index=0}get(e){return this._objectIndexMap.get(e)}getOrCreate(e){let t=this._objectIndexMap.get(e);return t==null&&(t=this._index,this._objectIndexMap.set(e,t),this._index++),t}};function Ao(e){var t,n,i,r;const o=new Y;o.name=e.name,o.setIndex(e.index);for(const[a,l]of Object.entries(e.attributes))o.setAttribute(a,l);for(const[a,l]of Object.entries(e.morphAttributes)){const s=a;o.morphAttributes[s]=l.concat()}o.morphTargetsRelative=e.morphTargetsRelative,o.groups=[];for(const a of e.groups)o.addGroup(a.start,a.count,a.materialIndex);return o.boundingSphere=(n=(t=e.boundingSphere)==null?void 0:t.clone())!=null?n:null,o.boundingBox=(r=(i=e.boundingBox)==null?void 0:i.clone())!=null?r:null,o.drawRange.start=e.drawRange.start,o.drawRange.count=e.drawRange.count,o.userData=e.userData,o}function Rn(e){if(Object.values(e).forEach(t=>{t!=null&&t.isTexture&&t.dispose()}),e.isShaderMaterial){const t=e.uniforms;t&&Object.values(t).forEach(n=>{const i=n.value;i!=null&&i.isTexture&&i.dispose()})}e.dispose()}function Lo(e){const t=e.geometry;t&&t.dispose();const n=e.skeleton;n&&n.dispose();const i=e.material;i&&(Array.isArray(i)?i.forEach(r=>Rn(r)):i&&Rn(i))}function Io(e){e.traverse(Lo)}function bo(e,t){var n,i;console.warn("VRMUtils.removeUnnecessaryJoints: removeUnnecessaryJoints is deprecated. Use combineSkeletons instead. combineSkeletons contributes more to the performance improvement. This function will be removed in the next major version.");const r=(n=t==null?void 0:t.experimentalSameBoneCounts)!=null?n:!1,o=[];e.traverse(s=>{s.type==="SkinnedMesh"&&o.push(s)});const a=new Map;let l=0;for(const s of o){const h=s.geometry.getAttribute("skinIndex");if(a.has(h))continue;const d=new Map,c=new Map;for(let p=0;p<h.count;p++)for(let f=0;f<h.itemSize;f++){const m=be(h,p,f);let _=d.get(m);_==null&&(_=d.size,d.set(m,_),c.set(_,m)),$n(h,p,f,_)}h.needsUpdate=!0,a.set(h,c),l=Math.max(l,d.size)}for(const s of o){const h=s.geometry.getAttribute("skinIndex"),d=a.get(h),c=[],p=[],f=r?l:d.size;for(let _=0;_<f;_++){const x=(i=d.get(_))!=null?i:0;c.push(s.skeleton.bones[x]),p.push(s.skeleton.boneInverses[x])}const m=new Ke(c,p);s.bind(m,new X)}}function Co(e){const t=new Map;e.traverse(n=>{var i,r,o,a;if(!n.isMesh)return;const l=n,s=l.geometry,u=s.index;if(u==null)return;const h=t.get(s);if(h!=null){l.geometry=h;return}const d=Object.values(s.attributes)[0].count,c=new Array(d);let p=0;const f=u.array;for(let v=0;v<f.length;v++){const M=f[v];c[M]||(c[M]=!0,p++)}if(p===d)return;const m=[],_=[];let x=0;for(let v=0;v<c.length;v++)if(c[v]){const M=x++;m[v]=M,_[M]=v}const R=new Y;R.name=s.name,R.morphTargetsRelative=s.morphTargetsRelative,s.groups.forEach(v=>{R.addGroup(v.start,v.count,v.materialIndex)}),R.boundingBox=(r=(i=s.boundingBox)==null?void 0:i.clone())!=null?r:null,R.boundingSphere=(a=(o=s.boundingSphere)==null?void 0:o.clone())!=null?a:null,R.setDrawRange(s.drawRange.start,s.drawRange.count),R.userData=s.userData,t.set(s,R);{const v=u.array,M=new v.constructor(v.length);for(let y=0;y<v.length;y++){const w=v[y],T=m[w];M[y]=T}R.setIndex(new U(M,1,!1))}Object.keys(s.attributes).forEach(v=>{const M=s.attributes[v];if(M.isInterleavedBufferAttribute)throw new Error("removeUnnecessaryVertices: InterleavedBufferAttribute is not supported");const y=M.array,{itemSize:w,normalized:T}=M,I=new y.constructor(_.length*w);_.forEach((E,L)=>{for(let b=0;b<w;b++)I[L*w+b]=y[E*w+b]}),R.setAttribute(v,new U(I,w,T))});let S=!0;for(const[v,M]of Object.entries(s.morphAttributes)){const y=v;R.morphAttributes[y]=[];for(let w=0;w<M.length;w++){const T=M[w];if(T.isInterleavedBufferAttribute)throw new Error("removeUnnecessaryVertices: InterleavedBufferAttribute is not supported");const I=T.array,{itemSize:E,normalized:L}=T,b=new I.constructor(_.length*E);_.forEach((N,q)=>{for(let B=0;B<E;B++)b[q*E+B]=I[N*E+B]}),S=S&&b.every(N=>N===0),R.morphAttributes[y][w]=new U(b,E,L)}}S&&(R.morphAttributes={}),l.geometry=R}),Array.from(t.keys()).forEach(n=>{n.dispose()})}function Uo(e){var t;((t=e.meta)==null?void 0:t.metaVersion)==="0"&&(e.scene.rotation.y=Math.PI)}var ae=class{constructor(){}};ae.combineMorphs=xo;ae.combineSkeletons=yo;ae.deepDispose=Io;ae.removeUnnecessaryJoints=bo;ae.removeUnnecessaryVertices=Co;ae.rotateVRM0=Uo;/*!
 * @pixiv/three-vrm-core v3.4.4
 * The implementation of core features of VRM, for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm-core is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 *//*!
 * @pixiv/three-vrm-materials-mtoon v3.4.4
 * MToon (toon material) module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm-materials-mtoon is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 *//*!
 * @pixiv/three-vrm-materials-hdr-emissive-multiplier v3.4.4
 * Support VRMC_hdr_emissiveMultiplier for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm-materials-hdr-emissive-multiplier is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 *//*!
 * @pixiv/three-vrm-materials-v0compat v3.4.4
 * VRM0.0 materials compatibility layer plugin for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm-materials-v0compat is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 *//*!
 * @pixiv/three-vrm-node-constraint v3.4.4
 * Node constraint module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm-node-constraint is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 *//*!
 * @pixiv/three-vrm-springbone v3.4.4
 * Spring bone module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2025 pixiv Inc.
 * @pixiv/three-vrm-springbone is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */export{xr as MToonMaterial,vr as MToonMaterialDebugMode,Rr as MToonMaterialLoaderPlugin,cn as MToonMaterialOutlineWidthMode,ur as VRM,kr as VRMAimConstraint,Wn as VRMCore,jo as VRMCoreLoaderPlugin,Ht as VRMExpression,Cn as VRMExpressionLoaderPlugin,zt as VRMExpressionManager,jt as VRMExpressionMaterialColorBind,de as VRMExpressionMaterialColorType,Le as VRMExpressionMorphTargetBind,Ho as VRMExpressionOverrideType,Ge as VRMExpressionPresetName,Yt as VRMExpressionTextureTransformBind,Gt as VRMFirstPerson,Un as VRMFirstPersonLoaderPlugin,ko as VRMFirstPersonMeshAnnotationType,Ne as VRMHumanBoneList,Wo as VRMHumanBoneName,Wi as VRMHumanBoneParentMap,Jt as VRMHumanoid,$t as VRMHumanoidHelper,Dn as VRMHumanoidLoaderPlugin,Xo as VRMLoaderPlugin,rr as VRMLookAt,Se as VRMLookAtBoneApplier,$e as VRMLookAtExpressionApplier,$i as VRMLookAtHelper,Hn as VRMLookAtLoaderPlugin,ln as VRMLookAtRangeMap,zo as VRMLookAtTypeName,kn as VRMMetaLoaderPlugin,it as VRMNodeConstraint,He as VRMNodeConstraintHelper,Jr as VRMNodeConstraintLoaderPlugin,zr as VRMNodeConstraintManager,Xi as VRMRequiredHumanBoneName,$r as VRMRollConstraint,Yr as VRMRotationConstraint,je as VRMSpringBoneCollider,ze as VRMSpringBoneColliderHelper,rt as VRMSpringBoneColliderShape,Yn as VRMSpringBoneColliderShapeCapsule,Gn as VRMSpringBoneColliderShapePlane,qn as VRMSpringBoneColliderShapeSphere,po as VRMSpringBoneJoint,so as VRMSpringBoneJointHelper,vo as VRMSpringBoneLoaderPlugin,Mn as VRMSpringBoneManager,ae as VRMUtils};
