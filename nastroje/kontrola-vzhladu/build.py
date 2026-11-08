# poskladá stránku ako plugin: python3 build.py <priečinok s css> <výstup>
import re,sys,json
import os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','app')+'/'
css=sys.argv[1] if len(sys.argv)>1 else R+"css";out=sys.argv[2] if len(sys.argv)>2 else "stranka.html"
h=open(R+'index.html',encoding='utf-8').read()
import os,glob
if len(sys.argv)>3:  # nové poradie štýlov: všetky súbory z priečinka podľa mena
    links=''.join(f'<link rel="stylesheet" href="css/{os.path.basename(f)}">\n' for f in sorted(glob.glob(css+'/*.css')))
    h=re.sub(r'(<link rel="stylesheet" href="css/[a-z0-9-]+\.css">\n)+',lambda m:links,h,count=1)
h=re.sub(r'<link rel="stylesheet" href="css/([a-z0-9-]+\.css)">',lambda m:'<style>\n'+open(css+'/'+m[1],encoding='utf-8').read()+'</style>',h)
h=re.sub(r'(?m)^//@subor (js/[a-z0-9-]+(?:/[a-z0-9-]+)?\.js)[ \t]*$',lambda m:re.sub(r'\n\Z','',open(R+m[1],encoding='utf-8').read(),count=1),h)
cfg={"rest":"https://t/rest/","nonce":"x","me":{"id":"wp_1","name":"Tomáš Test","firstName":"Tomáš","avatarUrl":""},"blob":"https://t/?arsp_blob=","home":"https://t/","base":"/priestor","admin":"","logout":""}
inj='<script>window.ARSP='+json.dumps(cfg)+';var ARSP_BLOB=window.ARSP.blob;</script><script>'+open(R+'shim.js',encoding='utf-8').read()+'</script>'
p=h.index('<script>');h=h[:p]+inj+'\n'+h[p:]
open(out,'w',encoding='utf-8').write(h)
