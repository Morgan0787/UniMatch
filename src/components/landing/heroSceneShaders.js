// GPU particle material and deterministic scroll morph, ported from the approved preview.
export const vertexShader = `precision highp float;
   attribute vec3 earth,icon,iconNormal,ribbon,center,meta;
   attribute float subject;
   uniform vec2 viewport;uniform float t,dpr;
   uniform vec3 uStages,uFold;uniform vec2 uEarthRotation,uYaw[7];uniform vec4 uLayout;
   varying vec3 shade;varying float focus;varying float opacity;
   mat2 rotate(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
   vec2 turn(vec2 p,vec2 cs){return vec2(cs.x*p.x+cs.y*p.y,-cs.y*p.x+cs.x*p.y);}
   float ease(float x){x=clamp(x,0.,1.);return x*x*x*(x*(x*6.-15.)+10.);}
   vec3 safeNormal(vec3 v){return v*inversesqrt(max(dot(v,v),.00000001));}
   void main(){
    float a=uStages.x,b=uStages.y,c=uStages.z;
    vec3 e=earth,en=vec3(0.,0.,-1.),local=vec3(0.),n=vec3(0.,0.,-1.);
    if(a<1.){e+=vec3(sin(meta.x*426.7),sin(meta.x*653.1),cos(meta.x*391.3))*.004;e.xz=turn(e.xz,uEarthRotation);en=normalize(e);}
    if(a>0.){local=icon-center;local.z*=1.8;vec2 yaw=uYaw[int(subject)];local.xz=turn(local.xz,yaw);local.yz=rotate(.16)*local.yz;n=iconNormal;n.xz=turn(n.xz,yaw);n.yz=rotate(.16)*n.yz;}
    vec3 p=mix(e,center+local,a),normal=safeNormal(mix(en,n,a));
    if(b>0.){vec3 r=ribbon;r.y+=sin(t*.65+meta.x*6.28)*.005;p=mix(p,r,b);vec3 rn=normalize(vec3(0.,ribbon.y-(.13-.41*meta.y+.26*sin(meta.y*6.283)),ribbon.z-.46*sin(meta.y*6.283)));normal=safeNormal(mix(normal,rn,b));}
    float chosen=0.,onArc=0.;
    if(c>0.){
      chosen=1.-step(.01,length(center-vec3(.73,-.28,0.)));onArc=(1.-chosen)*(1.-step(.34,meta.x));
      float u=meta.y;vec3 arc=vec3(-.92+1.58*u,.36-.56*u-.46*sin(u*3.14159),.10*sin(u*3.14159)-.08*u);
      float theta=meta.x*932.,thickness=.006+.006*sin(u*3.14159);arc+=vec3(cos(theta)*thickness*.3,sin(theta)*thickness,cos(theta)*thickness);
      vec3 background=center*vec3(1.13,1.13,1.)+local*.70+vec3(0.,0.,.65),university=vec3(.66,-.20,-.08)+local*1.55;
      p=mix(p,mix(mix(background,university,chosen),arc,onArc),c);normal=safeNormal(mix(normal,n,c*(1.-onArc)));
    }
    float flow=sin(p.x*15.+t*1.5)*sin(p.y*13.-t*.8)*.009;
    p+=normal*flow*(1.-c*.85);
    p.xz=turn(p.xz,uFold.xy);p.y+=sin(p.x*4.+t*.6)*uFold.z*.12;
    float diffuse=max(0.,dot(normal,normalize(vec3(-.5,-.65,-.8))));
    float land=step(.78,length(earth))*(1.-a);
    vec3 base=mix(vec3(.97,.98,.975),vec3(1.,.995,.98),land);
    shade=base*(.92+.10*diffuse)*(1.+(meta.x-.5)*.08);
    float rim=pow(1.-abs(normal.z),1.4);
    opacity=(.60+.28*rim+land*.035)*(.86+meta.x*.14);
    opacity*=mix(1.,mix(.17,1.25,max(chosen,onArc)),c);
    float scale=uLayout.x,pers=2.8/(2.8+p.z);
    vec2 xy=vec2(uLayout.y+p.x*scale*pers-viewport.x*.5,viewport.y*.5-uLayout.z-p.y*scale*pers)/(viewport*.5);
    gl_Position=vec4(xy,p.z*.19,1.);
    gl_PointSize=dpr*(1.3+meta.z*.7)*pers*mix(1.,1.3,uLayout.w);
    if(a<.01&&e.z>.02){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;}
    focus=diffuse;
   }`;

export const fragmentShader = `precision mediump float;varying vec3 shade;varying float focus;varying float opacity;
   void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;
    float bead=sqrt(max(0.,1.-r));float light=.91+.09*bead;
    gl_FragColor=vec4(shade*light,opacity*(1.-smoothstep(.50,1.,r)));
   }`;
