"""Bake transparent, directionally lit pixel animation sheets for the regional mines."""
import colorsys, json, math, random
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from PIL import Image, ImageDraw
from mine_species import REGIONS, recipe

PUBLIC=Path(__file__).resolve().parents[1]/'public'
CELL=80
HUES=[218,336,350,225,39,274,355,245,151,194,168,181,143]
SKINS=[(98,91,58),(66,96,83),(128,78,65),(83,83,119),(133,98,65),(99,89,63),(119,66,46),(87,83,119),(75,99,64),(90,78,100),(83,100,112),(80,102,67),(56,86,93)]
PREFIX=['นายด่าน','เจ้าโพรง','ผู้เฝ้าผา','ขุนเหมือง','นายทวาร']
SOVEREIGN=['ราชัน','จอมอสูร','เจ้าบาดาล','พญา','มหาอสูร']
def blend(a,b,n):return tuple(round(x*(1-n)+y*n) for x,y in zip(a,b))
def hue(h,s,l):return tuple(round(v*255) for v in colorsys.hls_to_rgb(h%360/360,l,s))
def species(r,f,k):
    animal,plan,w,l,h,leg,organ=recipe(r,f,k)
    region,place,feature,mark,layers=REGIONS[r]
    name=animal+layers[f]
    if k==10:name='มินิบอส '+PREFIX[(r+f)%5]+name
    if k==11:name='บอส '+SOVEREIGN[(r+f)%5]+name
    return dict(name=name,art=f'{region}-{f+1}-{k+1:02}',size=round(min(51,max(22,11+w+l+leg*.65))),
                fly=plan in ('bird','ray','bell','moth','fish','spirit'),detail=mark+'และ'+layers[f])

class Painter:
    def __init__(self,yaw):
        self.yaw=yaw;self.shapes=[]
    def project(self,p):
        x,y,z=p; cs=math.cos(self.yaw);sn=math.sin(self.yaw)
        u=x*cs+y*sn;depth=y*cs-x*sn
        return (64+u*1.65,83+depth*.69-z*1.53),depth+z*.27
    def ball(self,p,w,h,c):
        (x,y),d=self.project(p);w=max(1,w*1.6);h=max(1,h*1.5)
        self.shapes.append((d,'oval',(x,y,w,h),c))
    def line(self,p,q,width,c):
        (a,da),(b,db)=self.project(p),self.project(q)
        self.shapes.append(((da+db)/2,'line',(a,b,max(1,round(width*1.62))),c))
    def poly(self,points,c):
        proj=[self.project(p) for p in points]
        self.shapes.append((sum(d for _,d in proj)/len(proj),'poly',[v for v,d in proj],c))
    def shard(self,p,q,w,c):
        x,y,z=p;mid=(x,y+w*.6,z-w*.5)
        self.poly([(x-w,y,z),mid,q],blend(c,(240,255,255),.32))
        self.poly([mid,(x+w,y,z),q],c)
    def image(self):
        im=Image.new('RGBA',(128,128));g=ImageDraw.Draw(im)
        for _,mode,data,color in sorted(self.shapes,key=lambda s:s[0]):
            dark=blend(color,(12,15,26),.68);shine=blend(color,(255,235,205),.32)
            if mode=='oval':
                x,y,w,h=data
                g.ellipse((x-w,y-h,x+w,y+h),fill=dark)
                g.ellipse((x-w+1,y-h+1,x+w*.87,y+h*.72),fill=color)
                if w>4 and h>3:
                    mid=blend(color,shine,.43)
                    g.arc((x-w*.91,y-h*.85,x+w*.81,y+h*.79),22,96,fill=blend(color,dark,.49),width=1)
                    g.arc((x-w*.87,y-h*.84,x+w*.65,y+h*.6),184,268,fill=mid,width=1)
                if w>3 and h>3:
                    g.ellipse((x-w*.75,y-h*.78,x+w*.26,y-h*.05),fill=shine)
            elif mode=='line':
                a,b,w=data;g.line([a,b],fill=dark,width=w+2);g.line([a,b],fill=color,width=w)
                if w>=4:g.line([(a[0]-1,a[1]-1),(b[0]-1,b[1]-1)],fill=shine,width=max(1,w//3))
            else:g.polygon(data,fill=color,outline=dark)
        return im

def frame(r,f,k,direction,pose):
    _,plan,w,l,h,leg,organ=recipe(r,f,k)
    seed=r*60+f*12+k;rand=random.Random(seed+73)
    w*=rand.uniform(.87,1.14);l*=rand.uniform(.88,1.15)
    # Four genuine views with a slight three-quarter angle to expose the side limbs.
    g=Painter([.48,math.pi+.48,-1.12,1.12][direction])
    step=[-1,1,0,0][pose];strike=[0,0,-2.8,4][pose]
    # Local lineages differ in build as well as in their mineral organs.
    shoulder,spine,stature,stride=[(1,1,1,1),(0.77,1.22,.88,1.28),(1.16,.91,1.07,.88),
        (.90,.94,1.13,1.15),(.85,1.18,.78,1.32),(.85,.94,1.04,1.38),(1.26,1.06,.93,.79),
        (.82,1.08,1.24,1.14),(1.05,1.21,.8,.85),(1.28,.91,.78,.81),(.95,.89,1.22,1.18),
        (.84,1.32,.83,.9),(1.12,.90,1.07,1.04)][r]
    w*=shoulder;l*=spine;h*=stature;leg*=stride
    z=leg+h*.75+(1 if pose==1 else 0)
    body_hues=[18,137,31,282,54,206,23,12,254,32,174,108,348,76,184,43,207,26,146,298,198,88,205,157,19,190,24,35,278,45,26,173,255,32,18,64,112,173,48,22,279,25,195,15,36,22,30,161,9,46,173,271,95,18,197,81,351,12,37,8]
    body_hue=body_hues[(r*13+(f*12+k)*[1,7,11,13,17,19,23,29,31,37,41,43,47][r])%60]
    skin=blend(hue(body_hue+rand.randrange(-12,13),.47,.38+rand.random()*.13),SKINS[r],.22)
    gem=hue(HUES[r]+f*2,.73,.53);pale=blend(gem,(235,255,238),.64)
    shadow=blend(skin,(22,20,34),.41);bone=blend(skin,(243,213,150),.66)
    eye=(255,193,77) if r%3 else (170,241,252)
    B=g.ball;L=g.line;P=g.poly;S=g.shard
    def link(points,width,c):
        for a,b in zip(points,points[1:]):L(a,b,width,c)
    def chain(points,width,c):
        link(points,width,c)
        for p in points[1:-1]:B(p,width*.67,width*.68,c)
    def flank(x,y,z0,amplitude=1):
        for side in [-1,1]:
            X=side*x
            knee=(X*1.42,y+1,z0*.51)
            foot=(X*1.55,y+3+side*step*amplitude,1)
            chain([(X,y,z0),knee,foot],max(1.6,w*.32),skin)
            B(foot,w*.27,1.5,bone)
    front=l*.77+strike;headz=z+h*.28+(pose==2)*1.5
    head=(0,front,headz)
    if plan in ('beast','drake','hopper'):
        for y in [-l*.54,l*.45]:flank(w*.70,y,z,2 if y>0 else -2)
        for j in range(4):
            u=(j-1.5)/2;B((0,u*l*.77,z),w*(1-abs(u)*.27),h*(1-abs(u)*.23),skin)
        chain([(0,-l*.56,z),(step*1.4,-l*1.12,z+2),(3,-l*1.5,z+5)],2.2,shadow)
        if plan=='hopper':
            for side in [-1,1]:B((side*w*.88,-l*.25,z*.67),w*.54,h*.90,skin)
    elif plan in ('crawler','spider','claw','train'):
        segments=7 if plan=='train' else 3
        for j in range(segments):
            u=j/(segments-1)*2-1;y=u*l*.75
            x=math.sin(j*.9+step*.5)*1.7 if plan=='train' else 0
            B((x,y,z),w*(1-abs(u)*.19),h,skin if j%2 else shadow)
            if plan=='claw' or plan=='spider' or segments==7 or j<3:
                for side in (-1,1):
                    outward=1.9 if plan=='spider' else 1.42
                    chain([(x+side*w*.58,y,z),(x+side*w*outward,y-2,z+2),(x+side*w*(outward+.33),y+side*step*(1 if j%2 else -1)*2,1)],1.4 if plan=='train' else 2,skin)
        if plan=='claw':
            for side in (-1,1):
                arm=(side*w*1.45,front+4,z+1);L((side*w*.6,l*.38,z),arm,3,shadow)
                B(arm,3.8,3,skin);S(arm,(arm[0]-side,arm[1]+5,z+3),2,bone)
    elif plan in ('bird','ray','moth','fish'):
        for j in range(3):B((0,(j-1)*l*.48,z),w*(.80 if j!=1 else 1),h,skin)
        for side in [-1,1]:
            tip=side*(w+(12 if plan in ('moth','ray') else 8))
            wingZ=z+3+step*3+(pose==2)*5
            for j in range(4):
                root=(side*w*.45,l*.3-j*2,z)
                tipP=(tip-side*j*1.5,l*.15-j*3.0,wingZ+j*.4)
                P([root,tipP,(tipP[0]-side*2.5,tipP[1]-3,tipP[2]-1),(side*w*.55,-l*.64,z)],blend(skin,gem,.15+j*.12))
                L(root,tipP,1,bone)
        if plan=='bird':flank(w*.55,0,z,2);head=(0,front,headz+3)
        for j in (-1,0,1):S((j*2,-l*.6,z),(j*4,-l*1.48,z+3),2.6,shadow)
    elif plan in ('slug','serpent'):
        for j in range(10):
            u=j/9;y=(u-.5)*l*2;x=math.sin(u*6+step*.4)*w*.64
            lift=z*(u**2.3) if plan=='serpent' else 1
            B((x,y,3+lift),w*(.34+math.sin(u*2.6)*.65),h*(.32+math.sin(u*2.6)*.62),skin)
        if plan=='slug':B((0,-l*.1,h*.85),w,h,shadow)
        head=(0,l+strike,(z+4 if plan=='serpent' else h*.85))
    elif plan in ('giant','tower'):
        flank(w*.75,-1,z,2.4);B((0,0,z),w,h,skin);B((0,0,z+h*.65),w*.89,h*.57,shadow)
        for side in [-1,1]:
            fist=(side*(w+4),2+step*side+strike,leg*.72)
            chain([(side*w*.6,0,z+h*.35),(side*(w+3),-2,z*.80),fist],3.7,skin)
            B(fist,4,4,shadow)
        head=(0,2+strike*.55,z+h*.96)
    else:
        for j in range(6 if plan=='bell' else 4):
            a=j*math.tau/(6 if plan=='bell' else 4)
            x,y=math.cos(a)*w*.67,math.sin(a)*l*.7
            chain([(x*.6,y*.6,z),(x,y,z*.62),(x*1.4+step*1.3,y*1.6,2)],2 if plan=='flower' else 1.55,shadow)
        B((0,0,z),w,h,skin);head=(0,l*.53+strike*.65,z+1)
    hx,hy,hz=head
    # Jaws, eyes and sockets are actual geometry, so a rear view hides the face.
    B(head,w*.59,max(2.7,h*.68),skin)
    for side in [-1,1]:
        socket=(hx+side*w*.34,hy+w*.37,hz+h*.19)
        B(socket,1.8,1.9,shadow);B((socket[0],socket[1]+.7,socket[2]+.15),1.12,1.16,eye)
    if organ in ('scythes','pincers','clubs','shovels','fangs','sabres','tusks','horns','crescent','ears','feelers','hammers','fists','paddles','sacs','arms'):
        for side in (-1,1):
            anchor=(side*w*.45,hy,hz)
            if organ in ('sacs','clubs','fists','hammers','shovels','paddles'):
                end=(side*(w+2),hy+2+strike,hz-2);L(anchor,end,2.5,shadow)
                B(end,4 if organ!='sacs' else 5,2 if organ in ('paddles','shovels') else 4,gem if organ=='sacs' else skin)
            else:
                dy=-3 if organ in ('ears','horns','crescent') else 4
                high=9 if organ in ('horns','ears','feelers','crescent') else 2
                b=(side*(w+1),hy+dy,hz+high*.5)
                L(anchor,b,2.7,bone)
                S(b,(side*(w+2 if organ=='ears' else w*.68),hy+dy+2,hz+(high if high>2 else -4)),2.2,bone)
            if organ=='arms':flank(w,hy,z,2);flank(w*1.35,-1,z,2)
    elif organ in ('beak','tube','lance','snout','spoon','hook','trunk','drill'):
        end=(0,hy+7+(organ in ('tube','lance','trunk'))*4,hz-(3 if organ in ('hook','trunk') else 0))
        S(head,end,3,bone)
        if organ in ('spoon','trunk','hook'):B(end,2.3,1.7,bone)
    elif organ in ('petals','fan','fans','frill','hood','cap','chalice','ruff','mask'):
        for j in range(9):
            a=(j/8-.5)*math.pi*1.3;tip=(math.sin(a)*(w+4),hy-3,hz+math.cos(a)*(h+5))
            P([(0,hy-3,hz),(tip[0]-2,tip[1],tip[2]-1),tip,(tip[0]+2,tip[1]+1,tip[2]-2)],blend(skin,gem,.45+j%3*.15))
    elif organ=='triplets':
        for side in (-1,1):
            tip=(side*8,hy-1,hz+4);chain([(0,1,z),(side*5,4,z+5),tip],3,skin)
            B(tip,3.7,3.2,skin);B((tip[0]+side,hy+1,hz+5),1,1,eye)
    elif organ in ('spike','whip','rattle','stinger','leaf','flukes','curls','ribbons','threads'):
        for j in range(3 if organ in ('ribbons','threads','curls') else 1):
            end=((j-1)*3+step*2,-l*1.35,z+(8 if organ in ('stinger','rattle') else 0))
            chain([(0,-l*.4,z),(end[0],-l,z+3),end],2,skin);S(end,(end[0]+3,end[1]-3,end[2]+3),2.5,gem)
    else:
        for j in range(5):
            y=(j-2)*l*.30;root=(0,y,z+h*.70);tip=(step*.5,y-3,root[2]+4+2*math.sin(j))
            if organ in ('spiral','lantern','lure','flame'):B(tip,2.7,3.7,gem)
            else:S(root,tip,2.5,bone)
    # Distinct face profiles and surface detail stay attached to the animated skull.
    if plan in ('beast','drake','hopper','serpent'):
        snout=(hx,hy+w*.48,hz-h*.18)
        B(snout,w*(.55 if plan=='hopper' else .38),h*.28,blend(skin,bone,.36))
        for side in (-1,1):
            B((side*w*.23,hy+w*.61,hz-h*.15),.78,.65,shadow)
            if organ in ('sabres','fangs','tusks','triplets') or k>=10:
                S((side*w*.34,hy+w*.39,hz-h*.22),(side*w*.37,hy+w*.48,hz-h*.75),1.2,bone)
    if plan in ('beast','hopper','bird','drake','crawler','claw','fish','slug','tower','giant'):
        for side in (-1,1):
            for j in range(5):
                y=(j-2)*l*.25; zz=z+h*(.3+.16*math.sin(j))
                p=(side*w*.86,y,zz)
                if plan in ('bird','drake','fish'):
                    S(p,(side*(w+1.3),y-3,zz-2),1.65,blend(skin,gem,.23))
                elif plan in ('crawler','slug','claw','tower'):
                    B(p,1.75,1.2,blend(skin,bone,.30))
                elif j%2==0:
                    L(p,(side*w*.94,y+.5,zz-2.6),1,blend(skin,shadow,.72))
    # Evolutionary traits alter the outside contour from every camera angle.
    anatomy=blend(skin,gem,.38)
    for side in (-1,1):
        root=(side*w*.56,-l*.28,z)
        if r==1: # jointed stilt limbs
            knee=(side*(w+4),-l*.55,z+3)
            chain([root,knee,(side*(w+6),-l*.4+step*side,1)],1.6,anatomy)
        elif r==2: # flaring cheek mantle
            P([(side*w*.3,hy,hz),(side*(w+4),hy-2,hz+5),(side*(w+2),hy-3,hz-2)],anatomy)
        elif r==3: # fan of curved tail vanes
            for j in (0,1,2):S(root,(side*(w+2+j),-l-j*2,z+3+j*2),2.1,anatomy)
        elif r==4: # lateral pontoons with open vent mouths
            q=(side*(w+3),0,z+2);L(root,q,2,shadow);B(q,3.8,5,skin);B((q[0],0,z+6),2,1,gem)
        elif r==5: # two long, jointed hind spurs
            joint=(side*(w+6),-l*.7,z+7)
            chain([root,joint,(side*(w+8),-l,3+step*side)],1.8,anatomy)
        elif r==6: # underslung, outward-curving tusks
            q=(side*(w+3),hy+2,hz-4);L(head,q,2.5,bone);S(q,(side*(w+5),hy+4,hz+2),1.6,bone)
        elif r==7: # two tall triangular spinal sails
            P([root,(side*(w+4),-l*.5,z+h+8),(side*w*.5,l*.2,z)],anatomy)
        elif r==8: # paired broad shovel fins
            P([root,(side*(w+8),-l*.65,z+1),(side*(w+7),1,z-2),(side*w*.5,4,z)],anatomy)
        elif r==9: # opal-studded curled side plates
            q=(side*(w+1.5),0,z);B(q,3.2,5.6,shadow);B((q[0]+side,1,z),2.1,3.6,gem)
        elif r==10: # branching ice antlers
            q=(side*(w+2),hy-2,hz+8);L(head,q,1.8,bone);S(q,(q[0]+side*2,hy-1,hz+12),1.7,pale)
            S((q[0]-side,hy-2,hz+6),(q[0]+side*4,hy+1,hz+9),1.3,pale)
        elif r==11: # long prehensile tails
            chain([root,(side*(w+5),-l,z-2),(side*(w+7),-l-3,z+5),(side*(w+4),-l-5,z+7)],2,anatomy)
        elif r==12: # swept emerald feather train
            for j in range(3):S(root,(side*(w+4+j*2),-l-4-j,z+1+j),2.5,anatomy)
    regional_growth(g,r,f,k,w,l,z,h,step,gem,pale,skin)
    return g.image()

def regional_growth(g,r,f,k,w,l,z,h,step,gem,pale,skin):
    # Each environment grows an organ in a different location and direction.
    # Floor ecology changes the topology: dorsal crest, paired fins, tail, crown, mantle.
    locations=[
        [(0,(i-1)*l*.52,1) for i in range(3)],
        [(s*w*.79,(i-.5)*l*.64,s) for s in (-1,1) for i in range(2)],
        [(s*w*.5,-l*(.5+i*.35),s) for s in (-1,1) for i in range(2)],
        [(s*w*.62,l*.43,s) for s in (-1,1)]+[(0,l*.65,1)],
        [(math.cos(i*math.tau/5)*w*.77,math.sin(i*math.tau/5)*l*.58,1 if i in (0,1,4) else -1) for i in range(5)]][f]
    # Keep the regional motif subordinate to the native body. Mount it on different
    # joints according to the animal, with extra mantle pieces only for guardians.
    plan=recipe(r,f,k)[1]
    if k<10:
        if plan in ('bird','ray','moth','fish'):locations=[(s*w*.95,-l*.24,s) for s in (-1,1)]
        elif plan in ('serpent','train','slug'):locations=[(0,-l*.65,1)]
        elif k%3==0:locations=locations[:1]
        else:locations=locations[:2]
    for i,(x,y,s) in enumerate(locations):
        zz=z+h*(.64 if f!=2 else .24);height=(4+(k*3+i)%4)*(1.35 if k>=10 else .78)
        a=(x,y,zz);b=(x+s*(1.5+f*.55),y-2,zz+height);c=(b[0]+s*2,b[1]-1.5,b[2]+1.5)
        if r in (0,5,8,12): # Hanging roots, thorns, reeds and layered feathers
            if r==0:
                g.line(a,b,2.8,skin);g.line(b,c,2,skin)
                for j in (-1,1):g.line(c,(c[0]+j*3,c[1]+j,c[2]-height*.7),1.1,gem)
            elif r==5:
                g.shard(a,c,3.2,gem);g.shard((x,y,zz+2),(x-s*4,y+3,zz+height*.58),1.8,pale)
            elif r==8:
                g.line(a,c,1.5,skin);g.ball(c,1.4,4,gem);g.shard(a,(x+5*s,y+2,zz+height*.5),2.2,pale)
            else:
                for j in range(3):
                    t=(b[0]+s*j*2,b[1]-3*j,b[2]-j*2)
                    g.poly([a,(t[0]-2,t[1]+1,t[2]-2),t,(t[0]+2,t[1],t[2]-2)],gem);g.line(a,t,.8,pale)
        elif r in (1,4,9): # Hollow bamboo, mineral vents and opal lenses
            if r==1:
                g.line(a,c,2.8,skin)
                for j in (.35,.72,1):g.ball(tuple(a[n]+(c[n]-a[n])*j for n in range(3)),1.8,1,pale)
            elif r==4:
                g.line(a,b,4,skin);g.ball(b,3,1.6,gem);g.ball((b[0],b[1],b[2]+1),1.2,.7,(45,30,44))
                g.shard(b,c,1.5,pale)
            else:
                g.line(a,b,1.7,skin);g.ball(b,3.8,3,gem);g.ball((b[0]-.6,b[1]+1,b[2]+1),1.5,1,(255,161,88))
        elif r in (2,3,7): # Flames, open lotus calyces and ribbed sails
            if r==2:
                g.shard(a,b,3.8,gem);g.shard((x+1,y,zz+2),c,1.8,(255,182,89))
            elif r==3:
                for j in (-1,0,1):g.shard(a,(b[0]+j*3,b[1]-abs(j),b[2]-abs(j)*2),2.2,pale if j==0 else gem)
            else:
                g.poly([a,b,c,(x,y-6,zz+2)],gem);g.line(a,c,1,pale)
        elif r==6:
            mid=(x+s*4,y-2,zz+3);g.line(a,mid,3.4,pale);g.shard(mid,(b[0]+s*2,b[1]+1,b[2]),2.2,gem)
        elif r==10:
            g.line(a,c,1.8,pale)
            for j in (-1,1):g.shard(b,(b[0]+j*4,b[1],b[2]+3),1.4,gem)
        else:
            for j in range(8):
                t=j/7;ang=t*math.tau*.9
                p=(x+s*t*5+math.cos(ang)*2,y+math.sin(ang)*2,zz+t*height)
                if j:g.line(prev,p,1.6,gem)
                prev=p
            g.ball(prev,1.8,2,pale)
    # A contrasting, faceted gem core reads even on the smallest sprites.
    g.shard((0,l*.29,z+h*.64),(1,l*.29,z+h+4),3.2,gem)

def bake(task):
    r,f=task;atlas=Image.new('RGBA',(16*CELL,12*CELL))
    for k in range(12):
        poses=[frame(r,f,k,d,p) for d in range(4) for p in range(4)]
        boxes=[p.getbbox() for p in poses]
        left=min(b[0] for b in boxes);right=max(b[2] for b in boxes)
        top=min(b[1] for b in boxes);bottom=max(b[3] for b in boxes)
        half=max(64-left,right-64);rect=(64-half,top,64+half,bottom)
        scale=min(72/(2*half),70/(bottom-top))
        for n,im in enumerate(poses):
            im=im.crop(rect).resize((round(2*half*scale),round((bottom-top)*scale)),Image.Resampling.NEAREST)
            atlas.paste(im,(n*CELL+(CELL-im.width)//2,k*CELL+74-im.height))
    name=f'{REGIONS[r][0]}-{f+1}'
    atlas.save(PUBLIC/'mine-atlases'/(name+'.webp'),lossless=True,method=2)
    return name

if __name__=='__main__':
    data={region[0]:[[species(r,f,k) for k in range(12)] for f in range(5)] for r,region in enumerate(REGIONS)}
    data['cambodia'][0]=json.loads(Path(__file__).with_name('pailin-floor-one.json').read_text())
    (PUBLIC/'mine-species.js').write_text('const MineSpecies = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
    (PUBLIC/'mine-atlases').mkdir(exist_ok=True)
    with ProcessPoolExecutor(max_workers=8) as pool:
        for name in pool.map(bake,[(r,f) for r in range(13) for f in range(5) if (r,f)!=(0,0)]):print(name,flush=True)
