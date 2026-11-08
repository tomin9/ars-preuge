import json,sys,collections
A=json.load(open(sys.argv[1]));B=json.load(open(sys.argv[2]))
pairs=json.load(open(sys.argv[3])) if len(sys.argv)>3 else []
def parse(s): 
    d={}
    for kv in s.split(';'):
        if ':' in kv:k,v=kv.split(':',1);d[k]=v
    return d
diffs=collections.Counter();examples={};mis=[]
for st in A['states']:
    a=dict(A['states'][st]);b=dict(B['states'].get(st,[]))
    if set(a)!=set(b): mis.append((st,len(set(a)^set(b))))
    for path in a:
        if path in b and a[path]!=b[path]:
            pa,pb=parse(a[path]),parse(b[path])
            for k in pa:
                if pa[k]!=pb.get(k):
                    diffs[k]+=1;examples.setdefault(k,[]).append((st,path[-80:],pa[k][:60],pb.get(k,'')[:60]))
print("stavov",len(A['states']),"rozdielne štruktúry:",mis[:10])
print("rozdiely vo vlastnostiach:",sum(diffs.values()))
for k,n in diffs.most_common(40):
    print(f"  {k}: {n}x  napr. {examples[k][0]}")
print("chyby A:",A['errs']);print("chyby B:",B['errs'])
if pairs:
    ov=B.get('overlap',{})
    print("skutočne sa stretnuté páry:",len(ov))
    for i,sts in sorted(ov.items(),key=lambda x:int(x[0])):
        p=pairs[int(i)];print(f"  [{i}] {p[2]} {p[0]!r}  <->  {p[3]} {p[1]!r}  vlastnosti {p[4]}  ({len(sts)} stavov, napr. {sts[0]})")
