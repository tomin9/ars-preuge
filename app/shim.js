/* Ars Preuge – WordPress bridge: provides window.claude.use(...) on top of the plugin's REST API */
(function(){
  "use strict";
  var CFG = window.ARSP || {};
  var POLL_MS = 8000;

  function api(path, opts){
    opts = opts || {};
    var h = {"X-WP-Nonce": CFG.nonce};
    if (opts.json !== undefined){ h["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.json); }
    return fetch(CFG.rest + path, {method: opts.method || "GET", headers: h, body: opts.body, credentials: "same-origin", cache: "no-store"})
      .then(function(r){
        return r.json().catch(function(){ return null; }).then(function(j){
          if (!r.ok){
            var code = (j && j.code) || ("http_" + r.status);
            if (r.status === 403 || r.status === 401) code = (j && j.code === "rest_cookie_invalid_nonce") ? "session_expired" : "invalid_argument";
            if (r.status === 400) code = "invalid_argument";
            throw {code: code, message: (j && j.message) || ("HTTP " + r.status)};
          }
          return j;
        });
      });
  }
  function clone(o){ return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function rid(){ var a = new Uint8Array(12); crypto.getRandomValues(a); var c = "abcdefghijklmnopqrstuvwxyz0123456789", s = ""; for (var i = 0; i < a.length; i++) s += c[a[i] % 36]; return s + Date.now().toString(36).slice(-4); }

  /* ---------------- db ---------------- */
  var cache = {};         // col -> {id -> data}
  var ver = {};           // "col/id" -> updated ms
  var colL = {};          // col -> [ {cb, err} ]
  var docL = {};          // "col/id" -> [ {cb, err} ]
  var loaded = false, since = 0, polling = null, inflight = null, failures = 0;

  function colSnap(col){
    var m = cache[col] || {};
    return {docs: Object.keys(m).map(function(id){ var d = m[id]; return {id: id, exists: true, data: function(){ return clone(d); }}; }), size: Object.keys(m).length};
  }
  function docSnap(col, id){
    var m = cache[col] || {}, d = m[id];
    return {id: id, exists: d !== undefined, data: function(){ return d === undefined ? undefined : clone(d); }};
  }
  function emit(cols, docs){
    cols.forEach(function(c){ (colL[c] || []).slice().forEach(function(l){ try { l.cb(colSnap(c)); } catch(e){ console.error(e); } }); });
    docs.forEach(function(k){ var p = k.split("/"); (docL[k] || []).slice().forEach(function(l){ try { l.cb(docSnap(p[0], p[1])); } catch(e){ console.error(e); } }); });
  }
  function apply(list){
    var cols = {}, docs = {};
    list.forEach(function(r){
      var k = r.c + "/" + r.i;
      if (ver[k] && ver[k] >= r.u) return;
      ver[k] = r.u;
      cache[r.c] = cache[r.c] || {};
      if (r.x) delete cache[r.c][r.i]; else cache[r.c][r.i] = r.d || {};
      cols[r.c] = 1; docs[k] = 1;
    });
    return {cols: Object.keys(cols), docs: Object.keys(docs)};
  }
  function sync(){
    if (inflight) return inflight;
    inflight = api("sync?since=" + Math.max(0, since - 5000)).then(function(j){
      failures = 0;
      var ch = apply(j.docs || []);
      if (j.max > since) since = j.max;
      if (!loaded){
        loaded = true;
        Object.keys(colL).forEach(function(c){ if (ch.cols.indexOf(c) < 0) ch.cols.push(c); });
        Object.keys(docL).forEach(function(k){ if (ch.docs.indexOf(k) < 0) ch.docs.push(k); });
      }
      emit(ch.cols, ch.docs);
    }).catch(function(e){
      failures++;
      if (e && e.code === "session_expired") { notifyErr({code: "session_expired", message: "Prihlásenie vypršalo – obnovte stránku."}); }
      else if (!loaded && failures > 2) notifyErr(e);
    }).then(function(){ inflight = null; });
    return inflight;
  }
  var errShown = false;
  function notifyErr(e){
    if (errShown) return; errShown = true;
    Object.keys(colL).forEach(function(c){ (colL[c] || []).forEach(function(l){ if (l.err) try { l.err(e); } catch(_){} }); });
  }
  function startPolling(){
    if (polling) return;
    sync();
    polling = setInterval(function(){ if (!document.hidden) sync(); }, POLL_MS);
    document.addEventListener("visibilitychange", function(){ if (!document.hidden) sync(); });
    window.addEventListener("focus", function(){ sync(); });
  }
  function write(col, id, op, data){
    // optimistic local change
    var k = col + "/" + id, prev = cache[col] && cache[col][id];
    cache[col] = cache[col] || {};
    if (op === "delete") delete cache[col][id];
    else if (op === "set") cache[col][id] = clone(data);
    else cache[col][id] = Object.assign({}, prev || {}, clone(data));
    emit([col], [k]);
    return api("doc", {method: "POST", json: {col: col, id: id, op: op, data: data || {}}}).then(function(j){
      if (j && j.u){ ver[k] = j.u; if (j.d && op !== "delete") { cache[col][id] = j.d; emit([col], [k]); } }
    }, function(e){
      if (prev === undefined) delete cache[col][id]; else cache[col][id] = prev;
      emit([col], [k]);
      throw e;
    });
  }
  function docRef(col, id){
    return {
      id: id, path: col + "/" + id,
      set: function(d){ return write(col, id, "set", d); },
      update: function(p){ return write(col, id, "update", p); },
      delete: function(){ return write(col, id, "delete"); },
      get: function(){ return (loaded ? Promise.resolve() : sync()).then(function(){ return docSnap(col, id); }); },
      onSnapshot: function(cb, err){
        var k = col + "/" + id, l = {cb: cb, err: err};
        (docL[k] = docL[k] || []).push(l);
        if (loaded) setTimeout(function(){ cb(docSnap(col, id)); }, 0);
        startPolling();
        return function(){ docL[k] = (docL[k] || []).filter(function(x){ return x !== l; }); };
      }
    };
  }
  var db = {
    collection: function(col){
      return {
        doc: function(id){ return docRef(col, id || rid()); },
        get: function(){ return (loaded ? Promise.resolve() : sync()).then(function(){ return colSnap(col); }); },
        onSnapshot: function(cb, err){
          var l = {cb: cb, err: err};
          (colL[col] = colL[col] || []).push(l);
          if (loaded) setTimeout(function(){ cb(colSnap(col)); }, 0);
          startPolling();
          return function(){ colL[col] = (colL[col] || []).filter(function(x){ return x !== l; }); };
        }
      };
    },
    doc: function(path){ var p = String(path).split("/"); return docRef(p[0], p[1]); }
  };

  /* ---------------- user ---------------- */
  var user = {
    me: function(){ return Promise.resolve(clone(CFG.me)); },
    can: function(){ return Promise.resolve(true); },
    profiles: function(ids){
      ids = (ids || []).filter(function(x){ return /^wp_\d+$/.test(x); });
      if (!ids.length) return Promise.resolve({});
      return api("users?ids=" + encodeURIComponent(ids.join(","))).catch(function(){ return {}; });
    },
    search: function(q){ return api("users?q=" + encodeURIComponent(q || "")).catch(function(){ return []; }); }
  };

  /* ---------------- downloads ---------------- */
  var downloads = {
    save: function(o){
      var b = o.data instanceof Blob ? o.data : new Blob([o.data], {type: o.type || "text/plain;charset=utf-8"});
      var u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = o.filename || "subor"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
      return Promise.resolve();
    }
  };

  /* ---------------- assets ---------------- */
  var assets = {
    upload: function(blob, opts){
      var fd = new FormData();
      var name = blob.name || ("subor." + ((opts && opts.type || blob.type || "").split("/")[1] || "bin").replace("jpeg", "jpg"));
      fd.append("file", blob, name);
      if (opts && opts.type) fd.append("type", opts.type);
      return api("upload", {method: "POST", body: fd});
    }
  };

  var caps = {db: db, user: user, downloads: downloads, assets: assets, mcp: null};
  window.claude = {use: function(n){ return Promise.resolve(caps.hasOwnProperty(n) ? caps[n] : null); }};
})();
