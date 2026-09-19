(function(){
  "use strict";

  /* ==========================================================
     CONFIGURAÇÃO — edite aqui antes de publicar em produção
     ========================================================== */
  var CONFIG = {
    firmWhatsApp: "557991546226", // TODO: substituir pelo WhatsApp comercial real (formato 55DDDNUMERO)
    teamPin: "2026",               // código de acesso do painel da equipe (mude quando quiser)
    storageKey: "raiox_leads_v1",

    // Supabase — a "publishable key" é feita para ficar exposta no navegador;
    // a proteção real vem das políticas de RLS da tabela (ver supabase/schema.sql).
    supabaseUrl: "https://mrzqganozvvtgfyjfeeq.supabase.co",
    supabaseKey: "sb_publishable_bvNY7mCWIVvy366bYigtDA_4e6Jkk8Z",
    supabaseTable: "raiox_leads"
  };

  /* ==========================================================
     BASE DE PERGUNTAS — 5 pilares × 2 perguntas cada
     ========================================================== */
  var QUESTIONS = [
    { pillar:"Proteção", text:"Existem regras documentadas para uso de imagem e dados dos alunos?" },
    { pillar:"Proteção", text:"A escola possui protocolo escrito para bullying e cyberbullying?" },
    { pillar:"Conformidade", text:"O contrato educacional foi revisado nos últimos 12 meses?" },
    { pillar:"Conformidade", text:"O PGR e a NR-01 estão atualizados e aplicados à rotina de professores e colaboradores?" },
    { pillar:"IA Responsável", text:"Antes de contratar uma ferramenta de IA, alguém verifica onde os dados ficam armazenados?" },
    { pillar:"IA Responsável", text:"Existe revisão humana sobre decisões geradas por sistemas de IA na escola?" },
    { pillar:"Cultura", text:"A equipe sabe como agir diante de solicitações de pais separados?" },
    { pillar:"Cultura", text:"A coordenação registra formalmente reuniões e conflitos relevantes com famílias?" },
    { pillar:"Governança", text:"Existe alguém formalmente responsável pelas decisões de compliance digital na escola?" },
    { pillar:"Governança", text:"Antes de decisões sensíveis (inclusão, PcD, desligamentos), há consulta jurídica preventiva?" }
  ];

  var PILLAR_META = {
    "Proteção": {
      code:"PR",
      msg:"Como no caso da escola cujas fotos e provas de alunos vazaram por um app \"gratuito\" de correção sem contrato de tratamento de dados."
    },
    "Conformidade": {
      code:"CF",
      msg:"A fiscalização não aceita \"a gente faz\" — ela cobra prova documental. Contrato e PGR desatualizados costumam ser o primeiro ponto verificado."
    },
    "IA Responsável": {
      code:"IA",
      msg:"Como no caso da escola cujo sistema de IA \"previu\" risco de evasão de um aluno e ninguém na gestão soube explicar como."
    },
    "Cultura": {
      code:"CU",
      msg:"Como no grupo de WhatsApp da turma: mesmo sendo extraoficial, quando o problema aparece, a responsabilidade bate na porta da escola."
    },
    "Governança": {
      code:"GV",
      msg:"Sem alguém formalmente responsável por essas decisões, a lei vira papel e a tecnologia vira risco — é a peça que sustenta todas as outras."
    }
  };

  /* ==========================================================
     ESTADO
     ========================================================== */
  var state = {
    answers: new Array(QUESTIONS.length).fill(null),
    current: 0,
    lead: {}
  };

  /* ==========================================================
     UTIL
     ========================================================== */
  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function showView(id){
    $all(".view").forEach(function(v){ v.classList.remove("active"); });
    $("#"+id).classList.add("active");
    window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});
  }
  function escapeHtml(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }
  function digitsOnly(s){ return String(s || "").replace(/\D/g,""); }

  /* ==========================================================
     FLUXO — PERGUNTAS
     ========================================================== */
  function buildProgress(){
    var wrap = $("#qprogress");
    wrap.innerHTML = "";
    QUESTIONS.forEach(function(){
      var seg = document.createElement("span");
      seg.className = "seg";
      seg.innerHTML = "<i></i>";
      wrap.appendChild(seg);
    });
  }

  function renderQuestion(){
    var i = state.current;
    var q = QUESTIONS[i];
    $("#qcount").textContent = "Pergunta " + (i+1) + " de " + QUESTIONS.length;
    $("#qpillar").innerHTML = "<span class=\"mono\">" + PILLAR_META[q.pillar].code + "</span> " + q.pillar;
    $("#question-heading").textContent = q.text;

    var segs = $all(".piece-progress .seg");
    segs.forEach(function(seg, idx){
      seg.classList.remove("done","current");
      if(idx < i) seg.classList.add("done");
      if(idx === i) seg.classList.add("current");
    });
    $("#qprogress").setAttribute("aria-valuenow", i);

    $("#btn-sim").classList.remove("selected");
    $("#btn-nao").classList.remove("selected");
    var ans = state.answers[i];
    if(ans === 1) $("#btn-sim").classList.add("selected");
    if(ans === 0) $("#btn-nao").classList.add("selected");

    $("#btn-back").style.visibility = (i === 0) ? "hidden" : "visible";
    $("#q-help").textContent = (i === QUESTIONS.length - 1) ? "Última pergunta" : "Toque em Sim ou Não para avançar";
  }

  function answerQuestion(val){
    state.answers[state.current] = val;
    if(state.current < QUESTIONS.length - 1){
      state.current++;
      renderQuestion();
    } else {
      showView("view-form");
    }
  }

  $("#btn-sim").addEventListener("click", function(){ answerQuestion(1); });
  $("#btn-nao").addEventListener("click", function(){ answerQuestion(0); });
  $("#btn-back").addEventListener("click", function(){
    if(state.current > 0){ state.current--; renderQuestion(); }
  });
  $("#btn-start").addEventListener("click", function(){
    state.current = 0;
    renderQuestion();
    showView("view-questions");
  });

  /* ==========================================================
     FORMULÁRIO DE LEAD
     ========================================================== */
  function setFieldError(name, invalid){
    var field = document.querySelector('.field[data-field="'+name+'"]');
    if(field) field.classList.toggle("invalid", !!invalid);
  }

  $("#lead-form").addEventListener("submit", function(e){
    e.preventDefault();

    var nome = $("#f-nome").value.trim();
    var escola = $("#f-escola").value.trim();
    var cargo = $("#f-cargo").value;
    var alunos = $("#f-alunos").value;
    var whats = $("#f-whats").value.trim();
    var preoc = $("#f-preoc").value.trim();
    var consent = $("#f-consent").checked;

    var valid = true;
    setFieldError("nome", !nome); if(!nome) valid = false;
    setFieldError("escola", !escola); if(!escola) valid = false;
    setFieldError("cargo", !cargo); if(!cargo) valid = false;
    setFieldError("alunos", !alunos); if(!alunos) valid = false;
    var whatsDigits = digitsOnly(whats);
    setFieldError("whatsapp", whatsDigits.length < 10); if(whatsDigits.length < 10) valid = false;

    $("#consent-error").style.display = consent ? "none" : "block";
    if(!consent) valid = false;

    if(!valid){
      var firstInvalid = document.querySelector(".field.invalid");
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:"smooth", block:"center"});
      return;
    }

    state.lead = {
      nome: nome, escola: escola, cargo: cargo, alunos: alunos,
      whatsapp: whats, whatsappDigits: whatsDigits,
      preocupacao: preoc || "(não informado)"
    };

    computeAndShowResult();
  });

  /* ==========================================================
     CÁLCULO DO ÍNDICE E RESULTADO
     ========================================================== */
  function computeAndShowResult(){
    var total = state.answers.reduce(function(a,b){ return a + b; }, 0);
    var indice = total * 10; // 10 perguntas -> escala 0-100
    var pontosAtencao = QUESTIONS.length - total;

    var pillarScores = {};
    QUESTIONS.forEach(function(q, idx){
      pillarScores[q.pillar] = (pillarScores[q.pillar] || 0) + state.answers[idx];
    });

    // pilares fracos: soma < 2 (ou seja, ao menos uma resposta "não")
    var weakPillars = Object.keys(pillarScores).filter(function(p){ return pillarScores[p] < 2; });
    // ordenar do mais fraco para o menos fraco
    weakPillars.sort(function(a,b){ return pillarScores[a] - pillarScores[b]; });

    var record = {
      ts: new Date().toISOString(),
      nome: state.lead.nome, escola: state.lead.escola, cargo: state.lead.cargo,
      alunos: state.lead.alunos, whatsapp: state.lead.whatsapp,
      preocupacao: state.lead.preocupacao,
      indice: indice, pontosAtencao: pontosAtencao,
      pilarFraco: weakPillars.length ? weakPillars[0] : "Nenhum",
      pilarScores: pillarScores
    };
    saveLead(record);

    renderResult(indice, pontosAtencao, weakPillars);
  }

  function scoreTier(indice){
    var css = getComputedStyle(document.documentElement);
    if(indice < 50) return { color: css.getPropertyValue('--coral').trim(), label: "Atenção" };
    if(indice < 75) return { color: css.getPropertyValue('--amber').trim(), label: "Em progresso" };
    return { color: css.getPropertyValue('--teal').trim(), label: "Consolidado" };
  }

  function renderResult(indice, pontosAtencao, weakPillars){
    $("#score-num").textContent = indice;
    var tier = scoreTier(indice);
    $("#score-bar-fill").style.width = indice + "%";
    $("#score-bar-fill").style.background = tier.color;
    $("#score-status").textContent = tier.label;
    $("#score-status").style.color = tier.color;

    $("#attention-msg").innerHTML = pontosAtencao > 0
      ? "Identificamos <strong>" + pontosAtencao + " ponto" + (pontosAtencao>1?"s":"") + "</strong> que merece" + (pontosAtencao>1?"m":"") + " atenção na sua escola."
      : "Sua escola está com os cinco pilares formalizados — parabéns. Vamos manter isso atualizado.";

    var weakList = $("#weak-list");
    weakList.innerHTML = "";
    weakPillars.slice(0,3).forEach(function(p){
      var meta = PILLAR_META[p];
      var card = document.createElement("div");
      card.className = "weak-card";
      card.innerHTML = "<h3><span class=\"mono\">"+meta.code+"</span> "+escapeHtml(p)+"</h3><p>"+escapeHtml(meta.msg)+"</p>";
      weakList.appendChild(card);
    });

    var waText = "Olá! Acabei de fazer o Raio-X Jurídico da minha escola (" + state.lead.escola +
      ") no Geedu Connect. Meu índice foi " + indice + "/100. Gostaria de agendar uma conversa.";
    $("#btn-whatsapp").href = "https://wa.me/" + CONFIG.firmWhatsApp + "?text=" + encodeURIComponent(waText);

    showView("view-result");
  }

  $("#btn-restart").addEventListener("click", function(){
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.current = 0;
    state.lead = {};
    $("#lead-form").reset();
    $all(".field").forEach(function(f){ f.classList.remove("invalid"); });
    $("#consent-error").style.display = "none";
    showView("view-intro");
  });

  /* ==========================================================
     PERSISTÊNCIA LOCAL (equipe) — localStorage neste dispositivo
     ========================================================== */
  function getLeads(){
    try{
      var raw = localStorage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveLead(record){
    // 1) Fonte de verdade do painel da equipe no estande: localStorage
    //    (funciona mesmo sem internet no local do evento).
    try{
      var leads = getLeads();
      leads.push(record);
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(leads));
    }catch(e){
      console.warn("Não foi possível salvar o lead localmente:", e);
    }

    // 2) Cópia central no Supabase, em segundo plano. Se falhar (sem
    //    internet no estande, por exemplo), o lead continua garantido
    //    no localStorage acima — a equipe não perde nada.
    syncLeadToSupabase(record);
  }

  function syncLeadToSupabase(record){
    if(!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return;

    var payload = {
      captured_at: record.ts,
      nome: record.nome,
      escola: record.escola,
      cargo: record.cargo,
      alunos: record.alunos,
      whatsapp: record.whatsapp,
      preocupacao: record.preocupacao,
      indice: record.indice,
      pontos_atencao: record.pontosAtencao,
      pilar_fraco: record.pilarFraco,
      pilar_scores: record.pilarScores,
      origem: "geedu-connect"
    };

    fetch(CONFIG.supabaseUrl + "/rest/v1/" + CONFIG.supabaseTable, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": CONFIG.supabaseKey,
        "Authorization": "Bearer " + CONFIG.supabaseKey,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    }).catch(function(err){
      // Silencioso de propósito: o formulário não deve travar nem assustar
      // o visitante por causa de uma falha de rede em segundo plano.
      console.warn("Não foi possível sincronizar o lead com o Supabase (fica salvo localmente):", err);
    });
  }

  /* ==========================================================
     PAINEL DA EQUIPE
     ========================================================== */
  var teamUnlocked = false;

  $("#open-team").addEventListener("click", function(){
    $("#team-overlay").classList.add("active");
    if(teamUnlocked){
      $("#pin-gate").hidden = true;
      $("#team-content").hidden = false;
      renderTeamPanel();
    } else {
      $("#pin-gate").hidden = false;
      $("#team-content").hidden = true;
      $("#pin-input").value = "";
      $("#pin-error").style.display = "none";
      setTimeout(function(){ $("#pin-input").focus(); }, 50);
    }
  });
  $("#pin-cancel").addEventListener("click", function(){ $("#team-overlay").classList.remove("active"); });
  $("#close-team").addEventListener("click", function(){ $("#team-overlay").classList.remove("active"); });
  $("#team-overlay").addEventListener("click", function(e){
    if(e.target === this) this.classList.remove("active");
  });

  function tryUnlock(){
    if($("#pin-input").value === CONFIG.teamPin){
      teamUnlocked = true;
      $("#pin-gate").hidden = true;
      $("#team-content").hidden = false;
      renderTeamPanel();
    } else {
      $("#pin-error").style.display = "block";
    }
  }
  $("#pin-submit").addEventListener("click", tryUnlock);
  $("#pin-input").addEventListener("keydown", function(e){ if(e.key === "Enter") tryUnlock(); });

  function pillarBadgeColor(p){
    return { "Proteção":"#e2685f", "Conformidade":"#e0a53f", "IA Responsável":"#8f7de0",
             "Cultura":"#4aa8e0", "Governança":"#41B3B7", "Nenhum":"#41B3B7" }[p] || "#41B3B7";
  }

  function renderTeamPanel(){
    var leads = getLeads();
    $("#stat-total").textContent = leads.length;

    if(leads.length === 0){
      $("#table-wrap").hidden = true;
      $("#empty-state").hidden = false;
      $("#stat-avg").textContent = "—";
      $("#stat-weak").textContent = "—";
      return;
    }
    $("#table-wrap").hidden = false;
    $("#empty-state").hidden = true;

    var avg = Math.round(leads.reduce(function(a,l){ return a + l.indice; }, 0) / leads.length);
    $("#stat-avg").textContent = avg;

    var freq = {};
    leads.forEach(function(l){ freq[l.pilarFraco] = (freq[l.pilarFraco]||0) + 1; });
    var moda = Object.keys(freq).sort(function(a,b){ return freq[b]-freq[a]; })[0];
    $("#stat-weak").textContent = moda || "—";

    var tbody = $("#leads-tbody");
    tbody.innerHTML = "";
    leads.slice().reverse().forEach(function(l, revIdx){
      var idx = leads.length - 1 - revIdx;
      var tr = document.createElement("tr");
      var hora = new Date(l.ts).toLocaleString("pt-BR", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
      var color = pillarBadgeColor(l.pilarFraco);
      tr.innerHTML =
        "<td>"+hora+"</td>"+
        "<td>"+escapeHtml(l.nome)+"</td>"+
        "<td>"+escapeHtml(l.escola)+"</td>"+
        "<td>"+escapeHtml(l.cargo)+"</td>"+
        "<td>"+escapeHtml(l.alunos)+"</td>"+
        "<td>"+escapeHtml(l.whatsapp)+"</td>"+
        "<td><span class='idx-pill' style='color:"+color+"'>"+l.indice+"</span></td>"+
        "<td>"+escapeHtml(l.pilarFraco)+"</td>"+
        "<td>"+escapeHtml(l.preocupacao)+"</td>"+
        "<td><button class='btn btn-ghost btn-sm' data-copy='"+idx+"'>Copiar resumo</button></td>";
      tbody.appendChild(tr);
    });

    $all("[data-copy]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var l = leads[parseInt(btn.getAttribute("data-copy"),10)];
        var texto = "📋 Novo Raio-X — " + l.nome + " (" + l.cargo + ", " + l.escola + ")\n" +
          "Alunos: " + l.alunos + " | WhatsApp: " + l.whatsapp + "\n" +
          "Índice: " + l.indice + "/100 | Pontos de atenção: " + l.pontosAtencao + "\n" +
          "Pilar mais fraco: " + l.pilarFraco + "\n" +
          "Preocupação relatada: " + l.preocupacao + "\n" +
          "Sugestão: citar o caso da palestra ligado a " + l.pilarFraco + " no follow-up.";
        copyToClipboard(texto, btn);
      });
    });
  }

  function copyToClipboard(text, btn){
    var done = function(){
      var original = btn.textContent;
      btn.textContent = "Copiado!";
      setTimeout(function(){ btn.textContent = original; }, 1600);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){ fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, cb){
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); }catch(e){}
    document.body.removeChild(ta);
    cb();
  }

  $("#btn-export-csv").addEventListener("click", function(){
    var leads = getLeads();
    if(!leads.length) return;
    var cols = ["ts","nome","escola","cargo","alunos","whatsapp","preocupacao","indice","pontosAtencao","pilarFraco"];
    var rows = [cols.join(";")];
    leads.forEach(function(l){
      rows.push(cols.map(function(c){
        var v = String(l[c] == null ? "" : l[c]).replace(/;/g, ",").replace(/\n/g," ");
        return v;
      }).join(";"));
    });
    var blob = new Blob(["\uFEFF" + rows.join("\n")], {type:"text/csv;charset=utf-8;"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "raiox-leads-" + new Date().toISOString().slice(0,10) + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  $("#btn-clear-all").addEventListener("click", function(){
    if(confirm("Isso vai apagar todos os leads salvos neste dispositivo. Baixe o CSV antes, se ainda não baixou. Confirmar?")){
      localStorage.removeItem(CONFIG.storageKey);
      renderTeamPanel();
    }
  });

  /* ==========================================================
     INIT
     ========================================================== */
  buildProgress();
})();
