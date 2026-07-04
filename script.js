/* =========================================================
   ADELI EMBUTIDOS — Menu mobile + navegação SPA
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const conteudo = document.getElementById('conteudo');
  const menuToggle = document.getElementById('menuToggle');
  const menuPrincipal = document.getElementById('menuPrincipal');

  /* ---------- Menu mobile (hambúrguer) ---------- */
  if (menuToggle && menuPrincipal) {
    menuToggle.addEventListener('click', () => {
      const aberto = menuPrincipal.classList.toggle('aberto');
      menuToggle.setAttribute('aria-expanded', aberto);
    });
  }

  /* ---------- Navegação SPA ---------- */
  if (!conteudo) return; // segurança: se a página não tiver #conteudo, não faz nada

  function nomeDaPagina(url) {
    const semBarra = url.split('/').pop().split('?')[0].split('#')[0];
    return semBarra === '' ? 'index.html' : semBarra;
  }

  function marcarLinkAtivo(url) {
    const pagina = nomeDaPagina(url);
    document.querySelectorAll('a[data-link]').forEach(link => {
      const linkPagina = nomeDaPagina(link.getAttribute('href'));
      link.classList.toggle('active', linkPagina === pagina);
    });
  }

  function esperar(ms) {
    return new Promise(resolver => setTimeout(resolver, ms));
  }

  async function carregarPagina(url, guardarHistorico = true) {
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error('Página não encontrada: ' + url);

      const html = await resposta.text();
      const docNovo = new DOMParser().parseFromString(html, 'text/html');
      const conteudoNovo = docNovo.getElementById('conteudo');

      if (!conteudoNovo) {
        // a página de destino não segue o mesmo padrão — navega normalmente
        window.location.href = url;
        return;
      }

      // fecha o menu mobile, se estiver aberto
      menuPrincipal?.classList.remove('aberto');
      menuToggle?.setAttribute('aria-expanded', 'false');

      // pequena transição de saída
      conteudo.classList.add('conteudo-saindo');
      await esperar(160);

      conteudo.innerHTML = conteudoNovo.innerHTML;
      document.title = docNovo.title;

      conteudo.classList.remove('conteudo-saindo');
      window.scrollTo({ top: 0, behavior: 'auto' });
      marcarLinkAtivo(url);

      if (guardarHistorico) {
        history.pushState({ url }, '', url);
      }
    } catch (erro) {
      console.error(erro);
      // se algo falhar (ex: página não existe), cai para navegação normal
      window.location.href = url;
    }
  }

  // intercepta cliques em qualquer link marcado com data-link
  document.body.addEventListener('click', (evento) => {
    const link = evento.target.closest('a[data-link]');
    if (!link) return;

    const destino = link.getAttribute('href');

    // ignora links externos, âncoras (#) ou com target diferente
    if (!destino || destino.startsWith('http') || destino.startsWith('#') || link.target === '_blank') {
      return;
    }

    // já está na página? não faz nada
    if (nomeDaPagina(destino) === nomeDaPagina(window.location.pathname)) {
      evento.preventDefault();
      return;
    }

    evento.preventDefault();
    carregarPagina(destino);
  });

  // suporte ao botão voltar/avançar do navegador
  window.addEventListener('popstate', () => {
    carregarPagina(window.location.pathname, false);
  });

  // marca o link ativo já no carregamento inicial da página
  marcarLinkAtivo(window.location.pathname);
});