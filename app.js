/* PendlerRechner — Rechner-Logik (2026-Regel: 0,38 €/km ab dem ersten Kilometer) */
(function(){
  "use strict";
  var fmtEUR = new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"});
  var fmtNum = new Intl.NumberFormat("de-DE");
  var SATZ_2026 = 0.38;          // € pro km ab dem 1. Kilometer (Steueränderungsgesetz 2025)
  var CAP_NICHT_AUTO = 4500;    // €/Jahr für alle ohne eigenes Kfz
  var PAUSCHBETRAG = 1230;      // Arbeitnehmer-Pauschbetrag €/Jahr

  function $(id){ return document.getElementById(id); }
  function val(id){ var el=$(id); return el ? parseFloat(String(el.value).replace(",",".")) : NaN; }

  /* ---------- Haupt-Rechner ---------- */
  function berechnePendler(){
    var km = val("entfernung"), tage = val("arbeitstage");
    var fz = document.querySelector('input[name="verkehrsmittel"]:checked');
    var fzVal = fz ? fz.value : "auto";
    var grenz = val("grenzsteuersatz");
    var ok = true;

    var eKm=$("err-entfernung"), eTg=$("err-arbeitstage");
    if(eKm) eKm.style.display="none";
    if(eTg) eTg.style.display="none";

    if(!(km>0) || km>500){ if(eKm) eKm.style.display="block"; ok=false; }
    if(!(tage>0) || tage>366){ if(eTg) eTg.style.display="block"; ok=false; }
    if(!ok) return false;

    var roh = km * SATZ_2026 * tage;
    var tatsaechlich = NaN;
    var hinweis = "";

    if(fzVal === "auto"){
      hinweis = "Als Autofahrer gilt für Sie keine 4.500-€-Obergrenze.";
    } else {
      if(roh > CAP_NICHT_AUTO){
        hinweis = "Ohne eigenes Kfz ist die Entfernungspauschale auf 4.500 € pro Jahr begrenzt.";
        roh = Math.min(roh, CAP_NICHT_AUTO);
      }
      if(fzVal === "oepnv"){
        tatsaechlich = val("tatsaechliche-kosten");
        if(tatsaechlich > 0 && tatsaechlich > roh){
          hinweis = "Ihre tatsächlichen ÖPNV-Kosten (" + fmtEUR.format(tatsaechlich) +
            ") liegen über der Pauschale – Sie können die tatsächlichen Kosten ansetzen.";
          roh = tatsaechlich;
        } else if(tatsaechlich > 0){
          hinweis += (hinweis ? " " : "") + "Ihre tatsächlichen Kosten liegen unter der Pauschale – die Pauschale ist für Sie günstiger.";
        }
      }
    }

    var abzug = roh;
    var darueber = Math.max(0, abzug - PAUSCHBETRAG);
    var ersparnis = darueber * (grenz/100);

    $("res-pauschale").textContent = fmtEUR.format(abzug);
    $("res-vergleich").innerHTML =
      "Arbeitnehmer-Pauschbetrag: <strong>" + fmtEUR.format(PAUSCHBETRAG) + "</strong><br>" +
      (darueber > 0
        ? "Zusätzlich abzugsfähig: <strong class=\"v green\" style=\"font-size:1.1rem\">" + fmtEUR.format(darueber) + "</strong>"
        : "Ihre Wegekosten liegen <strong>unter</strong> dem Pauschbetrag – dieser deckt sie bereits ab.");
    $("res-ersparnis").textContent = fmtEUR.format(ersparnis);
    $("res-hinweis").textContent = hinweis;
    $("res-rate-label").textContent = fmtNum.format(grenz) + " %";
    $("results").classList.add("show");
    $("results").scrollIntoView({behavior:"smooth", block:"nearest"});
    return false;
  }

  function resetPendler(){
    var f=$("pendler-form"); if(f) f.reset();
    var d=$("arbeitstage"); if(d) d.value=230;
    var g=$("grenzsteuersatz"); if(g) g.value=30;
    updateRate(); toggleKosten();
    var r=$("results"); if(r) r.classList.remove("show");
    return false;
  }

  function updateRate(){
    var g=$("grenzsteuersatz"), l=$("rate-output");
    if(g && l) l.textContent = fmtNum.format(parseFloat(g.value)) + " %";
  }

  function toggleKosten(){
    var fz=document.querySelector('input[name="verkehrsmittel"]:checked');
    var box=$("kosten-box");
    if(box) box.style.display = (fz && fz.value==="oepnv") ? "block" : "none";
  }

  /* ---------- Arbeitstage-Mini-Rechner ---------- */
  function berechneArbeitstage(){
    var urlaub = val("at-urlaub")||0, feier = val("at-feiertage")||0,
        krank = val("at-krank")||0, homeW = val("at-homeoffice")||0;
    var tage = 365 - 104 - urlaub - feier - krank - Math.round(homeW*46);
    if(tage<0) tage=0;
    $("at-ergebnis").textContent = fmtNum.format(tage) + " Tage";
    var link=$("at-uebernehmen");
    if(link){ link.href="index.html?tage="+tage; link.style.display="inline-block"; }
    $("at-results").classList.add("show");
    return false;
  }

  /* ---------- URL-Parameter (?tage=) ---------- */
  function prefillTage(){
    try{
      var p=new URLSearchParams(window.location.search), t=p.get("tage");
      if(t && $("arbeitstage")){ var n=parseInt(t,10); if(n>0&&n<=366) $("arbeitstage").value=n; }
    }catch(e){}
  }

  /* ---------- Cookie-Banner (DSGVO) ---------- */
  function initCookies(){
    var banner=$("cookie-banner"); if(!banner) return;
    try{
      if(!localStorage.getItem("pr_cookie")) banner.classList.add("show");
    }catch(e){ banner.classList.add("show"); }
    var accept=$("cookie-accept"), only=$("cookie-necessary");
    function set(v){
      try{ localStorage.setItem("pr_cookie",v); }catch(e){}
      banner.classList.remove("show");
    }
    if(accept) accept.addEventListener("click",function(){set("all");});
    if(only) only.addEventListener("click",function(){set("necessary");});
  }

  /* ---------- Mobile Nav ---------- */
  function initNav(){
    var t=$("nav-toggle"), n=$("main-nav");
    if(t&&n) t.addEventListener("click",function(){ n.classList.toggle("open"); });
  }

  /* ---------- Kontakt-Formular (mailto, kein Backend) ---------- */
  function initKontakt(){
    var f=$("kontakt-form"); if(!f) return;
    f.addEventListener("submit",function(ev){
      ev.preventDefault();
      var name=$("k-name").value.trim(), mail=$("k-email").value.trim(), msg=$("k-msg").value.trim();
      if(!name||!mail||!msg){ $("k-hinweis").textContent="Bitte füllen Sie alle Felder aus."; return; }
      var to="kontakt@example.de"; /* PLATZHALTER – MUST-REPLACE */
      var subject=encodeURIComponent("Kontaktanfrage von "+name);
      var body=encodeURIComponent("Name: "+name+"\nE-Mail: "+mail+"\n\nNachricht:\n"+msg);
      window.location.href="mailto:"+to+"?subject="+subject+"&body="+body;
      $("k-hinweis").textContent="Ihr E-Mail-Programm wurde geöffnet. Alternativ schreiben Sie direkt an "+to+".";
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded",function(){
    prefillTage(); initCookies(); initNav(); initKontakt(); updateRate(); toggleKosten();
    var g=$("grenzsteuersatz"); if(g) g.addEventListener("input",updateRate);
    var radios=document.querySelectorAll('input[name="verkehrsmittel"]');
    for(var i=0;i<radios.length;i++) radios[i].addEventListener("change",toggleKosten);
    var y=$("jahr"); if(y) y.textContent=new Date().getFullYear();
  });

  window.berechnePendler=berechnePendler;
  window.resetPendler=resetPendler;
  window.berechneArbeitstage=berechneArbeitstage;
})();
