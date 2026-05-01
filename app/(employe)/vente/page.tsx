<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<title>Mafro — Ventes</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
:root {
  --vb:#4A7C59; --vb2:#2E5C3E; --vb3:#6FAE82; --vb4:#C8E6C9; --vb5:#EAF4EB;
  --or:#F5A623; --rouge:#E53935; --bleu:#1976D2; --violet:#7B1FA2;
  --bg:#F2F6F3; --card:#FFFFFF; --txt:#1A2E1E; --txt2:#5A7060; --txt3:#9AB0A0;
  --border:rgba(74,124,89,0.12);
  --sh:0 2px 10px rgba(46,92,62,0.08); --sh2:0 6px 24px rgba(46,92,62,0.13);
  --r:16px; --r-sm:10px;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--txt);}
body{display:flex;flex-direction:column;max-width:430px;margin:0 auto;height:100dvh;overflow:hidden;}

.statusbar{height:12px;background:var(--vb2);}
.topbar{background:var(--vb2);padding:10px 20px 14px;flex-shrink:0;}
.topbar-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.back-btn{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.page-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#fff;}
.notif-btn{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;}
.notif-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--or);border:1.5px solid var(--vb2);}
.kpi-strip{display:flex;gap:8px;}
.kpi-card{flex:1;background:rgba(255,255,255,0.12);border-radius:var(--r-sm);padding:10px;border:1px solid rgba(255,255,255,0.1);transition:background 0.2s,border-color 0.2s;}
.kpi-card.kpi-highlight{background:rgba(255,255,255,0.25);border-color:rgba(255,255,255,0.35);}
.kpi-val{font-family:'DM Mono',monospace;font-size:15px;font-weight:500;color:#fff;line-height:1;}
.kpi-lbl{font-size:9px;color:rgba(255,255,255,0.55);margin-top:3px;text-transform:uppercase;letter-spacing:0.5px;}
.kpi-delta{font-size:10px;margin-top:4px;font-weight:500;}
.kpi-delta.up{color:#69F0AE;} .kpi-delta.down{color:#FF7043;}
.kpi-period-lbl{font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px;font-style:italic;}

.main-tabs{display:flex;background:var(--vb2);padding:0 16px 0;flex-shrink:0;border-bottom:2px solid rgba(255,255,255,0.08);}
.main-tab{flex:1;text-align:center;padding:10px 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);cursor:pointer;font-family:'Syne',sans-serif;border-bottom:2.5px solid transparent;transition:all 0.2s;position:relative;display:flex;align-items:center;justify-content:center;gap:5px;}
.main-tab.active{color:#fff;border-bottom-color:var(--or);}
.main-tab .tab-badge{background:var(--rouge);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;font-family:'DM Mono',monospace;}

.scroll-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:16px 16px 100px;display:flex;flex-direction:column;gap:14px;scrollbar-width:none;}
.scroll-body::-webkit-scrollbar{display:none;}
.tab-content{display:none;flex-direction:column;gap:14px;width:100%;}
.tab-content.active{display:flex;}

.section-head{display:flex;align-items:center;justify-content:space-between;}
.section-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--txt);}
.section-link{font-size:12px;color:var(--vb);font-weight:500;cursor:pointer;}

/* ─── POINT SÉLECTIONNÉ BANNER ─── */
.selected-point-banner{
  background:linear-gradient(135deg,var(--vb2),#1a3d28);
  border-radius:var(--r-sm);padding:10px 14px;
  display:none;align-items:center;justify-content:space-between;
  border:1px solid rgba(255,255,255,0.1);margin:0 16px 6px;
}
.selected-point-banner.show{display:flex;}
.spb-label{font-size:11px;color:rgba(255,255,255,0.6);font-family:'DM Mono',monospace;}
.spb-val{font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:#fff;}
.spb-close{background:rgba(255,255,255,0.15);border:none;color:#fff;width:22px;height:22px;border-radius:50%;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;}

/* ─── EVO CARD ─── */
.evo-card{background:var(--card);border-radius:var(--r);padding:0;box-shadow:var(--sh);overflow:hidden;}
.evo-controls{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
.evo-period-tabs{display:flex;gap:4px;}
.evo-period-tab{padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace;cursor:pointer;border:none;background:transparent;color:var(--txt3);transition:all 0.15s;letter-spacing:0.3px;}
.evo-period-tab.active{background:var(--txt);color:#fff;}
.evo-export-btn{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg);font-size:11px;font-weight:600;color:var(--txt2);cursor:pointer;font-family:'DM Mono',monospace;letter-spacing:0.3px;transition:all 0.15s;}
.evo-export-btn:active{background:var(--vb5);border-color:var(--vb3);}

.evo-kpi{padding:14px 16px 10px;}
.evo-label{font-size:10px;font-weight:600;color:var(--txt3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;}
.evo-total{font-family:'DM Mono',monospace;font-size:28px;font-weight:500;color:var(--txt);letter-spacing:-0.5px;line-height:1;transition:all 0.2s;}
.evo-delta{font-size:11px;font-weight:700;color:#2E7D32;margin-top:5px;display:flex;align-items:center;gap:3px;}

.evo-toggle{display:flex;align-items:center;gap:8px;padding:0 16px 10px;}
.evo-toggle-group{display:flex;border-radius:20px;border:1.5px solid var(--border);overflow:hidden;background:var(--bg);}
.evo-toggle-btn{padding:5px 12px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace;cursor:pointer;border:none;background:transparent;color:var(--txt3);transition:all 0.15s;letter-spacing:0.3px;}
.evo-toggle-btn.active{background:var(--txt);color:#fff;}

.evo-legend{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 10px;}
.evo-legend-item{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--txt2);font-weight:500;}
.evo-legend-line{width:20px;height:2px;border-radius:2px;}

.evo-chart-wrap{padding:0 8px 14px;position:relative;}
.evo-chart-wrap canvas{display:block;cursor:crosshair;}

.evo-tooltip{position:absolute;background:var(--txt);color:#fff;border-radius:var(--r-sm);padding:10px 12px;font-size:11px;pointer-events:none;z-index:20;display:none;min-width:130px;box-shadow:0 4px 16px rgba(0,0,0,0.18);}
.evo-tooltip-label{font-family:'DM Mono',monospace;font-weight:700;margin-bottom:6px;font-size:12px;}
.evo-tooltip-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0;}
.evo-tooltip-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.evo-tooltip-name{font-size:10px;color:rgba(255,255,255,0.7);}
.evo-tooltip-val{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;}
.evo-tooltip-hint{font-size:9px;color:rgba(255,255,255,0.45);margin-top:6px;border-top:1px solid rgba(255,255,255,0.12);padding-top:5px;text-align:center;}

/* ─── HEATMAP ─── */
.heatmap-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.heatmap-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:12px;}
.heatmap-cell{aspect-ratio:1;border-radius:3px;cursor:pointer;transition:transform 0.1s;}
.heatmap-cell:active{transform:scale(0.9);}
.heatmap-labels{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:4px;}
.heatmap-lbl{font-size:7px;color:var(--txt3);text-align:center;font-family:'DM Mono',monospace;}

/* ─── RÉSUMÉ VENTES DU JOUR (anciennement vendeurs) ─── */
.ventes-aujourd-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.va-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.va-date-badge{background:var(--vb5);color:var(--vb2);font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;font-family:'DM Mono',monospace;}
.vente-du-jour-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.vente-du-jour-row:last-child{border-bottom:none;}
.vdj-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:'Syne',sans-serif;flex-shrink:0;}
.vdj-info{flex:1;min-width:0;}
.vdj-client{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vdj-prods{font-size:11px;color:var(--txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vdj-right{text-align:right;flex-shrink:0;}
.vdj-montant{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--vb2);}
.vdj-heure{font-size:10px;color:var(--txt3);margin-top:2px;}
.vdj-mode-badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600;margin-top:3px;}
.badge-esp{background:#E8F5E9;color:#2E7D32;}
.badge-mob{background:#E3F2FD;color:#1565C0;}
.badge-cred{background:#FFF3E0;color:#E65100;}

/* ─── TOP PRODUITS ─── */
.top-prods-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.prod-row{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:var(--r-sm);transition:background 0.15s;}
.prod-row:last-child{border-bottom:none;}
.prod-row:active{background:var(--vb5);}
.prod-emoji-wrap{width:36px;height:36px;border-radius:var(--r-sm);background:var(--vb5);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.prod-info{flex:1;min-width:0;}
.prod-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prod-units{font-size:11px;color:var(--txt3);}
.prod-right{text-align:right;flex-shrink:0;}
.prod-rev{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--vb2);}
.prod-trend{font-size:10px;font-weight:600;}
.prod-trend.up{color:#2E7D32;} .prod-trend.down{color:var(--rouge);}

/* ─── HISTORIQUE ─── */
.historique-card{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--sh);}
.search-bar{display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:24px;padding:9px 14px;margin-bottom:12px;border:1.5px solid var(--border);}
.search-bar input{flex:1;border:none;background:none;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--txt);outline:none;}
.search-bar input::placeholder{color:var(--txt3);}

/* Carte transaction détaillée */
.tx-card{background:var(--bg);border-radius:var(--r-sm);margin-bottom:8px;overflow:hidden;border:1px solid var(--border);transition:box-shadow 0.15s;}
.tx-card:last-child{margin-bottom:0;}
.tx-header{display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;}
.tx-header:active{background:var(--vb5);}
.tx-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:'Syne',sans-serif;flex-shrink:0;}
.tx-info{flex:1;min-width:0;}
.tx-client{font-size:13px;font-weight:600;}
.tx-meta{font-size:11px;color:var(--txt3);display:flex;align-items:center;gap:5px;margin-top:1px;flex-wrap:wrap;}
.tx-badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600;}
.tx-right{text-align:right;flex-shrink:0;}
.tx-montant{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;}
.tx-heure{font-size:10px;color:var(--txt3);margin-top:2px;}
.tx-chevron{font-size:13px;color:var(--txt3);transition:transform 0.2s;margin-left:4px;flex-shrink:0;}
.tx-chevron.open{transform:rotate(90deg);}
.tx-detail{display:none;padding:0 12px 12px;border-top:1px solid var(--border);}
.tx-detail.open{display:block;}
.tx-detail-title{font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:0.6px;margin:10px 0 8px;}
.tx-prod-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dashed var(--border);}
.tx-prod-row:last-child{border-bottom:none;}
.tx-prod-emoji{font-size:15px;width:24px;text-align:center;flex-shrink:0;}
.tx-prod-name{font-size:12px;flex:1;color:var(--txt);}
.tx-prod-qty{font-size:11px;color:var(--txt3);font-family:'DM Mono',monospace;}
.tx-prod-price{font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--vb2);}
.tx-total-row{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:2px solid var(--vb4);}
.tx-total-lbl{font-size:12px;font-weight:700;font-family:'Syne',sans-serif;}
.tx-total-val{font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:var(--vb2);}
.tx-info-row{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--txt3);}

/* vendeur tag */
.tx-vendeur{display:flex;align-items:center;gap:4px;background:var(--vb5);padding:3px 8px;border-radius:10px;font-size:10px;font-weight:600;color:var(--vb2);}

/* Résumé du jour en haut historique */
.hist-day-summary{background:linear-gradient(135deg,var(--vb2),#1a3d28);border-radius:var(--r);padding:14px 16px;color:#fff;margin-bottom:14px;}
.hds-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}
.hds-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.hds-stat{text-align:center;}
.hds-val{font-family:'DM Mono',monospace;font-size:16px;font-weight:500;}
.hds-lbl{font-size:10px;opacity:0.6;margin-top:2px;}

/* ─── DETTES ─── */
.dettes-summary{background:linear-gradient(135deg,#E53935 0%,#B71C1C 100%);border-radius:var(--r);padding:18px;box-shadow:0 4px 20px rgba(229,57,53,0.25);color:#fff;}
.dettes-summary-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
.dettes-title-row{display:flex;align-items:center;gap:8px;}
.dettes-icon{font-size:22px;}
.dettes-main-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;}
.dettes-alerte{background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;}
.dettes-total{font-family:'DM Mono',monospace;font-size:26px;font-weight:500;letter-spacing:-0.5px;}
.dettes-total-lbl{font-size:11px;opacity:0.7;margin-top:2px;}
.dettes-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}
.dette-stat{background:rgba(255,255,255,0.15);border-radius:var(--r-sm);padding:8px 10px;text-align:center;}
.dette-stat-val{font-family:'DM Mono',monospace;font-size:14px;font-weight:500;}
.dette-stat-lbl{font-size:9px;opacity:0.65;margin-top:2px;text-transform:uppercase;letter-spacing:0.4px;}

.dettes-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;}
.dettes-filters::-webkit-scrollbar{display:none;}
.dette-filter{flex-shrink:0;padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.dette-filter.active{background:var(--rouge);border-color:var(--rouge);color:#fff;}

.client-dette-card{background:var(--card);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden;border-left:4px solid var(--rouge);transition:box-shadow 0.2s;}
.client-dette-card.urgent{border-left-color:var(--rouge);}
.client-dette-card.normal{border-left-color:var(--or);}
.client-dette-card.recent{border-left-color:var(--vb3);}
.cdc-header{display:flex;align-items:center;gap:12px;padding:14px 16px 10px;cursor:pointer;}
.cdc-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;font-family:'Syne',sans-serif;flex-shrink:0;}
.cdc-info{flex:1;min-width:0;}
.cdc-name{font-size:14px;font-weight:700;font-family:'Syne',sans-serif;}
.cdc-meta{display:flex;align-items:center;gap:8px;margin-top:3px;flex-wrap:wrap;}
.cdc-tel{font-size:11px;color:var(--txt2);display:flex;align-items:center;gap:3px;}
.cdc-statut{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;}
.statut-urgent{background:#FFEBEE;color:var(--rouge);}
.statut-normal{background:#FFF8E1;color:#F57F17;}
.statut-recent{background:#E8F5E9;color:#2E7D32;}
.cdc-right{text-align:right;flex-shrink:0;}
.cdc-montant{font-family:'DM Mono',monospace;font-size:16px;font-weight:500;color:var(--rouge);}
.cdc-since{font-size:10px;color:var(--txt3);margin-top:2px;}
.cdc-chevron{font-size:14px;color:var(--txt3);transition:transform 0.2s;flex-shrink:0;}
.cdc-chevron.open{transform:rotate(90deg);}
.cdc-body{display:none;padding:0 16px 14px;border-top:1px solid var(--border);flex-direction:column;gap:10px;}
.cdc-body.open{display:flex;}
.cdc-hist-title{font-size:11px;font-weight:600;color:var(--txt2);text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;}
.cdc-hist-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed var(--border);}
.cdc-hist-row:last-child{border-bottom:none;}
.cdc-hist-date{font-size:11px;color:var(--txt3);}
.cdc-hist-items{font-size:12px;color:var(--txt2);flex:1;padding:0 8px;}
.cdc-hist-amt{font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--txt);}
.cdc-actions{display:flex;gap:8px;margin-top:4px;}
.cdc-btn{flex:1;padding:9px 8px;border-radius:var(--r-sm);font-size:12px;font-weight:600;font-family:'Syne',sans-serif;cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;gap:5px;transition:all 0.15s;}
.cdc-btn:active{opacity:0.8;transform:scale(0.97);}
.cdc-btn.whatsapp{background:#25D366;color:#fff;}
.cdc-btn.paiement{background:var(--vb);color:#fff;}
.cdc-btn.relance{background:var(--vb5);color:var(--vb2);border:1.5px solid var(--vb4);}
.cdc-progress-wrap{margin-top:2px;}
.cdc-progress-lbl{display:flex;justify-content:space-between;font-size:10px;color:var(--txt3);margin-bottom:4px;}
.cdc-progress-bar{height:6px;background:var(--bg);border-radius:3px;overflow:hidden;}
.cdc-progress-fill{height:6px;border-radius:3px;background:var(--vb3);}

.tooltip{position:fixed;background:var(--txt);color:#fff;font-size:11px;padding:5px 10px;border-radius:8px;pointer-events:none;z-index:50;display:none;font-family:'DM Mono',monospace;white-space:nowrap;}

.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--card);border-top:1px solid var(--border);display:flex;padding:10px 0 calc(10px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(46,92,62,0.08);z-index:10;}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;transition:opacity 0.15s;}
.nav-item:active{opacity:0.6;}
.nav-icon{font-size:20px;line-height:1;}
.nav-lbl{font-size:10px;color:var(--txt3);font-weight:500;}
.nav-item.active .nav-lbl{color:var(--vb);font-weight:700;}

.modal-overlay{position:fixed;inset:0;background:rgba(30,60,35,0.5);backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center;z-index:100;}
.modal-overlay.show{display:flex;}
.modal-sheet{background:var(--card);border-radius:24px 24px 0 0;padding:20px 20px 40px;width:100%;max-width:430px;animation:slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1);}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px;}
.modal-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:4px;}
.modal-sub{font-size:12px;color:var(--txt2);margin-bottom:16px;}
.modal-client-row{display:flex;align-items:center;gap:10px;background:var(--bg);border-radius:var(--r-sm);padding:10px 12px;margin-bottom:14px;}
.modal-amount-input{position:relative;margin-bottom:12px;}
.modal-amount-input input{width:100%;padding:14px 16px 14px 40px;border-radius:var(--r-sm);border:2px solid var(--border);font-size:18px;font-family:'DM Mono',monospace;font-weight:500;color:var(--txt);background:var(--bg);outline:none;transition:border-color 0.2s;}
.modal-amount-input input:focus{border-color:var(--vb3);}
.modal-currency{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-family:'DM Mono',monospace;font-size:16px;color:var(--txt3);}
.modal-mode-tabs{display:flex;gap:8px;margin-bottom:14px;}
.modal-mode{flex:1;padding:10px 6px;border-radius:var(--r-sm);border:2px solid var(--border);background:var(--bg);text-align:center;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.15s;}
.modal-mode.active{border-color:var(--vb);background:var(--vb5);color:var(--vb2);}
.modal-confirm{width:100%;padding:14px;background:var(--vb);color:#fff;border:none;border-radius:var(--r);font-family:'Syne',sans-serif;font-size:15px;font-weight:800;cursor:pointer;transition:all 0.2s;}
.modal-confirm:hover{background:var(--vb2);}

/* Export CSV popup */
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--txt);color:#fff;padding:10px 20px;border-radius:30px;font-size:12px;font-family:'DM Mono',monospace;z-index:200;display:none;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.2);}
.toast.show{display:block;animation:toastIn 0.3s ease;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

@media print {
  body{max-width:100%;height:auto;overflow:visible;background:#fff;}
  .statusbar,.topbar,.main-tabs,.bottom-nav,.modal-overlay,.evo-export-btn,.evo-period-tabs,.evo-toggle,.scroll-body .tab-content:not(.active),.heatmap-card,.ventes-aujourd-card,.top-prods-card{display:none!important;}
  .scroll-body{overflow:visible;padding:0;height:auto;}
  .tab-content.active{display:flex!important;}
  .evo-card{box-shadow:none;border:1px solid #e0e0e0;page-break-inside:avoid;}
  .pdf-header{display:block!important;}
  .pdf-footer{display:block!important;}
}
.pdf-header{display:none;background:var(--vb2);color:#fff;padding:20px 24px;border-radius:var(--r) var(--r) 0 0;}
.pdf-header-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;}
.pdf-header-sub{font-size:12px;opacity:0.7;margin-top:4px;}
.pdf-footer{display:none;text-align:center;font-size:10px;color:var(--txt3);padding:16px;border-top:1px solid var(--border);}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.evo-card,.heatmap-card,.ventes-aujourd-card,.top-prods-card,.historique-card,.dettes-summary,.client-dette-card{animation:fadeUp 0.3s ease both;}
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
      <div class="kpi-period-lbl" id="k-period-lbl">30 derniers jours</div>
    </div>
    <div class="kpi-card" id="kpi-nb-card">
      <div class="kpi-val" id="k-nb">47</div>
      <div class="kpi-lbl" id="k-nb-lbl">Ventes</div>
      <div class="kpi-delta up" id="k-nb-delta">↑ +8%</div>
    </div>
    <div class="kpi-card" style="background:rgba(229,57,53,0.25);border-color:rgba(229,57,53,0.3);">
      <div class="kpi-val" id="k-dettes">127 400</div>
      <div class="kpi-lbl">Dettes</div>
      <div class="kpi-delta down">↑ 9 clients</div>
    </div>
  </div>
</div>

<div class="main-tabs">
  <div class="main-tab active" onclick="switchTab('ventes',this)">📊 Ventes</div>
  <div class="main-tab" onclick="switchTab('historique',this)">📋 Historique</div>
  <div class="main-tab" onclick="switchTab('dettes',this)">⚠️ Dettes <span class="tab-badge" id="dettes-badge">9</span></div>
</div>

<div class="tooltip" id="tooltip"></div>
<div class="toast" id="toast"></div>

<div class="scroll-body">

  <!-- ── ONGLET VENTES ── -->
  <div class="tab-content active" id="tab-ventes">

    <div class="evo-card" id="evo-widget">
      <div class="pdf-header">
        <div class="pdf-header-title">Mafro — Rapport des ventes</div>
        <div class="pdf-header-sub" id="pdf-header-sub">Évolution des revenus · 30 derniers jours</div>
      </div>

      <div class="evo-controls">
        <div class="evo-period-tabs">
          <button class="evo-period-tab" onclick="setPeriod('7j',this)">7J</button>
          <button class="evo-period-tab active" onclick="setPeriod('30j',this)">30J</button>
          <button class="evo-period-tab" onclick="setPeriod('mois',this)">MOIS</button>
          <button class="evo-period-tab" onclick="setPeriod('annee',this)">ANNÉE</button>
        </div>
        <button class="evo-export-btn" onclick="exportData()">
          <span>↓</span> EXPORTER
        </button>
      </div>

      <div class="evo-kpi">
        <div class="evo-label" id="evo-label-txt">ÉVOLUTION DES REVENUS — 30J</div>
        <div class="evo-total" id="evo-total">4 280 000 F</div>
        <div class="evo-delta"><span>▲</span> <span id="evo-delta-val">12,5%</span> VS PÉRIODE PRÉCÉDENTE</div>
      </div>

      <div class="evo-toggle">
        <div class="evo-toggle-group">
          <button class="evo-toggle-btn" onclick="setVue('global',this)">GLOBAL</button>
          <button class="evo-toggle-btn active" onclick="setVue('boutique',this)">PAR BOUTIQUE</button>
        </div>
      </div>

      <div class="evo-legend" id="evo-legend"></div>

      <div class="evo-chart-wrap" style="position:relative;">
        <div style="position:relative;width:100%;height:180px;">
          <canvas id="evo-chart" role="img" aria-label="Graphique d'évolution des revenus"></canvas>
        </div>
        <div class="evo-tooltip" id="evo-tooltip"></div>
      </div>

      <div class="pdf-footer">Généré par Mafro · <span id="pdf-date"></span></div>
    </div>

    <!-- Heatmap -->
    <div class="heatmap-card">
      <div class="section-head"><span class="section-title">🕐 Activité par heure</span></div>
      <div class="heatmap-grid" id="heatmap-grid"></div>
      <div class="heatmap-labels" id="heatmap-labels"></div>
    </div>

    <!-- Ventes d'aujourd'hui (anciennement vendeurs) -->
    <div class="ventes-aujourd-card">
      <div class="va-title-row">
        <span class="section-title">🛒 Ventes d'aujourd'hui</span>
        <span class="va-date-badge" id="va-date-badge">28 avr</span>
      </div>
      <div id="ventes-aujourd-list"></div>
    </div>

    <!-- Top produits -->
    <div class="top-prods-card">
      <div class="section-head" style="margin-bottom:8px"><span class="section-title">🔥 Top produits</span><span class="section-link">Tout voir</span></div>
      <div id="top-prods"></div>
    </div>
  </div>

  <!-- ── ONGLET HISTORIQUE ── -->
  <div class="tab-content" id="tab-historique">

    <!-- Résumé du jour -->
    <div class="hist-day-summary">
      <div class="hds-title">📅 Aujourd'hui · 28 avril 2026</div>
      <div class="hds-stats">
        <div class="hds-stat"><div class="hds-val" id="hds-ca">68 750</div><div class="hds-lbl">CA (FCFA)</div></div>
        <div class="hds-stat"><div class="hds-val" id="hds-tx">8</div><div class="hds-lbl">Transactions</div></div>
        <div class="hds-stat"><div class="hds-val" id="hds-panier">8 594</div><div class="hds-lbl">Panier moy.</div></div>
      </div>
    </div>

    <div class="historique-card">
      <div class="section-head" style="margin-bottom:10px">
        <span class="section-title">📋 Transactions détaillées</span>
        <span class="section-link" onclick="exportCSV()">⬇ CSV</span>
      </div>
      <div class="search-bar">
        <span style="color:var(--txt3);font-size:14px">🔍</span>
        <input type="text" placeholder="Client, produit, vendeur…" id="hist-search" oninput="filterHist()"/>
      </div>
      <div id="hist-list"></div>
    </div>
  </div>

  <!-- ── ONGLET DETTES ── -->
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
      <div class="dette-filter active" onclick="filterDettes('tous',this)">Tous (9)</div>
      <div class="dette-filter" onclick="filterDettes('urgent',this)">🔴 Urgents (3)</div>
      <div class="dette-filter" onclick="filterDettes('normal',this)">🟡 Normaux (4)</div>
      <div class="dette-filter" onclick="filterDettes('recent',this)">🟢 Récents (2)</div>
    </div>
    <div class="search-bar" style="margin-bottom:0;">
      <span style="color:var(--txt3);font-size:14px">🔍</span>
      <input type="text" placeholder="Chercher un client…" id="dettes-search" oninput="filterDettesSearch()"/>
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

<div class="modal-overlay" id="modal-paiement">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Enregistrer un paiement</div>
    <div class="modal-sub" id="modal-sub">Remboursement de dette</div>
    <div class="modal-client-row">
      <div class="cdc-avatar" id="modal-avatar" style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-family:'Syne',sans-serif;"></div>
      <div>
        <div style="font-size:13px;font-weight:600;" id="modal-client-name"></div>
        <div style="font-size:11px;color:var(--txt3);">Dette restante : <span id="modal-dette-restante" style="font-family:'DM Mono',monospace;color:var(--rouge);font-weight:600;"></span></div>
      </div>
    </div>
    <div class="modal-amount-input">
      <span class="modal-currency">₣</span>
      <input type="number" id="modal-amount" placeholder="Montant reçu"/>
    </div>
    <div class="modal-mode-tabs">
      <div class="modal-mode active" onclick="setModalMode('especes',this)">💵 Espèces</div>
      <div class="modal-mode" onclick="setModalMode('mobile',this)">📱 Mobile</div>
      <div class="modal-mode" onclick="setModalMode('cheque',this)">📝 Chèque</div>
    </div>
    <button class="modal-confirm" onclick="confirmPaiement()">✅ Confirmer le paiement</button>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script>
/* ════════════════════════════════════════════
   DONNÉES BOUTIQUES & GRAPHIQUE
════════════════════════════════════════════ */
const BOUTIQUES = [
  { name:"Akpakpa",   color:"#22C55E", dash:[] },
  { name:"Zogbadjè",  color:"#3B82F6", dash:[6,3] },
  { name:"Cadjehoun", color:"#F5A623", dash:[4,4] },
  { name:"Fidjrossè", color:"#EF4444", dash:[2,2] },
];

// Pour chaque période, chaque point a aussi un nb de ventes estimé
const PERIODE_DATA = {
  "7j": {
    labels:["LUN","MAR","MER","JEU","VEN","SAM","DIM"],
    total:"1 038 000", delta:"12,5%", subtitle:"7 derniers jours",
    kpinb:"312",
    // ventes estimées par jour
    ventesParPoint:[38,42,51,44,55,62,60],
    boutiques:[
      [960,800,1100,970,1200,1310,1260],
      [700,900,700,620,820,850,920],
      [550,580,860,650,830,850,800],
      [400,470,540,610,680,700,700],
    ],
    global:[2610,2750,3200,2850,3530,3710,3680],
  },
  "30j": {
    labels: Array.from({length:30},(_,i)=>"J"+(i+1)),
    total:"4 280 000", delta:"12,5%", subtitle:"30 derniers jours",
    kpinb:"1 240",
    ventesParPoint:[38,46,49,48,37,42,41,35,32,37,34,39,43,41,37,44,42,39,36,47,43,42,37,41,43,40,38,37,24,26],
    boutiques:[
      [960,1170,1260,1230,960,1080,1060,900,820,940,880,1000,1100,1050,960,1120,1090,1000,930,1200,1100,1080,960,1050,1100,1030,980,960,620,660],
      [780,850,860,870,640,720,740,600,540,660,620,700,770,740,680,780,760,700,660,840,770,760,680,740,770,720,690,680,440,480],
      [600,680,640,770,440,520,560,400,360,480,440,520,580,560,500,580,560,500,460,640,580,560,500,560,580,540,500,480,320,360],
      [400,460,500,440,300,340,360,240,200,320,280,320,360,340,300,360,340,300,260,400,360,340,300,340,360,320,280,280,180,220],
    ],
    global:[2740,3160,3260,3310,2340,2660,2720,2140,1920,2400,2220,2540,2810,2690,2440,2840,2750,2500,2310,3080,2810,2740,2440,2690,2810,2610,2450,2400,1560,1720],
  },
  "mois": {
    labels:["SEM. 1","SEM. 2","SEM. 3","SEM. 4"],
    total:"4 280 000", delta:"8%", subtitle:"Ce mois par semaine",
    kpinb:"1 240",
    ventesParPoint:[280,310,370,280],
    boutiques:[
      [7200,8100,9000,8700],
      [5400,6075,6750,6525],
      [4800,5400,6000,5800],
      [2400,2700,2900,2800],
    ],
    global:[19800,22275,24650,23825],
  },
  "annee": {
    labels:["JAN","FÉV","MAR","AVR","MAI","JUN","JUL","AOÛ","SEP","OCT","NOV","DÉC"],
    total:"51 360 000", delta:"18%", subtitle:"Cette année par mois",
    kpinb:"14 880",
    ventesParPoint:[1100,1010,1350,1380,1260,1470,1570,1430,1310,1500,1540,1560],
    boutiques:[
      [14400,13200,15800,16200,14800,17200,18400,16800,15400,17600,18000,18200],
      [10800,9900,11850,12150,11100,12900,13800,12600,11550,13200,13500,13650],
      [9000,8250,9875,10125,9250,10750,11500,10500,9625,11000,11250,11375],
      [6000,5500,6583,6750,6167,7167,7667,7000,6417,7333,7500,7583],
    ],
    global:[40200,36850,44108,45225,41317,48017,51367,46900,43492,49133,50250,50808],
  },
};

let currentPeriod = "30j";
let currentVue = "boutique";
let chartInstance = null;
let selectedPointIndex = null;

/* ─── RENDU GRAPHIQUE ─── */
function buildDatasets(period, vue) {
  const d = PERIODE_DATA[period];
  if (vue === "global") {
    return [{
      label:"Global", data:d.global,
      borderColor:"#4A7C59", backgroundColor:"rgba(74,124,89,0.08)",
      borderWidth:2.5, tension:0.45, fill:true,
      pointBackgroundColor:"#4A7C59", pointRadius:4, pointHoverRadius:7,
      pointBorderColor:"#fff", pointBorderWidth:2, borderDash:[],
    }];
  }
  return BOUTIQUES.map((b,i) => ({
    label:b.name, data:d.boutiques[i],
    borderColor:b.color, backgroundColor:"transparent",
    borderWidth:2, tension:0.45, fill:false,
    pointBackgroundColor:"#fff", pointBorderColor:b.color,
    pointBorderWidth:2, pointRadius:4, pointHoverRadius:7,
    borderDash:b.dash,
  }));
}

function renderLegend(vue) {
  const leg = document.getElementById("evo-legend");
  if (vue === "global") {
    leg.innerHTML = `<div class="evo-legend-item"><div class="evo-legend-line" style="background:#4A7C59"></div>Toutes boutiques</div>`;
    return;
  }
  leg.innerHTML = BOUTIQUES.map(b =>
    `<div class="evo-legend-item"><div class="evo-legend-line" style="background:${b.color}"></div>${b.name}</div>`
  ).join("");
}

function formatY(v) {
  if (v >= 1000000) return (v/1000000).toFixed(1)+"M";
  if (v >= 1000) return Math.round(v/100)/10+"k";
  return v;
}

function updateKpiForPoint(idx) {
  const d = PERIODE_DATA[currentPeriod];
  if (idx === null) {
    // Revenir aux totaux de période
    document.getElementById("k-ca").textContent = d.total;
    document.getElementById("k-ca-lbl").textContent = "CA (FCFA)";
    document.getElementById("k-period-lbl").textContent = d.subtitle;
    document.getElementById("k-nb").textContent = d.kpinb;
    document.getElementById("k-nb-lbl").textContent = "Ventes";
    document.getElementById("k-nb-delta").textContent = "↑ +8%";
    document.getElementById("k-ca-delta").textContent = "↑ +"+d.delta;
    document.getElementById("kpi-ca-card").classList.remove("kpi-highlight");
    document.getElementById("kpi-nb-card").classList.remove("kpi-highlight");
    return;
  }
  // Point sélectionné
  const label = d.labels[idx];
  const ca = currentVue === "global"
    ? d.global[idx]
    : d.boutiques.reduce((s,b) => s + b[idx], 0);
  const nb = d.ventesParPoint[idx];

  document.getElementById("k-ca").textContent = ca.toLocaleString("fr-FR");
  document.getElementById("k-ca-lbl").textContent = "CA · "+label;
  document.getElementById("k-period-lbl").textContent = "Point sélectionné";
  document.getElementById("k-nb").textContent = nb;
  document.getElementById("k-nb-lbl").textContent = "Ventes · "+label;
  document.getElementById("k-nb-delta").textContent = nb+" transactions";
  document.getElementById("k-ca-delta").textContent = ca.toLocaleString("fr-FR")+" FCFA";
  document.getElementById("kpi-ca-card").classList.add("kpi-highlight");
  document.getElementById("kpi-nb-card").classList.add("kpi-highlight");
}

function renderChart() {
  const d = PERIODE_DATA[currentPeriod];
  selectedPointIndex = null;
  const datasets = buildDatasets(currentPeriod, currentVue);

  document.getElementById("evo-total").textContent = d.total + " F";
  document.getElementById("evo-delta-val").textContent = d.delta;
  document.getElementById("pdf-header-sub").textContent = "Évolution des revenus · " + d.subtitle;
  document.getElementById("evo-label-txt").textContent = "ÉVOLUTION DES REVENUS — " + currentPeriod.toUpperCase();

  // Reset KPIs
  document.getElementById("k-ca").textContent = d.total;
  document.getElementById("k-ca-lbl").textContent = "CA (FCFA)";
  document.getElementById("k-period-lbl").textContent = d.subtitle;
  document.getElementById("k-nb").textContent = d.kpinb;
  document.getElementById("k-nb-lbl").textContent = "Ventes";
  document.getElementById("k-ca-delta").textContent = "↑ +" + d.delta;
  document.getElementById("k-nb-delta").textContent = "↑ +8%";
  document.getElementById("kpi-ca-card").classList.remove("kpi-highlight");
  document.getElementById("kpi-nb-card").classList.remove("kpi-highlight");

  renderLegend(currentVue);

  const ctx = document.getElementById("evo-chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type:"line",
    data:{ labels:d.labels, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:"index", intersect:false },
      onClick(event, elements) {
        if (!elements.length) return;
        const idx = elements[0].index;
        selectedPointIndex = idx;
        updateKpiForPoint(idx);
        // Mettre à jour le total affiché
        const ca = currentVue === "global"
          ? d.global[idx]
          : d.boutiques.reduce((s,b) => s + b[idx], 0);
        document.getElementById("evo-total").textContent = ca.toLocaleString("fr-FR") + " F ("+d.labels[idx]+")";
      },
      plugins:{
        legend:{ display:false },
        tooltip:{
          enabled:false,
          external(context) {
            const tip = document.getElementById("evo-tooltip");
            if (context.tooltip.opacity === 0) { tip.style.display="none"; return; }
            const t = context.tooltip;
            const label = t.title[0] || "";
            const idx = t.dataPoints[0]?.dataIndex ?? null;
            const nb = idx !== null ? d.ventesParPoint[idx] : "";
            const rows = t.dataPoints.map(dp => {
              const b = currentVue==="global" ? {name:"Global",color:"#4A7C59"} : BOUTIQUES[dp.datasetIndex];
              return `<div class="evo-tooltip-row">
                <div style="display:flex;align-items:center;gap:5px;">
                  <div class="evo-tooltip-dot" style="background:${b.color}"></div>
                  <span class="evo-tooltip-name">${b.name}</span>
                </div>
                <span class="evo-tooltip-val">${Number(dp.raw).toLocaleString("fr-FR")}</span>
              </div>`;
            }).join("");
            tip.innerHTML = `<div class="evo-tooltip-label">${label}</div>${rows}<div class="evo-tooltip-hint">🖱 Cliquer pour filtrer</div>`;
            tip.style.display = "block";
            const pos = context.chart.canvas.getBoundingClientRect();
            let x = t.caretX + 12;
            if (x + 150 > pos.width) x = t.caretX - 158;
            tip.style.left = x + "px";
            tip.style.top = Math.max(0, t.caretY - 20) + "px";
          }
        }
      },
      scales:{
        x:{
          grid:{ display:false },
          ticks:{
            font:{ family:"'DM Mono',monospace", size:10 },
            color:"#9AB0A0", maxRotation:0, autoSkip:true,
            maxTicksLimit:currentPeriod==="30j"?8:currentPeriod==="mois"?4:12,
          },
          border:{ display:false },
        },
        y:{
          grid:{ color:"rgba(74,124,89,0.07)", lineWidth:1 },
          ticks:{
            font:{ family:"'DM Mono',monospace", size:10 },
            color:"#9AB0A0",
            callback:v => formatY(v),
          },
          border:{ display:false },
        }
      }
    }
  });
}

function setPeriod(p, el) {
  currentPeriod = p;
  document.querySelectorAll(".evo-period-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  renderChart();
}

function setVue(v, el) {
  currentVue = v;
  document.querySelectorAll(".evo-toggle-btn").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  renderChart();
}

/* ─── EXPORT CSV ─── */
function exportData() {
  const d = PERIODE_DATA[currentPeriod];
  let csv = "Période;Label;";
  if (currentVue === "global") {
    csv += "CA Total;Ventes\n";
    d.labels.forEach((l,i) => {
      csv += `${d.subtitle};${l};${d.global[i]};${d.ventesParPoint[i]}\n`;
    });
  } else {
    csv += BOUTIQUES.map(b=>b.name).join(";") + ";Total;Ventes\n";
    d.labels.forEach((l,i) => {
      const row = BOUTIQUES.map((_,bi) => d.boutiques[bi][i]).join(";");
      const total = BOUTIQUES.reduce((s,_,bi) => s + d.boutiques[bi][i], 0);
      csv += `${d.subtitle};${l};${row};${total};${d.ventesParPoint[i]}\n`;
    });
  }
  const blob = new Blob(["\ufeff"+csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `mafro-ventes-${currentPeriod}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast("✅ Export CSV téléchargé !");
}

function exportCSV() { exportData(); }

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ─── TABS ─── */
function switchTab(tab, el) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".main-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-"+tab).classList.add("active");
  el.classList.add("active");
}

/* ─── HEATMAP ─── */
const HEATMAP_DATA = [2,5,12,18,10,14,20,9,8,0,0,0];
const HEATMAP_HOURS = ["8h","9h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h"];

function drawHeatmap() {
  const max = Math.max(...HEATMAP_DATA.filter(v=>v>0));
  document.getElementById("heatmap-grid").innerHTML = HEATMAP_DATA.map((v,i) => {
    const alpha = Math.max(0.08, max>0 ? v/max : 0);
    return `<div class="heatmap-cell" style="background:rgba(74,124,89,${alpha});" onmouseenter="showTip(event,'${HEATMAP_HOURS[i]}: ${v} ventes')" onmouseleave="hideTip()"></div>`;
  }).join("");
  document.getElementById("heatmap-labels").innerHTML = HEATMAP_HOURS.map(l =>
    `<div class="heatmap-lbl">${l}</div>`).join("");
}

/* ════════════════════════════════════════════
   TRANSACTIONS DÉTAILLÉES (source unique)
   Utilisées dans Ventes + Historique
════════════════════════════════════════════ */
const TRANSACTIONS = [
  {
    id:"TX001", heure:"15:42", client:"Aminata Diallo", initials:"AD",
    col:"#C8E6C9", tcol:"#2E5C3E", mode:"especes",
    vendeur:"Mme Koussou", boutique:"Akpakpa",
    produits:[
      {emoji:"🌾", nom:"Riz parfumé 5kg",   qte:2, pu:4500, total:9000},
      {emoji:"🫙", nom:"Huile palme 1L",     qte:1, pu:1200, total:1200},
      {emoji:"🧴", nom:"Savon OMO 500g",     qte:2, pu:1100, total:2200},
    ],
    montant:12400,
  },
  {
    id:"TX002", heure:"15:31", client:"Client anonyme", initials:"🧑",
    col:"#ECEFF1", tcol:"#546E7A", mode:"mobile",
    vendeur:"M. Tossou", boutique:"Zogbadjè",
    produits:[
      {emoji:"🥤", nom:"Coca-Cola 33cl", qte:4, pu:500, total:2000},
      {emoji:"💧", nom:"Eau Awa 1,5L",   qte:2, pu:300, total:600},
    ],
    montant:2600,
  },
  {
    id:"TX003", heure:"15:18", client:"Kouassi Martin", initials:"KM",
    col:"#BBDEFB", tcol:"#1976D2", mode:"especes",
    vendeur:"Mme Koussou", boutique:"Akpakpa",
    produits:[
      {emoji:"🌾", nom:"Riz parfumé 5kg",   qte:1, pu:4500, total:4500},
      {emoji:"🥤", nom:"Coca-Cola 33cl",     qte:6, pu:500,  total:3000},
      {emoji:"💧", nom:"Eau Awa 1,5L",       qte:4, pu:300,  total:1200},
    ],
    montant:8700,
  },
  {
    id:"TX004", heure:"14:55", client:"Fatou Traoré", initials:"FT",
    col:"#E1BEE7", tcol:"#7B1FA2", mode:"credit",
    vendeur:"M. Dossou", boutique:"Cadjehoun",
    produits:[
      {emoji:"🥛", nom:"Lait Vache 1L",         qte:2, pu:900,  total:1800},
      {emoji:"🧀", nom:"Fromage fondu ×8",       qte:1, pu:1200, total:1200},
      {emoji:"🌾", nom:"Riz parfumé 5kg",        qte:1, pu:4500, total:4500},
    ],
    montant:7500,
  },
  {
    id:"TX005", heure:"14:32", client:"Client anonyme", initials:"🧑",
    col:"#ECEFF1", tcol:"#546E7A", mode:"mobile",
    vendeur:"Mme Koussou", boutique:"Akpakpa",
    produits:[
      {emoji:"🍬", nom:"Bonbons assortis", qte:3, pu:250, total:750},
      {emoji:"💧", nom:"Eau Awa 1,5L",    qte:2, pu:300, total:600},
    ],
    montant:1350,
  },
  {
    id:"TX006", heure:"14:10", client:"Ibrahim Sanogo", initials:"IS",
    col:"#FFE0B2", tcol:"#E65100", mode:"especes",
    vendeur:"M. Tossou", boutique:"Zogbadjè",
    produits:[
      {emoji:"🌾", nom:"Riz parfumé 5kg",  qte:3, pu:4500, total:13500},
      {emoji:"🫙", nom:"Huile palme 1L",   qte:2, pu:1200, total:2400},
      {emoji:"🥤", nom:"Coca-Cola 33cl",   qte:12,pu:500,  total:6000},
    ],
    montant:21900,
  },
  {
    id:"TX007", heure:"13:48", client:"Aminata Diallo", initials:"AD",
    col:"#C8E6C9", tcol:"#2E5C3E", mode:"especes",
    vendeur:"M. Dossou", boutique:"Cadjehoun",
    produits:[
      {emoji:"🧴", nom:"Détergent Ariel", qte:2, pu:1500, total:3000},
      {emoji:"🧽", nom:"Éponge ×3",       qte:1, pu:450,  total:450},
      {emoji:"🫧", nom:"Javel 1L",        qte:2, pu:600,  total:1200},
    ],
    montant:4650,
  },
  {
    id:"TX008", heure:"13:20", client:"Moussa Kaboré", initials:"MK",
    col:"#F0F4C3", tcol:"#827717", mode:"mobile",
    vendeur:"Mme Koussou", boutique:"Akpakpa",
    produits:[
      {emoji:"🌾", nom:"Riz parfumé 5kg",  qte:1, pu:4500, total:4500},
      {emoji:"🥤", nom:"Jus Tchamba 1L",   qte:4, pu:800,  total:3200},
      {emoji:"🍪", nom:"Biscuits assortis",qte:3, pu:400,  total:1200},
    ],
    montant:8900,
  },
];

/* Calcul stats du jour */
const totalCA = TRANSACTIONS.reduce((s,t) => s+t.montant, 0);
const nbTx = TRANSACTIONS.length;
const panierMoyen = Math.round(totalCA / nbTx);
document.getElementById("hds-ca").textContent = totalCA.toLocaleString("fr-FR");
document.getElementById("hds-tx").textContent = nbTx;
document.getElementById("hds-panier").textContent = panierMoyen.toLocaleString("fr-FR");

/* ─── VENTES D'AUJOURD'HUI (onglet Ventes) ─── */
function renderVentesAujourd() {
  const mb = {especes:"badge-esp", mobile:"badge-mob", credit:"badge-cred"};
  const ml = {especes:"Espèces", mobile:"Mobile", credit:"Crédit"};
  document.getElementById("ventes-aujourd-list").innerHTML = TRANSACTIONS.map(t => {
    const resumeProduits = t.produits.map(p => p.emoji + p.nom.split(" ")[0]).join(", ");
    return `
    <div class="vente-du-jour-row">
      <div class="vdj-avatar" style="background:${t.col};color:${t.tcol}">${t.initials}</div>
      <div class="vdj-info">
        <div class="vdj-client">${t.client}</div>
        <div class="vdj-prods">${resumeProduits}</div>
      </div>
      <div class="vdj-right">
        <div class="vdj-montant">${t.montant.toLocaleString("fr-FR")} F</div>
        <div class="vdj-heure">${t.heure}</div>
        <span class="vdj-mode-badge ${mb[t.mode]}">${ml[t.mode]}</span>
      </div>
    </div>`;
  }).join("");
}

/* ─── TOP PRODUITS ─── */
const PRODUITS = [
  {name:"Riz parfumé 5kg",emoji:"🌾",units:38,rev:171000,trend:"+22%",up:true},
  {name:"Coca-Cola 33cl", emoji:"🥤",units:94,rev:47000, trend:"+8%", up:true},
  {name:"Huile 1L",       emoji:"🫙",units:22,rev:39600, trend:"−5%", up:false},
  {name:"Eau Awa 1,5L",   emoji:"💧",units:65,rev:19500, trend:"+14%",up:true},
  {name:"Savon OMO 500g", emoji:"🧴",units:12,rev:13200, trend:"−2%", up:false},
];

function renderProduits() {
  document.getElementById("top-prods").innerHTML = PRODUITS.map(p =>
    `<div class="prod-row">
      <div class="prod-emoji-wrap">${p.emoji}</div>
      <div class="prod-info">
        <div class="prod-name">${p.name}</div>
        <div class="prod-units">${p.units} unités</div>
      </div>
      <div class="prod-right">
        <div class="prod-rev">${p.rev.toLocaleString("fr-FR")} F</div>
        <div class="prod-trend ${p.up?"up":"down"}">${p.trend}</div>
      </div>
    </div>`
  ).join("");
}

/* ─── HISTORIQUE TRANSACTIONS ─── */
const openTx = new Set();

function renderHist(list) {
  const mb = {especes:"badge-esp", mobile:"badge-mob", credit:"badge-cred"};
  const ml = {especes:"💵 Espèces", mobile:"📱 Mobile", credit:"📝 Crédit"};
  if (!list.length) {
    document.getElementById("hist-list").innerHTML = `<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">Aucune transaction trouvée</div>`;
    return;
  }
  document.getElementById("hist-list").innerHTML = list.map(t => {
    const isOpen = openTx.has(t.id);
    const lignesProduits = t.produits.map(p =>
      `<div class="tx-prod-row">
        <span class="tx-prod-emoji">${p.emoji}</span>
        <span class="tx-prod-name">${p.nom}</span>
        <span class="tx-prod-qty">×${p.qte}</span>
        <span class="tx-prod-price">${p.total.toLocaleString("fr-FR")} F</span>
      </div>`
    ).join("");
    return `
    <div class="tx-card" id="txcard-${t.id}">
      <div class="tx-header" onclick="toggleTx('${t.id}')">
        <div class="tx-avatar" style="background:${t.col};color:${t.tcol}">${t.initials}</div>
        <div class="tx-info">
          <div class="tx-client">${t.client}</div>
          <div class="tx-meta">
            <span class="tx-badge ${mb[t.mode]}">${ml[t.mode]}</span>
            <span>· ${t.boutique}</span>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-montant" style="color:var(--vb2)">${t.montant.toLocaleString("fr-FR")} F</div>
          <div class="tx-heure">${t.heure} · ${t.produits.length} art.</div>
        </div>
        <div class="tx-chevron ${isOpen?"open":""}" id="txchev-${t.id}">›</div>
      </div>
      <div class="tx-detail ${isOpen?"open":""}" id="txbody-${t.id}">
        <div class="tx-detail-title">📦 Produits vendus (dans l'ordre)</div>
        ${lignesProduits}
        <div class="tx-total-row">
          <span class="tx-total-lbl">Total encaissé</span>
          <span class="tx-total-val">${t.montant.toLocaleString("fr-FR")} FCFA</span>
        </div>
        <div class="tx-info-row">
          <span>Vendeur : <strong>${t.vendeur}</strong></span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--txt3);">#${t.id}</span>
        </div>
      </div>
    </div>`;
  }).join("");
}

function toggleTx(id) {
  if (openTx.has(id)) openTx.delete(id);
  else openTx.add(id);
  document.getElementById("txbody-"+id)?.classList.toggle("open");
  document.getElementById("txchev-"+id)?.classList.toggle("open");
}

function filterHist() {
  const q = document.getElementById("hist-search").value.toLowerCase();
  const list = q
    ? TRANSACTIONS.filter(t =>
        t.client.toLowerCase().includes(q) ||
        t.vendeur.toLowerCase().includes(q) ||
        t.boutique.toLowerCase().includes(q) ||
        t.produits.some(p => p.nom.toLowerCase().includes(q)) ||
        t.mode.includes(q) ||
        t.montant.toString().includes(q)
      )
    : TRANSACTIONS;
  renderHist(list);
}

/* ─── DETTES ─── */
const DETTES = [
  {id:1,name:"Koffi Adjobi",initials:"KA",col:"#FFCDD2",tcol:"#C62828",tel:"+229 97 12 34 56",montant:28500,paye:0,statut:"urgent",jours:32,dateCredit:"28 mars 2026",hist:[{date:"28 mars",items:"Riz 5kg × 3, Huile × 2",montant:18500},{date:"12 mars",items:"Farine, Sucre 2kg",montant:10000}]},
  {id:2,name:"Mariam Coulibaly",initials:"MC",col:"#FCE4EC",tcol:"#AD1457",tel:"+229 96 87 65 43",montant:15000,paye:5000,statut:"urgent",jours:21,dateCredit:"7 avr 2026",hist:[{date:"7 avr",items:"Coca ×12, Eau ×6",montant:15000}]},
  {id:3,name:"Sékou Traoré",initials:"ST",col:"#FFF3E0",tcol:"#E65100",tel:"+229 95 44 22 11",montant:22000,paye:8000,statut:"urgent",jours:18,dateCredit:"10 avr 2026",hist:[{date:"10 avr",items:"Savon ×5, Dentifrice ×3",montant:12000},{date:"5 avr",items:"Riz 5kg × 2",montant:10000}]},
  {id:4,name:"Awa Sangaré",initials:"AS",col:"#FFF9C4",tcol:"#F57F17",tel:"+229 94 33 21 00",montant:9500,paye:2000,statut:"normal",jours:11,dateCredit:"17 avr 2026",hist:[{date:"17 avr",items:"Yaourt ×4, Fromage, Lait",montant:9500}]},
  {id:5,name:"Drissa Koné",initials:"DK",col:"#E8EAF6",tcol:"#283593",tel:"+229 93 55 44 33",montant:18200,paye:10000,statut:"normal",jours:9,dateCredit:"19 avr 2026",hist:[{date:"19 avr",items:"Boissons ×20, Snacks",montant:11200},{date:"18 avr",items:"Riz 5kg, Huile 2L",montant:7000}]},
  {id:6,name:"Fatoumata Bah",initials:"FB",col:"#E8F5E9",tcol:"#1B5E20",tel:"+229 92 66 77 88",montant:7200,paye:3200,statut:"normal",jours:8,dateCredit:"20 avr 2026",hist:[{date:"20 avr",items:"Détergent ×3, Éponge ×5",montant:7200}]},
  {id:7,name:"Adama Diallo",initials:"AD",col:"#F3E5F5",tcol:"#6A1B9A",tel:"+229 91 22 33 44",montant:11300,paye:5000,statut:"normal",jours:7,dateCredit:"21 avr 2026",hist:[{date:"21 avr",items:"Pile ×6, Bougie ×4, Allumettes",montant:11300}]},
  {id:8,name:"Rokia Touré",initials:"RT",col:"#E0F7FA",tcol:"#006064",tel:"+229 90 11 22 33",montant:5400,paye:2000,statut:"recent",jours:2,dateCredit:"26 avr 2026",hist:[{date:"26 avr",items:"Jus ×4, Bière ×2",montant:5400}]},
  {id:9,name:"Bamba Kouyaté",initials:"BK",col:"#E0F2F1",tcol:"#004D40",tel:"+229 99 88 77 66",montant:10300,paye:4000,statut:"recent",jours:1,dateCredit:"27 avr 2026",hist:[{date:"27 avr",items:"Riz 5kg × 2, Sucre 1kg",montant:10300}]},
];

let currentDetteFilter = "tous";
const openCards = new Set();
let modalClientId = null;

function filterDettes(f, el) {
  currentDetteFilter = f;
  document.querySelectorAll(".dette-filter").forEach(d => d.classList.remove("active"));
  el.classList.add("active");
  renderDettes();
}

function filterDettesSearch() { renderDettes(); }

function renderDettes() {
  const q = (document.getElementById("dettes-search")||{}).value || "";
  let list = DETTES;
  if (currentDetteFilter !== "tous") list = list.filter(d => d.statut === currentDetteFilter);
  if (q) list = list.filter(d => d.name.toLowerCase().includes(q.toLowerCase()) || d.tel.includes(q));

  document.getElementById("dettes-list").innerHTML = list.map(d => {
    const restant = d.montant - d.paye;
    const pct = Math.round((d.paye/d.montant)*100);
    const statutLabel = {urgent:"🔴 Urgent",normal:"🟡 Normal",recent:"🟢 Récent"}[d.statut];
    const isOpen = openCards.has(d.id);
    return `
    <div class="client-dette-card ${d.statut}" id="card-${d.id}">
      <div class="cdc-header" onclick="toggleCard(${d.id})">
        <div class="cdc-avatar" style="background:${d.col};color:${d.tcol}">${d.initials}</div>
        <div class="cdc-info">
          <div class="cdc-name">${d.name}</div>
          <div class="cdc-meta">
            <span class="cdc-tel">📞 ${d.tel}</span>
            <span class="cdc-statut statut-${d.statut}">${statutLabel}</span>
          </div>
        </div>
        <div class="cdc-right">
          <div class="cdc-montant">${restant.toLocaleString("fr-FR")} F</div>
          <div class="cdc-since">depuis ${d.jours===1?"1 jour":d.jours+" jours"}</div>
        </div>
        <div class="cdc-chevron ${isOpen?"open":""}" id="chev-${d.id}">›</div>
      </div>
      <div class="cdc-body ${isOpen?"open":""}" id="body-${d.id}">
        <div class="cdc-progress-wrap">
          <div class="cdc-progress-lbl"><span>Remboursé : ${d.paye.toLocaleString("fr-FR")} F</span><span>${pct}%</span></div>
          <div class="cdc-progress-bar"><div class="cdc-progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="cdc-hist-title">📦 Historique achats à crédit</div>
        ${d.hist.map(h=>`<div class="cdc-hist-row"><div class="cdc-hist-date">${h.date}</div><div class="cdc-hist-items">${h.items}</div><div class="cdc-hist-amt">${h.montant.toLocaleString("fr-FR")} F</div></div>`).join("")}
        <div class="cdc-actions">
          <button class="cdc-btn whatsapp" onclick="sendWhatsApp(${d.id})">💬 WhatsApp</button>
          <button class="cdc-btn paiement" onclick="openPaiement(${d.id})">💵 Paiement</button>
          <button class="cdc-btn relance" onclick="relance(${d.id},event)">🔔 Relancer</button>
        </div>
      </div>
    </div>`;
  }).join("") || `<div style="text-align:center;padding:40px 20px;color:var(--txt3);font-size:13px;">Aucun client trouvé</div>`;
}

function toggleCard(id) {
  if (openCards.has(id)) openCards.delete(id);
  else openCards.add(id);
  document.getElementById("body-"+id).classList.toggle("open");
  document.getElementById("chev-"+id).classList.toggle("open");
}

function sendWhatsApp(id) {
  const d = DETTES.find(x => x.id===id);
  if (!d) return;
  const restant = d.montant - d.paye;
  const msg = encodeURIComponent(`Bonjour ${d.name.split(' ')[0]} 👋\n\nNous vous rappelons que vous avez une dette de *${restant.toLocaleString("fr-FR")} FCFA* depuis le ${d.dateCredit}.\n\nMerci de régulariser votre situation.\n\n— Mafro Shop 🛒`);
  window.open(`https://wa.me/${d.tel.replace(/\s/g,"")}?text=${msg}`, "_blank");
}

function openPaiement(id) {
  const d = DETTES.find(x => x.id===id);
  if (!d) return;
  modalClientId = id;
  const restant = d.montant - d.paye;
  document.getElementById("modal-avatar").textContent = d.initials;
  document.getElementById("modal-avatar").style.background = d.col;
  document.getElementById("modal-avatar").style.color = d.tcol;
  document.getElementById("modal-client-name").textContent = d.name;
  document.getElementById("modal-dette-restante").textContent = restant.toLocaleString("fr-FR") + " FCFA";
  document.getElementById("modal-sub").textContent = "Crédit depuis le " + d.dateCredit;
  document.getElementById("modal-amount").value = "";
  document.getElementById("modal-paiement").classList.add("show");
}

function relance(id, e) {
  const btn = e.target;
  btn.textContent = "✅ Relancé !";
  btn.style.background = "var(--vb4)";
  btn.style.color = "var(--vb2)";
  setTimeout(() => { btn.textContent = "🔔 Relancer"; btn.style.background = ""; btn.style.color = ""; }, 2000);
}

function confirmPaiement() {
  const d = DETTES.find(x => x.id===modalClientId);
  if (!d) return;
  const amt = parseFloat(document.getElementById("modal-amount").value) || 0;
  if (amt <= 0) { document.getElementById("modal-amount").style.borderColor = "var(--rouge)"; return; }
  d.paye = Math.min(d.paye + amt, d.montant);
  document.getElementById("modal-paiement").classList.remove("show");
  const total = DETTES.reduce((s,x) => s + (x.montant - x.paye), 0);
  document.getElementById("k-dettes").textContent = total.toLocaleString("fr-FR");
  document.getElementById("dettes-total").textContent = total.toLocaleString("fr-FR") + " FCFA";
  openCards.delete(modalClientId);
  renderDettes();
  showToast("✅ Paiement enregistré !");
}

function setModalMode(m, el) {
  document.querySelectorAll(".modal-mode").forEach(x => x.classList.remove("active"));
  el.classList.add("active");
}

document.getElementById("modal-paiement").addEventListener("click", e => {
  if (e.target === document.getElementById("modal-paiement"))
    document.getElementById("modal-paiement").classList.remove("show");
});

function showTip(e, text) {
  const t = document.getElementById("tooltip");
  t.textContent = text; t.style.display = "block";
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  t.style.left = Math.min(x+8, window.innerWidth-160) + "px";
  t.style.top = (y-34) + "px";
}
function hideTip() { document.getElementById("tooltip").style.display = "none"; }

/* ── INIT ── */
renderChart();
drawHeatmap();
renderVentesAujourd();
renderProduits();
renderHist(TRANSACTIONS);
renderDettes();

// Date badge
const today = new Date();
document.getElementById("va-date-badge").textContent =
  today.getDate() + " " + ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"][today.getMonth()];
document.getElementById("pdf-date").textContent = today.toLocaleDateString("fr-FR", {day:"2-digit",month:"long",year:"numeric"});
</script>
</body>
</html>
