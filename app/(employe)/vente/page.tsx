<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<title>Mafro — Ventes</title>

<style>
:root{
  --vb:var(--xa-green);
  --vb2:var(--xa-green);
  --vb3:var(--xa-green);
  --vb4:var(--xa-greenbg);
  --vb5:var(--xa-greenbg);
  --or:var(--xa-amber);
  --rouge:var(--xa-red);
  --bleu:var(--xa-blue);
  --bg:var(--xa-bg);
  --card:var(--xa-surface);
  --txt:var(--xa-ink);
  --txt2:var(--xa-muted);
  --txt3:var(--xa-faint);
  --border:var(--xa-border);
  --sh:0 2px 10px rgba(0,0,0,.06);
  --r:16px;--r-sm:10px;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;background:var(--bg);font-family:system-ui,sans-serif;color:var(--txt);}
body{display:flex;flex-direction:column;max-width:430px;margin:0 auto;height:100dvh;overflow:hidden;}

.statusbar{height:12px;background:var(--vb2);}

/* TOPBAR */
.topbar{background:var(--vb2);padding:10px 20px 14px;flex-shrink:0;}
.topbar-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.back-btn,.notif-btn{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;}
.page-title{font-family:var(--font-familjen,system-ui,sans-serif);font-size:17px;font-weight:700;color:#fff;}
.notif-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--or);border:1.5px solid var(--vb2);}
.kpi-strip{display:flex;gap:8px;}
.kpi-card{flex:1;background:rgba(255,255,255,0.12);border-radius:var(--r-sm);padding:10px;border:1px solid rgba(255,255,255,0.1);transition:background .2s;}
.kpi-card.kpi-hl{background:rgba(255,255,255,0.25);}
.kpi-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:15px;font-weight:500;color:#fff;line-height:1;}
.kpi-lbl{font-size:9px;color:rgba(255,255,255,0.55);margin-top:3px;text-transform:uppercase;letter-spacing:.5px;}
.kpi-delta{font-size:10px;margin-top:4px;font-weight:500;}
.kpi-delta.up{color:#69F0AE;}.kpi-delta.down{color:#FF7043;}
.kpi-sub{font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px;font-style:italic;}

/* TABS */
.main-tabs{display:flex;background:var(--vb2);padding:0 16px;flex-shrink:0;border-bottom:2px solid rgba(255,255,255,0.08);}
.main-tab{flex:1;text-align:center;padding:10px 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);cursor:pointer;font-family:var(--font-familjen,system-ui,sans-serif);border-bottom:2.5px solid transparent;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:4px;}
.main-tab.active{color:#fff;border-bottom-color:var(--or);}
.tab-badge{background:var(--rouge);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}

.scroll-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:16px 16px 100px;display:flex;flex-direction:column;gap:14px;scrollbar-width:none;}
.scroll-body::-webkit-scrollbar{display:none;}
.tab-content{display:none;flex-direction:column;gap:14px;width:100%;}
.tab-content.active{display:flex;}

.section-head{display:flex;align-items:center;justify-content:space-between;}
.section-title{font-family:var(--font-familjen,system-ui,sans-serif);font-size:14px;font-weight:700;color:var(--txt);}

/* ─ GRAPHIQUE ─ */
.evo-card{background:var(--card);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden;}
.evo-controls{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
.period-tabs{display:flex;gap:4px;}
.ptab{padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);cursor:pointer;border:none;background:transparent;color:var(--txt3);transition:all .15s;}
.ptab.active{background:var(--txt);color:#fff;}
.export-wrap{position:relative;}
.export-btn{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg);font-size:11px;font-weight:600;color:var(--txt2);cursor:pointer;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);transition:all .15s;}
.drop{position:absolute;right:0;top:36px;background:var(--card);border-radius:var(--r-sm);box-shadow:0 8px 24px rgba(0,0,0,.15);border:1px solid var(--border);z-index:50;min-width:170px;overflow:hidden;display:none;}
.drop.show{display:block;}
.drop-opt{padding:11px 14px;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);transition:background .1s;}
.drop-opt:last-child{border-bottom:none;}
.drop-opt:hover{background:var(--vb5);}
.drop-icon{font-size:14px;}
.drop-txt{flex:1;}
.drop-badge{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:9px;background:var(--vb5);color:var(--vb2);padding:2px 6px;border-radius:8px;font-weight:600;}
.evo-kpi{padding:14px 16px 8px;}
.evo-lbl{font-size:10px;font-weight:600;color:var(--txt3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;}
.evo-total{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:26px;font-weight:500;color:var(--txt);letter-spacing:-.5px;transition:all .2s;}
.evo-delta{font-size:11px;font-weight:700;color:#2E7D32;margin-top:5px;display:flex;align-items:center;gap:3px;}
.evo-toggle{display:flex;gap:8px;padding:0 16px 10px;}
.toggle-group{display:flex;border-radius:20px;border:1.5px solid var(--border);overflow:hidden;background:var(--bg);}
.toggle-btn{padding:5px 12px;font-size:11px;font-weight:700;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);cursor:pointer;border:none;background:transparent;color:var(--txt3);transition:all .15s;}
.toggle-btn.active{background:var(--txt);color:#fff;}
.evo-legend{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 10px;}
.legend-item{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--txt2);}
.legend-line{width:20px;height:2px;border-radius:2px;}
.evo-chart-wrap{padding:0 8px 14px;position:relative;}
canvas#evo-chart{display:block;cursor:crosshair;}
.evo-tip{position:absolute;background:var(--txt);color:#fff;border-radius:var(--r-sm);padding:10px 12px;font-size:11px;pointer-events:none;z-index:20;display:none;min-width:130px;box-shadow:0 4px 16px rgba(0,0,0,.18);}
.evo-tip-label{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-weight:700;margin-bottom:6px;font-size:12px;}
.evo-tip-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0;}
.evo-tip-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.evo-tip-name{font-size:10px;color:rgba(255,255,255,.7);}
.evo-tip-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:11px;font-weight:500;}
.evo-tip-hint{font-size:9px;color:rgba(255,255,255,.45);margin-top:6px;border-top:1px solid rgba(255,255,255,.12);padding-top:5px;text-align:center;}

/* HEATMAP */
.heatmap-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.heatmap-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:12px;}
.heatmap-cell{aspect-ratio:1;border-radius:3px;cursor:pointer;transition:transform .1s;}
.heatmap-cell:active{transform:scale(.9);}
.heatmap-labels{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:4px;}
.heatmap-lbl{font-size:7px;color:var(--txt3);text-align:center;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}

/* VAUJ */
.vauj-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.vauj-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.vauj-date-badge{background:var(--vb5);color:var(--vb2);font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}
.vauj-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.vauj-row:last-child{border-bottom:none;}
.vauj-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:var(--font-familjen,system-ui,sans-serif);flex-shrink:0;}
.vauj-info{flex:1;min-width:0;}
.vauj-client{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vauj-prods{font-size:11px;color:var(--txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vauj-right{text-align:right;flex-shrink:0;}
.vauj-montant{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:13px;font-weight:500;color:var(--vb2);}
.vauj-heure{font-size:10px;color:var(--txt3);margin-top:2px;}
.vauj-badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600;margin-top:3px;}

/* TOP PRODUITS */
.top-prods-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.prod-row{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px solid var(--border);border-radius:var(--r-sm);transition:background .15s;cursor:pointer;}
.prod-row:last-child{border-bottom:none;}
.prod-row:active{background:var(--vb5);}
.prod-emoji-wrap{width:36px;height:36px;border-radius:var(--r-sm);background:var(--vb5);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.prod-info{flex:1;min-width:0;}
.prod-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prod-units{font-size:11px;color:var(--txt3);}
.prod-right{text-align:right;flex-shrink:0;}
.prod-rev{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:13px;font-weight:500;color:var(--vb2);}
.prod-trend{font-size:10px;font-weight:600;}
.prod-trend.up{color:#2E7D32;}.prod-trend.down{color:var(--rouge);}
.badge-esp{background:#E8F5E9;color:#2E7D32;}
.badge-mob{background:#E3F2FD;color:#1565C0;}
.badge-cred{background:#FFF3E0;color:#E65100;}

/* ════════════════════════
   ONGLET HISTORIQUE
════════════════════════ */

/* Barre contrôle */
.hist-ctrl{background:var(--card);border-radius:var(--r);padding:12px 14px;box-shadow:var(--sh);display:flex;align-items:center;justify-content:space-between;gap:10px;}
.hist-ptabs{display:flex;gap:4px;}
.hist-ptab{padding:7px 12px;border-radius:20px;font-size:11px;font-weight:700;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);cursor:pointer;border:none;background:transparent;color:var(--txt3);transition:all .15s;}
.hist-ptab.active{background:var(--vb2);color:#fff;}
.hist-export-wrap{position:relative;}
.hist-export-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg);font-size:11px;font-weight:600;color:var(--txt2);cursor:pointer;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);transition:all .15s;}
.hist-export-btn:active{background:var(--vb5);}

/* Résumé période */
.period-summary{background:linear-gradient(135deg,var(--vb2),#1a3d28);border-radius:var(--r);padding:14px 16px;color:#fff;}
.ps-title{font-family:var(--font-familjen,system-ui,sans-serif);font-size:11px;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;}
.ps-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.ps-stat{text-align:center;}
.ps-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:16px;font-weight:500;}
.ps-lbl{font-size:10px;opacity:.6;margin-top:2px;}
.ps-boutiques{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12);}
.ps-pill{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border-radius:20px;padding:4px 10px;}
.ps-pill-dot{width:7px;height:7px;border-radius:50%;}
.ps-pill-name{font-size:10px;opacity:.8;}
.ps-pill-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:11px;font-weight:500;}

/* ════════════════════════
   GROUPES HISTORIQUE
   (cœur du nouveau design)
════════════════════════ */
.hist-groups{display:flex;flex-direction:column;gap:12px;}

/* En-tête de groupe : JOUR / SEMAINE / MOIS */
.group-header{
  display:flex;align-items:center;justify-content:space-between;
  cursor:pointer;
  padding:0 4px;
  user-select:none;
}
.group-header-left{display:flex;align-items:center;gap:10px;}
.group-icon{
  width:36px;height:36px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:15px;flex-shrink:0;
}
.group-label-wrap{}
.group-label{font-family:var(--font-familjen,system-ui,sans-serif);font-size:14px;font-weight:800;color:var(--txt);}
.group-sub{font-size:11px;color:var(--txt3);margin-top:1px;}
.group-header-right{display:flex;align-items:center;gap:10px;}
.group-kpi{text-align:right;}
.group-ca{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:14px;font-weight:600;color:var(--vb2);}
.group-nb{font-size:10px;color:var(--txt3);margin-top:1px;}
.group-chev{font-size:16px;color:var(--txt3);transition:transform .25s;flex-shrink:0;}
.group-chev.open{transform:rotate(90deg);}

/* Barre de synthèse sous le header */
.group-summary-bar{
  display:grid;grid-template-columns:repeat(3,1fr);gap:6px;
  padding:10px 12px;
  background:var(--card);
  border-radius:var(--r-sm);
  margin-top:8px;
  border-left:4px solid var(--vb3);
  box-shadow:var(--sh);
}
.gsb-item{text-align:center;}
.gsb-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:13px;font-weight:500;color:var(--txt);}
.gsb-lbl{font-size:9px;color:var(--txt3);margin-top:2px;text-transform:uppercase;letter-spacing:.4px;}

/* Corps du groupe (transactions) */
.group-body{
  margin-top:6px;
  display:none;
  flex-direction:column;
  gap:6px;
  animation:fadeDown .2s ease;
}
.group-body.open{display:flex;}
@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

/* Carte transaction individuelle */
.tx-card{
  background:var(--card);
  border-radius:var(--r-sm);
  border:1px solid var(--border);
  overflow:hidden;
}
.tx-header{display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;}
.tx-header:active{background:var(--vb5);}
.tx-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:var(--font-familjen,system-ui,sans-serif);flex-shrink:0;}
.tx-info{flex:1;min-width:0;}
.tx-client{font-size:12px;font-weight:600;}
.tx-meta{font-size:10px;color:var(--txt3);display:flex;align-items:center;gap:5px;margin-top:1px;flex-wrap:wrap;}
.tx-badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600;}
.tx-right{text-align:right;flex-shrink:0;}
.tx-montant{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:13px;font-weight:600;color:var(--vb2);}
.tx-heure{font-size:10px;color:var(--txt3);margin-top:1px;}
.tx-chev{font-size:12px;color:var(--txt3);transition:transform .2s;margin-left:2px;flex-shrink:0;}
.tx-chev.open{transform:rotate(90deg);}

/* Détail transaction dépliable */
.tx-detail{display:none;padding:0 12px 12px;border-top:1px solid var(--border);}
.tx-detail.open{display:block;}
.tx-detail-title{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.6px;margin:10px 0 8px;}
.tx-prod-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dashed var(--border);}
.tx-prod-row:last-child{border-bottom:none;}
.tx-prod-emoji{font-size:14px;width:20px;text-align:center;flex-shrink:0;}
.tx-prod-name{font-size:12px;flex:1;color:var(--txt);}
.tx-prod-qty{font-size:11px;color:var(--txt3);font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}
.tx-prod-price{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:12px;font-weight:500;color:var(--vb2);}
.tx-total-row{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:2px solid var(--vb4);}
.tx-total-lbl{font-size:12px;font-weight:700;font-family:var(--font-familjen,system-ui,sans-serif);}
.tx-total-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:14px;font-weight:600;color:var(--vb2);}
.tx-info-row{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--txt3);}

/* Search bar */
.search-bar{display:flex;align-items:center;gap:8px;background:var(--card);border-radius:24px;padding:9px 14px;border:1.5px solid var(--border);box-shadow:var(--sh);}
.search-bar input{flex:1;border:none;background:none;font-size:13px;font-family:system-ui,sans-serif;color:var(--txt);outline:none;}
.search-bar input::placeholder{color:var(--txt3);}

/* Chips mode paiement filtre */
.mode-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;}
.mode-chips::-webkit-scrollbar{display:none;}
.mode-chip{flex-shrink:0;padding:6px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}
.mode-chip.active{background:var(--vb2);border-color:var(--vb2);color:#fff;}

/* Résumé produits */
.produits-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.pr-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.period-badge{background:var(--vb5);color:var(--vb2);font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;}
.pr-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
.pr-stat{background:var(--bg);border-radius:var(--r-sm);padding:10px;text-align:center;}
.pr-stat-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:15px;font-weight:500;}
.pr-stat-lbl{font-size:9px;color:var(--txt3);margin-top:3px;text-transform:uppercase;letter-spacing:.4px;}
.pr-legend{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
.pr-leg-item{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--txt2);}
.pr-leg-dot{width:9px;height:9px;border-radius:50%;}
.pr-filter-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:10px;}
.pr-filter-tabs::-webkit-scrollbar{display:none;}
.pr-ftab{flex-shrink:0;padding:5px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}
.pr-ftab.active{background:var(--txt);color:#fff;border-color:var(--txt);}
.pr-sort-row{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-bottom:10px;}
.pr-sort-lbl{font-size:10px;color:var(--txt3);font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}
.pr-sort-btn{padding:4px 10px;border-radius:14px;border:1.5px solid var(--border);background:var(--bg);font-size:10px;font-weight:600;cursor:pointer;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);color:var(--txt3);transition:all .15s;}
.pr-sort-btn.active{background:var(--vb5);color:var(--vb2);border-color:var(--vb3);}
.pr-table-head{display:grid;grid-template-columns:1fr 46px 76px 38px;gap:4px;padding:6px 10px;background:var(--bg);border-radius:var(--r-sm);margin-bottom:6px;}
.pr-th{font-size:9px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.6px;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);}
.pr-th.r{text-align:right;}
.pr-row{display:grid;grid-template-columns:1fr 46px 76px 38px;gap:4px;align-items:center;padding:9px 10px;border-radius:var(--r-sm);margin-bottom:4px;border-left:4px solid transparent;}
.pr-row.tier-top{border-left-color:#22C55E;background:rgba(34,197,94,.04);}
.pr-row.tier-mid{border-left-color:#F5A623;background:rgba(245,166,35,.04);}
.pr-row.tier-low{border-left-color:#EF4444;background:rgba(239,68,68,.04);}
.pr-prod-cell{display:flex;align-items:center;gap:8px;min-width:0;}
.pr-emoji{font-size:15px;width:20px;text-align:center;flex-shrink:0;}
.pr-prod-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pr-tier-badge{font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;display:inline-block;}
.tier-badge-top{background:#DCFCE7;color:#166534;}
.tier-badge-mid{background:#FEF9C3;color:#854D0E;}
.tier-badge-low{background:#FEE2E2;color:#991B1B;}
.pr-qty,.pr-rev{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:12px;font-weight:500;text-align:right;}
.pr-rev{color:var(--vb2);}
.pr-share{font-size:10px;color:var(--txt3);text-align:right;}
.pr-bar-wrap{grid-column:1/-1;height:4px;background:var(--bg);border-radius:2px;margin-top:1px;}
.pr-bar-fill{height:4px;border-radius:2px;}
.pr-bar-top{background:#22C55E;}.pr-bar-mid{background:#F5A623;}.pr-bar-low{background:#EF4444;}

/* ════════════════════════
   DETTES
════════════════════════ */
.dettes-summary{background:linear-gradient(135deg,#E53935,#B71C1C);border-radius:var(--r);padding:18px;box-shadow:0 4px 20px rgba(229,57,53,.25);color:#fff;}
.dettes-summary-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
.dettes-title-row{display:flex;align-items:center;gap:8px;}
.dettes-icon{font-size:22px;}
.dettes-main-title{font-family:var(--font-familjen,system-ui,sans-serif);font-size:14px;font-weight:700;}
.dettes-alerte{background:rgba(255,255,255,.2);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;}
.dettes-total{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:26px;font-weight:500;letter-spacing:-.5px;}
.dettes-total-lbl{font-size:11px;opacity:.7;margin-top:2px;}
.dettes-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}
.dette-stat{background:rgba(255,255,255,.15);border-radius:var(--r-sm);padding:8px 10px;text-align:center;}
.dette-stat-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:14px;font-weight:500;}
.dette-stat-lbl{font-size:9px;opacity:.65;margin-top:2px;text-transform:uppercase;letter-spacing:.4px;}
.dettes-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;}
.dettes-filters::-webkit-scrollbar{display:none;}
.dette-filter{flex-shrink:0;padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap;}
.dette-filter.active{background:var(--rouge);border-color:var(--rouge);color:#fff;}
.cdc{background:var(--card);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden;border-left:4px solid var(--rouge);}
.cdc.urgent{border-left-color:var(--rouge);}
.cdc.normal{border-left-color:var(--or);}
.cdc.recent{border-left-color:var(--vb3);}
.cdc-header{display:flex;align-items:center;gap:12px;padding:14px 16px 10px;cursor:pointer;}
.cdc-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;font-family:var(--font-familjen,system-ui,sans-serif);flex-shrink:0;}
.cdc-info{flex:1;min-width:0;}
.cdc-name{font-size:14px;font-weight:700;font-family:var(--font-familjen,system-ui,sans-serif);}
.cdc-meta{display:flex;align-items:center;gap:8px;margin-top:3px;flex-wrap:wrap;}
.cdc-tel{font-size:11px;color:var(--txt2);}
.cdc-statut{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;}
.statut-urgent{background:#FFEBEE;color:var(--rouge);}
.statut-normal{background:#FFF8E1;color:#F57F17;}
.statut-recent{background:#E8F5E9;color:#2E7D32;}
.cdc-right{text-align:right;flex-shrink:0;}
.cdc-montant{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:16px;font-weight:500;color:var(--rouge);}
.cdc-since{font-size:10px;color:var(--txt3);margin-top:2px;}
.cdc-chev{font-size:14px;color:var(--txt3);transition:transform .2s;flex-shrink:0;}
.cdc-chev.open{transform:rotate(90deg);}
.cdc-body{display:none;padding:0 16px 14px;border-top:1px solid var(--border);flex-direction:column;gap:10px;}
.cdc-body.open{display:flex;}
.cdc-hist-title{font-size:11px;font-weight:600;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin-top:4px;}
.cdc-hist-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed var(--border);}
.cdc-hist-row:last-child{border-bottom:none;}
.cdc-hist-date{font-size:11px;color:var(--txt3);}
.cdc-hist-items{font-size:12px;color:var(--txt2);flex:1;padding:0 8px;}
.cdc-hist-amt{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:12px;font-weight:500;}
.cdc-prog-wrap{margin-top:2px;}
.cdc-prog-lbl{display:flex;justify-content:space-between;font-size:10px;color:var(--txt3);margin-bottom:4px;}
.cdc-prog-bar{height:6px;background:var(--bg);border-radius:3px;overflow:hidden;}
.cdc-prog-fill{height:6px;border-radius:3px;background:var(--vb3);}
.cdc-actions{display:flex;gap:8px;margin-top:4px;}
.cdc-btn{flex:1;padding:9px 8px;border-radius:var(--r-sm);font-size:12px;font-weight:600;font-family:var(--font-familjen,system-ui,sans-serif);cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s;}
.cdc-btn:active{opacity:.8;transform:scale(.97);}
.cdc-btn.whatsapp{background:#25D366;color:#fff;}
.cdc-btn.paiement{background:var(--vb);color:#fff;}
.cdc-btn.relance{background:var(--vb5);color:var(--vb2);border:1.5px solid var(--vb4);}

/* BOTTOM NAV */
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--card);border-top:1px solid var(--border);display:flex;padding:10px 0 calc(10px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(46,92,62,.08);z-index:10;}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;transition:opacity .15s;}
.nav-item:active{opacity:.6;}
.nav-icon{font-size:20px;line-height:1;}
.nav-lbl{font-size:10px;color:var(--txt3);font-weight:500;}
.nav-item.active .nav-lbl{color:var(--vb);font-weight:700;}

/* MODAL */
.modal-overlay{position:fixed;inset:0;background:rgba(30,60,35,.5);backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center;z-index:100;}
.modal-overlay.show{display:flex;}
.modal-sheet{background:var(--card);border-radius:24px 24px 0 0;padding:20px 20px 40px;width:100%;max-width:430px;animation:slideUp .3s cubic-bezier(.34,1.2,.64,1);}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px;}
.modal-title{font-family:var(--font-familjen,system-ui,sans-serif);font-size:16px;font-weight:800;margin-bottom:4px;}
.modal-sub{font-size:12px;color:var(--txt2);margin-bottom:16px;}
.modal-client-row{display:flex;align-items:center;gap:10px;background:var(--bg);border-radius:var(--r-sm);padding:10px 12px;margin-bottom:14px;}
.modal-amount-input{position:relative;margin-bottom:12px;}
.modal-amount-input input{width:100%;padding:14px 16px 14px 40px;border-radius:var(--r-sm);border:2px solid var(--border);font-size:18px;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);color:var(--txt);background:var(--bg);outline:none;transition:border-color .2s;}
.modal-amount-input input:focus{border-color:var(--vb3);}
.modal-currency{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:16px;color:var(--txt3);}
.modal-mode-tabs{display:flex;gap:8px;margin-bottom:14px;}
.modal-mode{flex:1;padding:10px 6px;border-radius:var(--r-sm);border:2px solid var(--border);background:var(--bg);text-align:center;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;}
.modal-mode.active{border-color:var(--vb);background:var(--vb5);color:var(--vb2);}
.modal-confirm{width:100%;padding:14px;background:var(--vb);color:#fff;border:none;border-radius:var(--r);font-family:var(--font-familjen,system-ui,sans-serif);font-size:15px;font-weight:800;cursor:pointer;transition:all .2s;}
.modal-confirm:hover{background:var(--vb2);}

/* TOAST + TOOLTIP */
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--txt);color:#fff;padding:10px 20px;border-radius:30px;font-size:12px;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);z-index:200;display:none;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.2);}
.toast.show{display:block;animation:toastIn .3s ease;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.tooltip{position:fixed;background:var(--txt);color:#fff;font-size:11px;padding:5px 10px;border-radius:8px;pointer-events:none;z-index:50;display:none;font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);white-space:nowrap;}

/* PRINT */
@media print{
  body{max-width:100%;height:auto;overflow:visible;background:#fff;}
  .statusbar,.topbar,.main-tabs,.bottom-nav,.modal-overlay,
  .hist-ctrl,.search-bar,.mode-chips,.pr-filter-tabs,.pr-sort-row,
  .group-chev,.tx-chev{display:none!important;}
  .tab-content#tab-historique{display:flex!important;}
  .tab-content:not(#tab-historique){display:none!important;}
  .scroll-body{overflow:visible;padding:0;height:auto;}
  .tx-detail{display:block!important;}
  .group-body{display:flex!important;}
  .print-header,.print-footer{display:block!important;}
  .produits-card,.tx-card,.group-summary-bar{box-shadow:none;border:1px solid #ddd;page-break-inside:avoid;}
}
.print-header{display:none;background:var(--vb2);color:#fff;padding:20px 24px;margin-bottom:16px;border-radius:var(--r);}
.ph-title{font-family:var(--font-familjen,system-ui,sans-serif);font-size:20px;font-weight:800;}
.ph-sub{font-size:12px;opacity:.7;margin-top:4px;}
.ph-meta{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px;}
.ph-meta-item{font-size:11px;opacity:.85;}
.ph-meta-val{font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-weight:500;}
.print-footer{display:none;text-align:center;font-size:10px;color:var(--txt3);padding:16px;border-top:1px solid var(--border);margin-top:8px;}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.evo-card,.heatmap-card,.vauj-card,.top-prods-card,.period-summary,.produits-card,.dettes-summary,.cdc{animation:fadeUp .3s ease both;}
</style>
</head>
<body>

<div class="statusbar"></div>

<div class="topbar">
  <div class="topbar-row1">
    <button class="back-btn">←</button>
    <div class="page-title">Ventes</div>
    <button class="notif-btn">⚙️<div class="notif-dot"></div></button>
  </div>
  <div class="kpi-strip">
    <div class="kpi-card" id="kpi-ca-card">
      <div class="kpi-val" id="k-ca">4 280 000</div>
      <div class="kpi-lbl" id="k-ca-lbl">CA (FCFA)</div>
      <div class="kpi-delta up" id="k-ca-delta">↑ +12,5%</div>
      <div class="kpi-sub" id="k-ca-sub">30 derniers jours</div>
    </div>
    <div class="kpi-card" id="kpi-nb-card">
      <div class="kpi-val" id="k-nb">1 240</div>
      <div class="kpi-lbl" id="k-nb-lbl">Ventes</div>
      <div class="kpi-delta up" id="k-nb-delta">↑ +8%</div>
    </div>
    <div class="kpi-card" style="background:rgba(229,57,53,.25);border-color:rgba(229,57,53,.3);">
      <div class="kpi-val" id="k-dettes">127 400</div>
      <div class="kpi-lbl">Dettes</div>
      <div class="kpi-delta down">↑ 9 clients</div>
    </div>
  </div>
</div>

<div class="main-tabs">
  <div class="main-tab active" onclick="switchTab('ventes',this)">📊 Ventes</div>
  <div class="main-tab" onclick="switchTab('historique',this)">📋 Historique</div>
  <div class="main-tab" onclick="switchTab('dettes',this)">⚠️ Dettes <span class="tab-badge">9</span></div>
</div>

<div class="tooltip" id="tooltip"></div>
<div class="toast" id="toast"></div>

<div class="scroll-body">

  <!-- ════ VENTES ════ -->
  <div class="tab-content active" id="tab-ventes">
    <div class="evo-card">
      <div class="evo-controls">
        <div class="period-tabs" id="ventes-ptabs">
          <button class="ptab" onclick="setPV('7j',this)">7J</button>
          <button class="ptab active" onclick="setPV('30j',this)">30J</button>
          <button class="ptab" onclick="setPV('mois',this)">MOIS</button>
          <button class="ptab" onclick="setPV('annee',this)">ANNÉE</button>
        </div>
        <div class="export-wrap">
          <button class="export-btn" onclick="toggleDrop('vdrop',event)">↓ EXPORT</button>
          <div class="drop" id="vdrop">
            <div class="drop-opt" onclick="exportVPDF()"><span class="drop-icon">📄</span><span class="drop-txt">PDF graphique</span><span class="drop-badge" id="vbadge1">30J</span></div>
            <div class="drop-opt" onclick="exportVCSV()"><span class="drop-icon">📊</span><span class="drop-txt">CSV données</span><span class="drop-badge" id="vbadge2">30J</span></div>
          </div>
        </div>
      </div>
      <div class="evo-kpi">
        <div class="evo-lbl" id="evo-lbl">ÉVOLUTION DES REVENUS — 30J</div>
        <div class="evo-total" id="evo-total">4 280 000 F</div>
        <div class="evo-delta">▲ <span id="evo-delta">12,5%</span> VS PÉRIODE PRÉCÉDENTE</div>
      </div>
      <div class="evo-toggle">
        <div class="toggle-group">
          <button class="toggle-btn" onclick="setVue('global',this)">GLOBAL</button>
          <button class="toggle-btn active" onclick="setVue('boutique',this)">PAR BOUTIQUE</button>
        </div>
      </div>
      <div class="evo-legend" id="evo-legend"></div>
      <div class="evo-chart-wrap" style="position:relative;">
        <div style="position:relative;width:100%;height:180px;">
          <canvas id="evo-chart"></canvas>
        </div>
        <div class="evo-tip" id="evo-tip"></div>
      </div>
    </div>
    <div class="heatmap-card">
      <div class="section-head"><span class="section-title">🕐 Activité par heure</span></div>
      <div class="heatmap-grid" id="hmap-grid"></div>
      <div class="heatmap-labels" id="hmap-labels"></div>
    </div>
    <div class="vauj-card">
      <div class="vauj-title-row">
        <span class="section-title">🛒 Ventes du jour</span>
        <span class="vauj-date-badge" id="vauj-date">28 avr</span>
      </div>
      <div id="vauj-list"></div>
    </div>
    <div class="top-prods-card">
      <div class="section-head" style="margin-bottom:8px"><span class="section-title">🔥 Top produits</span></div>
      <div id="top-prods"></div>
    </div>
  </div>

  <!-- ════ HISTORIQUE ════ -->
  <div class="tab-content" id="tab-historique">

    <!-- Print header -->
    <div class="print-header" id="print-header">
      <div class="ph-title">Mafro — Historique des ventes</div>
      <div class="ph-sub" id="ph-sub">Rapport 30 derniers jours</div>
      <div class="ph-meta">
        <div class="ph-meta-item">CA : <span class="ph-meta-val" id="ph-ca">—</span></div>
        <div class="ph-meta-item">Transactions : <span class="ph-meta-val" id="ph-tx">—</span></div>
        <div class="ph-meta-item">Panier moy. : <span class="ph-meta-val" id="ph-panier">—</span></div>
        <div class="ph-meta-item">Généré le : <span class="ph-meta-val" id="ph-date">—</span></div>
      </div>
    </div>

    <!-- Barre contrôle : période + export -->
    <div class="hist-ctrl">
      <div class="hist-ptabs" id="hist-ptabs">
        <button class="hist-ptab" onclick="setHP('7j',this)">7J</button>
        <button class="hist-ptab active" onclick="setHP('30j',this)">30J</button>
        <button class="hist-ptab" onclick="setHP('mois',this)">MOIS</button>
        <button class="hist-ptab" onclick="setHP('annee',this)">ANNÉE</button>
      </div>
      <div class="hist-export-wrap">
        <button class="hist-export-btn" onclick="toggleDrop('hdrop',event)">↓ EXPORTER</button>
        <div class="drop" id="hdrop" style="min-width:200px;">
          <div class="drop-opt" onclick="exportHPDF()"><span class="drop-icon">📄</span><span class="drop-txt">PDF complet</span><span class="drop-badge" id="hbadge1">30J</span></div>
          <div class="drop-opt" onclick="exportHCSV()"><span class="drop-icon">📊</span><span class="drop-txt">Transactions CSV</span><span class="drop-badge" id="hbadge2">30J</span></div>
          <div class="drop-opt" onclick="exportProdsCSV()"><span class="drop-icon">📦</span><span class="drop-txt">Produits CSV</span><span class="drop-badge" id="hbadge3">30J</span></div>
        </div>
      </div>
    </div>

    <!-- Résumé période -->
    <div class="period-summary">
      <div class="ps-title" id="ps-title">📅 30 DERNIERS JOURS</div>
      <div class="ps-stats">
        <div class="ps-stat"><div class="ps-val" id="ps-ca">—</div><div class="ps-lbl">CA (FCFA)</div></div>
        <div class="ps-stat"><div class="ps-val" id="ps-tx">—</div><div class="ps-lbl">Transactions</div></div>
        <div class="ps-stat"><div class="ps-val" id="ps-panier">—</div><div class="ps-lbl">Panier moy.</div></div>
      </div>
      <div class="ps-boutiques" id="ps-boutiques"></div>
    </div>

    <!-- Recherche + filtre mode -->
    <div class="search-bar">
      <span style="color:var(--txt3);font-size:14px">🔍</span>
      <input type="text" placeholder="Client, produit, boutique, vendeur…" id="hist-search" oninput="applyFilters()"/>
    </div>
    <div class="mode-chips">
      <div class="mode-chip active" onclick="setModeChip('tous',this)">Tous</div>
      <div class="mode-chip" onclick="setModeChip('especes',this)">💵 Espèces</div>
      <div class="mode-chip" onclick="setModeChip('mobile',this)">📱 Mobile</div>
      <div class="mode-chip" onclick="setModeChip('credit',this)">📝 Crédit</div>
    </div>

    <!-- Groupes de transactions -->
    <div class="hist-groups" id="hist-groups"></div>

    <!-- Résumé produits vendus -->
    <div class="produits-card">
      <div class="pr-header">
        <span class="section-title">📦 Produits vendus</span>
        <span class="period-badge" id="pr-badge">30J</span>
      </div>
      <div class="pr-stats-row" id="pr-stats"></div>
      <div class="pr-legend">
        <div class="pr-leg-item"><div class="pr-leg-dot" style="background:#22C55E"></div>Top</div>
        <div class="pr-leg-item"><div class="pr-leg-dot" style="background:#F5A623"></div>Moyen</div>
        <div class="pr-leg-item"><div class="pr-leg-dot" style="background:#EF4444"></div>Peu vendu</div>
      </div>
      <div class="pr-filter-tabs">
        <div class="pr-ftab active" onclick="setPrF('tous',this)">Tous</div>
        <div class="pr-ftab" onclick="setPrF('top',this)">🟢 Top</div>
        <div class="pr-ftab" onclick="setPrF('mid',this)">🟡 Moyens</div>
        <div class="pr-ftab" onclick="setPrF('low',this)">🔴 Peu vendus</div>
      </div>
      <div class="pr-sort-row">
        <span class="pr-sort-lbl">TRIER</span>
        <button class="pr-sort-btn active" onclick="setPrS('qty',this)">QTÉ</button>
        <button class="pr-sort-btn" onclick="setPrS('rev',this)">CA</button>
        <button class="pr-sort-btn" onclick="setPrS('name',this)">NOM</button>
      </div>
      <div class="pr-table-head">
        <div class="pr-th">Produit</div><div class="pr-th r">Qté</div>
        <div class="pr-th r">CA</div><div class="pr-th r">Part</div>
      </div>
      <div id="pr-list"></div>
    </div>

    <div class="print-footer">Rapport généré par Mafro · <span id="print-date"></span></div>
  </div>

  <!-- ════ DETTES ════ -->
  <div class="tab-content" id="tab-dettes">
    <div class="dettes-summary">
      <div class="dettes-summary-top">
        <div class="dettes-title-row"><span class="dettes-icon">⚠️</span><span class="dettes-main-title">Créances clients</span></div>
        <div class="dettes-alerte">3 urgentes</div>
      </div>
      <div class="dettes-total" id="dettes-total">127 400 FCFA</div>
      <div class="dettes-total-lbl">Total à récupérer</div>
      <div class="dettes-stats">
        <div class="dette-stat"><div class="dette-stat-val">9</div><div class="dette-stat-lbl">Clients</div></div>
        <div class="dette-stat"><div class="dette-stat-val">14 j</div><div class="dette-stat-lbl">Âge moy.</div></div>
        <div class="dette-stat"><div class="dette-stat-val">38%</div><div class="dette-stat-lbl">Récupéré</div></div>
      </div>
    </div>
    <div class="dettes-filters">
      <div class="dette-filter active" onclick="fDettes('tous',this)">Tous (9)</div>
      <div class="dette-filter" onclick="fDettes('urgent',this)">🔴 Urgents (3)</div>
      <div class="dette-filter" onclick="fDettes('normal',this)">🟡 Normaux (4)</div>
      <div class="dette-filter" onclick="fDettes('recent',this)">🟢 Récents (2)</div>
    </div>
    <div class="search-bar" style="box-shadow:none;">
      <span style="color:var(--txt3);font-size:14px">🔍</span>
      <input type="text" placeholder="Chercher un client…" id="dettes-search" oninput="renderDettes()"/>
    </div>
    <div id="dettes-list"></div>
  </div>
</div>

<div class="bottom-nav">
  <div class="nav-item"><div class="nav-icon">🏠</div><div class="nav-lbl">Accueil</div></div>
  <div class="nav-item active"><div class="nav-icon">📊</div><div class="nav-lbl">Ventes</div></div>
  <div class="nav-item"><div class="nav-icon">📦</div><div class="nav-lbl">Stock</div></div>
  <div class="nav-item"><div class="nav-icon">👥</div><div class="nav-lbl">Clients</div></div>
  <div class="nav-item"><div class="nav-icon">⚙️</div><div class="nav-lbl">Réglages</div></div>
</div>

<!-- MODAL PAIEMENT -->
<div class="modal-overlay" id="modal-paiement">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Enregistrer un paiement</div>
    <div class="modal-sub" id="modal-sub">Remboursement de dette</div>
    <div class="modal-client-row">
      <div id="modal-avatar" style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-family:var(--font-familjen,system-ui,sans-serif);flex-shrink:0;"></div>
      <div><div style="font-size:13px;font-weight:600;" id="modal-client-name"></div>
      <div style="font-size:11px;color:var(--txt3);">Restant : <span id="modal-restant" style="font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);color:var(--rouge);font-weight:600;"></span></div></div>
    </div>
    <div class="modal-amount-input"><span class="modal-currency">₣</span><input type="number" id="modal-amount" placeholder="Montant reçu"/></div>
    <div class="modal-mode-tabs">
      <div class="modal-mode active" onclick="setMM(this)">💵 Espèces</div>
      <div class="modal-mode" onclick="setMM(this)">📱 Mobile</div>
      <div class="modal-mode" onclick="setMM(this)">📝 Chèque</div>
    </div>
    <button class="modal-confirm" onclick="confirmPaiement()">✅ Confirmer le paiement</button>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script>
/* ══════════════════════════════════════
   DONNÉES
══════════════════════════════════════ */
const BOUTIQUES=[
  {name:"Akpakpa",  color:"#22C55E",dash:[]},
  {name:"Zogbadjè", color:"#3B82F6",dash:[6,3]},
  {name:"Cadjehoun",color:"#F5A623",dash:[4,4]},
  {name:"Fidjrossè",color:"#EF4444",dash:[2,2]},
];

const PERIODES_VENTES={
  "7j":{label:"7 derniers jours",lbl:"7J",total:"1 038 000",totalRaw:1038000,delta:"12,5%",kpinb:"312",
    ptab:["LUN","MAR","MER","JEU","VEN","SAM","DIM"],vpp:[38,42,51,44,55,62,60],
    boutiques:[[960,800,1100,970,1200,1310,1260],[700,900,700,620,820,850,920],[550,580,860,650,830,850,800],[400,470,540,610,680,700,700]],
    global:[2610,2750,3200,2850,3530,3710,3680]},
  "30j":{label:"30 derniers jours",lbl:"30J",total:"4 280 000",totalRaw:4280000,delta:"12,5%",kpinb:"1 240",
    ptab:Array.from({length:30},(_,i)=>"J"+(i+1)),vpp:[38,46,49,48,37,42,41,35,32,37,34,39,43,41,37,44,42,39,36,47,43,42,37,41,43,40,38,37,24,26],
    boutiques:[[960,1170,1260,1230,960,1080,1060,900,820,940,880,1000,1100,1050,960,1120,1090,1000,930,1200,1100,1080,960,1050,1100,1030,980,960,620,660],[780,850,860,870,640,720,740,600,540,660,620,700,770,740,680,780,760,700,660,840,770,760,680,740,770,720,690,680,440,480],[600,680,640,770,440,520,560,400,360,480,440,520,580,560,500,580,560,500,460,640,580,560,500,560,580,540,500,480,320,360],[400,460,500,440,300,340,360,240,200,320,280,320,360,340,300,360,340,300,260,400,360,340,300,340,360,320,280,280,180,220]],
    global:[2740,3160,3260,3310,2340,2660,2720,2140,1920,2400,2220,2540,2810,2690,2440,2840,2750,2500,2310,3080,2810,2740,2440,2690,2810,2610,2450,2400,1560,1720]},
  "mois":{label:"Ce mois",lbl:"MOIS",total:"4 280 000",totalRaw:4280000,delta:"8%",kpinb:"1 240",
    ptab:["SEM.1","SEM.2","SEM.3","SEM.4"],vpp:[280,310,370,280],
    boutiques:[[7200,8100,9000,8700],[5400,6075,6750,6525],[4800,5400,6000,5800],[2400,2700,2900,2800]],
    global:[19800,22275,24650,23825]},
  "annee":{label:"Cette année",lbl:"ANNÉE",total:"51 360 000",totalRaw:51360000,delta:"18%",kpinb:"14 880",
    ptab:["JAN","FÉV","MAR","AVR","MAI","JUN","JUL","AOÛ","SEP","OCT","NOV","DÉC"],vpp:[1100,1010,1350,1380,1260,1470,1570,1430,1310,1500,1540,1560],
    boutiques:[[14400,13200,15800,16200,14800,17200,18400,16800,15400,17600,18000,18200],[10800,9900,11850,12150,11100,12900,13800,12600,11550,13200,13500,13650],[9000,8250,9875,10125,9250,10750,11500,10500,9625,11000,11250,11375],[6000,5500,6583,6750,6167,7167,7667,7000,6417,7333,7500,7583]],
    global:[40200,36850,44108,45225,41317,48017,51367,46900,43492,49133,50250,50808]},
};

/* Transactions enrichies avec date et semaine */
const TX_ALL=[
  {id:"TX001",date:"2026-04-28",heure:"15:42",sem:"Sem. 17",mois:"Avril 2026",client:"Aminata Diallo",initials:"AD",col:"#C8E6C9",tcol:"#2E5C3E",mode:"especes",vendeur:"Mme Koussou",boutique:"Akpakpa",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:2,pu:4500,total:9000},{emoji:"🫙",nom:"Huile palme 1L",qte:1,pu:1200,total:1200},{emoji:"🧴",nom:"Savon OMO",qte:2,pu:1100,total:2200}],montant:12400},
  {id:"TX002",date:"2026-04-28",heure:"15:31",sem:"Sem. 17",mois:"Avril 2026",client:"Client anonyme",initials:"🧑",col:"#ECEFF1",tcol:"#546E7A",mode:"mobile",vendeur:"M. Tossou",boutique:"Zogbadjè",
   produits:[{emoji:"🥤",nom:"Coca-Cola 33cl",qte:4,pu:500,total:2000},{emoji:"💧",nom:"Eau Awa 1,5L",qte:2,pu:300,total:600}],montant:2600},
  {id:"TX003",date:"2026-04-28",heure:"15:18",sem:"Sem. 17",mois:"Avril 2026",client:"Kouassi Martin",initials:"KM",col:"#BBDEFB",tcol:"#1976D2",mode:"especes",vendeur:"Mme Koussou",boutique:"Akpakpa",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:1,pu:4500,total:4500},{emoji:"🥤",nom:"Coca-Cola 33cl",qte:6,pu:500,total:3000},{emoji:"💧",nom:"Eau Awa 1,5L",qte:4,pu:300,total:1200}],montant:8700},
  {id:"TX004",date:"2026-04-27",heure:"14:55",sem:"Sem. 17",mois:"Avril 2026",client:"Fatou Traoré",initials:"FT",col:"#E1BEE7",tcol:"#7B1FA2",mode:"credit",vendeur:"M. Dossou",boutique:"Cadjehoun",
   produits:[{emoji:"🥛",nom:"Lait 1L",qte:2,pu:900,total:1800},{emoji:"🧀",nom:"Fromage fondu",qte:1,pu:1200,total:1200},{emoji:"🌾",nom:"Riz parfumé 5kg",qte:1,pu:4500,total:4500}],montant:7500},
  {id:"TX005",date:"2026-04-27",heure:"14:32",sem:"Sem. 17",mois:"Avril 2026",client:"Client anonyme",initials:"🧑",col:"#ECEFF1",tcol:"#546E7A",mode:"mobile",vendeur:"Mme Koussou",boutique:"Akpakpa",
   produits:[{emoji:"🍬",nom:"Bonbons assortis",qte:3,pu:250,total:750},{emoji:"💧",nom:"Eau Awa 1,5L",qte:2,pu:300,total:600}],montant:1350},
  {id:"TX006",date:"2026-04-26",heure:"14:10",sem:"Sem. 16",mois:"Avril 2026",client:"Ibrahim Sanogo",initials:"IS",col:"#FFE0B2",tcol:"#E65100",mode:"especes",vendeur:"M. Tossou",boutique:"Zogbadjè",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:3,pu:4500,total:13500},{emoji:"🫙",nom:"Huile palme 1L",qte:2,pu:1200,total:2400},{emoji:"🥤",nom:"Coca-Cola 33cl",qte:12,pu:500,total:6000}],montant:21900},
  {id:"TX007",date:"2026-04-26",heure:"13:48",sem:"Sem. 16",mois:"Avril 2026",client:"Aminata Diallo",initials:"AD",col:"#C8E6C9",tcol:"#2E5C3E",mode:"especes",vendeur:"M. Dossou",boutique:"Cadjehoun",
   produits:[{emoji:"🧴",nom:"Détergent Ariel",qte:2,pu:1500,total:3000},{emoji:"🧽",nom:"Éponge ×3",qte:1,pu:450,total:450},{emoji:"🫧",nom:"Javel 1L",qte:2,pu:600,total:1200}],montant:4650},
  {id:"TX008",date:"2026-04-25",heure:"13:20",sem:"Sem. 16",mois:"Avril 2026",client:"Moussa Kaboré",initials:"MK",col:"#F0F4C3",tcol:"#827717",mode:"mobile",vendeur:"Mme Koussou",boutique:"Akpakpa",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:1,pu:4500,total:4500},{emoji:"🥤",nom:"Jus Tchamba 1L",qte:4,pu:800,total:3200},{emoji:"🍪",nom:"Biscuits assortis",qte:3,pu:400,total:1200}],montant:8900},
  {id:"TX009",date:"2026-04-21",heure:"10:15",sem:"Sem. 16",mois:"Avril 2026",client:"Drissa Koné",initials:"DK",col:"#E8EAF6",tcol:"#283593",mode:"especes",vendeur:"M. Tossou",boutique:"Zogbadjè",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:2,pu:4500,total:9000},{emoji:"🍬",nom:"Bonbons",qte:5,pu:250,total:1250}],montant:10250},
  {id:"TX010",date:"2026-04-14",heure:"09:30",sem:"Sem. 15",mois:"Avril 2026",client:"Rokia Touré",initials:"RT",col:"#E0F7FA",tcol:"#006064",mode:"mobile",vendeur:"Mme Koussou",boutique:"Akpakpa",
   produits:[{emoji:"🥤",nom:"Jus Tchamba 1L",qte:6,pu:800,total:4800},{emoji:"💧",nom:"Eau Awa 1,5L",qte:10,pu:300,total:3000}],montant:7800},
  {id:"TX011",date:"2026-04-07",heure:"11:00",sem:"Sem. 14",mois:"Avril 2026",client:"Bamba Kouyaté",initials:"BK",col:"#E0F2F1",tcol:"#004D40",mode:"credit",vendeur:"M. Dossou",boutique:"Cadjehoun",
   produits:[{emoji:"🧴",nom:"Savon OMO",qte:5,pu:1100,total:5500},{emoji:"🫧",nom:"Javel 1L",qte:3,pu:600,total:1800}],montant:7300},
  {id:"TX012",date:"2026-03-28",heure:"14:00",sem:"Sem. 13",mois:"Mars 2026",client:"Awa Sangaré",initials:"AS",col:"#FFF9C4",tcol:"#F57F17",mode:"especes",vendeur:"M. Tossou",boutique:"Zogbadjè",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:4,pu:4500,total:18000},{emoji:"🫙",nom:"Huile palme 1L",qte:3,pu:1200,total:3600}],montant:21600},
  {id:"TX013",date:"2026-03-15",heure:"16:20",sem:"Sem. 11",mois:"Mars 2026",client:"Kouassi Martin",initials:"KM",col:"#BBDEFB",tcol:"#1976D2",mode:"mobile",vendeur:"Mme Koussou",boutique:"Akpakpa",
   produits:[{emoji:"🥤",nom:"Coca-Cola 33cl",qte:24,pu:500,total:12000},{emoji:"🍺",nom:"Bière Castel",qte:6,pu:750,total:4500}],montant:16500},
  {id:"TX014",date:"2026-02-20",heure:"10:45",sem:"Sem. 8",mois:"Février 2026",client:"Ibrahim Sanogo",initials:"IS",col:"#FFE0B2",tcol:"#E65100",mode:"especes",vendeur:"M. Dossou",boutique:"Cadjehoun",
   produits:[{emoji:"🌾",nom:"Riz parfumé 5kg",qte:5,pu:4500,total:22500},{emoji:"🍬",nom:"Bonbons assortis",qte:10,pu:250,total:2500}],montant:25000},
  {id:"TX015",date:"2026-01-10",heure:"09:00",sem:"Sem. 2",mois:"Janvier 2026",client:"Fatou Traoré",initials:"FT",col:"#E1BEE7",tcol:"#7B1FA2",mode:"mobile",vendeur:"M. Tossou",boutique:"Zogbadjè",
   produits:[{emoji:"🧴",nom:"Savon OMO",qte:8,pu:1100,total:8800},{emoji:"🧽",nom:"Éponge ×3",qte:4,pu:450,total:1800},{emoji:"🫧",nom:"Javel 1L",qte:5,pu:600,total:3000}],montant:13600},
];

const PRODUITS_TOP=[
  {name:"Riz parfumé 5kg",emoji:"🌾",units:38,rev:171000,trend:"+22%",up:true},
  {name:"Coca-Cola 33cl",emoji:"🥤",units:94,rev:47000,trend:"+8%",up:true},
  {name:"Huile 1L",emoji:"🫙",units:22,rev:39600,trend:"−5%",up:false},
  {name:"Eau Awa 1,5L",emoji:"💧",units:65,rev:19500,trend:"+14%",up:true},
  {name:"Savon OMO 500g",emoji:"🧴",units:12,rev:13200,trend:"−2%",up:false},
];

const DETTES=[
  {id:1,name:"Koffi Adjobi",initials:"KA",col:"#FFCDD2",tcol:"#C62828",tel:"+229 97 12 34 56",montant:28500,paye:0,statut:"urgent",jours:32,dateCredit:"28 mars 2026",hist:[{date:"28 mars",items:"Riz 5kg × 3, Huile × 2",montant:18500},{date:"12 mars",items:"Farine, Sucre 2kg",montant:10000}]},
  {id:2,name:"Mariam Coulibaly",initials:"MC",col:"#FCE4EC",tcol:"#AD1457",tel:"+229 96 87 65 43",montant:15000,paye:5000,statut:"urgent",jours:21,dateCredit:"7 avr 2026",hist:[{date:"7 avr",items:"Coca ×12, Eau ×6",montant:15000}]},
  {id:3,name:"Sékou Traoré",initials:"ST",col:"#FFF3E0",tcol:"#E65100",tel:"+229 95 44 22 11",montant:22000,paye:8000,statut:"urgent",jours:18,dateCredit:"10 avr 2026",hist:[{date:"10 avr",items:"Savon ×5, Dentifrice ×3",montant:12000},{date:"5 avr",items:"Riz 5kg × 2",montant:10000}]},
  {id:4,name:"Awa Sangaré",initials:"AS",col:"#FFF9C4",tcol:"#F57F17",tel:"+229 94 33 21 00",montant:9500,paye:2000,statut:"normal",jours:11,dateCredit:"17 avr 2026",hist:[{date:"17 avr",items:"Yaourt ×4, Fromage, Lait",montant:9500}]},
  {id:5,name:"Drissa Koné",initials:"DK",col:"#E8EAF6",tcol:"#283593",tel:"+229 93 55 44 33",montant:18200,paye:10000,statut:"normal",jours:9,dateCredit:"19 avr 2026",hist:[{date:"19 avr",items:"Boissons ×20, Snacks",montant:11200},{date:"18 avr",items:"Riz 5kg, Huile 2L",montant:7000}]},
  {id:6,name:"Fatoumata Bah",initials:"FB",col:"#E8F5E9",tcol:"#1B5E20",tel:"+229 92 66 77 88",montant:7200,paye:3200,statut:"normal",jours:8,dateCredit:"20 avr 2026",hist:[{date:"20 avr",items:"Détergent ×3, Éponge ×5",montant:7200}]},
  {id:7,name:"Adama Diallo",initials:"AD",col:"#F3E5F5",tcol:"#6A1B9A",tel:"+229 91 22 33 44",montant:11300,paye:5000,statut:"normal",jours:7,dateCredit:"21 avr 2026",hist:[{date:"21 avr",items:"Pile ×6, Bougie ×4",montant:11300}]},
  {id:8,name:"Rokia Touré",initials:"RT",col:"#E0F7FA",tcol:"#006064",tel:"+229 90 11 22 33",montant:5400,paye:2000,statut:"recent",jours:2,dateCredit:"26 avr 2026",hist:[{date:"26 avr",items:"Jus ×4, Bière ×2",montant:5400}]},
  {id:9,name:"Bamba Kouyaté",initials:"BK",col:"#E0F2F1",tcol:"#004D40",tel:"+229 99 88 77 66",montant:10300,paye:4000,statut:"recent",jours:1,dateCredit:"27 avr 2026",hist:[{date:"27 avr",items:"Riz 5kg × 2, Sucre 1kg",montant:10300}]},
];

/* ══════════════════════════════════════
   ÉTAT
══════════════════════════════════════ */
let vPeriod="30j", hPeriod="30j", vue="boutique";
let modeFilter="tous", searchQ="";
let prFilter="tous", prSort="qty";
let detteFilter="tous";
let chartInst=null;
const openTx=new Set();
const openGroups=new Set();
const openCards=new Set();
let modalClientId=null;

/* ══════════════════════════════════════
   UTILITAIRES
══════════════════════════════════════ */
function switchTab(tab,el){
  document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".main-tab").forEach(t=>t.classList.remove("active"));
  document.getElementById("tab-"+tab).classList.add("active");
  el.classList.add("active");
}
function toggleDrop(id,e){
  e.stopPropagation();
  const el=document.getElementById(id);
  const was=el.classList.contains("show");
  document.querySelectorAll(".drop").forEach(d=>d.classList.remove("show"));
  if(!was)el.classList.add("show");
}
document.addEventListener("click",()=>document.querySelectorAll(".drop").forEach(d=>d.classList.remove("show")));
function showTip(e,t){const el=document.getElementById("tooltip");el.textContent=t;el.style.display="block";const x=e.touches?e.touches[0].clientX:e.clientX,y=e.touches?e.touches[0].clientY:e.clientY;el.style.left=Math.min(x+8,window.innerWidth-160)+"px";el.style.top=(y-34)+"px";}
function hideTip(){document.getElementById("tooltip").style.display="none";}
function showToast(m){const t=document.getElementById("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500);}
function fmtY(v){if(v>=1e6)return(v/1e6).toFixed(1)+"M";if(v>=1000)return Math.round(v/100)/10+"k";return v;}
function dlCSV(csv,fn){const b=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);showToast("✅ CSV téléchargé !");}

/* ══════════════════════════════════════
   GRAPHIQUE VENTES
══════════════════════════════════════ */
function setPV(p,el){
  vPeriod=p;
  document.querySelectorAll("#ventes-ptabs .ptab").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("vbadge1").textContent=p.toUpperCase();
  document.getElementById("vbadge2").textContent=p.toUpperCase();
  renderChart();
}
function setVue(v,el){
  vue=v;document.querySelectorAll(".toggle-btn").forEach(t=>t.classList.remove("active"));el.classList.add("active");renderChart();
}
function renderChart(){
  const d=PERIODES_VENTES[vPeriod];
  document.getElementById("k-ca").textContent=d.total;
  document.getElementById("k-ca-sub").textContent=d.label;
  document.getElementById("k-nb").textContent=d.kpinb;
  document.getElementById("k-ca-delta").textContent="↑ +"+d.delta;
  document.getElementById("evo-total").textContent=d.total+" F";
  document.getElementById("evo-delta").textContent=d.delta;
  document.getElementById("evo-lbl").textContent="ÉVOLUTION — "+vPeriod.toUpperCase();
  const datasets=vue==="global"
    ?[{label:"Global",data:d.global,borderColor:"#4A7C59",backgroundColor:"rgba(74,124,89,.08)",borderWidth:2.5,tension:.45,fill:true,pointBackgroundColor:"#4A7C59",pointRadius:4,pointHoverRadius:7,pointBorderColor:"#fff",pointBorderWidth:2}]
    :BOUTIQUES.map((b,i)=>({label:b.name,data:d.boutiques[i],borderColor:b.color,backgroundColor:"transparent",borderWidth:2,tension:.45,fill:false,pointBackgroundColor:"#fff",pointBorderColor:b.color,pointBorderWidth:2,pointRadius:4,pointHoverRadius:7,borderDash:b.dash}));
  document.getElementById("evo-legend").innerHTML=vue==="global"
    ?`<div class="legend-item"><div class="legend-line" style="background:#4A7C59"></div>Toutes boutiques</div>`
    :BOUTIQUES.map(b=>`<div class="legend-item"><div class="legend-line" style="background:${b.color}"></div>${b.name}</div>`).join("");
  const ctx=document.getElementById("evo-chart").getContext("2d");
  if(chartInst)chartInst.destroy();
  chartInst=new Chart(ctx,{type:"line",data:{labels:d.ptab,datasets},options:{
    responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},
    onClick(_,els){if(!els.length)return;const idx=els[0].index;const lbl=d.ptab[idx];const ca=vue==="global"?d.global[idx]:d.boutiques.reduce((s,b)=>s+b[idx],0);document.getElementById("k-ca").textContent=ca.toLocaleString("fr-FR");document.getElementById("k-ca-lbl").textContent="CA · "+lbl;document.getElementById("k-nb").textContent=d.vpp[idx];document.getElementById("evo-total").textContent=ca.toLocaleString("fr-FR")+" F ("+lbl+")";document.getElementById("kpi-ca-card").classList.add("kpi-hl");},
    plugins:{legend:{display:false},tooltip:{enabled:false,external(ctx2){const tip=document.getElementById("evo-tip");if(ctx2.tooltip.opacity===0){tip.style.display="none";return;}const t=ctx2.tooltip;const idx=t.dataPoints[0]?.dataIndex??null;const rows=t.dataPoints.map(dp=>{const b=vue==="global"?{name:"Global",color:"#4A7C59"}:BOUTIQUES[dp.datasetIndex];return`<div class="evo-tip-row"><div style="display:flex;align-items:center;gap:5px;"><div class="evo-tip-dot" style="background:${b.color}"></div><span class="evo-tip-name">${b.name}</span></div><span class="evo-tip-val">${Number(dp.raw).toLocaleString("fr-FR")}</span></div>`;}).join("");tip.innerHTML=`<div class="evo-tip-label">${t.title[0]||""}</div>${rows}<div class="evo-tip-hint">🛍 ${idx!==null?d.vpp[idx]:""} ventes</div>`;tip.style.display="block";const pos=ctx2.chart.canvas.getBoundingClientRect();let x=t.caretX+12;if(x+150>pos.width)x=t.caretX-158;tip.style.left=x+"px";tip.style.top=Math.max(0,t.caretY-20)+"px";}}},
    scales:{x:{grid:{display:false},ticks:{font:{family:"var(--font-plex-mono,'IBM Plex Mono',monospace)",size:10},color:"#9AB0A0",maxRotation:0,autoSkip:true,maxTicksLimit:vPeriod==="30j"?8:12},border:{display:false}},y:{grid:{color:"rgba(74,124,89,.07)"},ticks:{font:{family:"var(--font-plex-mono,'IBM Plex Mono',monospace)",size:10},color:"#9AB0A0",callback:v=>fmtY(v)},border:{display:false}}},
  }});
}
function exportVPDF(){document.getElementById("vdrop").classList.remove("show");showToast("📄 Impression graphique…");setTimeout(()=>window.print(),400);}
function exportVCSV(){document.getElementById("vdrop").classList.remove("show");const d=PERIODES_VENTES[vPeriod];let csv=vue==="global"?"Label;CA;Ventes\n":"Label;"+BOUTIQUES.map(b=>b.name).join(";")+";Total;Ventes\n";d.ptab.forEach((l,i)=>{if(vue==="global")csv+=`${l};${d.global[i]};${d.vpp[i]}\n`;else{const r=BOUTIQUES.map((_,bi)=>d.boutiques[bi][i]).join(";");csv+=`${l};${r};${BOUTIQUES.reduce((s,_,bi)=>s+d.boutiques[bi][i],0)};${d.vpp[i]}\n`;}});dlCSV(csv,"mafro-ventes-"+vPeriod+".csv");}

/* HEATMAP */
const HMAP=[2,5,12,18,10,14,20,9,8,0,0,0],HMAP_H=["8h","9h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h"];
function drawHeatmap(){const max=Math.max(...HMAP.filter(v=>v>0));document.getElementById("hmap-grid").innerHTML=HMAP.map((v,i)=>`<div class="heatmap-cell" style="background:rgba(74,124,89,${Math.max(.08,max>0?v/max:0)});" onmouseenter="showTip(event,'${HMAP_H[i]}: ${v} ventes')" onmouseleave="hideTip()"></div>`).join("");document.getElementById("hmap-labels").innerHTML=HMAP_H.map(l=>`<div class="heatmap-lbl">${l}</div>`).join("");}

/* VENTES DU JOUR */
const MB={especes:"badge-esp",mobile:"badge-mob",credit:"badge-cred"};
const ML={especes:"Espèces",mobile:"Mobile",credit:"Crédit"};
function renderVauj(){
  const today=TX_ALL.filter(t=>t.date==="2026-04-28");
  document.getElementById("vauj-list").innerHTML=today.map(t=>`
    <div class="vauj-row">
      <div class="vauj-avatar" style="background:${t.col};color:${t.tcol}">${t.initials}</div>
      <div class="vauj-info"><div class="vauj-client">${t.client}</div><div class="vauj-prods">${t.produits.map(p=>p.emoji+p.nom.split(" ")[0]).join(", ")}</div></div>
      <div class="vauj-right"><div class="vauj-montant">${t.montant.toLocaleString("fr-FR")} F</div><div class="vauj-heure">${t.heure}</div><span class="vauj-badge ${MB[t.mode]}">${ML[t.mode]}</span></div>
    </div>`).join("");
}
function renderTopProduits(){document.getElementById("top-prods").innerHTML=PRODUITS_TOP.map(p=>`<div class="prod-row"><div class="prod-emoji-wrap">${p.emoji}</div><div class="prod-info"><div class="prod-name">${p.name}</div><div class="prod-units">${p.units} unités</div></div><div class="prod-right"><div class="prod-rev">${p.rev.toLocaleString("fr-FR")} F</div><div class="prod-trend ${p.up?"up":"down"}">${p.trend}</div></div></div>`).join("");}

/* ══════════════════════════════════════
   HISTORIQUE — FILTRAGE PÉRIODE
══════════════════════════════════════ */
const HIST_META={
  "7j":{label:"7 derniers jours",lbl:"7J",ca:68750,tx:8,panier:8594,boutiques:[{n:"Akpakpa",c:"#22C55E",v:28400},{n:"Zogbadjè",c:"#3B82F6",v:21200},{n:"Cadjehoun",c:"#F5A623",v:11500},{n:"Fidjrossè",c:"#EF4444",v:7650}],
    filterFn:t=>["2026-04-28","2026-04-27","2026-04-26","2026-04-25"].includes(t.date),
    groupBy:"jour"},
  "30j":{label:"30 derniers jours",lbl:"30J",ca:284750,tx:11,panier:25886,boutiques:[{n:"Akpakpa",c:"#22C55E",v:118000},{n:"Zogbadjè",c:"#3B82F6",v:88000},{n:"Cadjehoun",c:"#F5A623",v:51000},{n:"Fidjrossè",c:"#EF4444",v:27750}],
    filterFn:t=>t.date>="2026-03-29",
    groupBy:"semaine"},
  "mois":{label:"Ce mois (Avril 2026)",lbl:"MOIS",ca:4280000,tx:11,panier:3452,boutiques:[{n:"Akpakpa",c:"#22C55E",v:1720000},{n:"Zogbadjè",c:"#3B82F6",v:1290000},{n:"Cadjehoun",c:"#F5A623",v:860000},{n:"Fidjrossè",c:"#EF4444",v:410000}],
    filterFn:t=>t.mois==="Avril 2026",
    groupBy:"semaine"},
  "annee":{label:"Cette année (2026)",lbl:"ANNÉE",ca:51360000,tx:15,panier:3424000,boutiques:[{n:"Akpakpa",c:"#22C55E",v:20640000},{n:"Zogbadjè",c:"#3B82F6",v:15480000},{n:"Cadjehoun",c:"#F5A623",v:10320000},{n:"Fidjrossè",c:"#EF4444",v:4920000}],
    filterFn:()=>true,
    groupBy:"mois"},
};

function setHP(p,el){
  hPeriod=p;
  document.querySelectorAll("#hist-ptabs .hist-ptab").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  ["hbadge1","hbadge2","hbadge3","pr-badge"].forEach(id=>{
    document.getElementById(id).textContent=HIST_META[p].lbl;
  });
  renderPeriodSummary(p);
  applyFilters();
  renderPrStats();renderPrList();
}

function renderPeriodSummary(p){
  const d=HIST_META[p];
  document.getElementById("ps-title").textContent="📅 "+d.label.toUpperCase();
  document.getElementById("ps-ca").textContent=d.ca.toLocaleString("fr-FR");
  document.getElementById("ps-tx").textContent=d.tx.toLocaleString("fr-FR");
  document.getElementById("ps-panier").textContent=d.panier.toLocaleString("fr-FR");
  document.getElementById("ps-boutiques").innerHTML=d.boutiques.map(b=>`<div class="ps-pill"><div class="ps-pill-dot" style="background:${b.c}"></div><span class="ps-pill-name">${b.n}</span><span class="ps-pill-val">${b.v.toLocaleString("fr-FR")} F</span></div>`).join("");
}

/* ══════════════════════════════════════
   HISTORIQUE — GROUPEMENT INTELLIGENT
══════════════════════════════════════ */
function setModeChip(m,el){
  modeFilter=m;
  document.querySelectorAll(".mode-chip").forEach(c=>c.classList.remove("active"));
  el.classList.add("active");
  applyFilters();
}

function applyFilters(){
  searchQ=document.getElementById("hist-search").value.toLowerCase();
  const meta=HIST_META[hPeriod];
  let list=TX_ALL.filter(meta.filterFn);
  if(modeFilter!=="tous")list=list.filter(t=>t.mode===modeFilter);
  if(searchQ)list=list.filter(t=>
    t.client.toLowerCase().includes(searchQ)||t.vendeur.toLowerCase().includes(searchQ)||
    t.boutique.toLowerCase().includes(searchQ)||t.mode.includes(searchQ)||
    t.produits.some(p=>p.nom.toLowerCase().includes(searchQ))||
    t.montant.toString().includes(searchQ)
  );
  renderGroups(list,meta.groupBy);
}

function getGroupKey(tx,groupBy){
  if(groupBy==="jour"){
    // Libellé convivial pour le jour
    const today="2026-04-28",yesterday="2026-04-27";
    if(tx.date===today)return{key:"Aujourd'hui",icon:"☀️",iconBg:"#FFF9C4",iconColor:"#F57F17"};
    if(tx.date===yesterday)return{key:"Hier",icon:"🕐",iconBg:"#E8EAF6",iconColor:"#3949AB"};
    // Formater la date
    const [y,m,d]=tx.date.split("-");
    const mois=["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"][parseInt(m)-1];
    return{key:`${parseInt(d)} ${mois} ${y}`,icon:"📅",iconBg:"#E0F2F1",iconColor:"#00695C"};
  }
  if(groupBy==="semaine")return{key:tx.sem,icon:"📆",iconBg:"#E3F2FD",iconColor:"#1565C0"};
  if(groupBy==="mois")return{key:tx.mois,icon:"🗓️",iconBg:"#F3E5F5",iconColor:"#6A1B9A"};
  return{key:"Toutes",icon:"📋",iconBg:"#E8F5E9",iconColor:"#2E7D32"};
}

function renderGroups(list,groupBy){
  if(!list.length){
    document.getElementById("hist-groups").innerHTML=`<div style="text-align:center;padding:40px;color:var(--txt3);font-size:13px;">Aucune transaction trouvée</div>`;
    return;
  }
  // Construire les groupes ordonnés
  const groupMap=new Map();
  list.forEach(tx=>{
    const {key,icon,iconBg,iconColor}=getGroupKey(tx,groupBy);
    if(!groupMap.has(key))groupMap.set(key,{key,icon,iconBg,iconColor,txs:[]});
    groupMap.get(key).txs.push(tx);
  });

  // Trier les groupes (plus récent en premier)
  const groups=[...groupMap.values()];

  document.getElementById("hist-groups").innerHTML=groups.map(g=>{
    const totalCA=g.txs.reduce((s,t)=>s+t.montant,0);
    const nbArt=g.txs.reduce((s,t)=>s+t.produits.reduce((a,p)=>a+p.qte,0),0);
    const panier=Math.round(totalCA/g.txs.length);
    const isOpen=openGroups.has(g.key);
    const txHtml=g.txs.map(t=>renderTxCard(t)).join("");
    return `
    <div class="hist-group-block">
      <!-- EN-TÊTE GROUPE -->
      <div class="group-header" onclick="toggleGroup('${CSS.escape(g.key)}')">
        <div class="group-header-left">
          <div class="group-icon" style="background:${g.iconBg};color:${g.iconColor}">${g.icon}</div>
          <div class="group-label-wrap">
            <div class="group-label">${g.key}</div>
            <div class="group-sub">${g.txs.length} transaction${g.txs.length>1?"s":""}</div>
          </div>
        </div>
        <div class="group-header-right">
          <div class="group-kpi">
            <div class="group-ca">${totalCA.toLocaleString("fr-FR")} F</div>
            <div class="group-nb">${g.txs.length} tx · ${nbArt} art.</div>
          </div>
          <div class="group-chev ${isOpen?"open":""}" id="gchev-${CSS.escape(g.key)}">›</div>
        </div>
      </div>

      <!-- BARRE RÉSUMÉ (toujours visible) -->
      <div class="group-summary-bar">
        <div class="gsb-item">
          <div class="gsb-val">${totalCA.toLocaleString("fr-FR")} F</div>
          <div class="gsb-lbl">CA total</div>
        </div>
        <div class="gsb-item">
          <div class="gsb-val">${panier.toLocaleString("fr-FR")} F</div>
          <div class="gsb-lbl">Panier moy.</div>
        </div>
        <div class="gsb-item">
          <div class="gsb-val">${nbArt}</div>
          <div class="gsb-lbl">Articles</div>
        </div>
      </div>

      <!-- DÉTAIL DÉPLIABLE -->
      <div class="group-body ${isOpen?"open":""}" id="gbody-${CSS.escape(g.key)}">
        ${txHtml}
      </div>
    </div>`;
  }).join("");
}

function toggleGroup(key){
  const escaped=CSS.escape(key);
  if(openGroups.has(key))openGroups.delete(key);else openGroups.add(key);
  document.getElementById("gbody-"+escaped)?.classList.toggle("open");
  document.getElementById("gchev-"+escaped)?.classList.toggle("open");
}

function renderTxCard(t){
  const isOpen=openTx.has(t.id);
  const lignes=t.produits.map(p=>`<div class="tx-prod-row"><span class="tx-prod-emoji">${p.emoji}</span><span class="tx-prod-name">${p.nom}</span><span class="tx-prod-qty">×${p.qte}</span><span class="tx-prod-price">${p.total.toLocaleString("fr-FR")} F</span></div>`).join("");
  return `<div class="tx-card">
    <div class="tx-header" onclick="toggleTx('${t.id}')">
      <div class="tx-avatar" style="background:${t.col};color:${t.tcol}">${t.initials}</div>
      <div class="tx-info">
        <div class="tx-client">${t.client}</div>
        <div class="tx-meta"><span class="tx-badge ${MB[t.mode]}">💡 ${ML[t.mode]}</span><span>· ${t.boutique}</span></div>
      </div>
      <div class="tx-right">
        <div class="tx-montant">${t.montant.toLocaleString("fr-FR")} F</div>
        <div class="tx-heure">${t.heure} · ${t.produits.length} art.</div>
      </div>
      <div class="tx-chev ${isOpen?"open":""}" id="txchev-${t.id}">›</div>
    </div>
    <div class="tx-detail ${isOpen?"open":""}" id="txbody-${t.id}">
      <div class="tx-detail-title">📦 Produits</div>
      ${lignes}
      <div class="tx-total-row"><span class="tx-total-lbl">Total encaissé</span><span class="tx-total-val">${t.montant.toLocaleString("fr-FR")} FCFA</span></div>
      <div class="tx-info-row"><span>Vendeur : <strong>${t.vendeur}</strong></span><span style="font-family:var(--font-plex-mono,'IBM Plex Mono',monospace);font-size:10px;color:var(--txt3);">#${t.id}</span></div>
    </div>
  </div>`;
}

function toggleTx(id){
  if(openTx.has(id))openTx.delete(id);else openTx.add(id);
  document.getElementById("txbody-"+id)?.classList.toggle("open");
  document.getElementById("txchev-"+id)?.classList.toggle("open");
}

/* ══════════════════════════════════════
   PRODUITS VENDUS
══════════════════════════════════════ */
function aggregateProduits(){
  const map={};
  TX_ALL.forEach(tx=>{tx.produits.forEach(p=>{if(!map[p.nom])map[p.nom]={nom:p.nom,emoji:p.emoji,qte:0,rev:0};map[p.nom].qte+=p.qte;map[p.nom].rev+=p.total;});});
  const list=Object.values(map);
  const sorted=[...list].sort((a,b)=>b.qte-a.qte);
  const n=sorted.length;
  sorted.forEach((p,i)=>{p.tier=i<Math.ceil(n/3)?"top":i<Math.ceil(2*n/3)?"mid":"low";});
  list.forEach(p=>{p.tier=sorted.find(s=>s.nom===p.nom).tier;});
  return list;
}
const ALL_PRODS=aggregateProduits();

function renderPrStats(){const r=ALL_PRODS.reduce((s,p)=>s+p.rev,0);const q=ALL_PRODS.reduce((s,p)=>s+p.qte,0);document.getElementById("pr-stats").innerHTML=`<div class="pr-stat"><div class="pr-stat-val">${ALL_PRODS.length}</div><div class="pr-stat-lbl">Références</div></div><div class="pr-stat"><div class="pr-stat-val">${q}</div><div class="pr-stat-lbl">Unités</div></div><div class="pr-stat"><div class="pr-stat-val">${(r/1000).toFixed(0)}k F</div><div class="pr-stat-lbl">CA</div></div>`;}
function setPrF(f,el){prFilter=f;document.querySelectorAll(".pr-ftab").forEach(t=>t.classList.remove("active"));el.classList.add("active");renderPrList();}
function setPrS(s,el){prSort=s;document.querySelectorAll(".pr-sort-btn").forEach(t=>t.classList.remove("active"));el.classList.add("active");renderPrList();}
function renderPrList(){
  const r=ALL_PRODS.reduce((s,p)=>s+p.rev,0);const mq=Math.max(...ALL_PRODS.map(p=>p.qte));
  let list=[...ALL_PRODS];
  if(prFilter!=="tous")list=list.filter(p=>p.tier===prFilter);
  list.sort((a,b)=>prSort==="qty"?b.qte-a.qte:prSort==="rev"?b.rev-a.rev:a.nom.localeCompare(b.nom,"fr"));
  const tl={top:"Top",mid:"Moyen",low:"Peu vendu"};const tb={top:"tier-badge-top",mid:"tier-badge-mid",low:"tier-badge-low"};const bc={top:"pr-bar-top",mid:"pr-bar-mid",low:"pr-bar-low"};
  document.getElementById("pr-list").innerHTML=list.length?list.map(p=>{const sh=r>0?Math.round((p.rev/r)*100):0;const bw=mq>0?Math.round((p.qte/mq)*100):0;return`<div class="pr-row tier-${p.tier}"><div class="pr-prod-cell"><span class="pr-emoji">${p.emoji}</span><div style="min-width:0;"><div class="pr-prod-name">${p.nom}</div><span class="pr-tier-badge ${tb[p.tier]}">${tl[p.tier]}</span></div></div><div class="pr-qty">${p.qte}</div><div class="pr-rev">${p.rev.toLocaleString("fr-FR")} F</div><div class="pr-share">${sh}%</div><div class="pr-bar-wrap"><div class="pr-bar-fill ${bc[p.tier]}" style="width:${bw}%"></div></div></div>`;}).join(""):`<div style="text-align:center;padding:20px;color:var(--txt3);font-size:13px;">Aucun produit</div>`;
}

/* ══════════════════════════════════════
   EXPORTS HISTORIQUE
══════════════════════════════════════ */
function exportHPDF(){
  document.getElementById("hdrop").classList.remove("show");
  const d=HIST_META[hPeriod];const today=new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  document.getElementById("ph-sub").textContent="Rapport — "+d.label;
  document.getElementById("ph-ca").textContent=d.ca.toLocaleString("fr-FR")+" FCFA";
  document.getElementById("ph-tx").textContent=d.tx;
  document.getElementById("ph-panier").textContent=d.panier.toLocaleString("fr-FR")+" FCFA";
  document.getElementById("ph-date").textContent=today;
  document.getElementById("print-date").textContent=today;
  // Ouvrir tous les groupes et transactions
  TX_ALL.filter(d.filterFn).forEach(t=>{openTx.add(t.id);});
  const meta=HIST_META[hPeriod];const list=TX_ALL.filter(meta.filterFn);
  renderGroups(list,meta.groupBy);
  // Ouvrir tous les groupes
  document.querySelectorAll(".group-body").forEach(b=>b.classList.add("open"));
  document.querySelectorAll(".tx-detail").forEach(b=>b.classList.add("open"));
  showToast("📄 Génération PDF — "+d.label+"…");
  setTimeout(()=>{window.print();setTimeout(()=>{openTx.clear();applyFilters();},1000);},500);
}
function exportHCSV(){
  document.getElementById("hdrop").classList.remove("show");
  let csv="ID;Date;Heure;Client;Boutique;Vendeur;Mode;Produit;Qté;PU;Sous-total;Total\n";
  TX_ALL.filter(HIST_META[hPeriod].filterFn).forEach(t=>{t.produits.forEach((p,i)=>{csv+=`${t.id};${t.date};${t.heure};${t.client};${t.boutique};${t.vendeur};${t.mode};${p.nom};${p.qte};${p.pu};${p.total};${i===0?t.montant:""}\n`;});});
  dlCSV(csv,"mafro-historique-"+hPeriod+".csv");
}
function exportProdsCSV(){
  document.getElementById("hdrop").classList.remove("show");
  const r=ALL_PRODS.reduce((s,p)=>s+p.rev,0);
  let csv="Produit;Qté;CA;Part (%);Catégorie\n";
  [...ALL_PRODS].sort((a,b)=>b.qte-a.qte).forEach(p=>{csv+=`${p.nom};${p.qte};${p.rev};${r>0?Math.round((p.rev/r)*100):0}%;${{top:"Top",mid:"Moyen",low:"Peu vendu"}[p.tier]}\n`;});
  dlCSV(csv,"mafro-produits-"+hPeriod+".csv");
}

/* ══════════════════════════════════════
   DETTES
══════════════════════════════════════ */
function fDettes(f,el){detteFilter=f;document.querySelectorAll(".dette-filter").forEach(d=>d.classList.remove("active"));el.classList.add("active");renderDettes();}
function renderDettes(){
  const q=(document.getElementById("dettes-search")||{}).value||"";
  let list=DETTES;
  if(detteFilter!=="tous")list=list.filter(d=>d.statut===detteFilter);
  if(q)list=list.filter(d=>d.name.toLowerCase().includes(q.toLowerCase())||d.tel.includes(q));
  document.getElementById("dettes-list").innerHTML=list.map(d=>{
    const rest=d.montant-d.paye;const pct=Math.round((d.paye/d.montant)*100);
    const sl={urgent:"🔴 Urgent",normal:"🟡 Normal",recent:"🟢 Récent"}[d.statut];
    const isOpen=openCards.has(d.id);
    return `<div class="cdc ${d.statut}">
      <div class="cdc-header" onclick="toggleCard(${d.id})">
        <div class="cdc-avatar" style="background:${d.col};color:${d.tcol}">${d.initials}</div>
        <div class="cdc-info"><div class="cdc-name">${d.name}</div><div class="cdc-meta"><span class="cdc-tel">📞 ${d.tel}</span><span class="cdc-statut statut-${d.statut}">${sl}</span></div></div>
        <div class="cdc-right"><div class="cdc-montant">${rest.toLocaleString("fr-FR")} F</div><div class="cdc-since">depuis ${d.jours===1?"1 jour":d.jours+" jours"}</div></div>
        <div class="cdc-chev ${isOpen?"open":""}" id="chev-${d.id}">›</div>
      </div>
      <div class="cdc-body ${isOpen?"open":""}" id="body-${d.id}">
        <div class="cdc-prog-wrap"><div class="cdc-prog-lbl"><span>Remboursé : ${d.paye.toLocaleString("fr-FR")} F</span><span>${pct}%</span></div><div class="cdc-prog-bar"><div class="cdc-prog-fill" style="width:${pct}%"></div></div></div>
        <div class="cdc-hist-title">📦 Achats à crédit</div>
        ${d.hist.map(h=>`<div class="cdc-hist-row"><div class="cdc-hist-date">${h.date}</div><div class="cdc-hist-items">${h.items}</div><div class="cdc-hist-amt">${h.montant.toLocaleString("fr-FR")} F</div></div>`).join("")}
        <div class="cdc-actions">
          <button class="cdc-btn whatsapp" onclick="sendWA(${d.id})">💬 WhatsApp</button>
          <button class="cdc-btn paiement" onclick="openPaiement(${d.id})">💵 Paiement</button>
          <button class="cdc-btn relance" onclick="relance(${d.id},event)">🔔 Relancer</button>
        </div>
      </div>
    </div>`;
  }).join()||`<div style="text-align:center;padding:40px;color:var(--txt3);font-size:13px;">Aucun client trouvé</div>`;
}
function toggleCard(id){if(openCards.has(id))openCards.delete(id);else openCards.add(id);document.getElementById("body-"+id).classList.toggle("open");document.getElementById("chev-"+id).classList.toggle("open");}
function sendWA(id){const d=DETTES.find(x=>x.id===id);if(!d)return;const rest=d.montant-d.paye;const msg=encodeURIComponent(`Bonjour ${d.name.split(" ")[0]} 👋\n\nVous avez une dette de *${rest.toLocaleString("fr-FR")} FCFA* depuis le ${d.dateCredit}.\n\nMerci de régulariser.\n\n— Mafro 🛒`);window.open(`https://wa.me/${d.tel.replace(/\s/g,"")}?text=${msg}`,"_blank");}
function openPaiement(id){const d=DETTES.find(x=>x.id===id);if(!d)return;modalClientId=id;const rest=d.montant-d.paye;document.getElementById("modal-avatar").textContent=d.initials;document.getElementById("modal-avatar").style.cssText+=`;background:${d.col};color:${d.tcol}`;document.getElementById("modal-client-name").textContent=d.name;document.getElementById("modal-restant").textContent=rest.toLocaleString("fr-FR")+" FCFA";document.getElementById("modal-sub").textContent="Crédit depuis le "+d.dateCredit;document.getElementById("modal-amount").value="";document.getElementById("modal-paiement").classList.add("show");}
function relance(id,e){const b=e.target;b.textContent="✅ Relancé !";b.style.background="var(--vb4)";b.style.color="var(--vb2)";setTimeout(()=>{b.textContent="🔔 Relancer";b.style.background="";b.style.color="";},2000);}
function confirmPaiement(){const d=DETTES.find(x=>x.id===modalClientId);if(!d)return;const amt=parseFloat(document.getElementById("modal-amount").value)||0;if(amt<=0){document.getElementById("modal-amount").style.borderColor="var(--rouge)";return;}d.paye=Math.min(d.paye+amt,d.montant);document.getElementById("modal-paiement").classList.remove("show");const tot=DETTES.reduce((s,x)=>s+(x.montant-x.paye),0);document.getElementById("k-dettes").textContent=tot.toLocaleString("fr-FR");document.getElementById("dettes-total").textContent=tot.toLocaleString("fr-FR")+" FCFA";openCards.delete(modalClientId);renderDettes();showToast("✅ Paiement enregistré !");}
function setMM(el){document.querySelectorAll(".modal-mode").forEach(x=>x.classList.remove("active"));el.classList.add("active");}
document.getElementById("modal-paiement").addEventListener("click",e=>{if(e.target===document.getElementById("modal-paiement"))document.getElementById("modal-paiement").classList.remove("show");});

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
renderChart();drawHeatmap();renderVauj();renderTopProduits();
renderPeriodSummary("30j");applyFilters();renderPrStats();renderPrList();renderDettes();
const today=new Date();
document.getElementById("vauj-date").textContent=today.getDate()+" "+["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"][today.getMonth()];
</script>
</body>
</html>
