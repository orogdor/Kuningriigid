# V131 Godot port 0.9 — elanikud ja ehitajad

### V131 lähtefailid
`builders.js`: `tickBuilders()`, `operateWorker()` — ehitaja veab kuni 24 ühikut (juba tasutud) ehitusmaterjali, seejärel töötab hoone juures; tööline läheb ukseni ja alustab tööd. `navigation.js` määratleb hoone sissepääsud ja takistused; `citizen-routes-v130.js` kasutab korduvaid marsruute.

### Godoti asendus
- `citizen_agents_port.gd`: püsivad Dictionary-agendid, sõltuvus tänavavõrgu adapterist.
- `local_street_nav.gd`: Godoti AStarGrid2D neljasuunaline nav, juba olemas 0.8-st.
- `preview_sim_port.gd`: tootmine ja ehitus hakkavad edenema ainult pärast kohaletoimetamist/kohalejõudmist.
- `native_citizen_view.gd`: MultiMeshInstance3D, ühine renderdus paljudele agentidele.

### Järgmiseks
Kasutada V131 detailkaardi tegelikke mõõte, nav/footprint/market süsteemi ja teha sõltumatu JS/Godot võrdlussimulatsioon identse salvestusolekuga. Praegused lihtsustatud tööagendid pole V131-ga matemaatiliselt üks-ühele võrreldavad.
