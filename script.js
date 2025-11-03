
/*
  script.js — funções usadas no HTML

  Contém:
  - loginComGoogle(): tenta usar Firebase Auth para login com Google; se o Firebase
    não estiver carregado, mostra uma mensagem explicativa.
  - inscrever(): redireciona para a página de inscrição (inscricao.html) ou exibe
    uma mensagem de confirmação.
  - doar(): redireciona para a página de doação (doacao.html) e mostra uma mensagem.
  - doacao() e doação(): aliases que chamam `doar()` para compatibilidade com
    atributos onclick que usam acento.

  Também contém pequenos inits de acessibilidade e adaptações:
  - aplica a classe `.btn` automaticamente a links de ação
  - controla botões `nav-toggle` (aria-expanded / aria-hidden) para menu móvel

  Observação: este arquivo é carregado como script clássico para que as funções
  fiquem disponíveis globalmente para handlers inline.
*/

function loginComGoogle() {
  // Verifica se o Firebase está disponível antes de tentar usá-lo
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().signInWithPopup) {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(result => {
        const user = result.user;
        alert(`Bem-vindo, ${user.displayName || 'usuário'}!`);
        // aqui você pode redirecionar para um painel admin, por exemplo:
        // window.location.href = 'admin.html';
      })
      .catch(err => {
        console.error('Erro no login com Google:', err);
        alert('Ocorreu um erro ao tentar entrar com Google. Veja o console para detalhes.');
      });
  } else {
    // Firebase não configurado — mensagem útil para desenvolvedores/usuários
    console.warn('Firebase não encontrado. loginComGoogle() não pôde ser executado.');
    alert('Login com Google não está disponível — o Firebase não está configurado nesta página.');
  }
}

function inscrever() {
  try {
    window.location.href = 'inscricao.html';
  } catch (err) {
    console.error('Erro ao redirecionar para inscricao.html', err);
    alert('Obrigado por se voluntariar! Entraremos em contato com você.');
  }
}

function doar() {
  try {
    alert('Obrigado por apoiar nossa causa! Você será redirecionado para a página de doação.');
    window.location.href = 'doacao.html';
  } catch (err) {
    console.error('Erro ao redirecionar para doacao.html', err);
    alert('Obrigado por apoiar nossa causa!');
  }
}

// Alias para compatibilidade com nomes com acento e variações usadas no HTML
function doacao() { return doar(); }
function doação() { return doar(); }

// Expor handlers globalmente
window.loginComGoogle = window.loginComGoogle || loginComGoogle;
window.inscrever = window.inscrever || inscrever;
window.doar = window.doar || doar;
window.doacao = window.doacao || doacao;
window['doação'] = window['doação'] || doação;

/* Init: aplica automaticamente a classe .btn a links que representam ações e
   configura botões de toggle de navegação para telas pequenas */
(function() {
  if (typeof document === 'undefined') return;

  // --- aplicar .btn automaticamente a links de ação ---
  const actionSelectors = [
    'a[href*="inscricao"]',
    'a[href*="doacao"]',
    'a[href*="donate"]'
  ];

  try {
    const nodes = new Set();
    actionSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => nodes.add(el));
    });
    nodes.forEach(el => {
      if (!el.classList.contains('btn')) {
        const inGaleria = el.closest('.galeria');
        if (inGaleria) el.classList.add('btn', 'btn--outline');
        else el.classList.add('btn');
      }
    });
  } catch (err) {
    console.error('Erro ao aplicar classes .btn automaticamente:', err);
  }

  // --- comportamento do toggle de nav (acessível) ---
  function setupNavToggle(toggleId) {
    const btn = document.getElementById(toggleId);
    if (!btn) return;
    const targetId = btn.getAttribute('aria-controls');
    if (!targetId) return;
    const nav = document.getElementById(targetId);
    if (!nav) return;

    // Define estado inicial com base na largura da janela
    function setInitial() {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        nav.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        nav.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        nav.classList.remove('nav--open');
      }
    }

    setInitial();

    // Toggle quando o botão for clicado
    let lastFocusedElement = null;
    let onKeyDown = null;

    function focusTrap(container, focusFirst = true) {
      const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
      const nodes = Array.from(container.querySelectorAll(focusableSelectors)).filter(n => n.offsetParent !== null);
      if (!nodes.length) return null;
      if (focusFirst) nodes[0].focus();

      return function trap(e) {
        if (e.key === 'Tab') {
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        } else if (e.key === 'Escape' || e.key === 'Esc') {
          // close on Esc
          closeNav();
        }
      };
    }

    function openNav() {
      lastFocusedElement = document.activeElement;
      nav.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      nav.classList.add('nav--open');
      // set focus trap
      onKeyDown = focusTrap(nav, true);
      if (onKeyDown) document.addEventListener('keydown', onKeyDown);
    }

    function closeNav() {
      nav.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('nav--open');
      if (onKeyDown) {
        document.removeEventListener('keydown', onKeyDown);
        onKeyDown = null;
      }
      // restore focus
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
    }

    btn.addEventListener('click', () => {
      const hidden = nav.getAttribute('aria-hidden') === 'true';
      if (hidden) openNav(); else closeNav();
    });

    // Atualiza ao redimensionar
    window.addEventListener('resize', () => {
      setInitial();
      // ensure listeners cleaned up on desktop
      if (window.matchMedia('(min-width: 769px)').matches) {
        if (onKeyDown) { document.removeEventListener('keydown', onKeyDown); onKeyDown = null; }
      }
    });
  }

  // Configura os toggles conhecidos
  setupNavToggle('navToggle');
  setupNavToggle('navToggleAdmin');

})();
